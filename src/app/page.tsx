"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      {/* Section Héro */}
      <section className="bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] text-white py-16 sm:py-24 px-4 sm:px-6 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span>🇨🇲 Conçu pour le Cameroun & l&apos;Afrique</span>
              <span>•</span>
              <span>MTN MoMo · Orange Money · Fapshi · WhatsApp</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Gérez vos produits, factures et encaissements{" "}
              <span className="text-emerald-400">en toute sécurité</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              InnovTech Encaisse sépare strictement l&apos;interface Administrateur (pilotage du chiffre d&apos;affaires, factures, clients et stock) et l&apos;interface Client de paiement en ligne via Fapshi.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] font-extrabold text-sm sm:text-base shadow-lg transition-colors"
              >
                Se connecter
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs sm:text-sm">
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-[#F5A524]">
                  XAF
                </div>
                <div className="text-slate-300">
                  Facturation & reçus officiels
                </div>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-emerald-400">
                  Fapshi
                </div>
                <div className="text-slate-300">
                  Paiement Mobile Money direct
                </div>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-white">
                  100% RLS
                </div>
                <div className="text-slate-300">
                  Accès Admin & Client séparés
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Architecture sécurisée
                </span>
                <h2 className="font-extrabold text-lg text-[#0B1F3A]">
                  Accès réservé à l&apos;Administrateur
                </h2>
                <p className="text-xs text-slate-500">
                  Seul l&apos;administrateur authentifié (`role = &apos;admin&apos;`) accède au tableau de bord et peut créer des factures, des produits ou des comptes.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-[#0B1F3A]">
                    🔒 Espace Admin (`/admin`, `/dashboard`, `/invoices`, `/products`, `/clients`)
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Protégé par authentification Supabase et contrôle de rôle `admin`.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="font-extrabold text-emerald-900">
                    💳 Page Paiement Client (`/pay/[invoice_id]`)
                  </div>
                  <div className="text-emerald-800 mt-0.5">
                    Le client voit uniquement sa propre facture et le bouton « Payer avec Fapshi », sans aucun menu d&apos;administration.
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="block w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-sm font-extrabold text-center shadow-sm transition-colors"
              >
                Se connecter à l&apos;administration →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
