"use client";

import React, { useEffect, useState } from "react";
import {
  BRAND_COLOR_PALETTE,
  buildWhatsAppLink,
  formatCFA,
  formatDate,
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
 * Génère une image haute résolution (PNG) de la facture professionnelle avec le logo du marchand
 */
async function renderInvoiceImageWithLogo(
  info: InvoiceShareAttachmentData
): Promise<{ dataUrl: string; blob: Blob | null }> {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1120;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: "", blob: null };

  const palette = BRAND_COLOR_PALETTE[info.primaryColor || "green"];
  const brandHex = palette.hex;

  // Fond blanc pur
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bandeau supérieur coloré
  ctx.fillStyle = brandHex;
  ctx.fillRect(0, 0, canvas.width, 18);

  // Charger le logo du marchand s'il existe
  let logoDrawn = false;
  if (info.merchantLogoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = info.merchantLogoUrl!;
      });
      ctx.save();
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 48, 96, 96);
      ctx.drawImage(img, 56, 54, 84, 84);
      ctx.restore();
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    ctx.fillStyle = brandHex;
    ctx.fillRect(50, 48, 88, 88);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      (info.merchantName || "I").charAt(0).toUpperCase(),
      94,
      108
    );
    ctx.textAlign = "left";
  }

  // En-tête droite : FACTURE + Numéro
  ctx.textAlign = "right";
  ctx.fillStyle = brandHex;
  ctx.font = "900 40px sans-serif";
  ctx.fillText("FACTURE", 850, 88);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(info.invoiceNumber, 850, 122);

  ctx.fillStyle = "#64748B";
  ctx.font = "18px sans-serif";
  ctx.fillText(
    `Date : ${formatDate(info.issueDate || new Date().toISOString().slice(0, 10))}`,
    850,
    152
  );

  // Infos Entreprise sous le logo à gauche
  ctx.textAlign = "left";
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(info.merchantName || "InnovTech MHA Infinity", 50, 185);

  let yPos = 216;
  ctx.fillStyle = "#475569";
  ctx.font = "18px sans-serif";
  if (info.merchantCity) {
    ctx.fillText(`Adresse : ${info.merchantCity}`, 50, yPos);
    yPos += 26;
  }
  if (info.merchantPhone) {
    ctx.fillText(`Tél / WhatsApp : ${info.merchantPhone}`, 50, yPos);
    yPos += 26;
  }
  if (info.merchantEmail) {
    ctx.fillText(`Email : ${info.merchantEmail}`, 50, yPos);
    yPos += 26;
  }
  if (info.merchantRccmNiu) {
    ctx.fillText(`RCCM / NIU : ${info.merchantRccmNiu}`, 50, yPos);
    yPos += 26;
  }

  // Ligne de séparation
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 315);
  ctx.lineTo(850, 315);
  ctx.stroke();

  // Encadré Client : "Facturé à: Nom client + Téléphone"
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(50, 340, 800, 105);
  ctx.strokeStyle = "#CBD5E1";
  ctx.strokeRect(50, 340, 800, 105);

  ctx.fillStyle = "#64748B";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("FACTURÉ À :", 74, 372);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 26px sans-serif";
  const clientLine = info.clientPhone
    ? `${info.clientName}  —  Tél : ${info.clientPhone}`
    : info.clientName;
  ctx.fillText(clientLine, 74, 415);

  // Tableau : Produit | Quantité | Prix | Total
  const tableTop = 485;
  ctx.fillStyle = brandHex;
  ctx.fillRect(50, tableTop, 800, 52);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("PRODUIT", 70, tableTop + 32);
  ctx.textAlign = "center";
  ctx.fillText("QUANTITÉ", 470, tableTop + 32);
  ctx.textAlign = "right";
  ctx.fillText("PRIX", 660, tableTop + 32);
  ctx.fillText("TOTAL", 830, tableTop + 32);

  // Ligne de produit
  const qty = info.quantity || 1;
  const unitP = info.unitPrice || info.amount;
  const rowY = tableTop + 100;

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 21px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(info.productName.slice(0, 34), 70, rowY);

  ctx.textAlign = "center";
  ctx.font = "20px sans-serif";
  ctx.fillText(String(qty), 470, rowY);

  ctx.textAlign = "right";
  ctx.fillText(formatCFA(unitP), 660, rowY);

  ctx.font = "bold 21px sans-serif";
  ctx.fillText(formatCFA(info.amount), 830, rowY);

  ctx.strokeStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.moveTo(50, rowY + 30);
  ctx.lineTo(850, rowY + 30);
  ctx.stroke();

  // Grand encadré Montant Total: XAF
  const totalBoxY = 670;
  ctx.fillStyle = brandHex;
  ctx.fillRect(380, totalBoxY, 470, 86);

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("MONTANT TOTAL :", 405, totalBoxY + 51);

  ctx.textAlign = "right";
  ctx.font = "900 32px sans-serif";
  ctx.fillText(formatCFA(info.amount), 825, totalBoxY + 53);

  // Lien de paiement Fapshi
  ctx.textAlign = "left";
  ctx.fillStyle = "#334155";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("Paiement en ligne sécurisé Fapshi :", 50, 830);
  ctx.fillStyle = brandHex;
  ctx.font = "17px sans-serif";
  ctx.fillText(info.paymentUrl, 50, 860);

  // Pied de page professionnel
  ctx.strokeStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.moveTo(50, 960);
  ctx.lineTo(850, 960);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(
    `Merci pour votre confiance 🙏 — ${info.merchantName}`,
    450,
    1015
  );

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 0.95)
  );
  return { dataUrl, blob };
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
        Merci pour votre confiance 🙏 — <span style="color:${palette.hex};">${info.merchantName}</span>
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

