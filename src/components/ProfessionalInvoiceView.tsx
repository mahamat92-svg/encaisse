"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BRAND_COLOR_PALETTE,
  buildInvoiceWhatsAppMessage,
  buildReceiptWhatsAppMessage,
  DEFAULT_MERCHANT_LOCATION_LABEL,
  formatCFA,
  formatDate,
  MTN_MOMO_PAY_DIGITS,
  MTN_MOMO_PAY_NUMBER,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
  ORANGE_MONEY_PAY_DIGITS,
  ORANGE_MONEY_PAY_NUMBER,
  PAYMENT_BENEFICIARY_NAME,
  type BrandColorChoice,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { FacebookBlueIcon } from "@/components/ExcelInvoiceTable";
import { WhatsAppShareButton } from "@/components/WhatsAppButton";

interface InvoiceDataView {
  publicToken: string;
  number: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientPhone: string;
  total: number;
  paidTotal: number;
  balance: number;
  merchant: {
    name: string;
    logoUrl: string;
    slogan: string;
    addressCity: string;
    phone: string;
    email: string;
    rccmNiu: string;
    primaryColor: BrandColorChoice;
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
  pendingSubmission?: {
    id: string;
    operator: "orange_money" | "mtn_momo";
    payerPhone: string;
    transactionCode: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null;
}

function ProfessionalInvoiceViewInner({
  invoiceIdOrToken,
  viewerMode,
}: {
  invoiceIdOrToken: string;
  viewerMode: "client" | "admin";
}) {
  const searchParams = useSearchParams();
  const { org: activeOrg, isAdmin } = useAppState();

  const [invoice, setInvoice] = useState<InvoiceDataView | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState<
    "orange_money" | "mtn_momo" | null
  >("orange_money");
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [payerPhone, setPayerPhone] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPaymentSuccess = searchParams?.get("payment") === "success";

  useEffect(() => {
    if (!invoiceIdOrToken || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchInvoice() {
      setLoading(true);
      try {
        const { data } = await supabase.rpc("get_public_document", {
          p_token: invoiceIdOrToken,
        });

        if (data && data.number) {
          const total = Number(data.total ?? 0);
          const balance = Number(data.balance ?? 0);
          const paid = Math.max(total - balance, 0);

          const footerStr = String(data.org?.footer_note || "");
          let footerMeta: {
            email?: string;
            slogan?: string;
            primaryColor?: BrandColorChoice;
            rccmNiu?: string;
            logoUrl?: string;
          } = {};

          if (footerStr.startsWith("{")) {
            try {
              footerMeta = JSON.parse(footerStr);
            } catch {
              // ignore
            }
          }

          const rawColor = data.org?.primary_color || footerMeta.primaryColor;
          const validColor: BrandColorChoice =
            rawColor === "blue" ||
              rawColor === "gold" ||
              rawColor === "orange" ||
              rawColor === "black"
              ? rawColor
              : activeOrg.primaryColor || "green";

          const matchedLocalDoc = activeOrg.documents.find(
            (d) =>
              d.publicToken === invoiceIdOrToken || d.id === invoiceIdOrToken
          );

          setInvoice({
            publicToken: String(
              data.public_token ||
              matchedLocalDoc?.publicToken ||
              invoiceIdOrToken
            ),
            number: String(data.number),
            issueDate:
              data.issue_date || new Date().toISOString().slice(0, 10),
            dueDate: data.due_date || new Date().toISOString().slice(0, 10),
            clientName: String(data.client_name || "Client"),
            clientPhone: String(
              data.client_phone || matchedLocalDoc?.whatsappPhone || ""
            ),
            total,
            paidTotal: isPaymentSuccess ? total : paid,
            balance: isPaymentSuccess ? 0 : balance,
            merchant: {
              name: String(
                data.org?.name || activeOrg.name || "InnovTech Encaisse"
              ),
              logoUrl: String(
                data.org?.logo_url ||
                footerMeta.logoUrl ||
                activeOrg.logoUrl ||
                ""
              ),
              slogan: String(
                data.org?.slogan || footerMeta.slogan || activeOrg.slogan || ""
              ),
              addressCity: String(
                data.org?.city ||
                activeOrg.city ||
                DEFAULT_MERCHANT_LOCATION_LABEL
              ),
              phone: String(
                data.org?.phone || activeOrg.phone || OFFICIAL_WHATSAPP_DIGITS
              ),
              email: String(
                data.org?.email ||
                footerMeta.email ||
                activeOrg.email ||
                OFFICIAL_EMAIL
              ),
              rccmNiu: String(
                data.org?.rccm_niu ||
                footerMeta.rccmNiu ||
                activeOrg.rccmNiu ||
                [data.org?.rccm, data.org?.niu].filter(Boolean).join(" · ")
              ),
              primaryColor: validColor,
              mtnMomoNumber: String(
                data.org?.mtn_momo_number || activeOrg.mtnMomoNumber || ""
              ),
              orangeMoneyNumber: String(
                data.org?.orange_money_number ||
                activeOrg.orangeMoneyNumber ||
                ""
              ),
              footerNote: footerStr,
            },
            lines: Array.isArray(data.lines)
              ? data.lines.map(
                (l: {
                  label?: string;
                  quantity?: number;
                  unit_price?: number;
                  total?: number;
                }) => ({
                  label: String(l.label ?? "Produit"),
                  quantity: Number(l.quantity ?? 1),
                  unitPrice: Number(l.unit_price ?? 0),
                  total: Number(l.total ?? 0),
                })
              )
              : [],
            pendingSubmission: data.pending_submission
              ? {
                  id: String(data.pending_submission.id ?? ""),
                  operator:
                    data.pending_submission.operator === "mtn_momo"
                      ? "mtn_momo"
                      : "orange_money",
                  payerPhone: String(data.pending_submission.payer_phone ?? ""),
                  transactionCode: String(
                    data.pending_submission.transaction_code ?? ""
                  ),
                  amount: Number(data.pending_submission.amount ?? balance),
                  status: String(data.pending_submission.status ?? "pending"),
                  createdAt: String(data.pending_submission.created_at ?? ""),
                }
              : null,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceIdOrToken, isPaymentSuccess, activeOrg]);

  function handleDownloadPdf() {
    if (!invoice) return;
    const prevTitle = document.title;
    document.title = `Facture-${invoice.number}-${invoice.merchant.name}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  }

  async function handleSelectOperator(op: "orange_money" | "mtn_momo") {
    setSelectedOperator(op);
    setErrorMsg(null);
    const digits =
      op === "orange_money" ? ORANGE_MONEY_PAY_DIGITS : MTN_MOMO_PAY_DIGITS;
    const display =
      op === "orange_money" ? ORANGE_MONEY_PAY_NUMBER : MTN_MOMO_PAY_NUMBER;
    const label = op === "orange_money" ? "Orange Money" : "MTN MoMo";

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(digits);
      }
      setCopiedMsg(`Numéro ${label} copié : ${display}`);
    } catch {
      setCopiedMsg(`Numéro ${label} sélectionné : ${display}`);
    }
  }

  async function handleSubmitMobileMoney(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    setErrorMsg(null);

    const operator = selectedOperator || "orange_money";
    const phone = payerPhone.trim();
    const code = transactionCode.trim();

    if (phone.length < 6) {
      setErrorMsg("Veuillez saisir le numéro de téléphone qui a payé.");
      return;
    }
    if (code.length < 3) {
      setErrorMsg("Veuillez saisir le code de transaction / ID du SMS.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("submit_mobile_money_payment", {
        p_token: invoice.publicToken || invoiceIdOrToken,
        p_payer_phone: phone,
        p_transaction_code: code,
        p_operator: operator,
      });

      if (error) {
        if (error.message.includes("ALREADY_PENDING")) {
          setErrorMsg(
            "Un paiement est déjà en attente de validation pour cette facture."
          );
        } else if (error.message.includes("INVOICE_ALREADY_PAID")) {
          setErrorMsg("Cette facture est déjà réglée.");
        } else {
          setErrorMsg(error.message || "Erreur lors de l'envoi du paiement.");
        }
        return;
      }

      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              pendingSubmission: {
                id: String(data?.id ?? ""),
                operator,
                payerPhone: phone,
                transactionCode: code,
                amount: Number(data?.amount ?? prev.balance ?? prev.total),
                status: "pending",
                createdAt: String(
                  data?.created_at ?? new Date().toISOString()
                ),
              },
            }
          : prev
      );
      setPayerPhone("");
      setTransactionCode("");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer votre confirmation."
      );
    } finally {
      setSubmittingPayment(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-xs text-slate-500">
        Chargement de la facture...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
          <div className="text-2xl">🧾</div>
          <h1 className="text-lg font-extrabold text-[#0B1F3A]">
            Facture introuvable
          </h1>
          <p className="text-xs text-slate-500">
            Ce lien de facture n&apos;existe pas ou a expiré.
          </p>
          {viewerMode === "admin" && isAdmin ? (
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

  const palette = BRAND_COLOR_PALETTE[invoice.merchant.primaryColor || "green"];
  const isPaid = invoice.balance <= 0 || isPaymentSuccess;
  const isPendingValidation = !isPaid && Boolean(invoice.pendingSubmission);
  const amountDue = invoice.balance > 0 ? invoice.balance : invoice.total;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://encaisse.vercel.app";

  const paymentUrl = `${origin}/pay/${invoice.publicToken}`;
  const receiptUrl = `${origin}/pay/${invoice.publicToken}?payment=success`;

  const waShareMessage = buildInvoiceWhatsAppMessage({
    clientName: invoice.clientName,
    invoiceNumber: invoice.number,
    amount: invoice.total,
    paymentUrl,
    merchantName: invoice.merchant.name,
    merchantCity: invoice.merchant.addressCity,
    merchantEmail: invoice.merchant.email || OFFICIAL_EMAIL,
  });

  const waReceiptMessage = buildReceiptWhatsAppMessage({
    clientName: invoice.clientName,
    amount: invoice.total,
    receiptUrl,
    merchantEmail: invoice.merchant.email || OFFICIAL_EMAIL,
  });

  return (
    <div className="min-h-screen bg-slate-100/80 print:bg-white py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Barre supérieure visible uniquement pour l'Admin (aucun menu sur /pay/[invoice_id]) */}
        {viewerMode === "admin" && isAdmin ? (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm no-print">
            <Link
              href="/invoices"
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              ← Retour aux factures (/invoices)
            </Link>
            <Link
              href="/admin/settings"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              🏢 Modifier le logo / l&apos;en-tête (/admin/settings)
            </Link>
          </div>
        ) : null}

        {/* FEUILLE DE FACTURE PROFESSIONNELLE A4 (Fond blanc pur, print-friendly) */}
        <div
          id="invoice-printable-area"
          className="bg-white rounded-2xl print:rounded-none border border-slate-200 print:border-0 shadow-md print:shadow-none overflow-hidden"
        >
          {/* Bandeau supérieur à la couleur principale de l'entreprise */}
          <div
            className="h-3 w-full"
            style={{ backgroundColor: palette.hex }}
          />

          <div className="p-6 sm:p-10 space-y-8">
            {/* TOP : Logo 70px dans un encadré sombre arrondi à gauche | "FACTURE" + Numéro FAC-2026-XXXX à droite */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
              {/* Gauche : Logo + Nom Entreprise + Coordonnées */}
              <div className="space-y-3">
                <div className="flex items-center gap-3.5">
                  <CompanyAvatar
                    logoUrl={invoice.merchant.logoUrl}
                    name={invoice.merchant.name || "Entreprise"}
                    size={70}
                  />

                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                      {invoice.merchant.name || "InnovTech MHA Infinity"}
                    </h2>
                    {invoice.merchant.slogan ? (
                      <p
                        className="text-xs font-bold mt-0.5"
                        style={{ color: palette.hex }}
                      >
                        {invoice.merchant.slogan}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Coordonnées de l'entreprise sous le logo */}
                <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed font-medium">
                  <div className="font-bold text-slate-800">
                    {invoice.merchant.name || "InnovTech MHA Infinity"}
                  </div>
                  <div>
                    {invoice.merchant.addressCity || DEFAULT_MERCHANT_LOCATION_LABEL}
                  </div>
                  <div>{invoice.merchant.email || OFFICIAL_EMAIL}</div>
                  <div>
                    WhatsApp: {invoice.merchant.phone || OFFICIAL_WHATSAPP_DISPLAY}
                  </div>
                  {invoice.merchant.rccmNiu ? (
                    <div className="text-slate-500">
                      🏛️ {invoice.merchant.rccmNiu}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Droite : "FACTURE" + Numéro FAC-2026-XXXX */}
              <div className="sm:text-right space-y-1.5">
                <div
                  className="text-2xl sm:text-3xl font-black tracking-tight uppercase"
                  style={{ color: palette.hex }}
                >
                  FACTURE
                </div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900">
                  {invoice.number}
                </div>
                <div className="text-xs text-slate-500">
                  Date : {formatDate(invoice.issueDate)}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Date limite : {formatDate(invoice.dueDate)}
                </div>
                <div className="pt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : isPendingValidation
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isPaid
                      ? "✅ PAYÉE"
                      : isPendingValidation
                        ? "⏳ En attente de validation"
                        : "⏳ EN ATTENTE DE PAIEMENT"}
                  </span>
                </div>
              </div>
            </div>

            {/* RÉSUMÉ EN HAUT : Client, Facture, Montant à payer en XAF en GROS, Date limite */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Facturé à :
                </div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900">
                  {invoice.clientName}
                  {invoice.clientPhone ? (
                    <span className="text-sm font-semibold text-slate-600">
                      {" "}
                      — 📞 {invoice.clientPhone}
                    </span>
                  ) : null}
                </div>
                {(() => {
                  const matchedClient = activeOrg.clients.find(
                    (c) =>
                      c.name.toLowerCase() ===
                        invoice.clientName.toLowerCase() ||
                      (invoice.clientPhone && c.phone === invoice.clientPhone)
                  );
                  const fbUrl = matchedClient?.facebookUrl?.trim();
                  if (!fbUrl) return null;
                  const href = fbUrl.startsWith("http")
                    ? fbUrl
                    : `https://${fbUrl}`;
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1877F2] hover:underline"
                    >
                      <FacebookBlueIcon className="w-3.5 h-3.5" />
                      <span>{fbUrl}</span>
                    </a>
                  );
                })()}
                <div className="text-xs text-slate-600">
                  Facture <strong>{invoice.number}</strong> · Date limite :{" "}
                  <strong>{formatDate(invoice.dueDate)}</strong>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  Montant à payer
                </div>
                <div
                  className="text-3xl sm:text-4xl font-black tracking-tight"
                  style={{ color: palette.hex }}
                >
                  {formatCFA(amountDue)}
                </div>
              </div>
            </div>

            {/* TABLEAU : Produit | Quantité | Prix unitaire | Total */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-white text-xs uppercase tracking-wider"
                    style={{ backgroundColor: palette.hex }}
                  >
                    <th className="py-3 px-4 rounded-tl-xl">Produit</th>
                    <th className="py-3 px-4 text-center">Quantité</th>
                    <th className="py-3 px-4 text-right">Prix</th>
                    <th className="py-3 px-4 text-right rounded-tr-xl">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {invoice.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {line.label}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {line.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700">
                        {formatCFA(line.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatCFA(line.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MONTANT TOTAL EN GRAND ET GRAS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t-2 border-slate-200">
              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  👤 Bénéficiaire :{" "}
                  <strong className="text-slate-900">
                    {PAYMENT_BENEFICIARY_NAME}
                  </strong>
                </div>
                <div>
                  🧡 <strong>Orange Money :</strong> {ORANGE_MONEY_PAY_NUMBER}
                </div>
                <div>
                  💛 <strong>MTN MoMo :</strong> {MTN_MOMO_PAY_NUMBER}
                </div>
              </div>

              <div
                className="p-4 sm:px-6 rounded-2xl text-white flex items-center justify-between sm:justify-end gap-6"
                style={{ backgroundColor: palette.hex }}
              >
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider opacity-90">
                  Montant Total :
                </span>
                <span className="text-2xl sm:text-3xl font-black">
                  {formatCFA(invoice.total)}
                </span>
              </div>
            </div>

            {/* PAIEMENT MOBILE MONEY CAMEROUN (Masqué si déjà payée ou à l'impression) */}
            {!isPaid ? (
              <div className="pt-6 border-t border-slate-200 space-y-5 no-print">
                {isPendingValidation && invoice.pendingSubmission ? (
                  <div className="p-5 sm:p-6 rounded-2xl bg-blue-50 border-2 border-blue-200 space-y-2 text-center">
                    <div className="text-2xl">⏳</div>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">
                      En attente de validation
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto">
                      Votre paiement de{" "}
                      <strong>
                        {formatCFA(invoice.pendingSubmission.amount)}
                      </strong>{" "}
                      via{" "}
                      <strong>
                        {invoice.pendingSubmission.operator === "orange_money"
                          ? "Orange Money"
                          : "MTN MoMo"}
                      </strong>{" "}
                      (Numéro :{" "}
                      <strong>{invoice.pendingSubmission.payerPhone}</strong>,
                      Code :{" "}
                      <strong>
                        {invoice.pendingSubmission.transactionCode}
                      </strong>
                      ) a bien été envoyé. Notre équipe vérifie le SMS et
                      valide votre facture sous peu.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-sm">
                    <div className="space-y-1 text-center sm:text-left">
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">
                        💳 Payer par Mobile Money Cameroun
                      </h3>
                      <p className="text-xs text-slate-600">
                        Cliquez sur un opérateur pour copier automatiquement le
                        numéro de paiement au nom de{" "}
                        <strong>{PAYMENT_BENEFICIARY_NAME}</strong>.
                      </p>
                    </div>

                    {/* 2 GROS BOUTONS CLIQUABLES : Orange Money & MTN MoMo */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectOperator("orange_money")}
                        className={`w-full px-5 py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-sm flex items-center justify-between gap-3 border-2 ${
                          selectedOperator === "orange_money"
                            ? "bg-[#FF7900] text-white border-[#cc6100] ring-4 ring-orange-200"
                            : "bg-[#FF7900] hover:bg-[#e56d00] text-white border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>🟠</span>
                          <span>Orange Money</span>
                        </span>
                        <span className="font-black tracking-wide">
                          {ORANGE_MONEY_PAY_NUMBER}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectOperator("mtn_momo")}
                        className={`w-full px-5 py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-sm flex items-center justify-between gap-3 border-2 ${
                          selectedOperator === "mtn_momo"
                            ? "bg-[#FFCC00] text-[#0B1F3A] border-[#d4a900] ring-4 ring-yellow-200"
                            : "bg-[#FFCC00] hover:bg-[#eab800] text-[#0B1F3A] border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>🟡</span>
                          <span>MTN MoMo</span>
                        </span>
                        <span className="font-black tracking-wide">
                          {MTN_MOMO_PAY_NUMBER}
                        </span>
                      </button>
                    </div>

                    {copiedMsg ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold text-center">
                        ✅ {copiedMsg}
                      </div>
                    ) : null}

                    {/* ÉTAPES AFFICHÉES AU CLIENT */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700">
                      <div className="font-extrabold text-[#0B1F3A]">
                        Comment payer votre facture :
                      </div>
                      <div>
                        <strong>Étape 1 :</strong> Ouvrez Orange Money ou MTN
                        MoMo sur votre téléphone.
                      </div>
                      <div>
                        <strong>Étape 2 :</strong> Envoyez le montant exact (
                        <strong className="text-[#0B1F3A]">
                          {formatCFA(amountDue)}
                        </strong>
                        ) au numéro :{" "}
                        <strong className="text-[#FF7900]">
                          {ORANGE_MONEY_PAY_NUMBER}
                        </strong>{" "}
                        (Orange) ou{" "}
                        <strong className="text-[#b58900]">
                          {MTN_MOMO_PAY_NUMBER}
                        </strong>{" "}
                        (MTN) au nom de{" "}
                        <strong className="text-[#0B1F3A]">
                          {PAYMENT_BENEFICIARY_NAME}
                        </strong>
                        .
                      </div>
                      <div>
                        <strong>Étape 3 :</strong> Gardez le SMS de
                        confirmation.
                      </div>
                    </div>

                    {/* FORMULAIRE DE CONFIRMATION */}
                    <form
                      onSubmit={handleSubmitMobileMoney}
                      className="space-y-4 pt-2"
                    >
                      <div className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                        Confirmer mon paiement :
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Opérateur utilisé *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedOperator("orange_money")
                              }
                              className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all ${
                                selectedOperator === "orange_money"
                                  ? "bg-[#FF7900] text-white border-[#FF7900]"
                                  : "bg-white text-slate-700 border-slate-300"
                              }`}
                            >
                              Orange Money
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedOperator("mtn_momo")}
                              className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all ${
                                selectedOperator === "mtn_momo"
                                  ? "bg-[#FFCC00] text-[#0B1F3A] border-[#eab800]"
                                  : "bg-white text-slate-700 border-slate-300"
                              }`}
                            >
                              MTN MoMo
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Votre numéro qui a payé *
                          </label>
                          <input
                            type="tel"
                            required
                            value={payerPhone}
                            onChange={(e) => setPayerPhone(e.target.value)}
                            placeholder="ex: 6XX XX XX XX"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Code de transaction / ID du SMS *
                          </label>
                          <input
                            type="text"
                            required
                            value={transactionCode}
                            onChange={(e) => setTransactionCode(e.target.value)}
                            placeholder="ex: MP261113.1234.A123"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {errorMsg ? (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold text-center">
                          ⚠️ {errorMsg}
                        </div>
                      ) : null}

                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold shadow-sm transition-colors disabled:opacity-50"
                      >
                        {submittingPayment
                          ? "Envoi de la confirmation..."
                          : "✅ J'ai payé, valider ma facture"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : null}

            {/* FOOTER : "Merci pour votre confiance - [Nom entreprise]" + PDF / WhatsApp */}
            <div className="pt-6 border-t border-slate-200 space-y-5">
              <div className="text-center text-xs sm:text-sm font-bold text-slate-700">
                {invoice.merchant.footerNote || "Merci pour votre confiance"} —{" "}
                <span style={{ color: palette.hex }}>
                  {invoice.merchant.name}
                </span>
              </div>

              {/* Boutons d'action (masqués à l'impression PDF) */}
              <div className="flex flex-wrap items-center justify-center gap-3 no-print">
                {isPaid ? (
                  <WhatsAppShareButton
                    phone={invoice.clientPhone}
                    message={waReceiptMessage}
                    label="Envoyer le reçu sur WhatsApp"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-sm"
                >
                  📥 Télécharger PDF avec logo
                </button>

                {viewerMode === "admin" ? (
                  <WhatsAppShareButton
                    phone={invoice.clientPhone}
                    message={waShareMessage}
                    label="Envoyer sur WhatsApp"
                    onDownloadPdf={handleDownloadPdf}
                    invoiceShare={{
                      invoiceNumber: invoice.number,
                      issueDate: invoice.issueDate,
                      clientName: invoice.clientName,
                      clientPhone: invoice.clientPhone,
                      productName:
                        invoice.lines.map((l) => l.label).join(", ") ||
                        "Produit",
                      quantity: invoice.lines[0]?.quantity || 1,
                      unitPrice: invoice.lines[0]?.unitPrice || invoice.total,
                      amount: invoice.total,
                      paymentUrl,
                      merchantName: invoice.merchant.name,
                      merchantCity: invoice.merchant.addressCity,
                      merchantPhone: invoice.merchant.phone,
                      merchantEmail: invoice.merchant.email,
                      merchantRccmNiu: invoice.merchant.rccmNiu,
                      merchantLogoUrl: invoice.merchant.logoUrl,
                      primaryColor: invoice.merchant.primaryColor,
                    }}
                  />
                ) : null}
              </div>

              {/* Bas de page /pay/[invoice_id] */}
              <div className="pt-4 border-t border-slate-100 text-center space-y-1">
                <div className="text-[11px] text-slate-400 font-medium">
                  Facture créée avec Encaisse
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfessionalInvoiceView(props: {
  invoiceIdOrToken: string;
  viewerMode: "client" | "admin";
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-xs text-slate-500">
          Chargement de la facture...
        </div>
      }
    >
      <ProfessionalInvoiceViewInner {...props} />
    </Suspense>
  );
}

