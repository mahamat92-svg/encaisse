"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  buildInvoiceWhatsAppMessage,
  buildReceiptWhatsAppMessage,
  formatCFA,
  formatDate,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";
import { WhatsAppShareButton } from "@/components/WhatsAppButton";

interface PublicDocPayload {
  number: string;
  docType: "invoice" | "quote" | "credit_note";
  issueDate: string;
  dueDate: string;
  clientName: string;
  total: number;
  paidTotal: number;
  balance: number;
  org: {
    name: string;
    city: string;
    phone: string;
    niu: string;
    rccm: string;
    mtnMomoNumber: string;
    orangeMoneyNumber: string;
    footerNote: string;
  };
  lines: Array<{
    label: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export default function PublicInvoicePage() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = params?.token ?? "";
  const { org: activeOrg, isAdmin, recordPaymentRecord } = useAppState();

  const [view, setView] = useState<PublicDocPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [fapshiLoading, setFapshiLoading] = useState(false);
  const [fapshiError, setFapshiError] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0);
  const [fapshiRef, setFapshiRef] = useState("");
  const [confirmingRef, setConfirmingRef] = useState(false);

  const isSuccessParam = searchParams?.get("payment") === "success";
  const recuParam = searchParams?.get("recu") || "";

  useEffect(() => {
    if (isSuccessParam) {
      setPaymentConfirmed(true);
    }
  }, [isSuccessParam]);

