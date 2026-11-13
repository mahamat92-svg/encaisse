"use client";

import React from "react";

export function CompanyAvatar({
  logoUrl,
  name,
  size = 40,
  className = "",
}: {
  logoUrl?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const cleanName = (name || "E").trim();
  const initial = cleanName ? cleanName.charAt(0).toUpperCase() : "E";
  const cleanUrl = (logoUrl || "").trim();

  if (cleanUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden border border-slate-200 bg-white shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cleanUrl}
          alt={cleanName}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 shadow-xs ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, Math.round(size * 0.45)),
      }}
      aria-label={cleanName}
    >
      {initial}
    </div>
  );
}

