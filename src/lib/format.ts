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
  | "ong"
  | "agriculture";

export const OFFICIAL_WHATSAPP_DISPLAY = "+235 66 26 85 03";
export const OFFICIAL_WHATSAPP_DIGITS = "23566268503";
export const OFFICIAL_WHATSAPP_URL = "https://wa.me/23566268503";
export const OFFICIAL_WHATSAPP_ACCOUNT_URL =
  "https://wa.me/23566268503?text=Bonjour%20InnovTech%20MHA%20Infinity%2C%20je%20veux%20un%20compte";

export const OFFICIAL_EMAIL = "innovtechmhainfinity92@mail.com";
export const OFFICIAL_SITE_URL = "https://encaisse-git-main-bouba7.vercel.app";

// Informations officielles de paiement Mobile Money Cameroun (NE PAS CONFONDRE avec WhatsApp)
export const PAYMENT_BENEFICIARY_NAME = "MAHAMAT BOUBA";
export const ORANGE_MONEY_PAY_NUMBER = "640 633 034";
export const ORANGE_MONEY_PAY_DIGITS = "640633034";
export const MTN_MOMO_PAY_NUMBER = "651 465 708";
export const MTN_MOMO_PAY_DIGITS = "651465708";
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

export const AFRICA_CITIES = [
  "N'Djamena",
  "Ngaoundéré",
  "Garoua",
  "Douala",
  "Yaoundé",
  "Maroua",
  "Bafoussam",
  "Kousseri",
  "Moundou",
  "Sarh",
  "Bertoua",
  "Foumban",
  "Autre",
] as const;

export interface AfricaServiceCategory {
  id: string;
  label: string;
  emoji: string;
  examples: string;
  businessType: BusinessType;
}

export const AFRICA_SERVICE_CATEGORIES: AfricaServiceCategory[] = [
  {
    id: "Boutique & Commerce",
    label: "Boutique & Commerce",
    emoji: "🛒",
    examples: "Vêtements, Chaussures, Cosmétiques, Téléphones, Marché",
    businessType: "boutique",
  },
  {
    id: "Nourriture",
    label: "Nourriture",
    emoji: "🍽️",
    examples: "Restaurant, Grillade, Jus, Boulangerie, Traiteur, Fast-Food",
    businessType: "boutique",
  },
  {
    id: "Transport",
    label: "Transport",
    emoji: "🚕",
    examples: "Moto-Taxi, Taxi, Location Voiture, Livraison, Déménagement",
    businessType: "artisan",
  },
  {
    id: "Beauté & Mode",
    label: "Beauté & Mode",
    emoji: "💇",
    examples: "Coiffure, Salon de beauté, Couture / Tailleur, Photographe",
    businessType: "artisan",
  },
  {
    id: "Santé",
    label: "Santé",
    emoji: "🏥",
    examples: "Clinique, Pharmacie, Cabinet Dentaire, Optique",
    businessType: "clinique",
  },
  {
    id: "Éducation",
    label: "Éducation",
    emoji: "🎓",
    examples: "École, Centre de Formation, Cours de répétition, Garderie",
    businessType: "ecole",
  },
  {
    id: "Immobilier",
    label: "Immobilier",
    emoji: "🏠",
    examples: "Location Maison/Chambre, Vente Terrain, Hôtel, Auberge",
    businessType: "immobilier",
  },
  {
    id: "Services Pro",
    label: "Services Pro",
    emoji: "🛠️",
    examples:
      "Plombier, Électricien, Mécanicien, Menuisier, Nettoyage, Agence de Voyage, Transfert d'argent, Cybercafé / Impression",
    businessType: "artisan",
  },
  {
    id: "Agriculture & Élevage",
    label: "Agriculture & Élevage",
    emoji: "🌾",
    examples:
      "Mil, Maïs, Riz, Oignon, Bœuf, Mouton, Poulet, Lait, Engrais, Tracteur",
    businessType: "agriculture",
  },
];

export interface AgricultureSubCategory {
  id: string;
  label: string;
  emoji: string;
  types: string[];
}

export const AGRICULTURE_SUBCATEGORIES: AgricultureSubCategory[] = [
  {
    id: "Cultures",
    label: "Cultures",
    emoji: "🌾",
    types: [
      "Mil",
      "Maïs",
      "Riz",
      "Oignon",
      "Arachide",
      "Coton",
      "Tomate",
      "Manioc",
    ],
  },
  {
    id: "Élevage",
    label: "Élevage",
    emoji: "🐄",
    types: ["Bœuf", "Mouton", "Chèvre", "Poulet", "Œuf", "Lait"],
  },
  {
    id: "Intrants",
    label: "Intrants",
    emoji: "🌱",
    types: ["Engrais", "Semences", "Pesticides", "Matériel Agricole"],
  },
  {
    id: "Services Agricoles",
    label: "Services Agricoles",
    emoji: "🚜",
    types: [
      "Location Tracteur",
      "Labour",
      "Transport Récolte",
      "Stockage",
    ],
  },
];