  useEffect(() => {
    if (!token || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .rpc("get_public_document", { p_token: token })
      .then(({ data }) => {
        if (data && data.number) {
          const total = Number(data.total ?? 0);
          const balance = Number(data.balance ?? 0);
          const paid = Math.max(total - balance, 0);
          setView({
            number: data.number,
            docType: data.type || "invoice",
            issueDate: data.issue_date || new Date().toISOString().slice(0, 10),
            dueDate: data.due_date || new Date().toISOString().slice(0, 10),
            clientName: data.client_name || "Client",
            total,
            paidTotal: paid,
            balance,
            org: {
              name: data.org?.name || "Entreprise",
              city: data.org?.city || "",
              phone: data.org?.phone || "",
              niu: data.org?.niu || "",
              rccm: data.org?.rccm || "",
              mtnMomoNumber: data.org?.mtn_momo_number || "",
              orangeMoneyNumber: data.org?.orange_money_number || "",
              footerNote: data.org?.footer_note || "",
            },
            lines: Array.isArray(data.lines)
              ? data.lines.map(
                  (l: {
                    label?: string;
                    quantity?: number;
                    unit_price?: number;
                    total?: number;
                  }) => ({
                    label: String(l.label ?? "Article"),
                    quantity: Number(l.quantity ?? 1),
                    unitPrice: Number(l.unit_price ?? 0),
                    total: Number(l.total ?? 0),
                  })
                )
              : [],
          });
          setConfirmedAmount(paid > 0 ? paid : total);
          if (balance === 0 && total > 0) {
            setPaymentConfirmed(true);
          }
        }
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-xs text-slate-500">
        Chargement du document...
      </div>
    );
  }

  if (!view) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md space-y-4">
          <h1 className="text-lg font-extrabold text-[#0B1F3A]">
            Document introuvable
          </h1>
          <p className="text-xs text-slate-500">
            Ce lien de facture n&apos;existe pas ou le document est encore à l&apos;état de brouillon.
          </p>
          {isAdmin ? (
            <Link
              href="/invoices"
              className="inline-block px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold"
            >
              ← Retour aux factures
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://encaisse.vercel.app";

  const currentUrl = `${origin}/pay/${token}`;
  const receiptUrl = recuParam
    ? `${origin}/pay/${token}?recu=${encodeURIComponent(recuParam)}`
    : `${origin}/pay/${token}?payment=success`;

  const matchedDoc = activeOrg.documents.find((d) => d.publicToken === token);
  const clientPhone = matchedDoc?.whatsappPhone || "";

  const productName =
    view.lines.map((l) => l.label).join(", ") || "votre commande";

  const invoiceWaMessage = buildInvoiceWhatsAppMessage({
    clientName: view.clientName,
    invoiceNumber: view.number,
    amount: view.total,
    productName,
    paymentUrl: currentUrl,
  });

  const receiptWaMessage = buildReceiptWhatsAppMessage({
    clientName: view.clientName,
    amount: confirmedAmount || view.paidTotal || view.total,
    receiptUrl,
  });

  async function handleFapshiPay() {
    if (!view) return;
    setFapshiError(null);
    setFapshiLoading(true);
    try {
      let apiUser = activeOrg.fapshi.apiUser;
      let apiKey = activeOrg.fapshi.apiKey;
      let environment = activeOrg.fapshi.environment;

      if ((!apiUser || !apiKey) && view.org.footerNote.startsWith("{")) {
        try {
          const parsed = JSON.parse(view.org.footerNote);
          apiUser = parsed.fapshiApiUser || "";
          apiKey = parsed.fapshiApiKey || "";
          environment = parsed.fapshiEnv === "sandbox" ? "sandbox" : "live";
        } catch {
          // ignore
        }
      }

      const res = await fetch("/api/fapshi/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: view.balance > 0 ? view.balance : view.total,
          apiUser,
          apiKey,
          environment,
          externalId: view.number,
          message: `Facture ${view.number} - ${view.org.name}`,
          redirectUrl: `${origin}/f/${token}?payment=success`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.link) {
        setFapshiError(
          data?.error ||
            "Impossible d'ouvrir le paiement Fapshi. Vérifiez vos clés API Fapshi dans Paramètres."
        );
        return;
      }
      window.location.href = data.link;
    } catch (err) {
      setFapshiError(
        err instanceof Error ? err.message : "Erreur de connexion Fapshi"
      );
    } finally {
      setFapshiLoading(false);
    }
  }

  async function handleConfirmFapshiPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!view) return;
    setFapshiError(null);
    const payAmt = view.balance > 0 ? view.balance : view.total;

    if (matchedDoc && activeOrg.isLiveDb) {
      setConfirmingRef(true);
      try {
        const res = await recordPaymentRecord({
          documentId: matchedDoc.id,
          amount: payAmt,
          method: "mtn_momo",
          reference: fapshiRef.trim() || `FAPSHI-${Date.now()}`,
        });
        if (!res.ok) {
          setFapshiError(res.error || "Erreur lors de la validation.");
          return;
        }
        setView({
          ...view,
          paidTotal: view.total,
          balance: 0,
        });
      } finally {
        setConfirmingRef(false);
      }
    }

    setConfirmedAmount(payAmt);
    setPaymentConfirmed(true);
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Barre d'actions avec FEATURE 1 : Envoyer sur WhatsApp */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
          {isAdmin ? (
            <Link
              href="/invoices"
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ← Retour aux factures
            </Link>
          ) : (
            <span className="text-xs font-extrabold text-[#0B1F3A]">
              Facture {view.number}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppShareButton
              phone={clientPhone}
              message={invoiceWaMessage}
              label="Envoyer sur WhatsApp"
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold shadow-sm"
            >
              🖨️ Télécharger / Imprimer PDF
            </button>
          </div>
        </div>

        {/* FEATURE 3 : Confirmation de paiement Fapshi + bouton "Envoyer le reçu sur WhatsApp" */}
        {paymentConfirmed ? (
          <div className="bg-emerald-50 border-2 border-[#25D366] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  ✅ Paiement Fapshi confirmé
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">
                  Merci {view.clientName}, paiement de{" "}
                  {formatCFA(confirmedAmount || view.paidTotal || view.total)}{" "}
                  reçu !
                </h2>
                <p className="text-xs text-slate-600">
                  Envoyez maintenant le reçu officiel de paiement sur WhatsApp en un clic.
                </p>
              </div>

              <WhatsAppShareButton
                phone={clientPhone}
                message={receiptWaMessage}
                label="Envoyer le reçu sur WhatsApp"
              />
            </div>
          </div>
        ) : null}

        {/* Facture détaillée */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="text-xl font-extrabold text-[#0B1F3A]">
                {view.org.name}
              </div>
              {view.org.city || view.org.phone ? (
                <div className="text-xs text-slate-600 mt-1">
                  {view.org.city} {view.org.phone ? `· ${view.org.phone}` : ""}
                </div>
              ) : null}
              {view.org.niu || view.org.rccm ? (
                <div className="text-xs text-slate-500">
                  {view.org.niu ? `NIU : ${view.org.niu} ` : ""}
                  {view.org.rccm ? `· RCCM : ${view.org.rccm}` : ""}
                </div>
              ) : null}
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-[#0B1F3A]">
                {paymentConfirmed || view.balance === 0
                  ? "REÇU / FACTURE PAYÉE"
                  : view.docType === "quote"
                    ? "DEVIS"
                    : "FACTURE"}
              </span>
              <div className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
                {view.number}
              </div>
              <div className="text-xs text-slate-500">
                Date : {formatDate(view.issueDate)} · Échéance :{" "}
                {formatDate(view.dueDate)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="text-slate-500 uppercase font-bold">
              Facturé à :
            </div>
            <div className="text-base font-extrabold text-[#0B1F3A]">
              {view.clientName}
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[11px]">
                <th className="py-2">Désignation</th>
                <th className="py-2 text-right">Qté</th>
                <th className="py-2 text-right">Prix Unitaire</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {view.lines.map((l, i) => (
                <tr key={i}>
                  <td className="py-3 font-semibold text-slate-800">
                    {l.label}
                  </td>
                  <td className="py-3 text-right">{l.quantity}</td>
                  <td className="py-3 text-right">{formatCFA(l.unitPrice)}</td>
                  <td className="py-3 text-right font-bold">
                    {formatCFA(l.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-2 text-xs">
              {view.org.mtnMomoNumber || view.org.orangeMoneyNumber ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  {view.org.mtnMomoNumber ? (
                    <div>
                      💛 <strong>MTN MoMo :</strong> {view.org.mtnMomoNumber}
                    </div>
                  ) : null}
                  {view.org.orangeMoneyNumber ? (
                    <div>
                      🧡 <strong>Orange Money :</strong>{" "}
                      {view.org.orangeMoneyNumber}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total TTC :</span>
                <span className="font-bold">{formatCFA(view.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Déjà payé :</span>
                <span className="font-bold">{formatCFA(view.paidTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#0B1F3A] pt-2 border-t border-slate-200">
                <span>Reste à payer :</span>
                <span>{formatCFA(view.balance)}</span>
              </div>
            </div>
          </div>

          {/* Section de paiement Fapshi en ligne si la facture a un solde à régler */}
          {view.balance > 0 && !paymentConfirmed ? (
            <div className="pt-6 border-t border-slate-200 space-y-4 no-print">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-sm font-extrabold text-[#0B1F3A]">
                    💳 Régler cette facture via Fapshi ({formatCFA(view.balance)})
                  </div>
                  <p className="text-xs text-slate-500">
                    Paiement sécurisé MTN Mobile Money / Orange Money via Fapshi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFapshiPay}
                  disabled={fapshiLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold shadow-sm disabled:opacity-50"
                >
                  {fapshiLoading
                    ? "Ouverture Fapshi..."
                    : `Payer ${formatCFA(view.balance)} avec Fapshi`}
                </button>
              </div>

              <form
                onSubmit={handleConfirmFapshiPayment}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200"
              >
                <input
                  type="text"
                  value={fapshiRef}
                  onChange={(e) => setFapshiRef(e.target.value)}
                  placeholder="Référence de transaction Fapshi / Mobile Money"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="submit"
                  disabled={confirmingRef}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shrink-0 disabled:opacity-50"
                >
                  {confirmingRef
                    ? "Confirmation..."
                    : "✔ Confirmer le paiement reçu & Générer le reçu WhatsApp"}
                </button>
              </form>

              {fapshiError ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
                  ⚠️ {fapshiError}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
