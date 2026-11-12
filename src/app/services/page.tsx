"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";

export default function ServicesPage() {
  const pillars = [
    {
      badge: "Pilier 1 · Vitesse",
      title: "Devis, Factures, Avoirs et Reçus PDF en 30 secondes",
      desc: "Numérotation automatique continue sans trou (DEV-2026-0001, FAC-2026-0001, REC-2026-0001). Une facture émise est verrouillée en base de données pour garantir une traçabilité irréprochable.",
      points: [
        "Calcul automatique HT, remises et TVA camerounaise (19,25 % si assujetti)",
        "Affichage clair de vos numéros MTN MoMo et Orange Money sur chaque PDF",
        "Lien public sécurisé consultable par le client sur WhatsApp sans créer de compte",
      ],
    },
    {
      badge: "Pilier 2 · Intelligence Artificielle",
      title: "Atelier IA : Dictée de factures & Rédaction de relances",
      desc: "Tapez ou dictez simplement « Facture Moussa 3 sacs ciment 5500, livraison 2000 » : l'IA prépare le brouillon chiffré. Vous gardez toujours le contrôle final avant validation.",
      points: [
        "Fonctionne dès 0 FCFA grâce à l'analyseur local intégré + support Gemini 2.5 Flash-Lite",
        "Génération de messages de relance en 3 tons : Courtois, Ferme, Dernier rappel",
        "Bilingue natif Français et Anglais (idéal pour Douala, Yaoundé, Bamenda, Buea)",
      ],
    },
    {
      badge: "Pilier 3 · Trésorerie & Écoles",
      title: "Suivi des paiements partiels, Échéanciers & Anti-fraude MoMo",
      desc: "Les clients et parents d'élèves paient rarement en une seule fois. InnovTech Encaisse impute chaque versement partiel et recalcule le solde restant en temps réel.",
      points: [
        "Détection automatique des références MTN MoMo / Orange Money déjà utilisées (anti-faux SMS)",
        "Découpage en tranches (1re, 2e, 3e tranche de scolarité ou acomptes chantier)",
        "Arrêt automatique des relances dès que le solde tombe à 0 FCFA",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Fonctionnalités d&apos;InnovTech Encaisse
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">
            Un seul service parfaitement exécuté pour faire rentrer votre trésorerie
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Conçu pour fonctionner sur smartphone Android comme sur ordinateur, même avec une connexion 3G instable.
          </p>
        </div>

        <div className="space-y-6">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                {p.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A]">
                {p.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {p.points.map((pt) => (
                  <li
                    key={pt}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-700"
                  >
                    ✔ {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-[#0B1F3A] text-white rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-extrabold">
            Prêt à tester avec vos propres factures ou frais scolaires ?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            14 jours d&apos;essai Pro offerts à la création de votre entreprise, sans engagement.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/inscription"
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] font-extrabold text-sm"
            >
              Créer mon compte gratuit
            </Link>
            <Link
              href="/app"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm"
            >
              Ouvrir la démo
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

