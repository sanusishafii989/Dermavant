import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/location";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.trim();

    if (!address) {
      return NextResponse.json({ ok: false, error: "Address is required" }, { status: 400 });
    }

    const result = await geocodeAddress(address);

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          error: "No matching location found. You can still drag the pin to confirm the exact place manually.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Geocoding failed. You can still drag the map pin to confirm the exact location manually.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
