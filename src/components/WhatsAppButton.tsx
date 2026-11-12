"use client";

import React from "react";
import { buildWhatsAppLink } from "@/lib/format";

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.031 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 0 0 1.333 4.993L2 22l5.233-1.237a9.994 9.994 0 0 0 4.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.935 9.935 0 0 0 12.031 2Zm5.824 14.12c-.245.688-1.419 1.318-1.976 1.402-.507.076-1.148.108-1.855-.117-.429-.136-.98-.318-1.686-.623-2.967-1.281-4.906-4.27-5.055-4.468-.148-.198-1.209-1.608-1.209-3.068 0-1.46.765-2.178 1.037-2.475.272-.297.593-.371.79-.371.198 0 .396.002.569.01.182.009.427-.069.668.511.247.594.84 2.055.914 2.203.074.149.123.322.025.52-.099.198-.148.322-.297.495-.148.173-.312.387-.445.52-.148.148-.303.309-.13.606.173.297.768 1.268 1.65 2.054 1.134 1.011 2.09 1.325 2.387 1.473.297.149.47.124.643-.074.173-.198.741-.866.939-1.163.198-.297.396-.248.668-.149.272.099 1.73.816 2.027.965.297.149.495.223.569.347.074.124.074.718-.171 1.406Z" />
    </svg>
  );
}

interface WhatsAppShareButtonProps {
  phone?: string | null;
  message: string;
  label?: string;
  className?: string;
}

export function WhatsAppShareButton({
  phone,
  message,
  label = "Envoyer sur WhatsApp",
  className = "",
}: WhatsAppShareButtonProps) {
  const href = buildWhatsAppLink(phone, message);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors ${className}`}
    >
      <WhatsAppIcon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </a>
  );
}

