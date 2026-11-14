"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppState } from "@/components/AppContext";
import { formatCFA } from "@/lib/format";

interface FapshiSubscriptionCheckoutProps {
  onSuccess?: () => void;
}

export function FapshiSubscriptionCheckout({
  onSuccess,
}: FapshiSubscriptionCheckoutProps) {
  const { org, refreshOrgData } = useAppState();
  const [planId, setPlanId] = useState<"pro" | "business">("pro");
  const [method, setMethod] = useState<"Orange Money" | "MTN MoMo">(
    "Orange Money"
  );
  const [phone, setPhone] = useState("+237 ");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [transId, setTransId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<
    "info" | "success" | "error" | null
  >(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  const amount = planId === "business" ? 15000 : 5000;

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setPolling(false);
  }

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  async function checkPaymentStatus(
    currentTransId: string,
    currentPaymentId: string | null,
    currentPlanId: "pro" | "business",
    currentAmount: number
  ) {
    try {
      const params = new URLSearchParams({
        transId: currentTransId,
        planId: currentPlanId,
        amount: String(currentAmount),
      });
      if (currentPaymentId) params.set("paymentId", currentPaymentId);

      const res = await fetch(`/api/fapshi/payer?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data?.status === "Réussi") {
        stopPolling();
        setStatusType("success");
        setStatusMessage("Paiement réussi ✅ Merci");
        await refreshOrgData();
        onSuccess?.();
        return true;
      }

      if (data?.fapshiStatus === "FAILED" || data?.fapshiStatus === "EXPIRED") {
        stopPolling();
        setStatusType("error");
        setStatusMessage("Paiement échoué, réessaie");
        onSuccess?.();
        return true;
      }
    } catch {
      // On continue de vérifier jusqu'au timeout
    }
    return false;
  }

  async function handleStartPayment(selectedPlan: "pro" | "business") {
    setPlanId(selectedPlan);
    const chosenAmount = selectedPlan === "business" ? 15000 : 5000;

    setStatusMessage(null);
    setStatusType(null);
    stopPolling();
    setLoading(true);

    try {
      const res = await fetch("/api/fapshi/payer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          amount: chosenAmount,
          method,
          phone,
          customerName: org.name || "Client InnovTech MHA",
          orgId: org.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.transId) {
        setStatusType("error");
        setStatusMessage(data?.error || "Paiement échoué, réessaie");
        onSuccess?.();
        return;
      }

      const newTransId = String(data.transId);
      const newPaymentId = data.paymentId ? String(data.paymentId) : null;
      setTransId(newTransId);
      setPaymentId(newPaymentId);
      setStatusType("info");
      setStatusMessage(
        "Demande envoyée sur votre téléphone ! Validez avec votre code PIN..."
      );

      // Polling automatique Fapshi payment-status
      pollAttemptsRef.current = 0;
      setPolling(true);
      pollTimerRef.current = setInterval(async () => {
        pollAttemptsRef.current += 1;
        const done = await checkPaymentStatus(
          newTransId,
          newPaymentId,
          selectedPlan,
          chosenAmount
        );
        if (!done && pollAttemptsRef.current >= 20) {
          stopPolling();
          setStatusType("error");
          setStatusMessage("Paiement échoué, réessaie");
          onSuccess?.();
        }
      }, 3000);
    } catch {
      setStatusType("error");
      setStatusMessage("Paiement échoué, réessaie");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#166534] p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-[11px] font-extrabold uppercase tracking-wider">
            ⚡ Paiement Instantané Fapshi Direct Pay
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A] mt-2">
            Active ton abonnement en 1 clic sur ton téléphone
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Choisis Orange Money ou MTN MoMo, entre ton numéro et valide le message PIN sur ton téléphone.
          </p>
        </div>
      </div>

      {/* Choix opérateur + numéro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-700">
            1. Choisis ton opérateur Mobile Money
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMethod("Orange Money")}
              className={`py-3 px-3 rounded-xl border-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                method === "Orange Money"
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-slate-300"
              }`}
            >
              🟠 Orange Money
            </button>
            <button
              type="button"
              onClick={() => setMethod("MTN MoMo")}
              className={`py-3 px-3 rounded-xl border-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                method === "MTN MoMo"
                  ? "border-amber-500 bg-amber-50 text-amber-900"
                  : "border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-slate-300"
              }`}
            >
              🟡 MTN MoMo
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="fapshi-phone"
            className="block text-xs font-extrabold text-slate-700"
          >
            2. Ton numéro Mobile Money
          </label>
          <input
            id="fapshi-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ex: +237 6XX XX XX XX"
            className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#166534]"
          />
        </div>
      </div>

      {/* 2 Boutons d'action directe Pro & Business */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          disabled={loading || polling}
          onClick={() => handleStartPayment("pro")}
          className="w-full py-3.5 px-4 rounded-xl bg-[#166534] hover:bg-[#14532D] disabled:opacity-60 text-white font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
        >
          {loading && planId === "pro"
            ? "Envoi sur ton téléphone..."
            : "Payer abonnement Pro 5 000 FCFA"}
        </button>

        <button
          type="button"
          disabled={loading || polling}
          onClick={() => handleStartPayment("business")}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-60 text-white font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
        >
          {loading && planId === "business"
            ? "Envoi sur ton téléphone..."
            : "Payer abonnement Business 15 000 FCFA"}
        </button>
      </div>

      {/* Statut en direct */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            statusType === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : statusType === "error"
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-amber-50 border-amber-300 text-amber-900"
          }`}
        >
          <span>
            {statusMessage}
            {statusType === "success"
              ? ` (Abonnement Payé • Solde Mobile Money + ${formatCFA(amount)})`
              : ""}
          </span>

          {polling && transId && (
            <button
              type="button"
              onClick={() =>
                checkPaymentStatus(transId, paymentId, planId, amount)
              }
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-400 text-amber-900 text-xs font-extrabold hover:bg-amber-100 shrink-0 cursor-pointer"
            >
              Vérifier maintenant
            </button>
          )}
        </div>
      )}
    </div>
  );
}
