import type { Locale, OrgMode } from "./format";

export const DICTIONARY = {
  fr: {
    brandTagline: "Facturez en 30 secondes, faites-vous payer plus vite.",
    nav: {
      home: "Accueil",
      services: "Services",
      pricing: "Tarifs",
      help: "Assistance",
      login: "Connexion",
      register: "Créer un compte",
      dashboard: "Tableau de bord",
      documents: "Factures & Devis",
      clients: "Clients",
      students: "Élèves & Parents",
      catalog: "Catalogue",
      CatalogSchool: "Frais scolaires",
      payments: "Paiements & Reçus",
      reminders: "Relances WhatsApp",
      ai: "Atelier IA (Dictée)",
      subscription: "Abonnement",
      history: "Historique",
      settings: "Entreprise",
      admin: "Super-Admin",
    },
    kpi: {
      receivable: "On vous doit",
      collectedMonth: "Encaissé ce mois",
      overdue: "En retard d'échéance",
      remindersToday: "À relancer aujourd'hui",
    },
    modes: {
      commerce: {
        title: "Mode Commerce & Services",
        subtitle: "PME, boutiques, grossistes, prestataires B2B, artisans",
        clientLabel: "Client",
        clientsLabel: "Clients",
        catalogLabel: "Articles & Prestations",
      },
      etablissement: {
        title: "Mode Établissement",
        subtitle: "Écoles privées, collèges, instituts et centres de formation",
        clientLabel: "Élève / Apprenant",
        clientsLabel: "Élèves & Parents",
        catalogLabel: "Frais de scolarité",
      },
    },
  },
  en: {
    brandTagline: "Invoice in 30 seconds, get paid faster.",
    nav: {
      home: "Home",
      services: "Services",
      pricing: "Pricing",
      help: "Help Center",
      login: "Sign in",
      register: "Get started",
      dashboard: "Dashboard",
      documents: "Invoices & Quotes",
      clients: "Customers",
      students: "Students & Parents",
      catalog: "Catalog",
      CatalogSchool: "School Fees",
      payments: "Payments & Receipts",
      reminders: "WhatsApp Reminders",
      ai: "AI Studio (Dictation)",
      subscription: "Subscription",
      history: "Audit Log",
      settings: "Organization",
      admin: "Super Admin",
    },
    kpi: {
      receivable: "Total Receivable",
      collectedMonth: "Collected this month",
      overdue: "Overdue Balance",
      remindersToday: "To remind today",
    },
    modes: {
      commerce: {
        title: "Business & Services Mode",
        subtitle: "SMBs, shops, wholesalers, contractors, freelancers",
        clientLabel: "Customer",
        clientsLabel: "Customers",
        catalogLabel: "Products & Services",
      },
      etablissement: {
        title: "School & Training Mode",
        subtitle: "Private schools, colleges, training centers",
        clientLabel: "Student",
        clientsLabel: "Students & Parents",
        catalogLabel: "Tuition & Fees",
      },
    },
  },
} as const;

export function getLabels(locale: Locale, mode: OrgMode) {
  const t = DICTIONARY[locale] ?? DICTIONARY.fr;
  const m = t.modes[mode] ?? t.modes.commerce;
  return { t, m };
}

