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

/** Formatte un montant entier en Francs CFA : 125 000 FCFA */
export function formatCFA(amount: number | null | undefined, currency = "FCFA"): string {
  const n = Math.round(Number(amount ?? 0));
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} ${currency}`;
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

/** Nettoie un numéro de téléphone camerounais/international pour wa.me */
export function normalizeWhatsAppPhone(phone: string | null | undefined, defaultCountryCode = "237"): string {
  if (!phone) return "";
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === 9 && (digits.startsWith("6") || digits.startsWith("2"))) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

/** Construit un lien WhatsApp gratuit wa.me avec message pré-rempli */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const encoded = encodeURIComponent(message);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/** Calcul d'une ligne de facture selon les règles métier (TVA 19,25 % = 1925 bp) */
export function computeLineTotals(
  quantity: number,
  unitPrice: number,
  discount = 0,
  vatRateBp = 0
): { subtotal: number; vat: number; total: number } {
  const subtotal = Math.max(Math.round(quantity * unitPrice) - Math.round(discount), 0);
  const vat = Math.round((subtotal * vatRateBp) / 10000);
  return { subtotal, vat, total: subtotal + vat };
}

