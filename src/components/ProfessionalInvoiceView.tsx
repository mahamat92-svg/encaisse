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
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
  type BrandColorChoice,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";
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
  const [payingFapshi, setPayingFapshi] = useState(false);
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

  async function handlePayWithFapshi() {
    if (!invoice) return;
    setErrorMsg(null);
    setPayingFapshi(true);
    try {
      let apiUser = activeOrg.fapshi.apiUser;
      let apiKey = activeOrg.fapshi.apiKey;
      let environment = activeOrg.fapshi.environment;

      if (
        (!apiUser || !apiKey) &&
        invoice.merchant.footerNote.startsWith("{")
      ) {
        try {
          const parsed = JSON.parse(invoice.merchant.footerNote);
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
          message: `Facture ${invoice.number} - ${invoice.merchant.name}`,
          redirectUrl: `${origin}/pay/${invoice.publicToken}?payment=success`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.link) {
        setErrorMsg(
          data?.error ||
          "Impossible d'ouvrir le paiement Fapshi. Vérifiez les clés API Fapshi de l'entreprise."
        );
        return;
      }

      window.location.href = data.link;
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erreur de connexion Fapshi"
      );
    } finally {
      setPayingFapshi(false);
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
                  <div className="w-[70px] h-[70px] rounded-2xl bg-[#0B1F3A] border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={invoice.merchant.logoUrl || "/logo.png"}
                      alt={invoice.merchant.name}
                      width={70}
                      height={70}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

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
                <div className="pt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {isPaid ? "✅ PAYÉE" : "⏳ EN ATTENTE DE PAIEMENT"}
                  </span>
                </div>
              </div>
            </div>

            {/* ENCADRÉ CLIENT : "Facturé à: Nom client, Téléphone" */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
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
              </div>
              <div className="text-xs text-slate-500">
                Échéance : <strong>{formatDate(invoice.dueDate)}</strong>
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
                {invoice.merchant.mtnMomoNumber ? (
                  <div>
                    💛 <strong>MTN MoMo :</strong>{" "}
                    {invoice.merchant.mtnMomoNumber}
                  </div>
                ) : null}
                {invoice.merchant.orangeMoneyNumber ? (
                  <div>
                    🧡 <strong>Orange Money :</strong>{" "}
                    {invoice.merchant.orangeMoneyNumber}
                  </div>
                ) : null}
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

            {/* FOOTER : "Merci pour votre confiance - [Nom entreprise]" + 3 boutons d'action */}
            <div className="pt-6 border-t border-slate-200 space-y-5">
              <div className="text-center text-xs sm:text-sm font-bold text-slate-700">
                Merci pour votre confiance —{" "}
                <span style={{ color: palette.hex }}>
                  {invoice.merchant.name}
                </span>
              </div>

              {errorMsg ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold text-center no-print">
                  ⚠️ {errorMsg}
                </div>
              ) : null}

              {/* Boutons d'action (masqués à l'impression PDF) */}
              <div className="flex flex-wrap items-center justify-center gap-3 no-print">
                {!isPaid ? (
                  <button
                    type="button"
                    onClick={handlePayWithFapshi}
                    disabled={payingFapshi}
                    className="px-5 py-3 rounded-xl text-white text-xs sm:text-sm font-extrabold shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
                    style={{ backgroundColor: palette.hex }}
                  >
                    {payingFapshi
                      ? "Ouverture Fapshi..."
                      : "💳 Payer avec Fapshi"}
                  </button>
                ) : (
                  <WhatsAppShareButton
                    phone={invoice.clientPhone}
                    message={waReceiptMessage}
                    label="Envoyer le reçu sur WhatsApp"
                  />
                )}

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-sm"
                >
                  📥 Télécharger PDF avec logo
                </button>

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
                      invoice.lines.map((l) => l.label).join(", ") || "Produit",
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
              </div>

              {/* Bas de page /pay/[invoice_id] : Questions ? innovtechmhainfinity92@mail.com - WhatsApp: +235 66 26 85 03 */}
              <div className="pt-4 border-t border-slate-100 text-center space-y-1.5">
                <div className="text-xs sm:text-sm font-extrabold text-slate-700">
                  Questions ?{" "}
                  <a
                    href={`mailto:${OFFICIAL_EMAIL}`}
                    className="text-[#0B1F3A] underline"
                  >
                    {OFFICIAL_EMAIL}
                  </a>{" "}
                  -{" "}
                  <a
                    href={OFFICIAL_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#128C7E] underline"
                  >
                    WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}
                  </a>
                </div>
                <div className="text-[11px] text-slate-500">
                  📍 {invoice.merchant.addressCity || DEFAULT_MERCHANT_LOCATION_LABEL}
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

