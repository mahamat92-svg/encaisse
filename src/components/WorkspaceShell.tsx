"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "./AppContext";
import { BrandLogo } from "./PublicHeaderFooter";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userEmail, org, loadingData, signOutUser } = useAppState();

  const navItems = [
    { href: "/app", label: "Tableau de bord", icon: "📊" },
    { href: "/app/catalogue", label: "Produits", icon: "📦" },
    { href: "/app/documents", label: "Commandes / Factures", icon: "🧾" },
    { href: "/app/clients", label: "Clients", icon: "👥" },
    { href: "/app/paiements", label: "Paiements", icon: "💳" },
    {
      href: "/app/relances",
      label: "Relances WhatsApp",
      icon: "💬",
      badge: org.reminders.length > 0 ? org.reminders.length : undefined,
    },
    { href: "/app/ia", label: "Assistant IA", icon: "✨" },
    { href: "/app/parametres", label: "Paramètres & Fapshi", icon: "⚙️" },
    { href: "/app/abonnement", label: "Abonnement", icon: "⭐" },
    { href: "/app/historique", label: "Journal d'audit", icon: "🛡️" },
  ];

  const mobileBottomItems = [
    { href: "/app", label: "Accueil", icon: "📊" },
    { href: "/app/catalogue", label: "Produits", icon: "📦" },
    { href: "/app/documents", label: "Factures", icon: "🧾" },
    { href: "/app/clients", label: "Clients", icon: "👥" },
    { href: "/app/parametres", label: "Paramètres", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Barre latérale Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 bg-[#0B1F3A] text-white shrink-0 border-r border-slate-800 no-print">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <BrandLogo light />
        </div>

        <div className="p-4 border-b border-slate-800/80 bg-[#132D54]/60">
          <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
            {org.isLiveDb ? "🟢 Connecté à Supabase" : "🔒 Authentification requise"}
          </div>
          <div className="font-bold text-sm text-white truncate">
            {org.name || userEmail || "Mon Espace"}
          </div>
          {org.city ? (
            <div className="text-xs text-slate-300 mt-0.5 truncate">
              📍 {org.city}
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
            <span>👑 Super-Admin</span>
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
              <span>🔑 Se connecter</span>
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
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <span>{org.isLiveDb ? "🟢" : "⚪"}</span>
                <span>
                  {org.isLiveDb
                    ? `${org.name} (${userEmail})`
                    : "Non connecté"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/catalogue"
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
            >
              + Produit
            </Link>
            <Link
              href="/app/documents"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              + Facture
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loadingData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              Chargement de vos données depuis Supabase...
            </div>
          ) : !userEmail ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto my-8 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0B1F3A] flex items-center justify-center text-xl mx-auto">
                🔐
              </div>
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">
                Connectez-vous à votre compte
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cette application utilise uniquement vos vraies données Supabase (aucune donnée de démonstration). Connectez-vous ou créez votre compte pour accéder à votre espace.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href="/connexion"
                  className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold"
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
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
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
