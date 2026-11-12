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
  const [subPayments, setSubPayments] = useState<PendingSubPayment[]>([]);
  const [orgsCount, setOrgsCount] = useState(0);
  const [aiCostFcfa, setAiCostFcfa] = useState(0);
  const [aiCallsCount, setAiCallsCount] = useState(0);
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
        .limit(20),
    ]);

    setOrgsCount(orgsRes.data?.length ?? 0);

    if (aiRes.data) {
      setAiCallsCount(aiRes.data.length);
      const totalMicroUsd = aiRes.data.reduce(
        (acc, r) => acc + Number(r.cost_micro_usd ?? 0),
        0
      );
      setAiCostFcfa(Math.max(Math.round(totalMicroUsd * 0.00062), 0));
    }

    if (ticketsRes.data) {
      setTickets(ticketsRes.data as AdminSupportTicket[]);
    }

    if (spRes.data) {
      const orgMap = new Map(
        orgsRes.data?.map((o) => [o.id, o.name]) ?? []
      );
      setSubPayments(
        spRes.data.map((row) => ({
          id: row.id,
          orgName: orgMap.get(row.org_id) || "Entreprise",
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
    const supabase = createClient();
    const { error } = await supabase.rpc("review_subscription_payment", {
      p_id: id,
      p_approve: approve,
      p_note: approve ? "Validé par Super-Admin" : "Refusé",
    });
    if (error) {
      setStatusMessage(`Erreur : ${error.message}`);
      return;
    }
    setStatusMessage(
      approve
        ? "✅ Abonnement activé avec succès !"
        : "Paiement refusé."
    );
    await loadAdminDashboard();
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
              🟢 {userEmail}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">
              Entreprises inscrites
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">
              {orgsCount}
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
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">
              Coût API IA
            </div>
            <div className="text-2xl font-extrabold text-[#F5A524] mt-2">
              {formatCFA(aiCostFcfa)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {aiCallsCount} appel(s) IA
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400 font-bold uppercase">
              Tickets Support
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">
              {tickets.length}
            </div>
          </div>
        </div>

        {statusMessage ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300">
            {statusMessage}
          </div>
        ) : null}

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold">
            💳 Paiements d&apos;abonnements Mobile Money
          </h2>

          {subPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
              Aucun paiement d&apos;abonnement déclaré pour le moment (0 XAF).
            </div>
          ) : (
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
                      {sp.method} · Réf :{" "}
                      <strong className="text-amber-300">{sp.reference}</strong>{" "}
                      · {sp.payerPhone}
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
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300">
                        {sp.status === "approved" ? "✅ Approuvé" : "❌ Refusé"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
