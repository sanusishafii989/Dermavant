import { auth } from "@clerk/nextjs/server";
import { get, head } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ensureKycRoleUser } from "@/lib/ensure-role-user";
import { KYCApplication, User } from "@/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
type DocumentKind = "license" | "business" | "identity";

function isDocumentKind(value: unknown): value is DocumentKind {
  return value === "license" || value === "business" || value === "identity";
}

function expectedPath(clerkId: string, kind: DocumentKind) {
  return `kyc/${clerkId}/${kind}/current`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { userId } = await auth();
        if (!userId) throw new Error("Sign in is required.");

        let payload: { role?: unknown; kind?: unknown };
        try {
          payload = JSON.parse(clientPayload || "{}");
        } catch {
          throw new Error("Invalid upload details.");
        }
        if (payload.role !== "doctor" && payload.role !== "partner") {
          throw new Error("Invalid account type for credential upload.");
        }

        const account = await ensureKycRoleUser(payload.role);
        if (!account.ok || account.user.clerkId !== userId) {
          throw new Error(account.ok ? "Sign in again to upload credentials." : account.error);
        }
        const user = account.user;
        if (user.status === "suspended") throw new Error("This account cannot upload documents.");

        if (payload.role !== user.role || !isDocumentKind(payload.kind)) {
          throw new Error("Invalid document type for this account.");
        }
        if (payload.kind === "business" && user.role !== "partner") {
          throw new Error("Business registration documents are for pharmacy accounts only.");
        }
        if (pathname !== expectedPath(userId, payload.kind)) {
          throw new Error("Invalid document destination.");
        }

        const application = await KYCApplication.findOne({ user_id: user._id as any }).lean();
        if (application?.status === "approved") {
          throw new Error("Verified accounts cannot replace their submitted documents.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_DOCUMENT_BYTES,
          allowOverwrite: true,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({ userId, role: user.role, kind: payload.kind }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // The KYC form attaches the uploaded pathname only after its owner submits the application.
        // Do not log or persist unsubmitted license documents in this callback.
        const payload = JSON.parse(tokenPayload || "{}") as {
          userId?: string;
          role?: string;
          kind?: DocumentKind;
        };
        if (
          !payload.userId ||
          (payload.role !== "doctor" && payload.role !== "partner") ||
          !isDocumentKind(payload.kind) ||
          (payload.kind === "business" && payload.role !== "partner") ||
          blob.pathname !== expectedPath(payload.userId, payload.kind)
        ) {
          throw new Error("Invalid completed upload.");
        }
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("KYC private upload authorization failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not authorize this private upload." },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const pathname = new URL(request.url).searchParams.get("pathname");
    if (!pathname || pathname.length > 300 || !pathname.startsWith("kyc/")) {
      return new NextResponse("Not found", { status: 404 });
    }

    await connectDB();
    const viewer = await User.findOne({ clerkId: userId }).lean();
    if (!viewer) return new NextResponse("Not found", { status: 404 });

    const isOwnUploadPath =
      pathname === expectedPath(userId, "license") ||
      pathname === expectedPath(userId, "identity") ||
      (viewer.role === "partner" && pathname === expectedPath(userId, "business"));

    if (!isOwnUploadPath) {
      const application = await KYCApplication.findOne({
        $or: [
          { license_document_url: pathname },
          { business_document_url: pathname },
          { id_document_url: pathname },
        ],
      }).lean();
      if (!application || viewer.role !== "admin") {
        return new NextResponse("Not found", { status: 404 });
      }
    }

    if (viewer.role !== "admin" && viewer.role !== "doctor" && viewer.role !== "partner") {
      return new NextResponse("Not found", { status: 404 });
    }

    const document = await get(pathname, { access: "private", useCache: false });
    if (!document || document.statusCode !== 200) {
      return new NextResponse("Not found", { status: 404 });
    }

    const contentType = document.blob.contentType;
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return new NextResponse("Unsupported document type", { status: 415 });
    }

    const extension = contentType === "application/pdf" ? "pdf" : contentType === "image/png" ? "png" : "jpg";
    return new NextResponse(document.stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="credential-document.${extension}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Document unavailable", { status: 404 });
  }
}
