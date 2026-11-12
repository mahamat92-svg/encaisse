"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  buildReceiptWhatsAppMessage,
  formatCFA,
  formatDate,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { WhatsAppShareButton } from "@/components/WhatsAppButton";

interface ClientInvoiceView {
  number: string;
  status: string;
  issueDate: string;
  clientName: string;
  productName: string;
  total: number;
  balance: number;
  orgName: string;
  footerNote: string;
}

export default function ClientPaymentPage() {
  const params = useParams<{ invoice_id: string }>();
  const searchParams = useSearchParams();
  const invoiceId = params?.invoice_id ?? "";

  const [invoice, setInvoice] = useState<ClientInvoiceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuccess = searchParams?.get("payment") === "success";

  useEffect(() => {
    if (!invoiceId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .rpc("get_public_document", { p_token: invoiceId })
      .then(({ data }) => {
        if (data && data.number) {
          const total = Number(data.total ?? 0);
          const balance = Number(data.balance ?? 0);
          const lines = Array.isArray(data.lines) ? data.lines : [];
          const productNames =
            lines
              .map((l: { label?: string }) => String(l.label ?? ""))
              .filter(Boolean)
              .join(", ") || "Commande";

          setInvoice({
            number: String(data.number),
            status:
              isSuccess || balance <= 0
                ? "Payée"
                : "En attente de paiement",
            issueDate:
              data.issue_date || new Date().toISOString().slice(0, 10),
            clientName: String(data.client_name || "Client"),
            productName: productNames,
            total,
            balance: isSuccess ? 0 : balance,
            orgName: String(data.org?.name || "InnovTech Encaisse"),
            footerNote: String(data.org?.footer_note || ""),
          });
        }
        setLoading(false);
      });
  }, [invoiceId, isSuccess]);

  async function handlePayWithFapshi() {
    if (!invoice) return;
    setError(null);
    setPaying(true);
    try {
      let apiUser = "";
      let apiKey = "";
      let environment: "live" | "sandbox" = "live";

      if (invoice.footerNote.startsWith("{")) {
        try {
          const parsed = JSON.parse(invoice.footerNote);
          apiUser = parsed.fapshiApiUser || "";
          apiKey = parsed.fapshiApiKey || "";
          environment = parsed.fapshiEnv === "sandbox" ? "sandbox" : "live";
        } catch {
          // ignore
        }
      }

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://encaisse.vercel.app";

      const res = await fetch("/api/fapshi/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: invoice.balance > 0 ? invoice.balance : invoice.total,
          apiUser,
          apiKey,
          environment,
          externalId: invoice.number,
          message: `Facture ${invoice.number} - ${invoice.productName}`,
          redirectUrl: `${origin}/pay/${invoiceId}?payment=success`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.link) {
        setError(
          data?.error ||
            "Impossible d'initialiser le paiement Fapshi pour le moment."
        );
        return;
      }

      window.location.href = data.link;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de connexion Fapshi"
      );
    } finally {
      setPaying(false);
    }
  }

  // Page publique isolée : AUCUN menu de navigation, AUCUN lien vers /dashboard ou d'autres factures
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-xs text-slate-500">
        Chargement de votre facture...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-sm">
          <div className="text-2xl">🧾</div>
          <h1 className="text-lg font-extrabold text-[#0B1F3A]">
            Facture introuvable
          </h1>
          <p className="text-xs text-slate-500">
            Ce lien de paiement est invalide ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://encaisse.vercel.app";
  const receiptUrl = `${origin}/pay/${invoiceId}?payment=success`;
  const isPaid = invoice.balance <= 0 || isSuccess;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        {/* En-tête sobre sans aucune navigation */}
        <div className="bg-[#0B1F3A] text-white p-6 text-center space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
            {invoice.orgName}
          </div>
          <h1 className="text-xl font-extrabold"> Facture {invoice.number}</h1>
          <div className="text-xs text-slate-300">
            Client : <strong>{invoice.clientName}</strong> ·{" "}
            {formatDate(invoice.issueDate)}
          </div>
        </div>

        {/* Détails strictement limités à cette facture : Produit, Montant, Statut */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase text-slate-500">
              Statut
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                isPaid
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isPaid ? "✅ Payée" : "⏳ En attente de paiement"}
            </span>
          </div>

          <div className="space-y-1 border-b border-slate-100 pb-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              Produit / Désignation
            </div>
            <div className="text-base font-extrabold text-[#0B1F3A]">
              {invoice.productName}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-600">
              Montant à payer
            </span>
            <span className="text-2xl font-extrabold text-[#0B1F3A]">
              {formatCFA(invoice.total)}
            </span>
          </div>

          {error ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
              ⚠️ {error}
            </div>
          ) : null}

          {/* Action unique : Payer avec Fapshi (ou reçu WhatsApp après paiement réussi) */}
          {isPaid ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="text-sm font-extrabold text-emerald-900">
                ✅ Paiement reçu — Merci {invoice.clientName} !
              </div>
              <WhatsAppShareButton
                message={buildReceiptWhatsAppMessage({
                  clientName: invoice.clientName,
                  amount: invoice.total,
                  receiptUrl,
                })}
                label="Envoyer le reçu sur WhatsApp"
                className="w-full"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePayWithFapshi}
              disabled={paying}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-base shadow-md transition-colors"
            >
              {paying ? "Redirection vers Fapshi..." : "Payer avec Fapshi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
