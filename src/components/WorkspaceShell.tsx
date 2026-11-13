"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "./AppContext";
import { BrandLogo } from "./PublicHeaderFooter";
import { CompanyAvatar } from "./CompanyAvatar";
import {
  getBusinessTypeLabels,
  MTN_MOMO_PAY_NUMBER,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
  ORANGE_MONEY_PAY_NUMBER,
} from "@/lib/format";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    userEmail,
    isAdmin,
    org,
    loadingData,
    refreshOrgData,
    signOutUser,
  } = useAppState();
  const labels = getBusinessTypeLabels(org.businessType);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Temps max 5 secondes sur l'écran de chargement : ne jamais rester bloqué
  useEffect(() => {
    if (!loadingData) {
      setLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loadingData]);

  useEffect(() => {
    if (!loadingData && (!userEmail || !isAdmin)) {
      router.replace("/login");
    }
  }, [loadingData, userEmail, isAdmin, router]);

  const navItems = [
    { href: "/admin", label: "Vue Admin Globale", icon: "👑" },
    { href: "/dashboard", label: "Tableau de bord", icon: "📊" },
    { href: "/produits", label: "Publier Produits (1 clic)", icon: "📣" },
    { href: "/products", label: labels.products, icon: "📦" },
    { href: "/invoices", label: "Factures", icon: "🧾" },
    { href: "/clients", label: labels.clients, icon: "👥" },
    { href: "/app/paiements", label: "Paiements & Reçus", icon: "💳" },
    {
      href: "/app/relances",
      label: "Relances WhatsApp",
      icon: "💬",
      badge: org.reminders.length > 0 ? org.reminders.length : undefined,
    },
    { href: "/app/abonnement", label: "Mon Abonnement", icon: "⭐" },
    { href: "/admin/settings", label: "Mon Entreprise / Paramètres", icon: "🏢" },
  ];

  const mobileBottomItems = [
    { href: "/dashboard", label: "Accueil", icon: "📊" },
    { href: "/produits", label: "Publier", icon: "📣" },
    { href: "/products", label: "Produits", icon: "📦" },
    { href: "/invoices", label: "Factures", icon: "🧾" },
    { href: "/admin/settings", label: "Entreprise", icon: "🏢" },
  ];

  if (loadingData && !loadingTimedOut) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-3 text-sm text-slate-600">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        <div className="font-bold text-[#0B1F3A]">Chargement...</div>
      </div>
    );
  }

  if (loadingTimedOut && loadingData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-4 text-center">
        <div className="text-base font-extrabold text-[#0B1F3A]">
          Problème de connexion, réessaie
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              setLoadingTimedOut(false);
              refreshOrgData();
            }}
            className="px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-extrabold"
          >
            Réessayer
          </button>
          <Link
            href="/login"
            className="px-5 py-3 rounded-xl bg-slate-100 text-[#0B1F3A] text-sm font-extrabold"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (!userEmail || !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-xs text-slate-500">
        Redirection vers la connexion...
      </div>
    );
  }

  const hideGlobalTrialBanner =
    pathname === "/produits" || pathname === "/app/abonnement";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Barre latérale Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 bg-[#0B1F3A] text-white shrink-0 border-r border-slate-800 no-print">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <BrandLogo light size={32} />
        </div>

        <div className="p-4 border-b border-slate-800/80 bg-[#132D54]/60 flex items-center gap-3">
          <CompanyAvatar logoUrl={org.logoUrl} name={org.name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-white truncate">
              {org.name || "Mon Entreprise"}
            </div>
            <div className="text-xs text-slate-300 truncate">{userEmail}</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/app") ||
              (item.href === "/products" && pathname === "/app/catalogue") ||
              (item.href === "/invoices" && pathname === "/app/documents") ||
              (item.href === "/clients" && pathname === "/app/clients") ||
              (item.href === "/admin/settings" &&
                pathname === "/app/parametres");
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
          <a
            href={OFFICIAL_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-1.5 text-emerald-300 hover:underline font-bold"
          >
            Aide WhatsApp : {OFFICIAL_WHATSAPP_DISPLAY}
          </a>
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              router.replace("/login");
            }}
            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-red-300 hover:bg-red-500/15 font-bold"
          >
            <span className="truncate">🚪 Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-6">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <CompanyAvatar logoUrl={org.logoUrl} name={org.name} size={34} />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-[#0B1F3A] truncate">
                {org.name || "Mon Entreprise"}
              </div>
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:underline block truncate"
              >
                Aide WhatsApp : {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/products"
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
            >
              + Produit
            </Link>
            <Link
              href="/invoices"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              + Facture
            </Link>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4">
          {!hideGlobalTrialBanner &&
          (org.subscriptionStatus === "expired" || org.trialDaysLeft <= 0) ? (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-[#0B1F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
              <div className="text-xs sm:text-sm font-extrabold leading-relaxed">
                🔒 Votre essai est terminé — Payez votre abonnement avec Orange
                Money {ORANGE_MONEY_PAY_NUMBER} / MTN MoMo {MTN_MOMO_PAY_NUMBER}.
              </div>
              <Link
                href="/app/abonnement"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shrink-0 text-center"
              >
                Payer mon abonnement
              </Link>
            </div>
          ) : !hideGlobalTrialBanner && org.subscriptionStatus === "trial" ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-[#0B1F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm no-print">
              <div className="font-bold leading-relaxed">
                🎁 Essai gratuit : {org.trialDaysLeft} jour(s) restant(s) -
                Payez après avec Orange Money {ORANGE_MONEY_PAY_NUMBER} / MTN
                MoMo {MTN_MOMO_PAY_NUMBER}
              </div>
              <Link
                href="/app/abonnement"
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-extrabold shrink-0 text-center"
              >
                Payer mon abonnement
              </Link>
            </div>
          ) : null}

          {children}
        </main>

        <footer className="px-4 py-4 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white no-print">
          Aide WhatsApp :{" "}
          <a
            href={OFFICIAL_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 font-bold hover:underline"
          >
            {OFFICIAL_WHATSAPP_DISPLAY}
          </a>{" "}
          | Email : {OFFICIAL_EMAIL}
        </footer>
      </div>

      {/* Navigation mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 grid grid-cols-5 py-1.5 px-1 no-print shadow-lg">
        {mobileBottomItems.map((item) => {
          const active = pathname === item.href;
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
