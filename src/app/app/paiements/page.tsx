"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";
import {
  buildReceiptWhatsAppMessage,
  formatCFA,
  formatDate,
  type PaymentMethod,
} from "@/lib/format";
import { WhatsAppShareButton } from "@/components/WhatsAppButton";

interface ConfirmedPaymentReceipt {
  clientName: string;
  clientPhone: string;
  amount: number;
  receiptNumber: string;
  publicToken: string;
}

export default function PaymentsPage() {
  const { org, recordPaymentRecord } = useAppState();

  const [selectedDocId, setSelectedDocId] = useState(
    org.documents[0]?.id ?? ""
  );
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("mtn_momo");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] =
    useState<ConfirmedPaymentReceipt | null>(null);

  React.useEffect(() => {
    if (
      org.documents.length > 0 &&
      !org.documents.some((d) => d.id === selectedDocId)
    ) {
      setSelectedDocId(org.documents[0].id);
    }
  }, [org.documents, selectedDocId]);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://encaisse.vercel.app";

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLastReceipt(null);
    setSaving(true);
    try {
      const targetId = selectedDocId || org.documents[0]?.id || "";
      const targetDoc = org.documents.find((d) => d.id === targetId);
      const numAmount = Number(amount) || 0;

      const res = await recordPaymentRecord({
        documentId: targetId,
        amount: numAmount,
        method,
        reference,
      });
      if (!res.ok) {
        setError(res.error || "Erreur lors de l'encaissement.");
        return;
      }

      setLastReceipt({
        clientName: targetDoc?.clientName || "Client",
        clientPhone: targetDoc?.whatsappPhone || "",
        amount: numAmount,
        receiptNumber: res.receiptNumber || "REC",
        publicToken: targetDoc?.publicToken || "",
      });

      setReference("");
      setAmount("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          💳 Paiements & Reçus Fapshi / Mobile Money
        </h1>
        <p className="text-xs text-slate-500">
          Enregistrez les règlements réels de vos factures et envoyez le reçu de confirmation sur WhatsApp ({org.payments.length} paiement(s) enregistré(s)).
        </p>
      </div>

      {/* FEATURE 3 : Bandeau de confirmation de paiement avec bouton "Envoyer le reçu sur WhatsApp" */}
      {lastReceipt ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-[#25D366] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              ✅ Paiement confirmé — Reçu {lastReceipt.receiptNumber}
            </div>
            <div className="text-base font-extrabold text-[#0B1F3A]">
              Merci {lastReceipt.clientName}, paiement de{" "}
              {formatCFA(lastReceipt.amount)} enregistré !
            </div>
            <p className="text-xs text-slate-600">
              Cliquez sur le bouton vert pour envoyer immédiatement le reçu au client sur WhatsApp.
            </p>
          </div>

          <WhatsAppShareButton
            phone={lastReceipt.clientPhone}
            message={buildReceiptWhatsAppMessage({
              clientName: lastReceipt.clientName,
              amount: lastReceipt.amount,
              receiptUrl: lastReceipt.publicToken
                ? `${origin}/f/${lastReceipt.publicToken}?recu=${encodeURIComponent(
                    lastReceipt.receiptNumber
                  )}`
                : `${origin}/app/paiements`,
            })}
            label="Envoyer le reçu sur WhatsApp"
          />
        </div>
      ) : null}

      {org.documents.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl mx-auto">
            💳
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#0B1F3A]">
              Aucun paiement enregistré (0 XAF)
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Créez d&apos;abord une commande ou facture pour pouvoir enregistrer un paiement client.
            </p>
          </div>
          <Link
            href="/app/documents"
            className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
          >
            + Créer ma première facture
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleRecordPayment}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
        >
          <div className="font-extrabold text-sm text-[#0B1F3A]">
            Confirmer un paiement Fapshi / Mobile Money sur une facture
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Facture *
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
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
                Montant reçu (XAF) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mode de paiement *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="mtn_momo">Fapshi / MTN Mobile Money</option>
                <option value="orange_money">Fapshi / Orange Money</option>
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Référence de transaction Fapshi / Mobile Money
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Référence Fapshi ou SMS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shrink-0 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Valider le paiement"}
            </button>
          </div>

          {error ? (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
              ⚠️ {error}
            </div>
          ) : null}
        </form>
      )}

      {org.payments.length > 0 ? (
        <div className="space-y-3">
          {org.payments.map((p) => {
            const receiptUrl = p.publicToken
              ? `${origin}/f/${p.publicToken}?recu=${encodeURIComponent(
                  p.receiptNumber
                )}`
              : `${origin}/app/paiements`;

            const waReceiptMsg = buildReceiptWhatsAppMessage({
              clientName: p.clientName,
              amount: p.amount,
              receiptUrl,
            });

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
                    {p.clientName}
                    {p.whatsappPhone ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        ({p.whatsappPhone})
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500">
                    Date : {formatDate(p.paidAt)}
                    {p.reference ? ` · Réf : ${p.reference}` : ""}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-lg font-extrabold text-emerald-700">
                    +{formatCFA(p.amount)}
                  </div>
                  <WhatsAppShareButton
                    phone={p.whatsappPhone}
                    message={waReceiptMsg}
                    label="Envoyer le reçu sur WhatsApp"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
