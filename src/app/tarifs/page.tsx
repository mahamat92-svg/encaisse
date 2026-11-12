"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { PLANS } from "@/lib/demo-data";
import { formatCFA } from "@/lib/format";

export default function PricingPage() {
  const [billing, setBilling] = useState<"month" | "year">("month");

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Modèle économique adapté à l&apos;Afrique (XAF)
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">
            Choisissez la formule adaptée à votre taille
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Toutes les formules payantes débutent par <strong>14 jours d&apos;essai Pro gratuit</strong>. En formule annuelle, vous bénéficiez de <strong>2 mois offerts</strong>.
          </p>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 text-xs font-bold mt-4">
            <button
              type="button"
              onClick={() => setBilling("month")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                billing === "month" ? "bg-[#0B1F3A] text-white shadow" : "text-slate-700"
              }`}
            >
              Paiement Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBilling("year")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                billing === "year" ? "bg-emerald-600 text-white shadow" : "text-slate-700"
              }`}
            >
              Paiement Annuel (-16% · 2 mois offerts)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price = billing === "year" ? plan.priceYear : plan.priceMonth;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl p-6 flex flex-col justify-between border ${
                  plan.badge
                    ? "border-2 border-emerald-500 shadow-lg"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-[#0B1F3A]">{plan.name}</h2>
                    {plan.badge ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-3xl font-extrabold text-[#0B1F3A]">
                      {formatCFA(price)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {" "}
                      / {billing === "year" ? "an" : "mois"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 min-h-[34px]">{plan.description}</p>

                  <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✔</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    href={`/inscription?plan=${plan.id}`}
                    className={`block w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold transition-colors ${
                      plan.badge
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-[#0B1F3A] hover:bg-[#132D54] text-white"
                    }`}
                  >
                    {plan.priceMonth === 0
                      ? "Commencer gratuitement"
                      : "Tester 14 jours gratuitement"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Règle d'éthique sur les données */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-xs sm:text-sm text-emerald-950 space-y-1">
          <div className="font-extrabold">
            🔒 Vos données ne sont jamais prises en otage (Règle ABO-5 du Cahier des Charges)
          </div>
          <p>
            Si votre abonnement payant expire, votre compte repasse automatiquement en formule Gratuite : vous conservez un accès total à vos clients, à votre historique et à l&apos;enregistrement des paiements.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

