"use client";

// Workaround for Next.js 15.5.x prerendering bug:
// "Html should not be imported outside of pages/_document" on /_error: /404
// See: https://github.com/vercel/next.js/issues/82366
export const dynamic = "force-dynamic";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try again.</p>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}
