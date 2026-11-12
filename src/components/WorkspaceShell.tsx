"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "./AppContext";
import { BrandLogo } from "./PublicHeaderFooter";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userEmail, isAdmin, org, loadingData, signOutUser } = useAppState();

  useEffect(() => {
    if (!loadingData && (!userEmail || !isAdmin)) {
      router.replace("/login");
    }
  }, [loadingData, userEmail, isAdmin, router]);

  const navItems = [
    { href: "/admin", label: "Vue Admin Globale", icon: "👑" },
    { href: "/dashboard", label: "Tableau de bord", icon: "📊" },
    { href: "/products", label: "Produits & Stock", icon: "📦" },
    { href: "/invoices", label: "Factures", icon: "🧾" },
    { href: "/clients", label: "Clients", icon: "👥" },
    { href: "/app/paiements", label: "Paiements & Reçus", icon: "💳" },
    {
      href: "/app/relances",
      label: "Relances WhatsApp",
      icon: "💬",
      badge: org.reminders.length > 0 ? org.reminders.length : undefined,
    },
    { href: "/admin/settings", label: "Paramètres de mon Entreprise", icon: "🏢" },
  ];

  const mobileBottomItems = [
    { href: "/admin", label: "Admin", icon: "👑" },
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/products", label: "Produits", icon: "📦" },
    { href: "/invoices", label: "Factures", icon: "🧾" },
    { href: "/clients", label: "Clients", icon: "👥" },
  ];

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-xs text-slate-500">
        Vérification des droits administrateur Supabase...
      </div>
    );
  }

  if (!userEmail || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-xs text-slate-500">
        Redirection vers /login...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Barre latérale Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 bg-[#0B1F3A] text-white shrink-0 border-r border-slate-800 no-print">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <BrandLogo light />
        </div>

        <div className="p-4 border-b border-slate-800/80 bg-[#132D54]/60">
          <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
            🟢 Admin connecté (RLS actif)
          </div>
          <div className="font-bold text-sm text-white truncate">
            {org.name || userEmail}
          </div>
          <div className="text-xs text-slate-300 mt-0.5 truncate">
            {userEmail}
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
          <button
            type="button"
            onClick={async () => {
              await signOutUser();
              router.replace("/login");
            }}
            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-red-300 hover:bg-red-500/15 font-bold"
          >
            <span className="truncate">🚪 Déconnexion ({userEmail})</span>
          </button>
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>🔒</span>
                <span>Admin : {userEmail}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
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
