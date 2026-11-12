"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAppState } from "@/components/AppContext";
import { PLANS } from "@/lib/demo-data";
import { formatCFA, type PaymentMethod } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

interface SubPaymentRow {
  id: string;
  plan_id: string;
  billing_period: string;
  amount: number;
  method: string;
  reference: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function SubscriptionPage() {
  const { org, refreshOrgData } = useAppState();
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [method, setMethod] = useState<PaymentMethod>("mtn_momo");
  const [reference, setReference] = useState("");
  const [payerPhone, setPayerPhone] = useState("+237 ");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [effectivePlanId, setEffectivePlanId] = useState<string>("pro");
  const [docsUsed, setDocsUsed] = useState<number>(org.documents.length);
  const [aiUsed, setAiUsed] = useState<number>(3);
  const [history, setHistory] = useState<SubPaymentRow[]>([]);

  const mtnAdmin =
    process.env.NEXT_PUBLIC_ADMIN_MTN_MOMO || "670 00 00 00 (Nom : INNOVTECH)";
  const omAdmin =
    process.env.NEXT_PUBLIC_ADMIN_ORANGE_MONEY || "690 00 00 00 (Nom : INNOVTECH)";

  const planObj = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[2];
  const currentPlanObj =
    PLANS.find((p) => p.id === effectivePlanId) ?? PLANS[2];
  const amountDue = period === "year" ? planObj.priceYear : planObj.priceMonth;

  const loadSubscriptionState = useCallback(async () => {
    if (!org.isLiveDb) {
      setDocsUsed(org.documents.length);
      return;
    }
    const supabase = createClient();
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [effRes, usageRes, histRes] = await Promise.all([
      supabase.rpc("effective_plan", { p_org: org.id }),
      supabase
        .from("usage_counters")
        .select("metric, used")
        .eq("org_id", org.id)
        .eq("period", currentMonth),
      supabase
        .from("subscription_payments")
        .select(
          "id, plan_id, billing_period, amount, method, reference, status, created_at"
        )
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (typeof effRes.data === "string" && effRes.data) {
      setEffectivePlanId(effRes.data);
    }
    if (usageRes.data) {
      const d = usageRes.data.find((x) => x.metric === "documents");
      const a = usageRes.data.find((x) => x.metric === "ai_dictations");
      setDocsUsed(d ? Number(d.used) : org.documents.length);
      setAiUsed(a ? Number(a.used) : 0);
    }
    if (histRes.data) {
      setHistory(histRes.data as SubPaymentRow[]);
    }
  }, [org.id, org.isLiveDb, org.documents.length]);

  useEffect(() => {
    loadSubscriptionState();
  }, [loadSubscriptionState]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitted(false);

    if (org.isLiveDb) {
      setSubmitting(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.rpc("submit_subscription_payment", {
          p_org: org.id,
          p_plan: selectedPlan,
          p_period: period,
          p_method: method,
          p_reference: reference.trim(),
          p_payer_phone: payerPhone.trim(),
        });
        if (error) {
          if (error.message.includes("DUPLICATE_REFERENCE")) {
            setErrorMsg(
              "Cette référence de transaction Mobile Money a déjà été soumise (protection anti-doublon)."
            );
          } else {
            setErrorMsg(error.message);
          }
          return;
        }
        await loadSubscriptionState();
        await refreshOrgData();
      } finally {
        setSubmitting(false);
      }
    }

    setSubmitted(true);
    setReference("");
  }

  return (
    <div className="space-y-6">
      {/* En-tête & Quotas en temps réel (ABO-1 & QUO-1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
              Formule effective : {currentPlanObj.name}
              {org.trialDaysLeft > 0
                ? ` · Essai Pro (${org.trialDaysLeft}j restants)`
                : ""}
            </span>
            <h1 className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
              ⭐ Mon Abonnement, Quotas & Paiement Mobile Money
            </h1>
            <p className="text-xs text-slate-500">
              Aucune coupure brutale : vos données restent 100% accessibles même après expiration (Règle ABO-4).
            </p>
          </div>
        </div>

        {/* Barres de consommation des quotas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>👥 Clients / Élèves actifs</span>
              <span className="text-[#0B1F3A]">
                {org.clients.length} / {currentPlanObj.limits.clients ?? "Illimité"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Contrôlé par le trigger PostgreSQL `enforce_client_limit`
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>📄 Devis & Factures ce mois</span>
              <span className="text-[#0B1F3A]">
                {docsUsed} / {currentPlanObj.limits.documents ?? "Illimité"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Compteur mensuel `usage_counters` (`documents`)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>✨ Dictées & Relances IA ce mois</span>
              <span className="text-[#0B1F3A]">
                {aiUsed} / {currentPlanObj.limits.aiDictations}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Compteur mensuel `usage_counters` (`ai_dictations`)
            </p>
          </div>
        </div>
      </div>

      {/* Sélecteur rapide des 6 formules (2 500 à 50 000 FCFA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PLANS.map((p) => {
          const isSelected = selectedPlan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (p.priceMonth > 0) setSelectedPlan(p.id);
              }}
              className={`text-left p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? "bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-sm"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-xs font-extrabold">{p.name}</div>
              <div
                className={`text-sm font-extrabold mt-1 ${
                  isSelected ? "text-emerald-400" : "text-emerald-700"
                }`}
              >
                {p.priceMonth === 0 ? "0 FCFA" : formatCFA(p.priceMonth)}
              </div>
              <div
                className={`text-[10px] mt-1 ${
                  isSelected ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {p.limits.users} utilisateur(s) · {p.limits.aiDictations} IA
              </div>
            </button>
          );
        })}
      </div>

      {/* Paiement manuel Mobile Money (ABO-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#0B1F3A] text-white rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold">
            1. Instructions de règlement Mobile Money
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Effectuez votre dépôt ou transfert sur l&apos;un des comptes officiels InnovTech AI ci-dessous, puis renseignez la référence SMS reçue dans le formulaire ci-contre.
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-400/15 border border-amber-400/30">
              <div className="font-bold text-[#F5A524]">💛 MTN Mobile Money</div>
              <div className="text-sm font-extrabold text-white mt-0.5">{mtnAdmin}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-orange-500/15 border border-orange-500/30">
              <div className="font-bold text-orange-300">🧡 Orange Money</div>
              <div className="text-sm font-extrabold text-white mt-0.5">{omAdmin}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/10 text-xs space-y-1">
            <div className="text-slate-300">
              Montant exact à envoyer ({planObj.name} ·{" "}
              {period === "year" ? "Annuel -2 mois offerts" : "Mensuel"}) :
            </div>
            <div className="text-2xl font-extrabold text-emerald-400">
              {formatCFA(amountDue)}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-extrabold text-[#0B1F3A]">
            2. Déclarer mon paiement d&apos;abonnement (`submit_subscription_payment`)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Formule souhaitée
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                {PLANS.filter((p) => p.priceMonth > 0).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCFA(p.priceMonth)} / mois
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Périodicité
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as "month" | "year")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="month">Mensuel (30 jours)</option>
                <option value="year">Annuel (365 jours · 2 mois offerts)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Opérateur utilisé
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="mtn_momo">MTN Mobile Money</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro ayant effectué le paiement *
              </label>
              <input
                type="tel"
                required
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Référence de la transaction Mobile Money *
            </label>
            <input
              type="text"
              required
              minLength={4}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: MP261111.1830.A4519"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {errorMsg ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
              🚨 {errorMsg}
            </div>
          ) : null}

          {submitted ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
              ✅ Votre déclaration de paiement ({formatCFA(amountDue)}) a été enregistrée. Elle apparaît maintenant dans l&apos;espace Super-Administrateur (`/admin`) pour validation en 1 clic.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-sm"
          >
            {submitting
              ? "Transmission en cours..."
              : `Envoyer ma référence pour activation (${formatCFA(amountDue)})`}
          </button>
        </form>
      </div>

      {/* Historique des déclarations d'abonnement de l'entreprise */}
      {history.length > 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B1F3A]">
            📋 Historique de vos paiements d&apos;abonnement déclarés
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {history.map((h) => (
              <div
                key={h.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-[#0B1F3A] uppercase">
                    Formule {h.plan_id}
                  </span>{" "}
                  ({h.billing_period === "year" ? "Annuel" : "Mensuel"}) · Réf :{" "}
                  <span className="font-mono font-bold">{h.reference}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold">{formatCFA(h.amount)}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold ${
                      h.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : h.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {h.status === "approved"
                      ? "✅ Activé"
                      : h.status === "rejected"
                      ? "❌ Refusé"
                      : "⏳ En attente Super-Admin"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