export function WhatsAppShareButton({
  phone,
  message,
  label = "Envoyer sur WhatsApp",
  className = "",
  invoiceShare,
  onDownloadPdf,
}: WhatsAppShareButtonProps) {
  const [openModal, setOpenModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);

  const waHref = buildWhatsAppLink(phone, message);

  useEffect(() => {
    if (!openModal || !invoiceShare) return;
    let active = true;
    setGenerating(true);
    renderInvoiceImageWithLogo(invoiceShare)
      .then((res) => {
        if (!active) return;
        setPreviewUrl(res.dataUrl);
        setImageBlob(res.blob);
      })
      .finally(() => {
        if (active) setGenerating(false);
      });
    return () => {
      active = false;
    };
  }, [openModal, invoiceShare]);

  // Si aucune donnée de facture n'est fournie (ex: simple reçu texte), ouvrir wa.me directement
  if (!invoiceShare) {
    return (
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </a>
    );
  }

  function handlePdfDownloadClick() {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else if (invoiceShare) {
      triggerStandaloneInvoicePdfPrint(invoiceShare);
    }
  }

  function handleDownloadImageFile() {
    if (!previewUrl || !invoiceShare) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `Facture-${invoiceShare.invoiceNumber}.png`;
    a.click();
  }

  async function handleNativeShareWithFile() {
    if (!invoiceShare) return;
    if (imageBlob && typeof navigator !== "undefined" && navigator.share) {
      const file = new File(
        [imageBlob],
        `Facture-${invoiceShare.invoiceNumber}.png`,
        { type: "image/png" }
      );
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Facture ${invoiceShare.invoiceNumber}`,
            text: message,
            files: [file],
          });
          return;
        } catch {
          // fallback vers wa.me
        }
      }
    }
    window.open(waHref, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenModal(true)}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </button>

      {openModal ? (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B1F3A]">
                    Envoyer la facture avec logo sur WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    {invoiceShare.invoiceNumber} · {invoiceShare.clientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-xs font-extrabold text-slate-400 hover:text-slate-700 px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Instruction obligatoire demandée */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs font-extrabold text-amber-950 flex items-center gap-2.5">
              <span className="text-base">📎</span>
              <span>
                Joignez la facture PDF avec logo avant d&apos;envoyer
              </span>
            </div>

            {/* Aperçu visuel de la facture générée avec logo */}
            <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200 text-center">
              {generating ? (
                <div className="py-10 text-xs text-slate-500">
                  Génération de la facture avec logo...
                </div>
              ) : previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt={`Facture ${invoiceShare.invoiceNumber}`}
                  className="max-h-60 mx-auto rounded-xl shadow-sm border border-slate-200 object-contain bg-white"
                />
              ) : null}
            </div>

            {/* Aperçu du message WhatsApp formaté */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-left">
              <div className="text-[11px] font-extrabold uppercase text-emerald-800 mb-1">
                Message WhatsApp pré-rempli :
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                {message}
              </pre>
            </div>

            {/* Boutons d'action : 1) Télécharger PDF avec logo, 2) Image avec logo, 3) Ouvrir WhatsApp */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handlePdfDownloadClick}
                  className="w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2"
                >
                  <span>📥 Télécharger PDF avec logo</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadImageFile}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-[#0B1F3A] text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <span>🖼️ Télécharger image facture</span>
                </button>
              </div>

              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleDownloadImageFile()}
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-md flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Ouvrir WhatsApp et envoyer au client</span>
              </a>

              <button
                type="button"
                onClick={handleNativeShareWithFile}
                className="w-full py-2 text-[11px] font-bold text-slate-500 hover:text-[#0B1F3A] underline"
              >
                📲 Sur téléphone : partager directement le fichier facture + message
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
