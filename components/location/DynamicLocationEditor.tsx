"use client";

import dynamic from "next/dynamic";

const LocationEditor = dynamic(
  () => import("./LocationEditor").then((mod) => mod.LocationEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    ),
  }
);

export { LocationEditor };
export default LocationEditor;
