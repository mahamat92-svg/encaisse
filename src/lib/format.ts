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

/** Formatte uniquement le nombre entier avec espaces : 125 000 */
export function formatAmountNumber(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Formatte un montant entier en Francs CFA : 125 000 XAF */
export function formatCFA(amount: number | null | undefined, currency = "XAF"): string {
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
 * FEATURE 1 & 2 : Message officiel de partage de facture sur WhatsApp
 * "Bonjour [Nom du client], voici votre facture [Numéro facture] de [Montant] XAF pour [Nom du produit]. Payez en ligne ici : [Lien de paiement Fapshi / Encaisse]. Merci - InnovTech Encaisse"
 */
export function buildInvoiceWhatsAppMessage(params: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  productName: string;
  paymentUrl: string;
}): string {
  const client = params.clientName.trim() || "Client";
  const num = params.invoiceNumber.trim();
  const amt = formatAmountNumber(params.amount);
  const prod = params.productName.trim() || "votre commande";
  const url = params.paymentUrl.trim();
  return `Bonjour ${client}, voici votre facture ${num} de ${amt} XAF pour ${prod}. Payez en ligne ici : ${url}. Merci - InnovTech Encaisse`;
}

/**
 * FEATURE 3 : Message officiel de confirmation de paiement / reçu sur WhatsApp
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
