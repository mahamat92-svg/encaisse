export type Locale = "fr" | "en";
export type OrgMode = "commerce" | "etablissement";
export type MemberRole = "owner" | "manager" | "viewer";
export type DocType = "quote" | "invoice" | "credit_note";
export type DocStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "cancelled"
  | "accepted"
  | "refused"
  | "expired";
export type PaymentMethod =
  | "cash"
  | "mtn_momo"
  | "orange_money"
  | "bank_transfer"
  | "other";
export type ReminderTone = "courteous" | "firm" | "final";
export type BrandColorChoice = "green" | "blue" | "gold" | "orange" | "black";

export const BRAND_COLOR_PALETTE: Record<
  BrandColorChoice,
  {
    label: string;
    hex: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeBgClass: string;
  }
> = {
  green: {
    label: "Vert",
    hex: "#059669",
    bgClass: "bg-emerald-600",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-600",
    badgeBgClass: "bg-emerald-50",
  },
  blue: {
    label: "Bleu",
    hex: "#1D4ED8",
    bgClass: "bg-blue-700",
    textClass: "text-blue-700",
    borderClass: "border-blue-700",
    badgeBgClass: "bg-blue-50",
  },
  gold: {
    label: "Or",
    hex: "#D97706",
    bgClass: "bg-amber-600",
    textClass: "text-amber-700",
    borderClass: "border-amber-600",
    badgeBgClass: "bg-amber-50",
  },
  orange: {
    label: "Orange",
    hex: "#EA580C",
    bgClass: "bg-orange-600",
    textClass: "text-orange-700",
    borderClass: "border-orange-600",
    badgeBgClass: "bg-orange-50",
  },
  black: {
    label: "Noir",
    hex: "#0F172A",
    bgClass: "bg-slate-900",
    textClass: "text-slate-900",
    borderClass: "border-slate-900",
    badgeBgClass: "bg-slate-100",
  },
};

/** Formatte uniquement le nombre entier avec espaces : 125 000 */
export function formatAmountNumber(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Formatte un montant entier en Francs CFA : 125 000 XAF */
export function formatCFA(
  amount: number | null | undefined,
  currency = "XAF"
): string {
  return `${formatAmountNumber(amount)} ${currency}`;
}

/** Formatte une date AAAA-MM-JJ en jj/mm/aaaa */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Nettoie un numéro de téléphone camerounais/international pour wa.me (ex: 237XXXXXXXXX) */
export function normalizeWhatsAppPhone(
  phone: string | null | undefined,
  defaultCountryCode = "237"
): string {
  if (!phone) return "";
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === 9 && (digits.startsWith("6") || digits.startsWith("2"))) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

/**
 * Construit un lien WhatsApp wa.me avec encodeURIComponent :
 * - Si un numéro existe : https://wa.me/237XXXXXXXXX?text=...
 * - Sinon : https://wa.me/?text=...
 */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message: string
): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const encoded = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Message WhatsApp professionnel avec entreprise et ville :
 * "Bonjour [Client] 👋
 * Voici votre facture [Numéro] de [Montant] XAF
 * 🏢 [Nom Entreprise]
 * 📍 [Ville]
 * 💳 Payez ici: [Lien pay]
 * Merci pour votre confiance 🙏 - [Nom Entreprise]"
 */
export function buildInvoiceWhatsAppMessage(params: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  productName?: string;
  paymentUrl: string;
  merchantName?: string;
  merchantCity?: string;
}): string {
  const client = params.clientName.trim() || "Client";
  const num = params.invoiceNumber.trim();
  const amt = formatAmountNumber(params.amount);
  const merchant = params.merchantName?.trim() || "InnovTech MHA Infinity";
  const city = params.merchantCity?.trim() || "Cameroun";
  const url = params.paymentUrl.trim();
  return [
    `Bonjour ${client} 👋`,
    `Voici votre facture ${num} de ${amt} XAF`,
    `🏢 ${merchant}`,
    `📍 ${city}`,
    `💳 Payez ici: ${url}`,
    `Merci pour votre confiance 🙏 - ${merchant}`,
  ].join("\n");
}

/**
 * Message officiel de confirmation de paiement / reçu sur WhatsApp :
 * "Merci [Nom], nous avons bien reçu votre paiement de [Montant] XAF. Voici votre reçu : [Lien reçu]"
 */
export function buildReceiptWhatsAppMessage(params: {
  clientName: string;
  amount: number;
  receiptUrl: string;
}): string {
  const client = params.clientName.trim() || "Client";
  const amt = formatAmountNumber(params.amount);
  const url = params.receiptUrl.trim();
  return `Merci ${client}, nous avons bien reçu votre paiement de ${amt} XAF. Voici votre reçu : ${url}`;
}

/** Calcul d'une ligne de facture selon les règles métier (TVA 19,25 % = 1925 bp) */
export function computeLineTotals(
  quantity: number,
  unitPrice: number,
  discount = 0,
  vatRateBp = 0
): { subtotal: number; vat: number; total: number } {
  const subtotal = Math.max(
    Math.round(quantity * unitPrice) - Math.round(discount),
    0
  );
  const vat = Math.round((subtotal * vatRateBp) / 10000);
  return { subtotal, vat, total: subtotal + vat };
}
