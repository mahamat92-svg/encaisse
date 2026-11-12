"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  computeLineTotals,
  type Locale,
  type OrgMode,
  type PaymentMethod,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  DEMO_ORGS,
  type DemoCatalogItem,
  type DemoClient,
  type DemoDocument,
  type DemoPayment,
  type DemoReminder,
} from "@/lib/demo-data";

export interface ActiveOrgData {
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
  isLiveDb: boolean;
}

export interface NewClientInput {
  name: string;
  phone: string;
  city: string;
  className?: string;
  payerName?: string;
}

export interface NewCatalogInput {
  name: string;
  unit: string;
  unitPrice: number;
}

export interface NewDocumentInput {
  docType: "invoice" | "quote";
  clientId: string;
  dueDate: string;
  label: string;
  quantity: number;
  unitPrice: number;
  applyVat: boolean;
}

export interface NewPaymentInput {
  documentId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

interface AppState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  mode: OrgMode;
  setMode: (m: OrgMode) => void;
  supabaseReady: boolean;
  userEmail: string | null;
  org: ActiveOrgData;
  loadingData: boolean;
  refreshOrgData: () => Promise<void>;
  signOutUser: () => Promise<void>;
  addClientRecord: (input: NewClientInput) => Promise<{ ok: boolean; error?: string }>;
  addCatalogRecord: (input: NewCatalogInput) => Promise<{ ok: boolean; error?: string }>;
  createDocumentRecord: (
    input: NewDocumentInput
  ) => Promise<{ ok: boolean; error?: string; number?: string; publicToken?: string }>;
  recordPaymentRecord: (
    input: NewPaymentInput
  ) => Promise<{ ok: boolean; error?: string; receiptNumber?: string }>;
}

const STORAGE_KEY = "innovtech_encaisse_custom_v1";

interface LocalCustomStore {
  commerce: {
    clients: DemoClient[];
    catalog: DemoCatalogItem[];
    documents: DemoDocument[];
    payments: DemoPayment[];
  };
  etablissement: {
    clients: DemoClient[];
    catalog: DemoCatalogItem[];
    documents: DemoDocument[];
    payments: DemoPayment[];
  };
}

