"use client";

import dynamic from "next/dynamic";

const LocationEditor = dynamic(
  () => import("./LocationEditor").then((mod) => mod.LocationEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]" />
    ),
  }
);

export { LocationEditor };
export default LocationEditor;
