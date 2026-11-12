"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "./AppContext";
import { BrandLogo } from "./PublicHeaderFooter";
import { getLabels } from "@/lib/i18n";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, mode, setMode, supabaseReady, userEmail, org, signOutUser } =
    useAppState();
  const { t } = getLabels(locale, mode);

  const navItems = [
    { href: "/app", label: t.nav.dashboard, icon: "📊" },
    { href: "/app/documents", label: t.nav.documents, icon: "🧾" },
    {
      href: "/app/clients",
      label: mode === "etablissement" ? t.nav.students : t.nav.clients,
      icon: mode === "etablissement" ? "🎓" : "👥",
    },
    {
      href: "/app/catalogue",
      label: mode === "etablissement" ? t.nav.CatalogSchool : t.nav.catalog,
      icon: "📦",
    },
    { href: "/app/paiements", label: t.nav.payments, icon: "💳" },
    {
      href: "/app/relances",
      label: t.nav.reminders,
      icon: "💬",
      badge: org.reminders.length,
    },
    { href: "/app/ia", label: t.nav.ai, icon: "✨" },
    { href: "/app/abonnement", label: t.nav.subscription, icon: "⭐" },
    { href: "/app/historique", label: t.nav.history, icon: "🛡️" },
    { href: "/app/parametres", label: t.nav.settings, icon: "⚙️" },
  ];

  const mobileBottomItems = [
    { href: "/app", label: locale === "fr" ? "Accueil" : "Home", icon: "📊" },
    { href: "/app/documents", label: locale === "fr" ? "Factures" : "Docs", icon: "🧾" },
    { href: "/app/ia", label: locale === "fr" ? "Dictée IA" : "AI", icon: "✨" },
    {
      href: "/app/relances",
      label: locale === "fr" ? "Relances" : "Remind",
      icon: "💬",
      badge: org.reminders.length,
    },
    { href: "/app/paiements", label: locale === "fr" ? "Encaisser" : "Pay", icon: "💳" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Barre latérale Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 bg-[#0B1F3A] text-white shrink-0 border-r border-slate-800 no-print">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <BrandLogo light />
        </div>

        {/* Entreprise active + Bascule Mode */}
        <div className="p-4 border-b border-slate-800/80 bg-[#132D54]/60">
          <div className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold mb-1">
            {org.isLiveDb ? "🟢 Base Supabase active" : "🟡 Démo interactive"}
          </div>
          <div className="font-bold text-sm text-white truncate">{org.name}</div>
          <div className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <span>●</span>
            <span>{org.city}</span>
          </div>

          {!org.isLiveDb ? (
            <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-[#0B1F3A] rounded-xl border border-slate-700/70 text-xs">
              <button
                type="button"
                onClick={() => setMode("commerce")}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                  mode === "commerce"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🏪 Commerce
              </button>
              <button
                type="button"
                onClick={() => setMode("etablissement")}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-colors ${
                  mode === "etablissement"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🎓 École
              </button>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge ? (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#F5A524] text-[#0B1F3A]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
          <Link
            href="/admin"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 font-semibold"
          >
            <span>👑 {t.nav.admin}</span>
            <span>→</span>
          </Link>
          {userEmail ? (
            <button
              type="button"
              onClick={signOutUser}
              className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-red-300 hover:bg-red-500/15"
            >
              <span className="truncate">🚪 Déconnexion ({userEmail})</span>
            </button>
          ) : (
            <Link
              href="/connexion"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-emerald-300 hover:bg-slate-800 font-semibold"
            >
              <span>🔑 Se connecter / Créer compte</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <BrandLogo />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
                  org.isLiveDb
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : supabaseReady
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                <span>{org.isLiveDb ? "🟢" : supabaseReady ? "🔵" : "🟡"}</span>
                <span>
                  {org.isLiveDb
                    ? `Connecté à Supabase (${org.name})`
                    : supabaseReady
                      ? "Supabase prêt — Créez un compte (/inscription) pour enregistrer vos vraies données"
                      : "Mode Démo Interactif"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!org.isLiveDb ? (
              <div className="flex lg:hidden bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("commerce")}
                  className={`px-2 py-1 rounded-md ${
                    mode === "commerce" ? "bg-[#0B1F3A] text-white" : "text-slate-600"
                  }`}
                >
                  🏪 PME
                </button>
                <button
                  type="button"
                  onClick={() => setMode("etablissement")}
                  className={`px-2 py-1 rounded-md ${
                    mode === "etablissement" ? "bg-[#0B1F3A] text-white" : "text-slate-600"
                  }`}
                >
                  🎓 École
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {locale === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
            </button>

            <Link
              href="/app/ia"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-semibold shadow-sm"
            >
              <span>✨</span>
              <span>{locale === "fr" ? "Dictée 30s" : "AI Dictate"}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Navigation mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-5 py-1.5 px-1 no-print shadow-lg">
        {mobileBottomItems.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-semibold relative ${
                active ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="mt-1 truncate">{item.label}</span>
              {item.badge ? (
                <span className="absolute top-0.5 right-3 w-4 h-4 rounded-full bg-[#F5A524] text-[#0B1F3A] text-[10px] font-extrabold flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