function getInitialCustomStore(): LocalCustomStore {
  if (typeof window === "undefined") {
    return {
      commerce: { clients: [], catalog: [], documents: [], payments: [] },
      etablissement: { clients: [], catalog: [], documents: [], payments: [] },
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalCustomStore;
      if (parsed?.commerce && parsed?.etablissement) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return {
    commerce: { clients: [], catalog: [], documents: [], payments: [] },
    etablissement: { clients: [], catalog: [], documents: [], payments: [] },
  };
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [mode, setMode] = useState<OrgMode>("commerce");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [liveOrg, setLiveOrg] = useState<ActiveOrgData | null>(null);
  const [customStore, setCustomStore] = useState<LocalCustomStore>({
    commerce: { clients: [], catalog: [], documents: [], payments: [] },
    etablissement: { clients: [], catalog: [], documents: [], payments: [] },
  });
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const supabaseReady = isSupabaseConfigured();

  // Charger les créations locales persistées au démarrage
  useEffect(() => {
    setCustomStore(getInitialCustomStore());
  }, []);

  const updateCustomStore = useCallback(
    (updater: (prev: LocalCustomStore) => LocalCustomStore) => {
      setCustomStore((prev) => {
        const next = updater(prev);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Ignore quota errors
          }
        }
        return next;
      });
    },
    []
  );

  const refreshOrgData = useCallback(async () => {
    if (!supabaseReady) {
      setLiveOrg(null);
      return;
    }

    setLoadingData(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserEmail(null);
        setLiveOrg(null);
        setLoadingData(false);
        return;
      }

      setUserEmail(user.email ?? null);

      // 1. Chercher l'organisation dont cet utilisateur est membre
      const { data: myMemberships } = await supabase
        .from("memberships")
        .select("org_id, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      let targetOrgId: string | null = myMemberships?.[0]?.org_id ?? null;

      // 2. Si l'utilisateur n'a pas encore d'organisation, la créer automatiquement
      if (!targetOrgId) {
        const meta = user.user_metadata || {};
        const defaultName =
          typeof meta.org_name === "string" && meta.org_name.trim()
            ? meta.org_name.trim()
            : typeof meta.full_name === "string" && meta.full_name.trim()
              ? `Entreprise ${meta.full_name.trim()}`
              : `Entreprise ${(user.email || "InnovTech").split("@")[0]}`;
        const defaultMode: OrgMode =
          meta.org_mode === "etablissement" ? "etablissement" : "commerce";
        const defaultCity =
          typeof meta.city === "string" && meta.city.trim()
            ? meta.city.trim()
            : "Douala";
        const defaultPhone =
          typeof meta.phone === "string" && meta.phone.trim()
            ? meta.phone.trim()
            : "+237 ";

        const { data: createdOrgId, error: createErr } = await supabase.rpc(
          "create_organization",
          {
            p_name: defaultName,
            p_mode: defaultMode,
            p_city: defaultCity,
            p_phone: defaultPhone,
          }
        );

        if (!createErr && createdOrgId) {
          targetOrgId = String(createdOrgId);
        }
      }

      // Fallback si Super-Admin a déjà une organisation visible dans `organizations`
      if (!targetOrgId) {
        const { data: anyOrgs } = await supabase
          .from("organizations")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1);
        if (anyOrgs?.[0]?.id) {
          targetOrgId = String(anyOrgs[0].id);
        }
      }

      if (!targetOrgId) {
        setLiveOrg(null);
        setLoadingData(false);
        return;
      }

      const { data: dbOrg } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", targetOrgId)
        .single();

      if (!dbOrg) {
        setLiveOrg(null);
        setLoadingData(false);
        return;
      }

      const activeMode: OrgMode =
        dbOrg.mode === "etablissement" ? "etablissement" : "commerce";
      setMode(activeMode);

      // 3. Synchroniser automatiquement en base Supabase tout client ou produit créé localement avant la connexion
      const localPending = getInitialCustomStore()[activeMode];
      if (localPending.clients.length > 0) {
        const { data: existingClients } = await supabase
          .from("clients")
          .select("name")
          .eq("org_id", dbOrg.id);
        const existingNames = new Set(
          (existingClients ?? []).map((c) => c.name.toLowerCase())
        );
        for (const locCli of localPending.clients) {
          if (!existingNames.has(locCli.name.toLowerCase())) {
            await supabase.from("clients").insert({
              org_id: dbOrg.id,
              kind: locCli.kind,
              name: locCli.name,
              phone: locCli.phone,
              city: locCli.city,
              locale: locCli.locale,
              class_name: locCli.className ?? null,
              school_year: locCli.schoolYear ?? null,
              payer_name: locCli.payerName ?? null,
              payer_phone: locCli.payerPhone ?? null,
            });
          }
        }
      }

      if (localPending.catalog.length > 0) {
        const { data: existingCat } = await supabase
          .from("catalog_items")
          .select("name")
          .eq("org_id", dbOrg.id);
        const existingCatNames = new Set(
          (existingCat ?? []).map((c) => c.name.toLowerCase())
        );
        for (const locItem of localPending.catalog) {
          if (!existingCatNames.has(locItem.name.toLowerCase())) {
            await supabase.from("catalog_items").insert({
              org_id: dbOrg.id,
              name: locItem.name,
              item_kind: locItem.itemKind,
              unit: locItem.unit,
              unit_price: locItem.unitPrice,
              vat_applicable: locItem.vatApplicable,
            });
          }
        }
      }

      // 4. Récupérer en parallèle clients, soldes, catalogue, documents, lignes, paiements et relances
      const [
        rawClientsRes,
        balancesRes,
        catRes,
        docsRes,
        linesRes,
        paysRes,
        remRes,
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("org_id", dbOrg.id)
          .is("archived_at", null)
          .order("created_at", { ascending: false }),
        supabase.from("v_client_balances").select("*").eq("org_id", dbOrg.id),
        supabase
          .from("catalog_items")
          .select("*")
          .eq("org_id", dbOrg.id)
          .is("archived_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("v_document_balances")
          .select("*")
          .eq("org_id", dbOrg.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("document_lines")
          .select("*")
          .eq("org_id", dbOrg.id)
          .order("position", { ascending: true }),
        supabase
          .from("payments")
          .select("*")
          .eq("org_id", dbOrg.id)
          .order("created_at", { ascending: false }),
        supabase.from("v_reminders_due").select("*").eq("org_id", dbOrg.id),
      ]);

      const balanceByClient = new Map<
        string,
        { balance: number; overdueBalance: number }
      >();
      for (const b of balancesRes.data ?? []) {
        balanceByClient.set(b.client_id, {
          balance: Number(b.balance ?? 0),
          overdueBalance: Number(b.overdue_balance ?? 0),
        });
      }

      const clientMap = new Map<string, DemoClient>();
      const mappedClients: DemoClient[] = (rawClientsRes.data ?? []).map((c) => {
        const bal = balanceByClient.get(c.id) ?? {
          balance: 0,
          overdueBalance: 0,
        };
        const item: DemoClient = {
          id: c.id,
          kind: c.kind === "student" ? "student" : "customer",
          name: c.name,
          phone: c.phone || c.payer_phone || "",
          city: c.city || dbOrg.city || "Cameroun",
          locale: c.locale === "en" ? "en" : "fr",
          creditLimit: c.credit_limit ? Number(c.credit_limit) : undefined,
          className: c.class_name || undefined,
          schoolYear: c.school_year || undefined,
          payerName: c.payer_name || undefined,
          payerPhone: c.payer_phone || undefined,
          balance: bal.balance,
          overdueBalance: bal.overdueBalance,
        };
        clientMap.set(item.id, item);
        return item;
      });

      const mappedCatalog: DemoCatalogItem[] = (catRes.data ?? []).map(
        (item) => ({
          id: item.id,
          name: item.name,
          itemKind: item.item_kind,
          unit: item.unit,
          unitPrice: Number(item.unit_price ?? 0),
          vatApplicable: Boolean(item.vat_applicable),
          className: item.class_name || undefined,
        })
      );

      const linesByDoc = new Map<string, DemoDocument["lines"]>();
      for (const l of linesRes.data ?? []) {
        const arr = linesByDoc.get(l.document_id) ?? [];
        arr.push({
          label: l.label,
          quantity: Number(l.quantity ?? 1),
          unitPrice: Number(l.unit_price ?? 0),
          discount: Number(l.discount ?? 0),
          vatRateBp: Number(l.vat_rate_bp ?? 0),
          total: Number(l.line_total ?? 0),
        });
        linesByDoc.set(l.document_id, arr);
      }

      const mappedDocs: DemoDocument[] = (docsRes.data ?? []).map((d) => {
        const cli = clientMap.get(d.client_id);
        return {
          id: d.id,
          number: d.number || "BROUILLON",
          docType: d.doc_type,
          status: d.status,
          clientId: d.client_id,
          clientName: cli?.name || "Client",
          whatsappPhone: cli?.payerPhone || cli?.phone || "",
          locale: d.locale === "en" ? "en" : "fr",
          issueDate: d.issue_date || new Date().toISOString().slice(0, 10),
          dueDate: d.due_date || new Date().toISOString().slice(0, 10),
          subtotal: Number(d.subtotal ?? 0),
          vatTotal: Number(d.vat_total ?? 0),
          total: Number(d.total ?? 0),
          paidTotal: Number(d.paid_total ?? 0),
          balance: Number(d.balance ?? 0),
          daysOverdue: Number(d.days_overdue ?? 0),
          publicToken: d.public_token,
          lines: linesByDoc.get(d.id) ?? [],
        };
      });

      const mappedPayments: DemoPayment[] = (paysRes.data ?? []).map((p) => {
        const cli = clientMap.get(p.client_id);
        return {
          id: p.id,
          receiptNumber: p.receipt_number || "REC",
          clientId: p.client_id,
          clientName: cli?.name || "Client",
          documentNumber: "Compte client",
          amount: Number(p.amount ?? 0),
          method: p.method,
          reference: p.reference || "ESPÈCES",
          paidAt: p.paid_at,
          status: p.status,
        };
      });

      const mappedReminders: DemoReminder[] = (remRes.data ?? []).map((r) => ({
        id: r.document_id,
        documentId: r.document_id,
        documentNumber: r.number || "FAC",
        clientName: r.client_name,
        whatsappPhone: r.whatsapp_phone || "",
        locale: r.client_locale === "en" ? "en" : "fr",
        balance: Number(r.balance ?? 0),
        dueDate: r.current_due_date,
        daysOverdue: Number(r.days_overdue ?? 0),
        suggestedTone: r.suggested_tone || "courteous",
      }));

      const trialEnd = dbOrg.trial_ends_at
        ? new Date(dbOrg.trial_ends_at).getTime()
        : 0;
      const daysLeft = Math.max(
        Math.ceil((trialEnd - Date.now()) / 86400000),
        0
      );

      setLiveOrg({
        id: dbOrg.id,
        name: dbOrg.name,
        mode: activeMode,
        city: dbOrg.city || "Cameroun",
        phone: dbOrg.phone || "",
        niu: dbOrg.niu || "Non renseigné",
        rccm: dbOrg.rccm || "Non renseigné",
        vatRegistered: Boolean(dbOrg.vat_registered),
        vatRateBp: Number(dbOrg.vat_rate_bp ?? 1925),
        mtnMomoNumber:
          dbOrg.mtn_momo_number || "À configurer dans Entreprise",
        orangeMoneyNumber:
          dbOrg.orange_money_number || "À configurer dans Entreprise",
        planId: "pro",
        trialDaysLeft: daysLeft,
        clients: mappedClients,
        catalog: mappedCatalog,
        documents: mappedDocs,
        payments: mappedPayments,
        reminders: mappedReminders,
        isLiveDb: true,
      });
    } catch {
      // Fallback
    } finally {
      setLoadingData(false);
    }
  }, [supabaseReady]);

  useEffect(() => {
    refreshOrgData();
    if (!supabaseReady) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshOrgData();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshOrgData, supabaseReady]);

  const signOutUser = useCallback(async () => {
    if (supabaseReady) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUserEmail(null);
    setLiveOrg(null);
  }, [supabaseReady]);

  // Construire l'organisation active en combinant soit Supabase Live (+ cache local de secours), soit Démo + créations locales persistées
  const baseDemo = DEMO_ORGS[mode];
  const localForMode = customStore[mode];

  const mergedDemoClients = [
    ...localForMode.clients,
    ...baseDemo.clients.filter(
      (dc) =>
        !localForMode.clients.some(
          (lc) => lc.id === dc.id || lc.name.toLowerCase() === dc.name.toLowerCase()
        )
    ),
  ];

  const mergedDemoCatalog = [
    ...localForMode.catalog,
    ...baseDemo.catalog.filter(
      (di) =>
        !localForMode.catalog.some(
          (li) => li.id === di.id || li.name.toLowerCase() === di.name.toLowerCase()
        )
    ),
  ];

  const mergedDemoDocs = [
    ...localForMode.documents,
    ...baseDemo.documents.filter(
      (dd) => !localForMode.documents.some((ld) => ld.id === dd.id)
    ),
  ];

  const mergedDemoPayments = [
    ...localForMode.payments,
    ...baseDemo.payments.filter(
      (dp) => !localForMode.payments.some((lp) => lp.id === dp.id)
    ),
  ];

  const fallbackDemo: ActiveOrgData = {
    ...baseDemo,
    clients: mergedDemoClients,
    catalog: mergedDemoCatalog,
    documents: mergedDemoDocs,
    payments: mergedDemoPayments,
    isLiveDb: false,
  };

  // Si liveOrg est actif, on fusionne aussi les éléments locaux qui n'auraient pas pu être écrits si un trigger SQL manquait de GRANT
  const activeOrg: ActiveOrgData = liveOrg
    ? {
        ...liveOrg,
        clients: [
          ...liveOrg.clients,
          ...localForMode.clients.filter(
            (lc) =>
              !liveOrg.clients.some(
                (rc) =>
                  rc.id === lc.id ||
                  rc.name.toLowerCase() === lc.name.toLowerCase()
              )
          ),
        ],
        catalog: [
          ...liveOrg.catalog,
          ...localForMode.catalog.filter(
            (li) =>
              !liveOrg.catalog.some(
                (ri) =>
                  ri.id === li.id ||
                  ri.name.toLowerCase() === li.name.toLowerCase()
              )
          ),
        ],
        documents: [
          ...liveOrg.documents,
          ...localForMode.documents.filter(
            (ld) =>
              !liveOrg.documents.some(
                (rd) => rd.id === ld.id || rd.number === ld.number
              )
          ),
        ],
        payments: [
          ...liveOrg.payments,
          ...localForMode.payments.filter(
            (lp) =>
              !liveOrg.payments.some(
                (rp) =>
                  rp.id === lp.id || rp.receiptNumber === lp.receiptNumber
              )
          ),
        ],
      }
    : fallbackDemo;

  // Actions centralisées : écrivent dans Supabase ET persistent dans AppContext + localStorage
  const addClientRecord = useCallback(
    async (input: NewClientInput): Promise<{ ok: boolean; error?: string }> => {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        return { ok: false, error: "Le nom du client est obligatoire." };
      }

      const newLocalClient: DemoClient = {
        id: `cli-${Date.now()}`,
        kind: mode === "etablissement" ? "student" : "customer",
        name: trimmedName,
        phone: input.phone.trim(),
        city: input.city.trim() || "Douala",
        locale: "fr",
        className: mode === "etablissement" ? input.className?.trim() : undefined,
        schoolYear: mode === "etablissement" ? "2026-2027" : undefined,
        payerName: mode === "etablissement" ? input.payerName?.trim() : undefined,
        payerPhone: mode === "etablissement" ? input.phone.trim() : undefined,
        balance: 0,
        overdueBalance: 0,
      };

      // 1. Persister immédiatement dans le store global (ne disparaît jamais au changement de page ni au F5)
      updateCustomStore((prev) => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          clients: [
            newLocalClient,
            ...prev[mode].clients.filter(
              (c) => c.name.toLowerCase() !== trimmedName.toLowerCase()
            ),
          ],
        },
      }));

      // 2. Si connecté à Supabase, enregistrer aussi en base PostgreSQL
      if (supabaseReady && liveOrg) {
        try {
          const supabase = createClient();
          const { error: dbErr } = await supabase.from("clients").insert({
            org_id: liveOrg.id,
            kind: mode === "etablissement" ? "student" : "customer",
            name: trimmedName,
            phone: input.phone.trim(),
            city: input.city.trim() || "Douala",
            locale: "fr",
            class_name:
              mode === "etablissement" ? input.className?.trim() || null : null,
            school_year: mode === "etablissement" ? "2026-2027" : null,
            payer_name:
              mode === "etablissement" ? input.payerName?.trim() || null : null,
            payer_phone:
              mode === "etablissement" ? input.phone.trim() || null : null,
          });
          if (!dbErr) {
            await refreshOrgData();
          }
        } catch {
          // Conservé dans le store persistant
        }
      }

      return { ok: true };
    },
    [liveOrg, mode, refreshOrgData, supabaseReady, updateCustomStore]
  );

  const addCatalogRecord = useCallback(
    async (input: NewCatalogInput): Promise<{ ok: boolean; error?: string }> => {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        return { ok: false, error: "La désignation est obligatoire." };
      }

      const itemKind = mode === "etablissement" ? "fee" : "product";
      const vatApplicable = mode === "commerce" && activeOrg.vatRegistered;

      const newLocalItem: DemoCatalogItem = {
        id: `cat-${Date.now()}`,
        name: trimmedName,
        itemKind,
        unit: input.unit.trim() || "unité",
        unitPrice: Math.max(Math.round(input.unitPrice), 0),
        vatApplicable,
      };

      updateCustomStore((prev) => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          catalog: [
            newLocalItem,
            ...prev[mode].catalog.filter(
              (i) => i.name.toLowerCase() !== trimmedName.toLowerCase()
            ),
          ],
        },
      }));

      if (supabaseReady && liveOrg) {
        try {
          const supabase = createClient();
          const { error: dbErr } = await supabase.from("catalog_items").insert({
            org_id: liveOrg.id,
            name: trimmedName,
            item_kind: itemKind,
            unit: newLocalItem.unit,
            unit_price: newLocalItem.unitPrice,
            vat_applicable: vatApplicable,
          });
          if (!dbErr) {
            await refreshOrgData();
          }
        } catch {
          // Conservé dans le store persistant
        }
      }

      return { ok: true };
    },
    [
      activeOrg.vatRegistered,
      liveOrg,
      mode,
      refreshOrgData,
      supabaseReady,
      updateCustomStore,
    ]
  );

  const createDocumentRecord = useCallback(
    async (
      input: NewDocumentInput
    ): Promise<{
      ok: boolean;
      error?: string;
      number?: string;
      publicToken?: string;
    }> => {
      const client =
        activeOrg.clients.find((c) => c.id === input.clientId) ??
        activeOrg.clients[0];
      if (!client) {
        return {
          ok: false,
          error: "Veuillez d'abord créer ou sélectionner un client.",
        };
      }

      const vatBp = input.applyVat ? activeOrg.vatRateBp : 0;
      const calc = computeLineTotals(
        input.quantity,
        input.unitPrice,
        0,
        vatBp
      );
      const prefix = input.docType === "quote" ? "DEV" : "FAC";
      const seq = activeOrg.documents.length + 1;
      const fallbackNum = `${prefix}-2026-${String(seq).padStart(4, "0")}`;
      const fallbackToken = `tok-${fallbackNum.toLowerCase()}-${Date.now()}`;

      // 1. Si connecté à Supabase et que le client existe en base (UUID)
      if (
        supabaseReady &&
        liveOrg &&
        !client.id.startsWith("cli-")
      ) {
        try {
          const supabase = createClient();
          const { data: draftDoc, error: docErr } = await supabase
            .from("documents")
            .insert({
              org_id: liveOrg.id,
              doc_type: input.docType,
              client_id: client.id,
              due_date: input.dueDate,
              locale: client.locale,
            })
            .select("*")
            .single();

          if (!docErr && draftDoc) {
            const { error: lineErr } = await supabase
              .from("document_lines")
              .insert({
                org_id: liveOrg.id,
                document_id: draftDoc.id,
                position: 1,
                label: input.label.trim() || "Prestation / Fourniture",
                quantity: input.quantity,
                unit_price: input.unitPrice,
                discount: 0,
                vat_rate_bp: vatBp,
              });

            if (!lineErr) {
              const { data: issued, error: issueErr } = await supabase.rpc(
                "issue_document",
                { p_doc: draftDoc.id }
              );
              if (!issueErr) {
                await refreshOrgData();
                return {
                  ok: true,
                  number: issued?.number || fallbackNum,
                  publicToken: draftDoc.public_token,
                };
              }
            }
          }
        } catch {
          // Bascule sur persistance locale si une contrainte/trigger bloque
        }
      }

      // 2. Persistance immédiate dans AppContext + localStorage + mise à jour du solde client
      const newDoc: DemoDocument = {
        id: `doc-${Date.now()}`,
        number: fallbackNum,
        docType: input.docType,
        status: "issued",
        clientId: client.id,
        clientName: client.name,
        whatsappPhone: client.payerPhone || client.phone,
        locale: client.locale,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: input.dueDate,
        subtotal: calc.subtotal,
        vatTotal: calc.vat,
        total: calc.total,
        paidTotal: 0,
        balance: input.docType === "invoice" ? calc.total : 0,
        daysOverdue: 0,
        publicToken: fallbackToken,
        lines: [
          {
            label: input.label.trim() || "Prestation / Fourniture",
            quantity: input.quantity,
            unitPrice: input.unitPrice,
            discount: 0,
            vatRateBp: vatBp,
            total: calc.total,
          },
        ],
      };

      updateCustomStore((prev) => {
        const currentClients = prev[mode].clients;
        const existingInCustom = currentClients.find((c) => c.id === client.id);
        const updatedClient: DemoClient = {
          ...(existingInCustom ?? client),
          balance:
            (existingInCustom ?? client).balance +
            (input.docType === "invoice" ? calc.total : 0),
        };
        return {
          ...prev,
          [mode]: {
            ...prev[mode],
            clients: [
              updatedClient,
              ...currentClients.filter((c) => c.id !== client.id),
            ],
            documents: [newDoc, ...prev[mode].documents],
          },
        };
      });

      return { ok: true, number: fallbackNum, publicToken: fallbackToken };
    },
    [
      activeOrg.clients,
      activeOrg.documents.length,
      activeOrg.vatRateBp,
      liveOrg,
      mode,
      refreshOrgData,
      supabaseReady,
      updateCustomStore,
    ]
  );

  const recordPaymentRecord = useCallback(
    async (
      input: NewPaymentInput
    ): Promise<{ ok: boolean; error?: string; receiptNumber?: string }> => {
      const doc =
        activeOrg.documents.find((d) => d.id === input.documentId) ??
        activeOrg.documents[0];
      if (!doc) {
        return { ok: false, error: "Aucune facture sélectionnée." };
      }

      const refTrimmed = input.reference.trim();
      if (
        refTrimmed &&
        activeOrg.payments.some(
          (p) =>
            p.status === "valid" &&
            p.method === input.method &&
            p.reference.toLowerCase() === refTrimmed.toLowerCase()
        )
      ) {
        return {
          ok: false,
          error: `ALERTE ANTI-FRAUDE (PAY-5) : La référence Mobile Money "${refTrimmed}" a déjà été utilisée !`,
        };
      }

      if (supabaseReady && liveOrg && !doc.id.startsWith("doc-")) {
        try {
          const supabase = createClient();
          const { data: payRow, error: rpcErr } = await supabase.rpc(
            "record_payment",
            {
              p_org: liveOrg.id,
              p_client: doc.clientId,
              p_amount: input.amount,
              p_method: input.method,
              p_reference: refTrimmed || null,
              p_document: doc.id,
            }
          );
          if (rpcErr) {
            if (rpcErr.message.includes("DUPLICATE_REFERENCE")) {
              return {
                ok: false,
                error: `ALERTE ANTI-FRAUDE (PAY-5) : La référence Mobile Money "${refTrimmed}" a déjà été utilisée !`,
              };
            }
            return { ok: false, error: rpcErr.message };
          }
          await refreshOrgData();
          return {
            ok: true,
            receiptNumber: payRow?.receipt_number || "REC-2026-0001",
          };
        } catch {
          // Fallback store
        }
      }

      const nextRec = `REC-2026-${String(
        activeOrg.payments.length + 215
      ).padStart(4, "0")}`;
      const newPay: DemoPayment = {
        id: `pay-${Date.now()}`,
        receiptNumber: nextRec,
        clientId: doc.clientId,
        clientName: doc.clientName,
        documentNumber: doc.number,
        amount: input.amount,
        method: input.method,
        reference: refTrimmed || "ESPÈCES-CAISSE",
        paidAt: new Date().toISOString().slice(0, 10),
        status: "valid",
      };

      updateCustomStore((prev) => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          payments: [newPay, ...prev[mode].payments],
          documents: prev[mode].documents.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  paidTotal: d.paidTotal + input.amount,
                  balance: Math.max(d.balance - input.amount, 0),
                  status:
                    d.balance - input.amount <= 0 ? "paid" : "partially_paid",
                }
              : d
          ),
        },
      }));

      return { ok: true, receiptNumber: nextRec };
    },
    [
      activeOrg.documents,
      activeOrg.payments,
      liveOrg,
      mode,
      refreshOrgData,
      supabaseReady,
      updateCustomStore,
    ]
  );

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        mode,
        setMode,
        supabaseReady,
        userEmail,
        org: activeOrg,
        loadingData,
        refreshOrgData,
        signOutUser,
        addClientRecord,
        addCatalogRecord,
        createDocumentRecord,
        recordPaymentRecord,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return ctx;
}
