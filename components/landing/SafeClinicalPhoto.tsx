"use client";

import { useState } from "react";
import { Stethoscope } from "lucide-react";

interface SafeClinicalPhotoProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeClinicalPhoto({
  src,
  alt,
  className = "h-full w-full object-cover",
  fallbackLabel,
}: SafeClinicalPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#023047] via-[#06182c] to-[#0a2f44] p-6 text-center text-white/80">
        <Stethoscope className="h-8 w-8 text-[#22d3ee]" aria-hidden="true" />
        <p className="text-sm font-medium">{fallbackLabel || alt}</p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
