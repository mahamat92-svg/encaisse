"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import {
  buildWhatsAppLink,
  formatCFA,
  formatDate,
  type PaymentMethod,
} from "@/lib/format";

export default function PaymentsPage() {
  const { org, recordPaymentRecord } = useAppState();

  const [selectedDocId, setSelectedDocId] = useState(
    org.documents[0]?.id ?? ""
  );
  const [amount, setAmount] = useState(50000);
  const [method, setMethod] = useState<PaymentMethod>("mtn_momo");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (
      org.documents.length > 0 &&
      !org.documents.some((d) => d.id === selectedDocId)
    ) {
      setSelectedDocId(org.documents[0].id);
    }
  }, [org.documents, selectedDocId]);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await recordPaymentRecord({
        documentId: selectedDocId || org.documents[0]?.id || "",
        amount,
        method,
        reference,
      });
      if (!res.ok) {
        setError(res.error || "Erreur lors de l'encaissement.");
        return;
      }
      setReference("");
      setSuccessMsg(
        `✅ Paiement enregistré ! Reçu officiel ${
          res.receiptNumber ?? ""
        } généré et solde mis à jour.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          💳 Paiements & Reçus Officiels
        </h1>
        <p className="text-xs text-slate-500">
          Imputation via `record_payment()`, génération automatique des reçus (`REC-2026-XXXX`) et détection des références MoMo/OM en doublon (Règle PAY-5).
        </p>
      </div>

      <form
        onSubmit={handleRecordPayment}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <div className="font-extrabold text-sm text-[#0B1F3A]">
          Enregistrer un encaissement (Espèces, MTN MoMo, Orange Money)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Facture à imputer
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            >
              {org.documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.number} — {d.clientName} (Reste : {formatCFA(d.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Montant reçu (FCFA) *
            </label>
            <input
              type="number"
              min={500}
              step={500}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Moyen de paiement *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            >
              <option value="mtn_momo">MTN Mobile Money</option>
              <option value="orange_money">Orange Money</option>
              <option value="cash">Espèces (Caisse)</option>
              <option value="bank_transfer">Virement bancaire</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Référence de transaction SMS (MTN MoMo / Orange Money)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: MP261101.1422.A8921 (Testez ce code pour voir le blocage anti-doublon !)"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shrink-0 disabled:opacity-50"
          >
            {saving
              ? "Validation en cours..."
              : "Valider l'encaissement & créer le reçu"}
          </button>
        </div>

        {error ? (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
            🚨 {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
            {successMsg}
          </div>
        ) : null}
      </form>

      <div className="space-y-3">
        {org.payments.map((p) => {
          const waReceiptMsg = `Bonjour ${p.clientName},\nNous confirmons la bonne réception de votre paiement de *${formatCFA(
            p.amount
          )}* (Réf : ${p.reference}) sur la facture *${
            p.documentNumber
          }*.\n🧾 Numéro de reçu officiel : *${
            p.receiptNumber
          }*\nMerci pour votre confiance — ${org.name}.`;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#0B1F3A]">
                    {p.receiptNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    {p.method.replace("_", " ")}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {p.clientName} ({p.documentNumber})
                </div>
                <div className="text-xs text-slate-500">
                  Date : {formatDate(p.paidAt)} · Réf : {p.reference}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-emerald-700">
                    +{formatCFA(p.amount)}
                  </div>
                </div>
                <a
                  href={buildWhatsAppLink("", waReceiptMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-bold"
                >
                  💬 Envoyer Reçu WhatsApp
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
