"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "./AppContext";
import { getLabels } from "@/lib/i18n";
import {
  DEFAULT_MERCHANT_LOCATION_LABEL,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
} from "@/lib/format";
import { WhatsAppIcon } from "./WhatsAppButton";

export function BrandLogo({
  light = false,
  size = 40,
}: {
  light?: boolean;
  size?: number;
}) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      <div
        className="rounded-xl bg-[#0B1F3A] border border-emerald-500/40 flex items-center justify-center shadow-sm overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="InnovTech MHA Infinity"
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col">
        <span
          className={`font-bold text-base leading-none tracking-tight ${light ? "text-white" : "text-[#0B1F3A]"
            }`}
        >
          InnovTech <span className="text-emerald-500">MHA Infinity</span>
        </span>
        <span
          className={`text-[10px] font-medium tracking-wider uppercase mt-0.5 ${light ? "text-slate-300" : "text-slate-500"
            }`}
        >
          SaaS Multi-Services · Afrique
        </span>
      </div>
    </Link>
  );
}

export function PublicNavbar() {
  const pathname = usePathname();
  const { locale } = useAppState();
  const { t } = getLabels(locale, "commerce");

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/decouvrir", label: "Découvrir" },
    { href: "/services", label: "Services" },
    { href: "/tarifs", label: t.nav.pricing },
    { href: "/aide", label: "Aide" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 no-print">
      {/* Bandeau supérieur de contact : Localisation manuelle + Email officiel + WhatsApp */}
      <div className="bg-[#0B1F3A] text-slate-200 text-[11px] sm:text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">
            📍 {DEFAULT_MERCHANT_LOCATION_LABEL}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="font-bold text-emerald-300 hover:underline"
            >
              📧 Email: {OFFICIAL_EMAIL}
            </a>
            <a
              href={OFFICIAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:underline"
            >
              📱 WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <BrandLogo />

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-[#0B1F3A] font-semibold border-b-2 border-emerald-500 py-1"
                    : "hover:text-[#0B1F3A] transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Toujours afficher "Se connecter" + "S'inscrire Gratuit" côte à côte (Desktop & Mobile) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-white hover:bg-slate-50 text-[#0B1F3A] border-2 border-[#0B1F3A] transition-colors"
          >
            Se connecter
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            S&apos;inscrire Gratuit
          </Link>
        </div>
      </div>

      {/* Navigation mobile rapide */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-100 bg-slate-50/80 py-2 px-2 text-xs font-medium text-slate-600">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href
                ? "text-emerald-700 font-bold"
                : "hover:text-slate-900"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#0B1F3A] text-slate-300 border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-3">
          <BrandLogo light size={48} />
          <div className="text-xs sm:text-sm text-slate-200 space-y-1 font-medium">
            <div className="font-extrabold text-white">InnovTech MHA Infinity</div>
            <div>Ngaoundéré, Adamawa - Cameroun</div>
            <div>
              <a href={`mailto:${OFFICIAL_EMAIL}`} className="hover:underline text-emerald-300">
                {OFFICIAL_EMAIL}
              </a>
            </div>
            <div>
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-[#25D366] font-bold"
              >
                WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Une seule plateforme, tous vos métiers : Encaisse Boutique, École, Clinique, Immobilier, Artisan et ONG — Facturation + Paiement Orange Money / MTN MoMo / Fapshi / WhatsApp.
          </p>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Navigation & Services
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/services" className="hover:text-white font-semibold text-emerald-400">
                Nos 6 Services Métiers →
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-white font-semibold text-white">
                Créer mon compte gratuit (/signup)
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Se connecter (/login)
              </Link>
            </li>
            <li>
              <Link href="/assistance" className="hover:text-white">
                Centre d&apos;assistance
              </Link>
            </li>
          </ul>
        </div>

        {/* Section "Contactez-nous" avec Email officiel + WhatsApp + Ngaoundéré, Adamawa - Cameroun */}
        <div className="md:col-span-4 bg-[#132D54] border border-slate-700/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-base font-extrabold text-white">
            📞 Contactez-nous
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">Email :</span>
              <a
                href={`mailto:${OFFICIAL_EMAIL}`}
                className="font-extrabold text-white hover:underline break-all"
              >
                {OFFICIAL_EMAIL}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">WhatsApp :</span>
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-white hover:underline"
              >
                {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">Ville :</span>
              <span className="text-white">{DEFAULT_MERCHANT_LOCATION_LABEL}</span>
            </li>
          </ul>
          <div className="pt-2">
            <a
              href={OFFICIAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-md transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <span>Discuter sur WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-400 px-4">
        © {new Date().getFullYear()} InnovTech MHA Infinity — 📍 {DEFAULT_MERCHANT_LOCATION_LABEL} · 📧 {OFFICIAL_EMAIL} · 📱 WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}
      </div>
    </footer>
  );
}

/**
 * Bouton flottant WhatsApp vert en bas à droite sur TOUTES les pages
 */
export function FloatingWhatsAppButton() {
  return (
    <a
      href="https://wa.me/23566268503"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp +235 66 26 85 03"
      className="fixed bottom-18 lg:bottom-6 right-4 sm:right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs sm:text-sm shadow-xl border-2 border-white no-print"
    >
      <span>💬 WhatsApp +235 66 26 85 03</span>
    </a>
  );
}
