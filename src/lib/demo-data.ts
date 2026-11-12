import type { DocStatus, DocType, OrgMode, PaymentMethod, ReminderTone } from "./format";

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
    description: "Pour tester l'outil et remplacer le cahier papier sans dépenser 1 FCFA.",
    features: [
      "15 factures ou devis / mois",
      "Jusqu'à 20 clients ou élèves",
      "5 dictées IA / mois",
      "Envoi et relances WhatsApp en 1 clic (wa.me)",
      "Reçus PDF téléchargeables",
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
    description: "Idéal pour les indépendants, artisans et petits commerces.",
    features: [
      "60 factures ou devis / mois",
      "Jusqu'à 150 clients",
      "30 dictées IA / mois",
      "Documents PDF sans mention « Propulsé par InnovTech »",
      "Numéros MTN MoMo & Orange Money sur facture",
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
    badge: "Le plus choisi",
    description: "Pour les PME, quincailleries et prestataires qui veulent zéro impayé.",
    features: [
      "Factures, devis et reçus ILLIMITÉS",
      "Jusqu'à 1 000 clients",
      "150 dictées IA / mois",
      "Échéanciers de paiement en plusieurs tranches",
      "2 utilisateurs (Propriétaire + Comptable/Caissier)",
    ],
    limits: {
      documents: null,
      clients: 1000,
      users: 2,
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
    description: "Pour les PME en croissance avec équipe commerciale.",
    features: [
      "Documents illimités · 3 000 clients",
      "400 dictées IA / mois",
      "5 utilisateurs avec rôles et journal d'audit",
      "300 relances WhatsApp automatisées (V2)",
      "Résumé IA hebdomadaire de trésorerie",
    ],
    limits: {
      documents: null,
      clients: 3000,
      users: 5,
      aiDictations: 400,
      waMessages: 300,
      installments: true,
      branding: false,
    },
  },
  {
    id: "entreprise",
    name: "Entreprise",
    priceMonth: 25000,
    priceYear: 250000,
    description: "Pour les grossistes, distributeurs et structures multi-agences.",
    features: [
      "Documents illimités · 10 000 clients",
      "1 500 dictées IA / mois",
      "15 utilisateurs + contrôle strict des plafonds de crédit",
      "1 000 relances WhatsApp automatisées (V2)",
      "Export comptable & support prioritaire",
    ],
    limits: {
      documents: null,
      clients: 10000,
      users: 15,
      aiDictations: 1500,
      waMessages: 1000,
      installments: true,
      branding: false,
    },
  },
  {
    id: "etablissement",
    name: "Établissement",
    priceMonth: 50000,
    priceYear: 500000,
    badge: "Spécial Écoles",
    description: "Conçu pour les écoles privées, collèges et centres de formation.",
    features: [
      "Élèves, parents payeurs et reçus ILLIMITÉS",
      "Facturation groupée par classe et par tranche (1re, 2e, 3e tranche)",
      "Suivi du taux de recouvrement par salle de classe",
      "30 utilisateurs (Direction, Économat, Secrétariat)",
      "3 000 relances parents + accompagnement dédié",
    ],
    limits: {
      documents: null,
      clients: null,
      users: 30,
      aiDictations: 3000,
      waMessages: 3000,
      installments: true,
      branding: false,
    },
  },
];

export const DEMO_ORGS: Record<
  OrgMode,
  {
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
> = {
  commerce: {
    id: "org-demo-commerce",
    name: "Quincaillerie & BTP Ngo & Fils SARL",
    mode: "commerce",
    city: "Douala (Akwa)",
    phone: "+237 677 45 12 89",
    niu: "M052418902341K",
    rccm: "RC/DLA/2024/B/1842",
    vatRegistered: true,
    vatRateBp: 1925,
    mtnMomoNumber: "677 45 12 89 (NGO & FILS)",
    orangeMoneyNumber: "699 11 22 33 (NGO & FILS)",
    planId: "pro",
    trialDaysLeft: 12,
    clients: [
      {
        id: "cli-1",
        kind: "customer",
        name: "Entreprise Bâtiment Fotso",
        phone: "+237 670 12 34 56",
        city: "Douala (Bonamoussadi)",
        locale: "fr",
        creditLimit: 1000000,
        balance: 345000,
        overdueBalance: 345000,
      },
      {
        id: "cli-2",
        kind: "customer",
        name: "Moussa Quincaillerie Détail",
        phone: "+237 694 88 77 66",
        city: "Yaoundé (Mokolo)",
        locale: "fr",
        creditLimit: 500000,
        balance: 145000,
        overdueBalance: 0,
      },
      {
        id: "cli-3",
        kind: "customer",
        name: "NorthWest Solar & Tech Ltd",
        phone: "+237 678 55 44 33",
        city: "Bamenda",
        locale: "en",
        creditLimit: 800000,
        balance: 210000,
        overdueBalance: 210000,
      },
      {
        id: "cli-4",
        kind: "customer",
        name: "Atelier Froid & Clim Kamga",
        phone: "+237 691 20 30 40",
        city: "Bafoussam",
        locale: "fr",
        creditLimit: 300000,
        balance: 0,
        overdueBalance: 0,
      },
    ],
    catalog: [
      {
        id: "cat-1",
        name: "Sac de ciment CIMENCAM 42.5 (50 kg)",
        itemKind: "product",
        unit: "sac",
        unitPrice: 5500,
        vatApplicable: true,
      },
      {
        id: "cat-2",
        name: "Fer à béton torsadé Ø10 (barre 12m)",
        itemKind: "product",
        unit: "barre",
        unitPrice: 4200,
        vatApplicable: true,
      },
      {
        id: "cat-3",
        name: "Peinture acrylique blanche Seigneurie 20L",
        itemKind: "product",
        unit: "seau",
        unitPrice: 38000,
        vatApplicable: true,
      },
      {
        id: "cat-4",
        name: "Livraison camionnette chantier (Douala)",
        itemKind: "service",
        unit: "forfait",
        unitPrice: 15000,
        vatApplicable: false,
      },
    ],
    documents: [
      {
        id: "doc-1",
        number: "FAC-2026-0042",
        docType: "invoice",
        status: "partially_paid",
        clientId: "cli-1",
        clientName: "Entreprise Bâtiment Fotso",
        whatsappPhone: "+237670123456",
        locale: "fr",
        issueDate: "2026-10-25",
        dueDate: "2026-11-04",
        subtotal: 545000,
        vatTotal: 0,
        total: 545000,
        paidTotal: 200000,
        balance: 345000,
        daysOverdue: 7,
        publicToken: "demo-fac-2026-0042",
        lines: [
          {
            label: "Sac de ciment CIMENCAM 42.5 (50 kg)",
            quantity: 80,
            unitPrice: 5500,
            discount: 0,
            vatRateBp: 0,
            total: 440000,
          },
          {
            label: "Fer à béton torsadé Ø10 (barre 12m)",
            quantity: 25,
            unitPrice: 4200,
            discount: 0,
            vatRateBp: 0,
            total: 105000,
          },
        ],
      },
      {
        id: "doc-2",
        number: "FAC-2026-0043",
        docType: "invoice",
        status: "issued",
        clientId: "cli-3",
        clientName: "NorthWest Solar & Tech Ltd",
        whatsappPhone: "+237678554433",
        locale: "en",
        issueDate: "2026-10-20",
        dueDate: "2026-10-27",
        subtotal: 210000,
        vatTotal: 0,
        total: 210000,
        paidTotal: 0,
        balance: 210000,
        daysOverdue: 15,
        publicToken: "demo-fac-2026-0043",
        lines: [
          {
            label: "Heavy-duty mounting brackets & bolts kit",
            quantity: 6,
            unitPrice: 35000,
            discount: 0,
            vatRateBp: 0,
            total: 210000,
          },
        ],
      },
      {
        id: "doc-3",
        number: "FAC-2026-0044",
        docType: "invoice",
        status: "issued",
        clientId: "cli-2",
        clientName: "Moussa Quincaillerie Détail",
        whatsappPhone: "+237694887766",
        locale: "fr",
        issueDate: "2026-11-08",
        dueDate: "2026-11-18",
        subtotal: 145000,
        vatTotal: 0,
        total: 145000,
        paidTotal: 0,
        balance: 145000,
        daysOverdue: 0,
        publicToken: "demo-fac-2026-0044",
        lines: [
          {
            label: "Peinture acrylique blanche 20L",
            quantity: 3,
            unitPrice: 38000,
            discount: 0,
            vatRateBp: 0,
            total: 114000,
          },
          {
            label: "Accessoires rouleaux + bâches",
            quantity: 1,
            unitPrice: 31000,
            discount: 0,
            vatRateBp: 0,
            total: 31000,
          },
        ],
      },
      {
        id: "doc-4",
        number: "FAC-2026-0041",
        docType: "invoice",
        status: "paid",
        clientId: "cli-4",
        clientName: "Atelier Froid & Clim Kamga",
        whatsappPhone: "+237691203040",
        locale: "fr",
        issueDate: "2026-11-02",
        dueDate: "2026-11-05",
        subtotal: 185000,
        vatTotal: 0,
        total: 185000,
        paidTotal: 185000,
        balance: 0,
        daysOverdue: 0,
        publicToken: "demo-fac-2026-0041",
        lines: [
          {
            label: "Outillage & consommables cuivre",
            quantity: 1,
            unitPrice: 185000,
            discount: 0,
            vatRateBp: 0,
            total: 185000,
          },
        ],
      },
    ],
    payments: [
      {
        id: "pay-1",
        receiptNumber: "REC-2026-0088",
        clientId: "cli-1",
        clientName: "Entreprise Bâtiment Fotso",
        documentNumber: "FAC-2026-0042",
        amount: 200000,
        method: "mtn_momo",
        reference: "MP261101.1422.A8921",
        paidAt: "2026-11-01",
        status: "valid",
      },
      {
        id: "pay-2",
        receiptNumber: "REC-2026-0089",
        clientId: "cli-4",
        clientName: "Atelier Froid & Clim Kamga",
        documentNumber: "FAC-2026-0041",
        amount: 185000,
        method: "orange_money",
        reference: "OM261103.0941.C7712",
        paidAt: "2026-11-03",
        status: "valid",
      },
    ],
    reminders: [
      {
        id: "rem-1",
        documentId: "doc-1",
        documentNumber: "FAC-2026-0042",
        clientName: "Entreprise Bâtiment Fotso",
        whatsappPhone: "+237670123456",
        locale: "fr",
        balance: 345000,
        dueDate: "2026-11-04",
        daysOverdue: 7,
        suggestedTone: "firm",
      },
      {
        id: "rem-2",
        documentId: "doc-2",
        documentNumber: "FAC-2026-0043",
        clientName: "NorthWest Solar & Tech Ltd",
        whatsappPhone: "+237678554433",
        locale: "en",
        balance: 210000,
        dueDate: "2026-10-27",
        daysOverdue: 15,
        suggestedTone: "final",
      },
    ],
  },
  etablissement: {
    id: "org-demo-ecole",
    name: "Complexe Scolaire Bilingue Les Lauréats",
    mode: "etablissement",
    city: "Yaoundé (Bastos)",
    phone: "+237 699 00 11 22",
    niu: "M092114409812B",
    rccm: "RC/YAE/2021/B/0912",
    vatRegistered: false,
    vatRateBp: 0,
    mtnMomoNumber: "675 00 11 22 (CS LES LAUREATS)",
    orangeMoneyNumber: "699 00 11 22 (CS LES LAUREATS)",
    planId: "etablissement",
    trialDaysLeft: 14,
    clients: [
      {
        id: "stu-1",
        kind: "student",
        name: "Ewane Samuel Junior",
        className: "Terminale C",
        schoolYear: "2026-2027",
        payerName: "M. Ewane Paul (Parent)",
        payerPhone: "+237 677 80 90 10",
        phone: "+237 677 80 90 10",
        city: "Yaoundé",
        locale: "fr",
        balance: 95000,
        overdueBalance: 95000,
      },
      {
        id: "stu-2",
        kind: "student",
        name: "Ndi Grace Bih",
        className: "Form 5 Science",
        schoolYear: "2026-2027",
        payerName: "Mrs. Ndi Comfort",
        payerPhone: "+237 679 11 22 44",
        phone: "+237 679 11 22 44",
        city: "Yaoundé",
        locale: "en",
        balance: 75000,
        overdueBalance: 75000,
      },
      {
        id: "stu-3",
        kind: "student",
        name: "Mbarga Aïcha",
        className: "3ème Espagnol",
        schoolYear: "2026-2027",
        payerName: "Mme Mbarga Hélène",
        payerPhone: "+237 690 44 55 66",
        phone: "+237 690 44 55 66",
        city: "Yaoundé",
        locale: "fr",
        balance: 0,
        overdueBalance: 0,
      },
    ],
    catalog: [
      {
        id: "fee-1",
        name: "Inscription annuelle + Assurance scolaire",
        itemKind: "fee",
        unit: "année",
        unitPrice: 25000,
        vatApplicable: false,
        className: "Toutes classes",
      },
      {
        id: "fee-2",
        name: "Scolarité 1ère Tranche (Septembre)",
        itemKind: "fee",
        unit: "tranche",
        unitPrice: 100000,
        vatApplicable: false,
        className: "Second Cycle",
      },
      {
        id: "fee-3",
        name: "Scolarité 2ème Tranche (Novembre)",
        itemKind: "fee",
        unit: "tranche",
        unitPrice: 95000,
        vatApplicable: false,
        className: "Terminale C",
      },
      {
        id: "fee-4",
        name: "Bus scolaire trimestriel",
        itemKind: "fee",
        unit: "trimestre",
        unitPrice: 45000,
        vatApplicable: false,
        className: "Optionnel",
      },
    ],
    documents: [
      {
        id: "sdoc-1",
        number: "FAC-2026-0118",
        docType: "invoice",
        status: "partially_paid",
        clientId: "stu-1",
        clientName: "Ewane Samuel Junior (Terminale C)",
        whatsappPhone: "+237677809010",
        locale: "fr",
        issueDate: "2026-09-05",
        dueDate: "2026-11-05",
        subtotal: 220000,
        vatTotal: 0,
        total: 220000,
        paidTotal: 125000,
        balance: 95000,
        daysOverdue: 6,
        publicToken: "demo-scol-0118",
        lines: [
          {
            label: "Inscription + Scolarité Annuelle Terminale C",
            quantity: 1,
            unitPrice: 220000,
            discount: 0,
            vatRateBp: 0,
            total: 220000,
          },
        ],
        installments: [
          { label: "1ère Tranche + Inscription", dueDate: "2026-09-15", amount: 125000 },
          { label: "2ème Tranche", dueDate: "2026-11-05", amount: 95000 },
        ],
      },
      {
        id: "sdoc-2",
        number: "FAC-2026-0119",
        docType: "invoice",
        status: "partially_paid",
        clientId: "stu-2",
        clientName: "Ndi Grace Bih (Form 5 Science)",
        whatsappPhone: "+237679112244",
        locale: "en",
        issueDate: "2026-09-05",
        dueDate: "2026-10-30",
        subtotal: 200000,
        vatTotal: 0,
        total: 200000,
        paidTotal: 125000,
        balance: 75000,
        daysOverdue: 12,
        publicToken: "demo-scol-0119",
        lines: [
          {
            label: "Registration + Annual Tuition Fee (Form 5)",
            quantity: 1,
            unitPrice: 200000,
            discount: 0,
            vatRateBp: 0,
            total: 200000,
          },
        ],
      },
    ],
    payments: [
      {
        id: "spay-1",
        receiptNumber: "REC-2026-0210",
        clientId: "stu-1",
        clientName: "Ewane Samuel Junior (Parent : M. Ewane Paul)",
        documentNumber: "FAC-2026-0118",
        amount: 125000,
        method: "mtn_momo",
        reference: "MP260910.0812.B1104",
        paidAt: "2026-09-10",
        status: "valid",
      },
    ],
    reminders: [
      {
        id: "srem-1",
        documentId: "sdoc-1",
        documentNumber: "FAC-2026-0118",
        clientName: "Ewane Samuel Junior (Terminale C)",
        payerName: "M. Ewane Paul",
        whatsappPhone: "+237677809010",
        locale: "fr",
        balance: 95000,
        dueDate: "2026-11-05",
        daysOverdue: 6,
        suggestedTone: "courteous",
      },
      {
        id: "srem-2",
        documentId: "sdoc-2",
        documentNumber: "FAC-2026-0119",
        clientName: "Ndi Grace Bih (Form 5 Science)",
        payerName: "Mrs. Ndi Comfort",
        whatsappPhone: "+237679112244",
        locale: "en",
        balance: 75000,
        dueDate: "2026-10-30",
        daysOverdue: 12,
        suggestedTone: "firm",
      },
    ],
  },
};

