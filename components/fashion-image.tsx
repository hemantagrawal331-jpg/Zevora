"use client";

import Image from "next/image";
import { useState } from "react";

export function FashionImage({
  src,
  alt,
  fit = "cover",
  priority = false,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className="absolute inset-0 flex items-end bg-sand p-4">
        <span className="text-[11px] tracking-[0.14em] text-stone uppercase">Photograph pending</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={`${fit === "contain" ? "object-contain p-6 md:p-8" : "object-cover"} ${className}`}
    />
  );
}
