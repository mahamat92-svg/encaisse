"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  BUSINESS_SERVICES,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
} from "@/lib/format";

const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "5.000 FCFA / mois",
    subtitle: "1 utilisateur, 50 factures",
    points: [
      "1 utilisateur inclus",
      "Jusqu'à 50 factures / mois",
      "Paiement Mobile Money & Fapshi",
      "Support WhatsApp",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "10.000 FCFA / mois",
    subtitle: "Illimité, Logo, WhatsApp",
    points: [
      "Factures, produits et clients illimités",
      "Logo personnalisé sur chaque facture PDF",
      "Partage WhatsApp professionnel en 1 clic",
      "7 jours d'essai gratuit inclus",
    ],
    popular: true,
  },
  {
    id: "ecole_clinique",
    name: "École / Clinique",
    price: "25.000 FCFA / mois",
    subtitle: "Multi-classes, Rapports",
    points: [
      "Suivi par classe, élève ou patient",
      "Frais scolaires, soins et paiements partiels",
      "Rapports financiers et relances WhatsApp",
      "Accompagnement dédié InnovTech MHA Infinity",
    ],
    popular: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      {/* Section Héro (Section bleue principale) */}
      <section className="bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] text-white py-16 sm:py-24 px-4 sm:px-6 flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-7 space-y-6">
            {/* Logo officiel centré 120px dans le Héro */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-[120px] h-[120px] rounded-2xl bg-[#071427] border-2 border-emerald-400/40 shadow-2xl overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="InnovTech MHA Infinity"
                  width={120}
                  height={120}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span>🇨🇲 Conçu pour le Cameroun & l&apos;Afrique</span>
              <span>•</span>
              <span>MTN MoMo · Orange Money · Fapshi · WhatsApp</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Une seule plateforme,{" "}
              <span className="text-emerald-400">tous vos métiers.</span>
            </h1>

            {/* 5. Texte fixe de localisation manuelle et coordonnées officielles sur la page d'accueil */}
            <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm font-bold text-white leading-relaxed">
              📍 Ngaoundéré, Adamawa - Cameroun | 📧{" "}
              <a
                href={`mailto:${OFFICIAL_EMAIL}`}
                className="text-emerald-300 hover:underline"
              >
                {OFFICIAL_EMAIL}
              </a>{" "}
              | 📱 WhatsApp:{" "}
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] hover:underline"
              >
                {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
            </div>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Encaisse, École, Clinique, Immobilier, Artisan, ONG — Gérez vos produits, factures et encaissements Mobile Money via Fapshi et WhatsApp en toute sécurité.
            </p>

            {/* 4. HOMEPAGE HERO : 2 boutons (Vert: "Créer mon compte gratuit" -> /signup, Blanc: "Se connecter" -> /login) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap gap-3.5">
                <Link
                  href="/signup"
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] font-extrabold text-sm sm:text-base shadow-lg transition-colors"
                >
                  Créer mon compte gratuit
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#0B1F3A] font-extrabold text-sm sm:text-base shadow-lg transition-colors"
                >
                  Se connecter
                </Link>
              </div>

              <p className="text-xs sm:text-sm text-emerald-300 font-semibold">
                Rejoignez +100 commerçants au Cameroun et au Tchad - WhatsApp:{" "}
                <a
                  href={OFFICIAL_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-white hover:text-emerald-300"
                >
                  {OFFICIAL_WHATSAPP_DISPLAY}
                </a>
              </p>
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

          {/* 5. CARTE DE DROITE : "Accès réservé à l'Administrateur" avec les 2 boutons */}
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
                  Créez votre compte commerçant en 30 secondes (7 jours gratuits) ou connectez-vous à votre espace d&apos;administration.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-[#0B1F3A]">
                    🔒 Espace Commerçant (`/admin`, `/dashboard`, `/invoices`, `/products`, `/clients`)
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Pilotage complet de vos ventes, factures avec logo et partage WhatsApp.
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="font-extrabold text-emerald-900">
                    💳 Page Paiement Client (`/pay/[invoice_id]`)
                  </div>
                  <div className="text-emerald-800 mt-0.5">
                    Votre client ouvre simplement le lien reçu sur WhatsApp et paie avec Fapshi sans créer de compte.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold text-center shadow-sm transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/signup"
                  className="block w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold text-center shadow-sm transition-colors"
                >
                  Créer un compte commerçant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section : Pourquoi Encaisse est nécessaire pour toi ? */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
              Afrique · Cameroun &amp; Tchad
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0B1F3A]">
              Pourquoi Encaisse est nécessaire pour toi ?
            </h2>
            <p className="text-base sm:text-lg font-bold text-slate-700 max-w-3xl mx-auto">
              Tu es boutiquier, restaurateur, coiffeuse, moto-taxi à N&apos;Djamena, Garoua, Douala ou Ngaoundéré ?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-base">
                1
              </div>
              <p className="text-sm sm:text-base font-extrabold text-[#0B1F3A] leading-snug">
                Tu perds tes clients car personne ne voit tes produits
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-base">
                2
              </div>
              <p className="text-sm sm:text-base font-extrabold text-[#0B1F3A] leading-snug">
                Tu perds ton argent car tu vends à crédit dans un cahier qui se perd
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-base">
                3
              </div>
              <p className="text-sm sm:text-base font-extrabold text-[#0B1F3A] leading-snug">
                Tu perds ton temps à écrire des factures à la main
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50 border-2 border-emerald-500 text-center space-y-4 shadow-sm">
            <div className="text-sm font-black uppercase tracking-wider text-emerald-700">
              ✅ La solution simple
            </div>
            <p className="text-base sm:text-xl font-extrabold text-[#0B1F3A] leading-relaxed max-w-3xl mx-auto">
              Avec Encaisse : Tu publies ta photo en 1 clic sur WhatsApp, TikTok, Facebook. Ton client paie par Orange Money{" "}
              <span className="text-[#FF7900]">640 633 034</span> ou MTN{" "}
              <span className="text-[#b58900]">651 465 708</span>. Tu vois tout sur ton téléphone.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Link
                href="/signup"
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-md"
              >
                🚀 Créer mon compte gratuit
              </Link>
              <Link
                href="/decouvrir"
                className="px-6 py-3.5 rounded-2xl bg-[#0B1F3A] hover:bg-[#132D54] text-white font-black text-sm sm:text-base shadow-md"
              >
                🌍 Découvrir les produits
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Nos 6 Services Métiers */}
      <section className="py-14 px-4 sm:px-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Multi-Services · InnovTech MHA Infinity
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
              Choisissez votre métier
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Les libellés de votre espace d&apos;administration s&apos;adaptent automatiquement à votre activité.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BUSINESS_SERVICES.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl">
                    {srv.emoji}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                    {srv.title}
                  </h3>
                  <p className="text-xs font-bold text-emerald-700">
                    {srv.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {srv.bullets.map((f) => (
                      <span
                        key={f}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/signup?service=${srv.id}`}
                  className="block w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold text-center transition-colors"
                >
                  Choisir ce service
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Tarifs */}
      <section id="tarifs" className="py-16 px-4 sm:px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider">
              7 jours gratuits, sans carte bancaire
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0B1F3A]">
              Nos Tarifs
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Créez votre compte gratuitement et testez toutes les fonctionnalités pendant 7 jours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 ${
                  plan.popular
                    ? "bg-[#0B1F3A] text-white border-2 border-emerald-500 shadow-xl"
                    : "bg-[#F8FAFC] text-slate-900 border border-slate-200 shadow-sm"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold">{plan.name}</h3>
                    {plan.popular ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-[#0B1F3A] text-[10px] font-extrabold uppercase">
                        Recommandé
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl font-black">
                      {plan.price}
                    </div>
                    <p
                      className={`text-xs font-bold mt-1 ${
                        plan.popular ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      {plan.subtitle}
                    </p>
                  </div>

                  <ul
                    className={`space-y-2 text-xs pt-3 border-t ${
                      plan.popular
                        ? "border-slate-700 text-slate-200"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    {plan.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2 font-medium">
                        <span className="text-emerald-500 font-extrabold">✔</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/signup?plan=pro"
                  className={`block w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-center shadow-sm transition-colors ${
                    plan.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-[#0B1F3A]"
                      : "bg-[#0B1F3A] hover:bg-[#132D54] text-white"
                  }`}
                >
                  Souscrire
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
