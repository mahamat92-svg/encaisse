"use client";

import React, { useEffect, useState } from "react";
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
    <Link href="/" className="inline-flex items-center gap-2.5 group shrink-0 whitespace-nowrap">
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
      <div className="flex flex-col shrink-0">
        <span
          className={`font-bold text-sm sm:text-base leading-none tracking-tight whitespace-nowrap ${light ? "text-white" : "text-[#0B1F3A]"
            }`}
        >
          InnovTech <span className="text-emerald-500">MHA Infinity</span>
        </span>
        <span
          className={`text-[10px] font-medium tracking-wider uppercase mt-0.5 whitespace-nowrap ${light ? "text-slate-300" : "text-slate-500"
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
      {/* Bandeau supérieur propre, jamais coupé */}
      <div className="bg-[#0B1F3A] text-slate-200 text-[11px] py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="font-semibold">
            📍 {DEFAULT_MERCHANT_LOCATION_LABEL}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="font-bold text-emerald-300 hover:underline whitespace-nowrap"
            >
              📧 {OFFICIAL_EMAIL}
            </a>
            <span className="hidden sm:inline text-slate-500">|</span>
            <a
              href={OFFICIAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:underline whitespace-nowrap"
            >
              Aide WhatsApp : {OFFICIAL_WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      {/* Desktop Header : 2 lignes propres (Ligne 1: Logo + Boutons | Ligne 2: Menu centré) */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <BrandLogo />

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-extrabold bg-white hover:bg-slate-50 text-[#0B1F3A] border-2 border-[#0B1F3A] transition-colors whitespace-nowrap"
            >
              Se connecter
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors whitespace-nowrap"
            >
              S&apos;inscrire Gratuit
            </Link>
          </div>
        </div>

        <nav className="border-t border-slate-100 bg-slate-50/80 py-2.5 px-6 flex items-center justify-center gap-8 text-sm font-semibold text-slate-600">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-[#0B1F3A] font-extrabold border-b-2 border-emerald-500 pb-0.5 whitespace-nowrap"
                    : "hover:text-[#0B1F3A] transition-colors whitespace-nowrap"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Header (360px+ : 3 lignes propres sans aucun chevauchement) */}
      <div className="flex flex-col md:hidden">
        {/* Ligne 1 : Logo tout seul à gauche, petit et propre */}
        <div className="px-3 py-2.5 flex items-center justify-start">
          <BrandLogo size={32} />
        </div>

        {/* Ligne 2 : Les 2 boutons en pleine largeur, côte à côte, jamais coupés */}
        <div className="px-3 pb-2.5 grid grid-cols-2 gap-2 w-full">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center px-2 py-2.5 rounded-xl text-xs font-extrabold bg-white hover:bg-slate-50 text-[#0B1F3A] border-2 border-[#0B1F3A] text-center whitespace-nowrap"
          >
            Se connecter
          </Link>

          <Link
            href="/signup"
            className="w-full inline-flex items-center justify-center px-2 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-center whitespace-nowrap"
          >
            S&apos;inscrire Gratuit
          </Link>
        </div>

        {/* Ligne 3 : Menu en scroll horizontal propre avec espace entre chaque mot */}
        <nav className="flex items-center gap-5 overflow-x-auto whitespace-nowrap border-t border-slate-100 bg-slate-50/90 py-2.5 px-4 text-xs font-semibold text-slate-600">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-emerald-700 font-extrabold shrink-0"
                    : "hover:text-[#0B1F3A] shrink-0"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
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

        {/* Section "Contactez-nous" : lien texte propre sans gros bouton WhatsApp en double */}
        <div className="md:col-span-4 bg-[#132D54] border border-slate-700/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-base font-extrabold text-white">
            📞 Contactez-nous
          </h3>
          <div className="text-xs sm:text-sm text-slate-200 space-y-1.5 leading-relaxed">
            <div>
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#25D366] hover:underline"
              >
                Aide WhatsApp : {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
            </div>
            <div className="break-all">
              Email :{" "}
              <a
                href={`mailto:${OFFICIAL_EMAIL}`}
                className="font-extrabold text-white hover:underline"
              >
                {OFFICIAL_EMAIL}
              </a>
            </div>
            <div>Ville : {DEFAULT_MERCHANT_LOCATION_LABEL}</div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-300 px-4">
        Aide WhatsApp :{" "}
        <a
          href={OFFICIAL_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#25D366] font-bold hover:underline"
        >
          {OFFICIAL_WHATSAPP_DISPLAY}
        </a>{" "}
        | Email :{" "}
        <a href={`mailto:${OFFICIAL_EMAIL}`} className="text-white hover:underline">
          {OFFICIAL_EMAIL}
        </a>
      </div>
    </footer>
  );
}

/**
 * UNIQUE bouton WhatsApp flottant dans tout le site :
 * Petit, rond, en bas à droite, icône seule + petit point vert.
 * Disparaît automatiquement quand le clavier téléphone s'ouvre.
 */
export function FloatingWhatsAppButton() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    function handleFocusIn(e: FocusEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        setKeyboardOpen(true);
      }
    }
    function handleFocusOut() {
      setTimeout(() => {
        const activeTag = document.activeElement?.tagName;
        if (
          activeTag !== "INPUT" &&
          activeTag !== "TEXTAREA" &&
          activeTag !== "SELECT"
        ) {
          setKeyboardOpen(false);
        }
      }, 150);
    }

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  if (keyboardOpen) return null;

  return (
    <a
      href="https://wa.me/23566268503"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Aide WhatsApp"
      title="Aide WhatsApp : +235 66 26 85 03"
      className="fixed bottom-20 lg:bottom-6 right-4 z-40 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform hover:scale-105 no-print"
    >
      <WhatsAppIcon className="w-6 h-6" />
      <span
        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white"
        aria-hidden="true"
      />
    </a>
  );
}
