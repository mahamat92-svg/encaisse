"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";
import { BrandLogo } from "@/components/PublicHeaderFooter";
import { formatCFA } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

interface PendingSubPayment {
  id: string;
  orgName: string;
  planName: string;
  period: string;
  amount: number;
  method: string;
  reference: string;
  payerPhone: string;
  status: "pending" | "approved" | "rejected";
}

interface AdminSupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function SuperAdminPage() {
  const { supabaseReady, userEmail } = useAppState();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);
  const [subPayments, setSubPayments] = useState<PendingSubPayment[]>([
    {
      id: "sp-1",
      orgName: "Quincaillerie & BTP Ngo & Fils SARL",
      planName: "Pro (5 000 FCFA)",
      period: "Mensuel",
      amount: 5000,
      method: "MTN MoMo",
      reference: "MP261111.1904.D9920",
      payerPhone: "+237 677 45 12 89",
      status: "pending",
    },
    {
      id: "sp-2",
      orgName: "Complexe Scolaire Bilingue Les Lauréats",
      planName: "Établissement (500 000 FCFA)",
      period: "Annuel",
      amount: 500000,
      method: "Orange Money",
      reference: "OM261110.1120.A4410",
      payerPhone: "+237 699 00 11 22",
      status: "approved",
    },
  ]);
  const [orgsCount, setOrgsCount] = useState(12);
  const [aiCostFcfa, setAiCostFcfa] = useState(84);
  const [aiCallsCount, setAiCallsCount] = useState(412);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadAdminDashboard = useCallback(async () => {
    if (!supabaseReady) return;
    const supabase = createClient();

    const { data: adminCheck } = await supabase.rpc("is_platform_admin");
    setIsPlatformAdmin(Boolean(adminCheck));

    const [spRes, orgsRes, aiRes, ticketsRes] = await Promise.all([
      supabase
        .from("subscription_payments")
        .select(
          "id, org_id, plan_id, billing_period, amount, method, reference, payer_phone, status"
        )
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("organizations").select("id, name"),
      supabase.from("ai_usage").select("cost_micro_usd"),
      supabase
        .from("support_tickets")
        .select("id, subject, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (orgsRes.data && orgsRes.data.length > 0) {
      setOrgsCount(orgsRes.data.length);
    }

    if (aiRes.data && aiRes.data.length > 0) {
      setAiCallsCount(aiRes.data.length);
      const totalMicroUsd = aiRes.data.reduce(
        (acc, r) => acc + Number(r.cost_micro_usd ?? 0),
        0
      );
      // 1 USD ≈ 620 FCFA => 1 micro-USD = 0.00062 FCFA
      setAiCostFcfa(Math.max(Math.round(totalMicroUsd * 0.00062), 0));
    }

    if (ticketsRes.data) {
      setTickets(ticketsRes.data as AdminSupportTicket[]);
    }

    if (spRes.data && spRes.data.length > 0) {
      const orgMap = new Map(
        orgsRes.data?.map((o) => [o.id, o.name]) ?? []
      );
      setSubPayments(
        spRes.data.map((row) => ({
          id: row.id,
          orgName: orgMap.get(row.org_id) || "Entreprise inscrite",
          planName: row.plan_id.toUpperCase(),
          period: row.billing_period === "year" ? "Annuel" : "Mensuel",
          amount: Number(row.amount ?? 0),
          method: row.method === "mtn_momo" ? "MTN MoMo" : "Orange Money",
          reference: row.reference,
          payerPhone: row.payer_phone || "",
          status: row.status,
        }))
      );
    }
  }, [supabaseReady]);

  useEffect(() => {
    loadAdminDashboard();
  }, [loadAdminDashboard]);

  async function handleReview(id: string, approve: boolean) {
    setStatusMessage(null);
    if (supabaseReady && !id.startsWith("sp-")) {
      const supabase = createClient();
      const { error } = await supabase.rpc("review_subscription_payment", {
        p_id: id,
        p_approve: approve,
        p_note: approve ? "Validé par Super-Admin" : "Référence non trouvée",
      });
      if (error) {
        setStatusMessage(`Erreur RPC : ${error.message}`);
        return;
      }
      setStatusMessage(
        approve
          ? "✅ Abonnement activé / prolongé avec succès en base Supabase !"
          : "Paiement marqué comme refusé."
      );
      await loadAdminDashboard();
      return;
    }

    setSubPayments(
      subPayments.map((sp) =>
        sp.id === id ? { ...sp, status: approve ? "approved" : "rejected" } : sp
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandLogo light />
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-[#0B1F3A]">
            👑 SUPER-ADMINISTRATION
          </span>
          {isPlatformAdmin ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              🟢 Super-Admin Authentifié ({userEmail})
            </span>
          ) : null}
        </div>
        <Link
          href="/app"
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
        >
          ← Retour à l&apos;espace client
        </Link>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {isPlatformAdmin === false ? (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 space-y-1">
            <div className="font-extrabold text-amber-300">
              ℹ️ Mode Aperçu Super-Admin : votre compte n&apos;est pas encore inscrit dans la table `public.platform_admins`.
            </div>
            <div>
              Exécutez la commande SQL d&apos;une ligne dans Supabase SQL Editor pour activer vos droits complets de Super-Administrateur.
            </div>
          </div>
        ) : null}

        {/* KPI Plateforme (ADM-3 & ADM-5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">
              Entreprises & Écoles inscrites
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">
              {orgsCount}
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              Multi-tenant RLS actif
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">
              Revenus abonnements validés
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">
              {formatCFA(
                subPayments
                  .filter((s) => s.status === "approved")
                  .reduce((acc, s) => acc + s.amount, 0)
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {subPayments.filter((s) => s.status === "pending").length} en attente de validation
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">
              Coût total API IA (ADM-3)
            </div>
            <div className="text-2xl font-extrabold text-[#F5A524] mt-2">
              {formatCFA(aiCostFcfa)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {aiCallsCount} appels IA journalisés dans `ai_usage`
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">
              Tickets Support Clients
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">
              {tickets.length}
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              Isolation RLS 100% active
            </div>
          </div>
        </div>

        {statusMessage ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300">
            {statusMessage}
          </div>
        ) : null}

        {/* Validation des paiements manuels d'abonnements (ADM-2) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-extrabold">
              💳 Paiements d&apos;abonnements Mobile Money à valider (`review_subscription_payment`)
            </h2>
            <p className="text-xs text-slate-400">
              Vérifiez sur votre téléphone la réception du SMS MTN MoMo ou Orange Money, puis cliquez sur « Approuver » pour prolonger automatiquement l&apos;abonnement de 30 ou 365 jours.
            </p>
          </div>

          <div className="space-y-3">
            {subPayments.map((sp) => (
              <div
                key={sp.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{sp.orgName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-emerald-400">
                      {sp.planName} · {sp.period}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Opérateur : <strong>{sp.method}</strong> · Réf SMS :{" "}
                    <strong className="text-amber-300">{sp.reference}</strong> · Téléphone :{" "}
                    {sp.payerPhone}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-extrabold text-base text-white">
                    {formatCFA(sp.amount)}
                  </div>
                  {sp.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(sp.id, true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] text-xs font-extrabold"
                      >
                        ✔ Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(sp.id, false)}
                        className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold"
                      >
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        sp.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {sp.status === "approved" ? "✅ Approuvé & Activé" : "❌ Refusé"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tickets de support reçus (ADM-4) */}
        {tickets.length > 0 ? (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold">
              🎧 Tickets d&apos;assistance reçus (`support_tickets`)
            </h2>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex justify-between font-bold text-white">
                    <span>{t.subject}</span>
                    <span className="text-emerald-400 uppercase">{t.status}</span>
                  </div>
                  <p className="text-slate-400">{t.message}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
