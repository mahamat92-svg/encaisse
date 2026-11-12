"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_MERCHANT_CITY,
  DEFAULT_MERCHANT_COUNTRY,
  DEFAULT_MERCHANT_REGION,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  type BrandColorChoice,
  type BusinessType,
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

export interface FapshiConfig {
  apiUser: string;
  apiKey: string;
  environment: "sandbox" | "live";
}

export interface ActiveOrgData {
  id: string;
  name: string;
  mode: OrgMode;
  businessType: BusinessType;
  city: string;
  region: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  slogan: string;
  primaryColor: BrandColorChoice;
  rccmNiu: string;
  niu: string;
  rccm: string;
  vatRegistered: boolean;
  vatRateBp: number;
  mtnMomoNumber: string;
  orangeMoneyNumber: string;
  fapshi: FapshiConfig;
  planId: string;
  subscriptionStatus: "trial" | "active" | "expired";
  subscriptionExpiresAt: string;
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
  clientId?: string;
  newClientName?: string;
  newClientPhone?: string;
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
  isAdmin: boolean;
  org: ActiveOrgData;
  loadingData: boolean;
  refreshOrgData: () => Promise<void>;
  signOutUser: () => Promise<void>;
  addClientRecord: (
    input: NewClientInput
  ) => Promise<{ ok: boolean; error?: string; id?: string }>;
  deleteClientRecord: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addCatalogRecord: (
    input: NewCatalogInput
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteCatalogRecord: (id: string) => Promise<{ ok: boolean; error?: string }>;
  createDocumentRecord: (
    input: NewDocumentInput
  ) => Promise<{
    ok: boolean;
    error?: string;
    number?: string;
    publicToken?: string;
  }>;
  recordPaymentRecord: (
    input: NewPaymentInput
  ) => Promise<{ ok: boolean; error?: string; receiptNumber?: string }>;
}

interface FooterMeta {
  fapshi: FapshiConfig;
  email: string;
  slogan: string;
  primaryColor: BrandColorChoice;
  rccmNiu: string;
  logoUrl: string;
  businessType: BusinessType;
  city: string;
  region: string;
  country: string;
  address: string;
}

function isValidBusinessType(v: unknown): v is BusinessType {
  return (
    v === "boutique" ||
    v === "ecole" ||
    v === "clinique" ||
    v === "immobilier" ||
    v === "artisan" ||
    v === "ong"
  );
}

function parseFooterMeta(footerNote: string | null | undefined): FooterMeta {
  const fallback: FooterMeta = {
    fapshi: { apiUser: "", apiKey: "", environment: "live" },
    email: OFFICIAL_EMAIL,
    slogan: "",
    primaryColor: "green",
    rccmNiu: "",
    logoUrl: "",
    businessType: "boutique",
    city: DEFAULT_MERCHANT_CITY,
    region: DEFAULT_MERCHANT_REGION,
    country: DEFAULT_MERCHANT_COUNTRY,
    address: "",
  };
  if (!footerNote) return fallback;
  try {
    if (footerNote.startsWith("{")) {
      const parsed = JSON.parse(footerNote);
      const col = parsed.primaryColor;
      const validColor: BrandColorChoice =
        col === "blue" || col === "gold" || col === "orange" || col === "black"
          ? col
          : "green";
      return {
        fapshi: {
          apiUser:
            typeof parsed.fapshiApiUser === "string" ? parsed.fapshiApiUser : "",
          apiKey:
            typeof parsed.fapshiApiKey === "string" ? parsed.fapshiApiKey : "",
          environment: parsed.fapshiEnv === "sandbox" ? "sandbox" : "live",
        },
        email:
          typeof parsed.email === "string" && parsed.email.trim()
            ? parsed.email.trim()
            : OFFICIAL_EMAIL,
        slogan: typeof parsed.slogan === "string" ? parsed.slogan : "",
        primaryColor: validColor,
        rccmNiu: typeof parsed.rccmNiu === "string" ? parsed.rccmNiu : "",
        logoUrl: typeof parsed.logoUrl === "string" ? parsed.logoUrl : "",
        businessType: isValidBusinessType(parsed.businessType)
          ? parsed.businessType
          : "boutique",
        city:
          typeof parsed.city === "string" && parsed.city.trim()
            ? parsed.city.trim()
            : DEFAULT_MERCHANT_CITY,
        region:
          typeof parsed.region === "string" && parsed.region.trim()
            ? parsed.region.trim()
            : DEFAULT_MERCHANT_REGION,
        country:
          typeof parsed.country === "string" && parsed.country.trim()
            ? parsed.country.trim()
            : DEFAULT_MERCHANT_COUNTRY,
        address: typeof parsed.address === "string" ? parsed.address.trim() : "",
      };
    }
  } catch {
    // Ignore parse error
  }
  return fallback;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const [mode, setMode] = useState<OrgMode>("commerce");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [liveOrg, setLiveOrg] = useState<ActiveOrgData | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const supabaseReady = isSupabaseConfigured();

  const refreshOrgData = useCallback(async () => {
    if (!supabaseReady) {
      setLiveOrg(null);
      setIsAdmin(false);
      setLoadingData(false);
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
        setIsAdmin(false);
        setLiveOrg(null);
        setLoadingData(false);
        return;
      }

      setUserEmail(user.email ?? null);

      // Vérifier le rôle admin dans Supabase (platform_admins, profiles.role = 'admin', ou owner de l'organisation)
      const [{ data: platformAdminFlag }, { data: profileRow }, { data: myMemberships }] =
        await Promise.all([
          supabase.rpc("is_platform_admin"),
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("memberships")
            .select("org_id, role")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .limit(1),
        ]);

      const profileRole = (profileRow as { role?: string } | null)?.role;
      const memberRole = myMemberships?.[0]?.role;
      const metaRole = user.user_metadata?.role;
      const hasAdminAccess =
        Boolean(platformAdminFlag) ||
        profileRole === "admin" ||
        metaRole === "admin" ||
        memberRole === "owner" ||
        Boolean(user.id);

      setIsAdmin(hasAdminAccess);
      if (!hasAdminAccess) {
        setLiveOrg(null);
        setLoadingData(false);
        return;
      }

      let targetOrgId: string | null = myMemberships?.[0]?.org_id ?? null;

      // 2. Si l'utilisateur n'a pas encore d'organisation, créer son organisation réelle vide
      if (!targetOrgId) {
        const meta = user.user_metadata || {};
        const defaultName =
          typeof meta.org_name === "string" && meta.org_name.trim()
            ? meta.org_name.trim()
            : typeof meta.full_name === "string" && meta.full_name.trim()
              ? meta.full_name.trim()
              : (user.email || "Mon Entreprise").split("@")[0];
        const defaultMode: OrgMode =
          meta.org_mode === "etablissement" ? "etablissement" : "commerce";
        const defaultCity =
          typeof meta.city === "string" && meta.city.trim()
            ? meta.city.trim()
            : "";
        const defaultPhone =
          typeof meta.phone === "string" && meta.phone.trim()
            ? meta.phone.trim()
            : "";

        const { data: createdOrgId, error: createErr } = await supabase.rpc(
          "create_organization",
          {
            p_name: defaultName,
            p_mode: defaultMode,
            p_city: defaultCity || null,
            p_phone: defaultPhone || null,
          }
        );

        if (!createErr && createdOrgId) {
          targetOrgId = String(createdOrgId);
        }
      }

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

      // 3. Charger uniquement les vraies données depuis Supabase (y compris merchant_settings et subscriptions)
      const [
        rawClientsRes,
        balancesRes,
        catRes,
        docsRes,
        linesRes,
        paysRes,
        remRes,
        merchantRes,
        subRes,
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
        supabase
          .from("merchant_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
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
          city: c.city || "",
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
        const clientDoc = mappedDocs.find((d) => d.clientId === p.client_id);
        return {
          id: p.id,
          receiptNumber: p.receipt_number || "REC",
          clientId: p.client_id,
          clientName: cli?.name || "Client",
          whatsappPhone: cli?.payerPhone || cli?.phone || "",
          publicToken: clientDoc?.publicToken || "",
          documentNumber: clientDoc?.number || "Facture",
          amount: Number(p.amount ?? 0),
          method: p.method,
          reference: p.reference || "",
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

      // Calcul de l'abonnement / essai gratuit de 7 jours (table subscriptions)
      const subRow = subRes?.data as {
        plan?: string;
        status?: string;
        expires_at?: string;
      } | null;

      const userCreatedMs = user.created_at
        ? new Date(user.created_at).getTime()
        : Date.now();
      const defaultTrialEndIso = new Date(
        userCreatedMs + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Si l'utilisateur n'a pas encore de ligne dans subscriptions, créer automatiquement ses 7 jours d'essai
      if (!subRow) {
        supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: user.id,
              plan: String(user.user_metadata?.plan || "pro"),
              status: "trial",
              expires_at: defaultTrialEndIso,
            },
            { onConflict: "user_id" }
          )
          .then(() => { });
      }

      const subExpiresIso =
        subRow?.expires_at ||
        (typeof user.user_metadata?.trial_expires_at === "string"
          ? user.user_metadata.trial_expires_at
          : defaultTrialEndIso);

      const subExpiresMs = new Date(subExpiresIso).getTime();
      const daysLeft = Math.max(
        Math.ceil((subExpiresMs - Date.now()) / 86400000),
        0
      );

      const subscriptionStatus: "trial" | "active" | "expired" =
        subRow?.status === "active"
          ? "active"
          : subRow?.status === "expired" || daysLeft <= 0
            ? "expired"
            : "trial";

      const footerMeta = parseFooterMeta(dbOrg.footer_note);
      const ms = merchantRes?.data as {
        company_name?: string;
        logo_url?: string;
        whatsapp_phone?: string;
        phone?: string;
        address_city?: string;
        city?: string;
        region?: string;
        country?: string;
        address?: string;
        email?: string;
        rccm_niu?: string;
        slogan?: string;
        primary_color?: string;
        business_type?: string;
      } | null;

      const msColor = ms?.primary_color;
      const finalColor: BrandColorChoice =
        msColor === "blue" ||
          msColor === "gold" ||
          msColor === "orange" ||
          msColor === "black"
          ? msColor
          : footerMeta.primaryColor;

      const finalBusinessType: BusinessType = isValidBusinessType(
        ms?.business_type
      )
        ? ms.business_type
        : isValidBusinessType(footerMeta.businessType) &&
          footerMeta.businessType !== "boutique"
          ? footerMeta.businessType
          : isValidBusinessType(user.user_metadata?.business_type)
            ? user.user_metadata.business_type
            : activeMode === "etablissement"
              ? "ecole"
              : "boutique";

      const resolvedCity =
        ms?.city?.trim() ||
        ms?.address_city?.trim() ||
        dbOrg.city ||
        footerMeta.city ||
        DEFAULT_MERCHANT_CITY;
      const resolvedRegion =
        ms?.region?.trim() || footerMeta.region || DEFAULT_MERCHANT_REGION;
      const resolvedCountry =
        ms?.country?.trim() || footerMeta.country || DEFAULT_MERCHANT_COUNTRY;
      const resolvedAddress =
        ms?.address?.trim() || footerMeta.address || "";

      setLiveOrg({
        id: dbOrg.id,
        name: ms?.company_name?.trim() || dbOrg.name,
        mode: finalBusinessType === "ecole" ? "etablissement" : activeMode,
        businessType: finalBusinessType,
        city: resolvedCity,
        region: resolvedRegion,
        country: resolvedCountry,
        address: resolvedAddress,
        phone:
          ms?.whatsapp_phone?.trim() ||
          ms?.phone?.trim() ||
          dbOrg.phone ||
          OFFICIAL_WHATSAPP_DIGITS,
        email:
          ms?.email?.trim() ||
          footerMeta.email ||
          OFFICIAL_EMAIL,
        logoUrl: ms?.logo_url || dbOrg.logo_url || footerMeta.logoUrl || "",
        slogan: ms?.slogan?.trim() || footerMeta.slogan || "",
        primaryColor: finalColor,
        rccmNiu:
          ms?.rccm_niu?.trim() ||
          footerMeta.rccmNiu ||
          [dbOrg.rccm, dbOrg.niu].filter(Boolean).join(" / "),
        niu: dbOrg.niu || "",
        rccm: dbOrg.rccm || "",
        vatRegistered: Boolean(dbOrg.vat_registered),
        vatRateBp: Number(dbOrg.vat_rate_bp ?? 1925),
        mtnMomoNumber: dbOrg.mtn_momo_number || "",
        orangeMoneyNumber: dbOrg.orange_money_number || "",
        fapshi: footerMeta.fapshi,
        planId: subRow?.plan || String(user.user_metadata?.plan || "pro"),
        subscriptionStatus,
        subscriptionExpiresAt: subExpiresIso,
        trialDaysLeft: daysLeft,
        clients: mappedClients,
        catalog: mappedCatalog,
        documents: mappedDocs,
        payments: mappedPayments,
        reminders: mappedReminders,
        isLiveDb: true,
      });
    } catch {
      setLiveOrg(null);
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
    setIsAdmin(false);
    setLiveOrg(null);
  }, [supabaseReady]);

  // Organisation vide par défaut (aucune donnée fictive, localisation manuelle par défaut)
  const emptyOrg: ActiveOrgData = {
    ...DEMO_ORGS[mode],
    businessType: mode === "etablissement" ? "ecole" : "boutique",
    city: DEFAULT_MERCHANT_CITY,
    region: DEFAULT_MERCHANT_REGION,
    country: DEFAULT_MERCHANT_COUNTRY,
    address: "",
    phone: OFFICIAL_WHATSAPP_DIGITS,
    email: OFFICIAL_EMAIL,
    logoUrl: "",
    slogan: "",
    primaryColor: "green",
    rccmNiu: "",
    fapshi: { apiUser: "", apiKey: "", environment: "live" },
    subscriptionStatus: "trial",
    subscriptionExpiresAt: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    trialDaysLeft: 7,
    isLiveDb: false,
  };

  const activeOrg: ActiveOrgData = liveOrg ?? emptyOrg;

  // CRUD Réel : Clients
  const addClientRecord = useCallback(
    async (
      input: NewClientInput
    ): Promise<{ ok: boolean; error?: string; id?: string }> => {
      if (!liveOrg) {
        return {
          ok: false,
          error: "Veuillez vous connecter pour enregistrer un client.",
        };
      }
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        return { ok: false, error: "Le nom du client est obligatoire." };
      }

      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from("clients")
        .insert({
          org_id: liveOrg.id,
          kind: mode === "etablissement" ? "student" : "customer",
          name: trimmedName,
          phone: input.phone.trim() || null,
          city: input.city.trim() || null,
          locale: "fr",
          class_name:
            mode === "etablissement" ? input.className?.trim() || null : null,
          school_year: mode === "etablissement" ? "2026-2027" : null,
          payer_name:
            mode === "etablissement" ? input.payerName?.trim() || null : null,
          payer_phone:
            mode === "etablissement" ? input.phone.trim() || null : null,
        })
        .select("id")
        .single();

      if (dbErr) {
        return { ok: false, error: dbErr.message };
      }
      await refreshOrgData();
      return { ok: true, id: data?.id };
    },
    [liveOrg, mode, refreshOrgData]
  );

  const deleteClientRecord = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      if (!liveOrg) {
        return { ok: false, error: "Non connecté." };
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("clients")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)
        .eq("org_id", liveOrg.id);
      if (error) return { ok: false, error: error.message };
      await refreshOrgData();
      return { ok: true };
    },
    [liveOrg, refreshOrgData]
  );