export const AGRICULTURE_UNITS = [
  "Sac 50kg",
  "Sac 100kg",
  "Tonne",
  "Kg",
  "Casier",
  "Tête",
  "Litre",
] as const;

export const AGRICULTURE_MARKETS = [
  "Marché de Garoua",
  "Marché de Maroua",
  "Marché de Kousseri",
  "Marché de Ngaoundéré",
  "Marché de N'Djamena",
  "Marché de Douala",
  "Marché de Yaoundé",
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
  {
    id: "agriculture",
    icon: "🌾",
    emoji: "🌾",
    title: "Agriculture & Élevage",
    subtitle: "Récoltes, Stock, Bétail, Ventes en gros",
    features: ["Cultures & Récoltes", "Élevage & Bétail", "Vente en gros"],
    bullets: ["Cultures & Récoltes", "Élevage & Bétail", "Vente en gros"],
    productsLabel: "Récoltes & Produits",
    clientsLabel: "Acheteurs",
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
  if (businessType === "agriculture") {
    return {
      products: "Récoltes & Produits",
      productsLabel: "Récoltes & Produits",
      productSingular: "Récolte / Produit",
      clients: "Acheteurs",
      clientsLabel: "Acheteurs",
      clientSingular: "Acheteur",
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
  paidAmount?: number;
  balanceAmount?: number;
  productName?: string;
  linesSummary?: string;
  paymentUrl?: string;
  merchantName?: string;
  merchantCity?: string;
  merchantPhone?: string;
  merchantEmail?: string;
  footerMessage?: string;
}): string {
  const client = params.clientName.trim() || "Client";
  const num = params.invoiceNumber.trim();
  const totalAmt = formatAmountNumber(params.amount);
  const paidNum = Math.max(0, Number(params.paidAmount ?? 0));
  const balanceNum =
    params.balanceAmount !== undefined
      ? Math.max(0, Number(params.balanceAmount))
      : Math.max(0, params.amount - paidNum);
  const paidAmt = formatAmountNumber(paidNum);
  const balanceAmt = formatAmountNumber(balanceNum);
  const merchant = params.merchantName?.trim() || "Ma Boutique";
  const city = (params.merchantCity || DEFAULT_MERCHANT_CITY).split(",")[0].trim();
  const details =
    params.linesSummary?.trim() ||
    params.productName?.trim() ||
    "Votre commande";

  return `Bonjour ${client}, voici votre facture ${num} de ${merchant} - ${city}. Total : ${totalAmt} XAF, Déjà payé : ${paidAmt} XAF, Reste à payer : ${balanceAmt} XAF. Détails : ${details}. Payez par Orange Money ${ORANGE_MONEY_PAY_NUMBER} / MTN MoMo ${MTN_MOMO_PAY_NUMBER}. Merci !`;
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

/** Traduit toute erreur Supabase/Réseau/Anglaise en français simple pour le commerçant */
export function translateAuthOrNetworkError(
  rawMsg: string | null | undefined
): string {
  const msg = (rawMsg || "").trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("429") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("security purposes") ||
    lower.includes("once every")
  ) {
    return "Trop d'essais, attends 2 minutes et réessaie";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("fetcherror") ||
    lower.includes("load failed") ||
    lower.includes("timeout") ||
    lower.includes("err_internet") ||
    lower.includes("connection")
  ) {
    return "Problème de connexion, vérifie ton internet et réessaie";
  }

  if (lower.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect. Vérifie tes informations et réessaie.";
  }

  if (lower.includes("email not confirmed")) {
    return "Ton compte attend l'activation par email. Clique sur « Renvoyer le code » ou contacte l'aide WhatsApp +235 66 26 85 03.";
  }

  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already")
  ) {
    return "Cette adresse email est déjà utilisée. Connecte-toi ou clique sur « Mot de passe oublié ? ».";
  }

  if (lower.includes("password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }

  if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
    return "Veuillez saisir une adresse email valide.";
  }

  if (lower.includes("duplicate_reference")) {
    return "Cette référence de transaction a déjà été envoyée.";
  }

  // Éviter d'afficher des messages techniques anglais bruts
  if (
    /^[a-z0-9_:\s.,'-]+$/i.test(msg) &&
    (lower.includes("error") ||
      lower.includes("failed") ||
      lower.includes("invalid") ||
      lower.includes("token") ||
      lower.includes("expired") ||
      lower.includes("denied"))
  ) {
    return "Une erreur s'est produite. Réessaie dans quelques secondes ou contacte l'aide WhatsApp +235 66 26 85 03.";
  }

  return (
    msg ||
    "Une erreur s'est produite. Réessaie ou contacte l'aide WhatsApp +235 66 26 85 03."
  );
}
