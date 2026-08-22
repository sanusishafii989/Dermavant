"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">Something went wrong</h1>
        <p className="mt-4 text-[var(--text-secondary)]">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-8">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
