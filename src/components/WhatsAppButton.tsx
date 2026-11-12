"use client";

import React from "react";
import {
  BRAND_COLOR_PALETTE,
  formatCFA,
  formatDate,
  normalizeWhatsAppPhone,
  OFFICIAL_WHATSAPP_DIGITS,
  type BrandColorChoice,
} from "@/lib/format";

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.031 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 0 0 1.333 4.993L2 22l5.233-1.237a9.994 9.994 0 0 0 4.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.935 9.935 0 0 0 12.031 2Zm5.824 14.12c-.245.688-1.419 1.318-1.976 1.402-.507.076-1.148.108-1.855-.117-.429-.136-.98-.318-1.686-.623-2.967-1.281-4.906-4.27-5.055-4.468-.148-.198-1.209-1.608-1.209-3.068 0-1.46.765-2.178 1.037-2.475.272-.297.593-.371.79-.371.198 0 .396.002.569.01.182.009.427-.069.668.511.247.594.84 2.055.914 2.203.074.149.123.322.025.52-.099.198-.148.322-.297.495-.148.173-.312.387-.445.52-.148.148-.303.309-.13.606.173.297.768 1.268 1.65 2.054 1.134 1.011 2.09 1.325 2.387 1.473.297.149.47.124.643-.074.173-.198.741-.866.939-1.163.198-.297.396-.248.668-.149.272.099 1.73.816 2.027.965.297.149.495.223.569.347.074.124.074.718-.171 1.406Z" />
    </svg>
  );
}

export interface InvoiceShareAttachmentData {
  invoiceNumber: string;
  issueDate?: string;
  clientName: string;
  clientPhone?: string;
  productName: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  paymentUrl: string;
  merchantName: string;
  merchantCity?: string;
  merchantPhone?: string;
  merchantEmail?: string;
  merchantRccmNiu?: string;
  merchantLogoUrl?: string;
  primaryColor?: BrandColorChoice;
}

interface WhatsAppShareButtonProps {
  phone?: string | null;
  message: string;
  label?: string;
  className?: string;
  invoiceShare?: InvoiceShareAttachmentData;
  onDownloadPdf?: () => void;
}

/**
 * Ouvre une fenêtre d'impression A4 dédiée contenant la facture avec logo pour télécharger en PDF
 */
export function triggerStandaloneInvoicePdfPrint(
  info: InvoiceShareAttachmentData
) {
  const palette = BRAND_COLOR_PALETTE[info.primaryColor || "green"];
  const qty = info.quantity || 1;
  const unitP = info.unitPrice || info.amount;
  const dateFormatted = formatDate(
    info.issueDate || new Date().toISOString().slice(0, 10)
  );

  const logoHtml = info.merchantLogoUrl
    ? `<img src="${info.merchantLogoUrl}" alt="Logo" style="max-height:72px;max-width:140px;object-fit:contain;border:1px solid #e2e8f0;border-radius:12px;padding:6px;" />`
    : `<div style="width:64px;height:64px;border-radius:14px;background:${palette.hex};color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;">${(
      info.merchantName || "I"
    )
      .charAt(0)
      .toUpperCase()}</div>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture-${info.invoiceNumber}-${info.merchantName}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 32px; color: #0f172a; background: #fff; }
    .sheet { max-width: 760px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .top-bar { height: 12px; background: ${palette.hex}; }
    .content { padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .client-box { margin-top: 22px; padding: 16px 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: ${palette.hex}; color: #fff; padding: 12px 14px; font-size: 12px; text-transform: uppercase; text-align: left; }
    td { padding: 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .total-box { margin-top: 24px; margin-left: auto; width: 320px; background: ${palette.hex}; color: #fff; padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-weight: 700; font-size: 14px; color: #334155; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-bar"></div>
    <div class="content">
      <div class="header">
        <div>
          ${logoHtml}
          <h2 style="margin:12px 0 4px;font-size:22px;">${info.merchantName}</h2>
          <div style="font-size:12px;color:#475569;line-height:1.5;">
            ${info.merchantCity ? `<div>📍 ${info.merchantCity}</div>` : ""}
            ${info.merchantPhone ? `<div>📞 ${info.merchantPhone}</div>` : ""}
            ${info.merchantEmail ? `<div>✉️ ${info.merchantEmail}</div>` : ""}
            ${info.merchantRccmNiu ? `<div>🏛️ ${info.merchantRccmNiu}</div>` : ""}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:28px;font-weight:900;color:${palette.hex};">FACTURE</div>
          <div style="font-size:16px;font-weight:800;margin-top:4px;">${info.invoiceNumber}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">Date : ${dateFormatted}</div>
        </div>
      </div>

      <div class="client-box">
        <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;">Facturé à :</div>
        <div style="font-size:16px;font-weight:800;margin-top:4px;">
          ${info.clientName} ${info.clientPhone ? `— 📞 ${info.clientPhone}` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th style="text-align:center;">Quantité</th>
            <th style="text-align:right;">Prix</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:700;">${info.productName}</td>
            <td style="text-align:center;">${qty}</td>
            <td style="text-align:right;">${formatCFA(unitP)}</td>
            <td style="text-align:right;font-weight:800;">${formatCFA(info.amount)}</td>
          </tr>
        </tbody>
      </table>

      <div class="total-box">
        <span style="font-size:13px;font-weight:800;text-transform:uppercase;">Montant Total :</span>
        <span style="font-size:22px;font-weight:900;">${formatCFA(info.amount)}</span>
      </div>

      <div class="footer">
        Merci pour votre confiance — <span style="color:${palette.hex};">${info.merchantName}</span> — WhatsApp: +23566268503
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=850,height=950");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  } else {
    window.print();
  }
}

/**
 * Bouton WhatsApp simple côté client, sans API externe ni clé API :
 * const waLink = `https://wa.me/23566268503?text=${encodeURIComponent(message)}`
 * window.open(waLink, '_blank')
 */
export function WhatsAppShareButton({
  phone,
  message,
  label = "Envoyer sur WhatsApp",
  className = "",
}: WhatsAppShareButtonProps) {
  function handleWhatsAppClick() {
    const cleanTargetPhone =
      normalizeWhatsAppPhone(phone) || OFFICIAL_WHATSAPP_DIGITS;
    const waLink = `https://wa.me/${cleanTargetPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(waLink, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleWhatsAppClick}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors ${className}`}
    >
      <WhatsAppIcon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
