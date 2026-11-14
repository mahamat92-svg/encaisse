"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/components/AppContext";
import { formatCFA } from "@/lib/format";
import {
  normalizeCameroonPhone,
  type CameroonOperator,
} from "@/lib/fapshi";

interface FapshiSubscriptionCheckoutProps {
  onSuccess?: () => void;
}

function formatCountdown(secondsLeft: number): string {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function FapshiSubscriptionCheckout({
  onSuccess,
}: FapshiSubscriptionCheckoutProps) {
  const { org, refreshOrgData } = useAppState();
  const [planId, setPlanId] = useState<"pro" | "business">("pro");
  const [method, setMethod] = useState<CameroonOperator>("Orange Money");
  const [manualOverride, setManualOverride] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  const [transId, setTransId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<
    "info" | "success" | "error" | null
  >(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parsedPhone = useMemo(() => normalizeCameroonPhone(phone), [phone]);
  const amount = planId === "business" ? 15000 : 5000;
  const hasTypedPhone = phone.trim().length > 0;
  const isPhoneInvalid = hasTypedPhone && !parsedPhone.valid;

  // Auto-détecte l'opérateur tant que l'utilisateur n'a pas forcé manuellement
  useEffect(() => {
    if (!manualOverride && parsedPhone.detectedOperator) {
      setMethod(parsedPhone.detectedOperator);
    }
  }, [parsedPhone.detectedOperator, manualOverride]);

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setPolling(false);
  }

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  async function checkPaymentStatus(
    currentTransId: string,
    currentPaymentId: string | null,
    currentPlanId: "pro" | "business",
    currentAmount: number
  ) {
    setCheckingNow(true);
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

      if (data?.status === "Réussi" || data?.fapshiStatus === "SUCCESS") {
        stopPolling();
        setTimedOut(false);
        setStatusType("success");
        setStatusMessage("Paiement réussi ✅ Merci");
        await refreshOrgData();
        onSuccess?.();
        return true;
      }

      if (data?.fapshiStatus === "FAILED" || data?.fapshiStatus === "EXPIRED") {
        stopPolling();
        setTimedOut(false);
        setStatusType("error");
        setStatusMessage(
          data?.message || data?.error || "Fapshi a refusé le paiement."
        );
        onSuccess?.();
        return true;
      }
    } catch {
      // On continue de vérifier jusqu'à la fin des 120 secondes
    } finally {
      setCheckingNow(false);
    }
    return false;
  }

  async function handleStartPayment(selectedPlan: "pro" | "business") {
    if (!parsedPhone.valid) {
      setStatusType("error");
      setStatusMessage("Numéro invalide, vérifie ton numéro : ex 640633834");
      return;
    }

    setPlanId(selectedPlan);
    const chosenAmount = selectedPlan === "business" ? 15000 : 5000;

    setStatusMessage(null);
    setStatusType(null);
    setTimedOut(false);
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
          phone: parsedPhone.local9,
          customerName: org.name || "Hadja production",
          orgId: org.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.transId) {
        setStatusType("error");
        setStatusMessage(
          data?.error || data?.message || "Fapshi a refusé la demande."
        );
        onSuccess?.();
        return;
      }

      const newTransId = String(data.transId);
      const newPaymentId = data.paymentId ? String(data.paymentId) : null;
      setTransId(newTransId);
      setPaymentId(newPaymentId);
      setStatusType("info");
      setStatusMessage(
        `On a envoyé une demande à ${parsedPhone.display}. Regarde ton téléphone, tape ton code PIN ${method}.`
      );

      // Compte à rebours 120 secondes + polling toutes les 10 secondes
      setSecondsLeft(120);
      setPolling(true);

      countdownTimerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopPolling();
            setTimedOut(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      pollTimerRef.current = setInterval(async () => {
        await checkPaymentStatus(
          newTransId,
          newPaymentId,
          selectedPlan,
          chosenAmount
        );
      }, 10000);
    } catch {
      setStatusType("error");
      setStatusMessage("Erreur réseau lors de l'appel à Fapshi. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#166534] p-5 sm:p-6 shadow-sm space-y-5">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#166534] text-[11px] font-extrabold uppercase tracking-wider">
          ⚡ Paiement Instantané Fapshi Mobile Money
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A] mt-2">
          Active ton abonnement en 1 clic sur ton téléphone
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Entre ton numéro camerounais (9 chiffres), choisis Orange Money ou MTN MoMo et valide le code PIN sur ton téléphone.
        </p>
      </div>

      {/* Numéro + Select Opérateur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="fapshi-phone"
            className="block text-xs font-extrabold text-slate-700"
          >
            1. Ton numéro Mobile Money (Cameroun)
          </label>
          <input
            id="fapshi-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="ex: 640633834 ou +237 640 63 38 34"
            className={`w-full rounded-xl border px-4 py-3 text-sm font-bold text-[#0B1F3A] bg-[#F8FAFC] focus:outline-none ${
              isPhoneInvalid
                ? "border-red-500 focus:border-red-600"
                : parsedPhone.valid
                  ? "border-emerald-500 focus:border-[#166534]"
                  : "border-slate-300 focus:border-[#166534]"
            }`}
          />
          {isPhoneInvalid && (
            <p className="text-xs font-bold text-red-600">
              Numéro invalide, vérifie ton numéro : ex 640633834
            </p>
          )}
          {parsedPhone.valid && (
            <p className="text-xs font-extrabold text-[#166534]">
              ✅ Numéro confirmé : {parsedPhone.display} - {method}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="fapshi-operator"
            className="block text-xs font-extrabold text-slate-700"
          >
            2. Opérateur Mobile Money
          </label>
          <select
            id="fapshi-operator"
            value={method}
            onChange={(e) => {
              setManualOverride(true);
              setMethod(e.target.value as CameroonOperator);
            }}
            className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0B1F3A] focus:outline-none focus:border-[#166534]"
          >
            <option value="Orange Money">🟠 Orange Money</option>
            <option value="MTN MoMo">🟡 MTN MoMo</option>
          </select>
          {parsedPhone.valid && parsedPhone.detectedOperator && (
            <p className="text-[11px] text-slate-500">
              Opérateur détecté : <strong>{parsedPhone.detectedOperator}</strong> (modifiable ci-dessus)
            </p>
          )}
        </div>
      </div>

      {/* 2 Boutons d'action directe Pro & Business */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          disabled={!parsedPhone.valid || loading || polling}
          onClick={() => handleStartPayment("pro")}
          className="w-full py-3.5 px-4 rounded-xl bg-[#166534] hover:bg-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
        >
          {loading && planId === "pro"
            ? "Envoi à Fapshi..."
            : "Payer abonnement Pro 5 000 FCFA"}
        </button>

        <button
          type="button"
          disabled={!parsedPhone.valid || loading || polling}
          onClick={() => handleStartPayment("business")}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-sm transition-colors cursor-pointer"
        >
          {loading && planId === "business"
            ? "Envoi à Fapshi..."
            : "Payer abonnement Business 15 000 FCFA"}
        </button>
      </div>

      {/* Statut en direct + Compte à rebours + Vérifier maintenant */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-extrabold space-y-3 ${
            statusType === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : statusType === "error"
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-amber-50 border-amber-300 text-amber-900"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p>
                {statusMessage}
                {statusType === "success"
                  ? ` (Abonnement Payé • Solde Mobile Money + ${formatCFA(amount)})`
                  : ""}
              </p>
              {polling && secondsLeft > 0 && (
                <p className="text-xs font-bold text-amber-800 mt-1">
                  ⏳ En attente de validation... {formatCountdown(secondsLeft)}
                </p>
              )}
            </div>

            {transId && statusType !== "success" && (
              <button
                type="button"
                disabled={checkingNow}
                onClick={() =>
                  checkPaymentStatus(transId, paymentId, planId, amount)
                }
                className="px-3.5 py-2 rounded-lg bg-white border border-amber-400 text-amber-900 text-xs font-extrabold hover:bg-amber-100 shrink-0 cursor-pointer disabled:opacity-60"
              >
                {checkingNow ? "Vérification..." : "Vérifier maintenant"}
              </button>
            )}
          </div>

          {timedOut && statusType !== "success" && (
            <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs font-bold text-amber-900">
                Tu n&apos;as rien reçu ? 1) Vérifie que ton numéro est bien Orange/MTN 2) Vérifie ton réseau 3) Clique sur Renvoyer la demande
              </p>
              <button
                type="button"
                disabled={loading || !parsedPhone.valid}
                onClick={() => handleStartPayment(planId)}
                className="px-3.5 py-2 rounded-lg bg-[#166534] hover:bg-[#14532D] text-white text-xs font-extrabold shrink-0 cursor-pointer"
              >
                Renvoyer la demande PIN
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
