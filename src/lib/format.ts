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

export type BusinessType =
  | "boutique"
  | "ecole"
  | "clinique"
  | "immobilier"
  | "artisan"
  | "ong";

export const OFFICIAL_WHATSAPP_DISPLAY = "+235 66 26 85 03";
export const OFFICIAL_WHATSAPP_DIGITS = "23566268503";
export const OFFICIAL_WHATSAPP_URL = "https://wa.me/23566268503";
export const OFFICIAL_WHATSAPP_ACCOUNT_URL =
  "https://wa.me/23566268503?text=Bonjour%20InnovTech%20MHA%20Infinity%2C%20je%20veux%20un%20compte";

export const OFFICIAL_EMAIL = "innovtechmhainfinity92@mail.com";
export const DEFAULT_MERCHANT_CITY = "Ngaoundéré";
export const DEFAULT_MERCHANT_REGION = "Adamawa";
export const DEFAULT_MERCHANT_COUNTRY = "Cameroun";
export const DEFAULT_MERCHANT_LOCATION_LABEL =
  "Ngaoundéré, Adamawa - Cameroun";

export const COUNTRY_OPTIONS = [
  "Cameroun",
  "Tchad",
  "Niger",
  "Nigeria",
  "Centrafrique",
  "Gabon",
  "Congo",
  "RD Congo",
  "Sénégal",
  "Côte d'Ivoire",
  "Mali",
  "Burkina Faso",
  "Bénin",
  "Togo",
  "France",
  "Autre",
] as const;

export interface BusinessServiceDefinition {
  id: BusinessType;
  icon: string;
  emoji: string;
  title: string;
  subtitle: string;
  features: string[];
  bullets: string[];
  productsLabel: string;
  clientsLabel: string;
}

export const BUSINESS_SERVICES: BusinessServiceDefinition[] = [
  {
    id: "boutique",
    icon: "🛒",
    emoji: "🛒",
    title: "Encaisse Boutique",
    subtitle: "Produits, Stock, Factures",
    features: ["Produits", "Stock", "Factures"],
    bullets: ["Produits", "Stock", "Factures"],
    productsLabel: "Produits",
    clientsLabel: "Clients",
  },
  {
    id: "ecole",
    icon: "🎓",
    emoji: "🎓",
    title: "École",
    subtitle: "Élèves, Classes, Frais scolaires, Notes",
    features: ["Élèves", "Classes", "Frais scolaires", "Notes"],
    bullets: ["Élèves", "Classes", "Frais scolaires", "Notes"],
    productsLabel: "Frais scolaires",
    clientsLabel: "Élèves",
  },
  {
    id: "clinique",
    icon: "🏥",
    emoji: "🏥",
    title: "Clinique",
    subtitle: "Patients, Consultations, Ordonnances",
    features: ["Patients", "Consultations", "Ordonnances"],
    bullets: ["Patients", "Consultations", "Ordonnances"],
    productsLabel: "Soins",
    clientsLabel: "Patients",
  },
  {
    id: "immobilier",
    icon: "🏠",
    emoji: "🏠",
    title: "Immobilier",
    subtitle: "Maisons, Locataires, Loyers",
    features: ["Maisons", "Locataires", "Loyers"],
    bullets: ["Maisons", "Locataires", "Loyers"],
    productsLabel: "Maisons",
    clientsLabel: "Locataires",
  },
  {
    id: "artisan",
    icon: "✂️",
    emoji: "✂️",
    title: "Artisan",
    subtitle: "Commandes, Clients, Rendez-vous",
    features: ["Commandes", "Clients", "Rendez-vous"],
    bullets: ["Commandes", "Clients", "Rendez-vous"],
    productsLabel: "Produits",
    clientsLabel: "Clients",
  },
  {
    id: "ong",
    icon: "🤝",
    emoji: "🤝",
    title: "ONG",
    subtitle: "Membres, Cotisations, Projets",
    features: ["Membres", "Cotisations", "Projets"],
    bullets: ["Membres", "Cotisations", "Projets"],
    productsLabel: "Produits",
    clientsLabel: "Clients",
  },
];