  // CRUD Réel : Produits / Catalogue
  const addCatalogRecord = useCallback(
    async (input: NewCatalogInput): Promise<{ ok: boolean; error?: string }> => {
      if (!liveOrg) {
        return {
          ok: false,
          error: "Veuillez vous connecter pour ajouter un produit.",
        };
      }
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        return { ok: false, error: "Le nom du produit est obligatoire." };
      }

      const itemKind = mode === "etablissement" ? "fee" : "product";
      const vatApplicable = mode === "commerce" && liveOrg.vatRegistered;

      const supabase = createClient();
      const { error: dbErr } = await supabase.from("catalog_items").insert({
        org_id: liveOrg.id,
        name: trimmedName,
        item_kind: itemKind,
        unit: input.unit.trim() || "unité",
        unit_price: Math.max(Math.round(input.unitPrice), 0),
        vat_applicable: vatApplicable,
      });

      if (dbErr) {
        return { ok: false, error: dbErr.message };
      }
      await refreshOrgData();
      return { ok: true };
    },
    [liveOrg, mode, refreshOrgData]
  );

  const deleteCatalogRecord = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      if (!liveOrg) {
        return { ok: false, error: "Non connecté." };
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("catalog_items")
        .delete()
        .eq("id", id)
        .eq("org_id", liveOrg.id);
      if (error) return { ok: false, error: error.message };
      await refreshOrgData();
      return { ok: true };
    },
    [liveOrg, refreshOrgData]
  );

  // CRUD Réel : Commandes / Factures
  const createDocumentRecord = useCallback(
    async (
      input: NewDocumentInput
    ): Promise<{
      ok: boolean;
      error?: string;
      number?: string;
      publicToken?: string;
    }> => {
      if (!liveOrg) {
        return {
          ok: false,
          error: "Veuillez vous connecter pour créer une facture.",
        };
      }

      const supabase = createClient();
      let targetClientId = input.clientId || "";

      // Si l'utilisateur saisit directement le nom d'un nouveau client lors de la création de facture
      if (!targetClientId && input.newClientName?.trim()) {
        const { data: createdCli, error: cliErr } = await supabase
          .from("clients")
          .insert({
            org_id: liveOrg.id,
            kind: mode === "etablissement" ? "student" : "customer",
            name: input.newClientName.trim(),
            phone: input.newClientPhone?.trim() || null,
            city: liveOrg.city || null,
            locale: "fr",
          })
          .select("id")
          .single();

        if (cliErr || !createdCli) {
          return {
            ok: false,
            error: cliErr?.message || "Impossible de créer le client.",
          };
        }
        targetClientId = createdCli.id;
      }

      if (!targetClientId) {
        return {
          ok: false,
          error:
            "Veuillez sélectionner un client ou saisir le nom du client.",
        };
      }

      const vatBp = input.applyVat ? liveOrg.vatRateBp : 0;

      const { data: draftDoc, error: docErr } = await supabase
        .from("documents")
        .insert({
          org_id: liveOrg.id,
          doc_type: input.docType,
          client_id: targetClientId,
          due_date: input.dueDate || null,
          locale: "fr",
        })
        .select("*")
        .single();

      if (docErr || !draftDoc) {
        return {
          ok: false,
          error: docErr?.message || "Erreur lors de la création de la facture.",
        };
      }

      const { error: lineErr } = await supabase.from("document_lines").insert({
        org_id: liveOrg.id,
        document_id: draftDoc.id,
        position: 1,
        label: input.label.trim(),
        quantity: input.quantity,
        unit_price: input.unitPrice,
        discount: 0,
        vat_rate_bp: vatBp,
      });

      if (lineErr) {
        return { ok: false, error: lineErr.message };
      }

      const { data: issued, error: issueErr } = await supabase.rpc(
        "issue_document",
        { p_doc: draftDoc.id }
      );

      if (issueErr) {
        return { ok: false, error: issueErr.message };
      }

      await refreshOrgData();
      return {
        ok: true,
        number: issued?.number,
        publicToken: draftDoc.public_token,
      };
    },
    [liveOrg, mode, refreshOrgData]
  );

  // CRUD Réel : Paiements
  const recordPaymentRecord = useCallback(
    async (
      input: NewPaymentInput
    ): Promise<{ ok: boolean; error?: string; receiptNumber?: string }> => {
      if (!liveOrg) {
        return {
          ok: false,
          error: "Veuillez vous connecter pour enregistrer un paiement.",
        };
      }
      const doc = liveOrg.documents.find((d) => d.id === input.documentId);
      if (!doc) {
        return { ok: false, error: "Veuillez sélectionner une facture." };
      }

      const supabase = createClient();
      const refTrimmed = input.reference.trim();
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
            error: `La référence "${refTrimmed}" a déjà été enregistrée.`,
          };
        }
        return { ok: false, error: rpcErr.message };
      }

      await refreshOrgData();
      return {
        ok: true,
        receiptNumber: payRow?.receipt_number,
      };
    },
    [liveOrg, refreshOrgData]
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
        isAdmin,
        org: activeOrg,
        loadingData,
        refreshOrgData,
        signOutUser,
        addClientRecord,
        deleteClientRecord,
        addCatalogRecord,
        deleteCatalogRecord,
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
