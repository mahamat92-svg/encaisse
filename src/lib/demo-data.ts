import type {
  DocStatus,
  DocType,
  OrgMode,
  PaymentMethod,
  ReminderTone,
} from "./format";

export interface DemoClient {
  id: string;
  kind: "customer" | "student";
  name: string;
  phone: string;
  city: string;
  locale: "fr" | "en";
  creditLimit?: number;
  className?: string;
  schoolYear?: string;
  payerName?: string;
  payerPhone?: string;
  facebookUrl?: string;
  mobileMoneyBalance?: number;
  bankCardBalance?: number;
  balance: number;
  overdueBalance: number;
}

export interface DemoCatalogItem {
  id: string;
  name: string;
  itemKind: "product" | "service" | "fee";
  unit: string;
  unitPrice: number;
  vatApplicable: boolean;
  className?: string;
}

export interface DemoDocumentLine {
  label: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRateBp: number;
  total: number;
}

export interface DemoInstallment {
  label: string;
  dueDate: string;
  amount: number;
}

export interface DemoDocument {
  id: string;
  number: string;
  docType: DocType;
  status: DocStatus;
  clientId: string;
  clientName: string;
  whatsappPhone: string;
  locale: "fr" | "en";
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vatTotal: number;
  total: number;
  paidTotal: number;
  balance: number;
  daysOverdue: number;
  publicToken: string;
  lines: DemoDocumentLine[];
  installments?: DemoInstallment[];
}

export interface DemoPayment {
  id: string;
  receiptNumber: string;
  clientId: string;
  clientName: string;
  whatsappPhone?: string;
  publicToken?: string;
  documentNumber: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  status: "valid" | "cancelled";
}

export interface DemoReminder {
  id: string;
  documentId: string;
  documentNumber: string;
  clientName: string;
  payerName?: string;
  whatsappPhone: string;
  locale: "fr" | "en";
  balance: number;
  dueDate: string;
  daysOverdue: number;
  suggestedTone: ReminderTone;
}

export interface PlanDefinition {
  id: string;
  name: string;
  priceMonth: number;
  priceYear: number;
  badge?: string;
  description: string;
  features: string[];
  limits: {
    documents: number | null;
    clients: number | null;
    users: number;
    aiDictations: number;
    waMessages: number;
    installments: boolean;
    branding: boolean;
  };
}

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Gratuit",
    priceMonth: 0,
    priceYear: 0,
    description: "Pour démarrer gratuitement.",
    features: [
      "15 factures ou commandes / mois",
      "Jusqu'à 20 clients",
      "5 dictées IA / mois",
      "Envoi WhatsApp en 1 clic",
      "Factures PDF téléchargeables",
    ],
    limits: {
      documents: 15,
      clients: 20,
      users: 1,
      aiDictations: 5,
      waMessages: 0,
      installments: false,
      branding: true,
    },
  },
  {
    id: "starter",
    name: "Démarrage",
    priceMonth: 2500,
    priceYear: 25000,
    description: "Pour les indépendants et petits commerces.",
    features: [
      "60 factures ou commandes / mois",
      "Jusqu'à 150 clients",
      "30 dictées IA / mois",
      "Intégration paiement Fapshi & Mobile Money",
    ],
    limits: {
      documents: 60,
      clients: 150,
      users: 1,
      aiDictations: 30,
      waMessages: 0,
      installments: false,
      branding: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    priceMonth: 5000,
    priceYear: 50000,
    badge: "Populaire",
    description: "Pour les PME et commerçants en croissance.",
    features: [
      "Factures, commandes et reçus illimités",
      "Jusqu'à 1 000 clients",
      "150 dictées IA / mois",
      "3 utilisateurs inclus",
    ],
    limits: {
      documents: null,
      clients: 1000,
      users: 3,
      aiDictations: 150,
      waMessages: 0,
      installments: true,
      branding: false,
    },
  },
  {
    id: "business",
    name: "Business",
    priceMonth: 10000,
    priceYear: 100000,
    description: "Pour les entreprises multi-utilisateurs.",
    features: [
      "Factures et clients illimités",
      "500 dictées IA / mois",
      "10 utilisateurs inclus",
    ],
    limits: {
      documents: null,
      clients: null,
      users: 10,
      aiDictations: 500,
      waMessages: 250,
      installments: true,
      branding: false,
    },
  },
];

export interface DemoOrgData {
  id: string;
  name: string;
  mode: OrgMode;
  city: string;
  phone: string;
  niu: string;
  rccm: string;
  vatRegistered: boolean;
  vatRateBp: number;
  mtnMomoNumber: string;
  orangeMoneyNumber: string;
  planId: string;
  trialDaysLeft: number;
  clients: DemoClient[];
  catalog: DemoCatalogItem[];
  documents: DemoDocument[];
  payments: DemoPayment[];
  reminders: DemoReminder[];
}

// Aucun jeu de données fictif : toutes les listes démarrent strictement vides (0 XAF, 0 élément).
const EMPTY_ORG: DemoOrgData = {
  id: "",
  name: "",
  mode: "commerce",
  city: "",
  phone: "",
  niu: "",
  rccm: "",
  vatRegistered: false,
  vatRateBp: 1925,
  mtnMomoNumber: "",
  orangeMoneyNumber: "",
  planId: "free",
  trialDaysLeft: 14,
  clients: [],
  catalog: [],
  documents: [],
  payments: [],
  reminders: [],
};

export const DEMO_ORGS: Record<OrgMode, DemoOrgData> = {
  commerce: EMPTY_ORG,
  etablissement: { ...EMPTY_ORG, mode: "etablissement" },
};