export function getBusinessTypeLabels(businessType?: BusinessType | string): {
  products: string;
  productsLabel: string;
  productSingular: string;
  clients: string;
  clientsLabel: string;
  clientSingular: string;
} {
  if (businessType === "ecole") {
    return {
      products: "Frais scolaires",
      productsLabel: "Frais scolaires",
      productSingular: "Frais scolaire",
      clients: "Élèves",
      clientsLabel: "Élèves",
      clientSingular: "Élève",
    };
  }
  if (businessType === "clinique") {
    return {
      products: "Soins",
      productsLabel: "Soins",
      productSingular: "Soin",
      clients: "Patients",
      clientsLabel: "Patients",
      clientSingular: "Patient",
    };
  }
  if (businessType === "immobilier") {
    return {
      products: "Maisons",
      productsLabel: "Maisons",
      productSingular: "Maison",
      clients: "Locataires",
      clientsLabel: "Locataires",
      clientSingular: "Locataire",
    };
  }
  return {
    products: "Produits",
    productsLabel: "Produits",
    productSingular: "Produit",
    clients: "Clients",
    clientsLabel: "Clients",
    clientSingular: "Client",
  };
}

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

/** Nettoie un numéro de téléphone camerounais/international pour wa.me (ex: 23566268503 ou 237XXXXXXXXX) */
export function normalizeWhatsAppPhone(
  phone: string | null | undefined,
  defaultCountryCode = "237"
): string {
  if (!phone) return "";
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.length === 8 && digits.startsWith("6")) {
    return `235${digits}`;
  }
  if (digits.length === 9 && (digits.startsWith("6") || digits.startsWith("2"))) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

/**
 * Construit un lien WhatsApp wa.me simple côté client, sans clé API :
 * const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
 */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message: string
): string {
  const cleanPhone = normalizeWhatsAppPhone(phone) || OFFICIAL_WHATSAPP_DIGITS;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Message WhatsApp officiel pour les factures (avec email et WhatsApp officiels) :
 * "Bonjour [Client], voici votre facture [Numéro] de [Montant] XAF de [Nom Entreprise]. Payez ici: [Lien]. Merci - [Nom Entreprise] - Email: innovtechmhainfinity92@mail.com - WhatsApp: +23566268503"
 */
export function buildInvoiceWhatsAppMessage(params: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  productName?: string;
  paymentUrl: string;
  merchantName?: string;
  merchantCity?: string;
  merchantPhone?: string;
  merchantEmail?: string;
}): string {
  const client = params.clientName.trim() || "Client";
  const num = params.invoiceNumber.trim();
  const amt = formatAmountNumber(params.amount);
  const merchant = params.merchantName?.trim() || "InnovTech MHA Infinity";
  const email = params.merchantEmail?.trim() || OFFICIAL_EMAIL;
  const url = params.paymentUrl.trim();
  return `Bonjour ${client}, voici votre facture ${num} de ${amt} XAF de ${merchant}. Payez ici: ${url}. Merci - ${merchant} - Email: ${email} - WhatsApp: +23566268503`;
}

/**
 * Message officiel de confirmation de paiement / reçu sur WhatsApp :
 */
export function buildReceiptWhatsAppMessage(params: {
  clientName: string;
  amount: number;
  receiptUrl: string;
  merchantPhone?: string;
  merchantEmail?: string;
}): string {
  const client = params.clientName.trim() || "Client";
  const amt = formatAmountNumber(params.amount);
  const url = params.receiptUrl.trim();
  const email = params.merchantEmail?.trim() || OFFICIAL_EMAIL;
  const waPhone = params.merchantPhone?.trim() || OFFICIAL_WHATSAPP_DISPLAY;
  return `Merci ${client}, nous avons bien reçu votre paiement de ${amt} XAF. Voici votre reçu : ${url} (Email: ${email} | WhatsApp: ${waPhone})`;
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
