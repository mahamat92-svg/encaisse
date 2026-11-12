"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "./AppContext";
import { getLabels } from "@/lib/i18n";

export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] border border-emerald-500/40 flex items-center justify-center shadow-sm relative overflow-hidden">
        <span className="text-white font-extrabold text-lg tracking-tight">i</span>
        <span
          className="w-2 h-2 rounded-full bg-[#F5A524] absolute top-1.5 right-1.5"
          title="Message vers Paiement"
        />
      </div>
      <div className="flex flex-col">
        <span
          className={`font-bold text-base leading-none tracking-tight ${
            light ? "text-white" : "text-[#0B1F3A]"
          }`}
        >
          InnovTech <span className="text-emerald-500">Encaisse</span>
        </span>
        <span
          className={`text-[10px] font-medium tracking-wider uppercase mt-0.5 ${
            light ? "text-slate-300" : "text-slate-500"
          }`}
        >
          SaaS FinTech & IA · Afrique
        </span>
      </div>
    </Link>
  );
}

export function PublicNavbar() {
  const pathname = usePathname();
  const { locale, setLocale } = useAppState();
  const { t } = getLabels(locale, "commerce");

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/services", label: t.nav.services },
    { href: "/tarifs", label: t.nav.pricing },
    { href: "/assistance", label: t.nav.help },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            title="Changer de langue / Switch language"
          >
            {locale === "fr" ? "🇫🇷 FR · EN" : "🇬🇧 EN · FR"}
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold bg-[#0B1F3A] hover:bg-[#132D54] text-white shadow-sm transition-colors"
          >
            <span>Se connecter</span>
            <span aria-hidden>→</span>
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
  const { locale } = useAppState();
  return (
    <footer className="bg-[#0B1F3A] text-slate-300 border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <BrandLogo light />
          <p className="text-sm text-slate-300 max-w-md leading-relaxed">
            {locale === "fr"
              ? "Plateforme SaaS de facturation rapide, suivi des créances, encaissements Fapshi / Mobile Money et relances WhatsApp."
              : "Fast invoicing SaaS, receivables tracking, Fapshi / Mobile Money collections and WhatsApp reminders."}
          </p>
          <p className="text-xs text-slate-400">
            🇨🇲 Conçu pour le Cameroun et l&apos;Afrique (XAF) · Sécurité RLS stricte.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            {locale === "fr" ? "Navigation" : "Links"}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/services" className="hover:text-white">
                {locale === "fr" ? "Fonctionnalités" : "Features"}
              </Link>
            </li>
            <li>
              <Link href="/tarifs" className="hover:text-white">
                {locale === "fr" ? "Tarifs en XAF" : "Pricing in XAF"}
              </Link>
            </li>
            <li>
              <Link href="/assistance" className="hover:text-white">
                {locale === "fr" ? "Centre d'assistance" : "Help Center"}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Administration
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold">
                Se connecter (Admin) →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-400 px-4">
        © {new Date().getFullYear()} InnovTech AI — InnovTech Encaisse. Tous droits réservés.
      </div>
    </footer>
  );
}
