"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { useAppState } from "@/components/AppContext";
import { PLANS } from "@/lib/demo-data";
import { formatCFA } from "@/lib/format";

export default function HomePage() {
  const { locale, setMode } = useAppState();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      {/* Section Héro */}
      <section className="bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] text-white py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span>🇨🇲 Conçu pour le Cameroun & l&apos;Afrique</span>
              <span>•</span>
              <span>MTN MoMo · Orange Money · WhatsApp</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {locale === "fr" ? (
                <>
                  Remplacez le cahier de dettes.{" "}
                  <span className="text-emerald-400">Facturez en 30 secondes</span> et faites-vous payer plus vite.
                </>
              ) : (
                <>
                  Replace the paper ledger.{" "}
                  <span className="text-emerald-400">Invoice in 30 seconds</span> and get paid faster.
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {locale === "fr"
                ? "InnovTech Encaisse transforme vos ventes à crédit et vos frais de scolarité en un tableau clair « Qui me doit combien », génère vos factures et reçus PDF en FCFA, et prépare vos relances WhatsApp polies en un clic."
                : "InnovTech Encaisse turns credit sales and school tuition into a clear 'Who owes me what' dashboard, generates PDF invoices & receipts in FCFA, and prepares polite WhatsApp reminders in one click."}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/inscription"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] font-extrabold text-sm sm:text-base shadow-lg transition-colors"
              >
                {locale === "fr"
                  ? "Démarrer gratuitement (14 jours Pro offerts)"
                  : "Start free (14-day Pro trial)"}
              </Link>
              <Link
                href="/app"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition-colors"
              >
                {locale === "fr" ? "Tester la démo en direct →" : "Try Live Demo →"}
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs sm:text-sm">
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-[#F5A524]">30 sec</div>
                <div className="text-slate-300">
                  {locale === "fr" ? "par facture (saisie ou dictée IA)" : "per invoice (form or AI dictation)"}
                </div>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-emerald-400">0 FCFA</div>
                <div className="text-slate-300">
                  {locale === "fr" ? "frais WhatsApp avec liens wa.me" : "WhatsApp fees via wa.me links"}
                </div>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-white">100% RLS</div>
                <div className="text-slate-300">
                  {locale === "fr" ? "isolation stricte par entreprise" : "strict multi-tenant isolation"}
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu visuel du Tableau de bord */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Aperçu en direct
                  </span>
                  <h2 className="font-bold text-base text-[#0B1F3A]">
                    Quincaillerie & BTP Ngo & Fils
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  Douala · XAF
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">On vous doit</div>
                  <div className="text-lg font-extrabold text-[#0B1F3A] mt-1">700 000 FCFA</div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                    3 factures ouvertes
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-xs text-emerald-800 font-medium">Encaissé ce mois</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-1">385 000 FCFA</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    MTN MoMo & Orange Money
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1F3A] text-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#F5A524] font-bold">✨ Dictée IA (30 secondes)</span>
                  <span className="text-slate-300">Français & Anglais</span>
                </div>
                <p className="text-xs italic text-slate-200 bg-white/10 p-2.5 rounded-lg">
                  « Facture pour Entreprise Fotso : 80 sacs de ciment à 5 500, 25 barres de fer à 4 200 »
                </p>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-300 font-semibold">
                    → FAC-2026-0042 · Total : 545 000 FCFA
                  </span>
                  <Link
                    href="/app/ia"
                    className="underline font-bold text-white hover:text-emerald-300"
                  >
                    Essayer →
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  À relancer aujourd&apos;hui sur WhatsApp
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">Entreprise Bâtiment Fotso</div>
                    <div className="text-slate-600">Reste : 345 000 FCFA · Retard J+7</div>
                  </div>
                  <Link
                    href="/app/relances"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                  >
                    💬 Relancer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deux modes dans un seul produit */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Un seul moteur · Deux modes spécialisés
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
            Adapté aux PME commerciales comme aux établissements scolaires
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            À l&apos;inscription, choisissez le mode qui correspond à votre activité. Le vocabulaire, les modèles de documents et les échéanciers s&apos;adaptent automatiquement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 text-[#0B1F3A] text-xs font-bold">
                🏪 MODE COMMERCE & SERVICES
              </div>
              <h3 className="text-xl font-extrabold text-[#0B1F3A]">
                Quincailleries, grossistes, prestataires B2B, ateliers & freelances
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li>✅ Devis convertibles en facture en un clic (`DEV-2026-0001` → `FAC-2026-0001`)</li>
                <li>✅ Suivi des paiements partiels (avances chantier, acomptes Mobile Money)</li>
                <li>✅ Plafond de crédit par client pour bloquer les mauvais payeurs</li>
                <li>✅ Calcul optionnel de la TVA camerounaise (19,25 %)</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/app"
                onClick={() => setMode("commerce")}
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>Explorer la démo Commerce & BTP</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">
                🎓 MODE ÉTABLISSEMENT SCOLAIRE & FORMATION
              </div>
              <h3 className="text-xl font-extrabold text-[#0B1F3A]">
                Écoles privées, collèges bilingues, instituts et centres de formation
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li>✅ Fiche Élève (classe, année scolaire) reliée au Parent Payeur (numéro WhatsApp)</li>
                <li>✅ Échéanciers en 2 ou 3 tranches de scolarité avec calcul automatique du retard</li>
                <li>✅ Reçus officiels numérotés (`REC-2026-0001`) envoyés aux parents sur WhatsApp</li>
                <li>✅ Bilingue Français / Anglais (sections francophone et anglophone)</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/app"
                onClick={() => setMode("etablissement")}
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>Explorer la démo École Privée</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Aperçu des Tarifs */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F5A524]">
              Tarification transparente en FCFA
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Une seule créance récupérée rembourse des mois d&apos;abonnement
            </h2>
            <p className="text-sm text-slate-300">
              Commencez gratuitement, sans carte bancaire. Payez ensuite par MTN MoMo ou Orange Money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col justify-between border ${
                  plan.badge
                    ? "bg-[#0B1F3A] border-emerald-400 shadow-xl"
                    : "bg-slate-800/70 border-slate-700"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    {plan.badge ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400 text-[#0B1F3A]">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold">
                      {formatCFA(plan.priceMonth)}
                    </span>
                    <span className="text-xs text-slate-300"> / mois</span>
                  </div>
                  <p className="text-xs text-slate-300">{plan.description}</p>
                  <ul className="space-y-2 text-xs text-slate-200 pt-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-emerald-400">✔</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/tarifs"
                  className="mt-6 w-full py-2.5 rounded-xl text-center text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] transition-colors"
                >
                  Voir les 6 formules (jusqu&apos;à Établissement) →
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

