"use client";

import { useMemo, useState } from "react";

interface ChannelLogoProps {
  logo?: string | null;
  name?: string | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
}

const isValidUrl = (value?: string | null) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const normalizeLogoUrl = (value?: string | null) => {
  if (!isValidUrl(value)) return null;

  const url = new URL(value as string);
  if (!url.hostname.includes("wikimedia.org")) {
    return value as string;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const thumbIndex = parts.indexOf("thumb");
  if (thumbIndex === -1) {
    return value as string;
  }

  const originalParts = [...parts.slice(0, thumbIndex), ...parts.slice(thumbIndex + 1, -1)];
  if (originalParts.length < 4) {
    return value as string;
  }

  return `${url.protocol}//${url.hostname}/${originalParts.join("/")}`;
};

const getInitials = (name?: string | null) => {
  const cleanName = (name || "TV").replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  if (!cleanName) return "TV";

  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
};

export default function ChannelLogo({
  logo,
  name,
  className = "h-10 w-20",
  imageClassName = "object-contain p-1",
  priority = false,
}: ChannelLogoProps) {
  const src = useMemo(() => normalizeLogoUrl(logo), [logo]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shouldShowImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={`${className} relative bg-gray-50 rounded-xl overflow-hidden shadow-sm flex-shrink-0`}
      title={name || "Channel logo"}
    >
      {shouldShowImage ? (
        // External channel logos come from mixed third-party sources; native img
        // gives reliable onError/onLoad fallback behavior for blocked SVG/CDN URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={name ? `${name} logo` : "Channel logo"}
          className={`absolute inset-0 h-full w-full ${imageClassName}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedSrc(src)}
          onLoad={(event) => {
            if (event.currentTarget.naturalWidth === 0) {
              setFailedSrc(src);
            }
          }}
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200">
          <span className="text-[11px] font-semibold tracking-wide text-slate-600">
            {getInitials(name)}
          </span>
        </div>
      )}
    </div>
  );
}
