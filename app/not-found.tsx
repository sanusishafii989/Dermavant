import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--accent-cyan)]">404</h1>
        <p className="mt-4 text-xl text-[var(--text-secondary)]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button variant="primary">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
