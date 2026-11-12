"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { useAppState } from "@/components/AppContext";
import { PLANS } from "@/lib/demo-data";
import { formatCFA } from "@/lib/format";

export default function HomePage() {
  const { locale, setMode, org } = useAppState();

  const totalRevenue = org.documents
    .filter((d) => d.docType === "invoice")
    .reduce((acc, d) => acc + d.paid, 0);
  const totalReceivables = org.documents
    .filter((d) => d.docType === "invoice")
    .reduce((acc, d) => acc + d.balance, 0);

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
              <span>MTN MoMo · Orange Money · Fapshi · WhatsApp</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {locale === "fr" ? (
                <>
                  Gérez vos produits, factures et encaissements{" "}
                  <span className="text-emerald-400">en temps réel</span>.
                </>
              ) : (
                <>
                  Manage your products, invoices and collections{" "}
                  <span className="text-emerald-400">in real time</span>.
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {locale === "fr"
                ? "InnovTech Encaisse centralise votre catalogue, vos commandes/factures en XAF, vos encaissements Mobile Money (Fapshi, MTN MoMo, Orange Money) et vos relances WhatsApp sur une base Supabase 100 % isolée."
                : "InnovTech Encaisse centralizes your catalog, XAF invoices, Mobile Money payments (Fapshi, MTN MoMo, Orange Money) and WhatsApp reminders on a strictly isolated Supabase database."}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/inscription"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] font-extrabold text-sm sm:text-base shadow-lg transition-colors"
              >
                {locale === "fr"
                  ? "Créer mon compte gratuitement"
                  : "Create my free account"}
              </Link>
              <Link
                href="/app"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition-colors"
              >
                {locale === "fr" ? "Ouvrir le tableau de bord →" : "Open Dashboard →"}
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs sm:text-sm">
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-[#F5A524]">XAF</div>
                <div className="text-slate-300">
                  {locale === "fr" ? "facturation & reçus PDF" : "PDF invoicing & receipts"}
                </div>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-emerald-400">Fapshi</div>
                <div className="text-slate-300">
                  {locale === "fr" ? "connexion API Mobile Money" : "Mobile Money API integration"}
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

          {/* Carte état réel du compte */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    État en temps réel
                  </span>
                  <h2 className="font-bold text-base text-[#0B1F3A]">
                    {org.name || "Votre Entreprise"}
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  XAF
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Chiffre d&apos;affaires encaissé</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-1">
                    { totalRevenue.toLocaleString("fr-FR") } XAF
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {org.documents.filter((d) => d.docType === "invoice").length} vente(s)
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Reste à encaisser</div>
                  <div className="text-lg font-extrabold text-[#0B1F3A] mt-1">
                    { totalReceivables.toLocaleString("fr-FR") } XAF
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {org.catalog.length} produit(s) au catalogue
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Link
                  href="/app/catalogue"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold text-center"
                >
                  📦 Gérer mes produits
                </Link>
                <Link
                  href="/app/documents"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold text-center"
                >
                  📄 Créer une facture
                </Link>
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
                Quincailleries, grossistes, prestataires B2B, boutiques & freelances
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li>✅ Catalogue produits et services avec prix en XAF</li>
                <li>✅ Factures et commandes numérotées automatiquement</li>
                <li>✅ Suivi des paiements partiels et encaissements Mobile Money / Fapshi</li>
                <li>✅ Calcul optionnel de la TVA camerounaise (19,25 %)</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/app"
                onClick={() => setMode("commerce")}
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>Accéder à l&apos;espace Commerce</span>
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
                <li>✅ Échéanciers de scolarité avec suivi du solde restant</li>
                <li>✅ Reçus officiels numérotés envoyés aux parents sur WhatsApp</li>
                <li>✅ Bilingue Français / Anglais</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/app"
                onClick={() => setMode("etablissement")}
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
              >
                <span>Accéder à l&apos;espace Établissement</span>
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
                  Voir les 6 formules →
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
