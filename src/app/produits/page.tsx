"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { AgricultureAiSection } from "@/components/AgricultureAiSection";
import { useAppState } from "@/components/AppContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  AFRICA_CITIES,
  AFRICA_SERVICE_CATEGORIES,
  AGRICULTURE_MARKETS,
  AGRICULTURE_SUBCATEGORIES,
  AGRICULTURE_UNITS,
  DEFAULT_MERCHANT_CITY,
  formatAmountNumber,
  formatCFA,
  OFFICIAL_SITE_URL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
} from "@/lib/format";

const SUBSCRIPTION_BLOCK_MSG =
  "Payez votre abonnement pour publier. Orange Money : 640 633 034 / MTN MoMo : 651 465 708 au nom de MAHAMAT BOUBA. Aide WhatsApp : +235 66 26 85 03";

interface SocialProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  city: string;
  shopName: string;
  shopLogoUrl: string;
  whatsappPhone: string;
  imageUrl: string;
  subCategory: string;
  agriType: string;
  unit: string;
  stockQty: number;
  soldQty: number;
  marketName: string;
  harvestDate: string;
  whatsappCount: number;
  tiktokCount: number;
  facebookCount: number;
  lastPublishedAt: string | null;
  createdAt: string;
}

type PublishChannel = "whatsapp" | "tiktok" | "facebook";

interface PublishFeedback {
  productId: string;
  channel: PublishChannel;
  message: string;
  imageUrl?: string;
  productName?: string;
}

function formatPublishDate(iso: string | null): string {
  if (!iso) return "Jamais publié";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Jamais publié";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : OFFICIAL_WHATSAPP_DIGITS;
}

async function downloadProductPhoto(imageUrl: string, productName: string) {
  const safeName =
    productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "") || "produit";
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${safeName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${safeName}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

async function copyTextSafe(text: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // ignore clipboard permission errors
  }
}

export default function PublishProductsPage() {
  const { org } = useAppState();
  const isSubscriptionPaid = org.subscriptionStatus === "active";

  const [products, setProducts] = useState<SocialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Formulaire Page /produits : Ajouter un Service / Produit
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [cityChoice, setCityChoice] = useState<string>(DEFAULT_MERCHANT_CITY);
  const [customCity, setCustomCity] = useState("");
  const [category, setCategory] = useState<string>(
    AFRICA_SERVICE_CATEGORIES[0].id
  );
  // Champs spéciaux Agriculture & Élevage
  const [subCategory, setSubCategory] = useState<string>(
    AGRICULTURE_SUBCATEGORIES[0].id
  );
  const [agriType, setAgriType] = useState<string>(
    AGRICULTURE_SUBCATEGORIES[0].types[0]
  );
  const [unit, setUnit] = useState<string>(AGRICULTURE_UNITS[0]);
  const [stockQty, setStockQty] = useState<string>("20");
  const [marketChoice, setMarketChoice] = useState<string>(
    AGRICULTURE_MARKETS[0]
  );
  const [customMarket, setCustomMarket] = useState<string>("");
  const [harvestDate, setHarvestDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Règle d'abonnement & feedback de publication
  const [blockedAlert, setBlockedAlert] = useState<string | null>(null);
  const [publishFeedback, setPublishFeedback] =
    useState<PublishFeedback | null>(null);

  // Pré-remplir Ville et Catégorie depuis le profil du commerçant
  useEffect(() => {
    const orgCity = (org.city || "").split(",")[0].trim();
    if (orgCity) {
      if ((AFRICA_CITIES as readonly string[]).includes(orgCity)) {
        setCityChoice(orgCity);
      } else {
        setCityChoice("Autre");
        setCustomCity(orgCity);
      }
    }

    const matchedCat = AFRICA_SERVICE_CATEGORIES.find(
      (c) => c.businessType === org.businessType
    );
    if (matchedCat) {
      setCategory(matchedCat.id);
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        const metaCat = data.user?.user_metadata?.service_category;
        if (
          typeof metaCat === "string" &&
          AFRICA_SERVICE_CATEGORIES.some((c) => c.id === metaCat)
        ) {
          setCategory(metaCat);
        }
      });
    }
  }, [org.city, org.businessType]);

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured() || !org.isLiveDb || !org.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("social_products")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: SocialProduct[] = data.map((row) => ({
          id: String(row.id),
          name: String(row.name ?? ""),
          price: Number(row.price ?? 0),
          description: String(row.description ?? ""),
          category: String(row.category ?? "Boutique & Commerce"),
          city: String(row.city || org.city || DEFAULT_MERCHANT_CITY),
          shopName: String(row.shop_name || org.name || "Ma Boutique"),
          shopLogoUrl: String(row.shop_logo_url || org.logoUrl || ""),
          whatsappPhone: String(
            row.whatsapp_phone || org.phone || OFFICIAL_WHATSAPP_DISPLAY
          ),
          imageUrl: String(row.image_url ?? ""),
          subCategory: String(row.sub_category ?? ""),
          agriType: String(row.agri_type ?? ""),
          unit: String(row.unit ?? ""),
          stockQty: Number(row.stock_qty ?? 0),
          soldQty: Number(row.sold_qty ?? 0),
          marketName: String(row.market_name ?? ""),
          harvestDate: String(row.harvest_date ?? ""),
          whatsappCount: Number(row.whatsapp_count ?? 0),
          tiktokCount: Number(row.tiktok_count ?? 0),
          facebookCount: Number(row.facebook_count ?? 0),
          lastPublishedAt: row.last_published_at
            ? String(row.last_published_at)
            : null,
          createdAt: String(row.created_at ?? ""),
        }));
        setProducts(mapped);
        if (mapped.length === 0) {
          setShowForm(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [org.id, org.isLiveDb, org.city, org.name, org.phone]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Veuillez choisir une image valide (JPG, PNG, WEBP).");
      return;
    }
    setFormError(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!photoFile) {
      setFormError("La photo du produit ou service est obligatoire.");
      return;
    }
    const isAgri = category === "Agriculture & Élevage";
    const cleanName = name.trim() || (isAgri ? agriType : "");
    const numericPrice = Number(price);
    const resolvedCity =
      cityChoice === "Autre"
        ? customCity.trim() || DEFAULT_MERCHANT_CITY
        : cityChoice;
    const resolvedMarket = isAgri
      ? marketChoice === "Autre"
        ? customMarket.trim() || `Marché de ${resolvedCity}`
        : marketChoice
      : "";
    const numericStock = isAgri ? Math.max(0, Number(stockQty) || 0) : 0;

    if (!cleanName) {
      setFormError("Veuillez saisir le nom du produit ou service.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError("Veuillez saisir un prix valide en XAF / FCFA.");
      return;
    }
    if (!isSupabaseConfigured() || !org.isLiveDb) {
      setFormError("Veuillez vous connecter pour enregistrer un produit.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setFormError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${org.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      let publicImageUrl = "";
      const { error: upErr } = await supabase.storage
        .from("products")
        .upload(filePath, photoFile, { upsert: true });

      if (!upErr) {
        const { data: pub } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);
        publicImageUrl = pub.publicUrl;
      } else {
        const fallbackPath = `products/${filePath}`;
        const { error: fbErr } = await supabase.storage
          .from("logos")
          .upload(fallbackPath, photoFile, { upsert: true });
        if (fbErr) {
          setFormError(
            "Impossible d'envoyer la photo. Vérifiez la migration SQL Supabase."
          );
          return;
        }
        const { data: pub } = supabase.storage
          .from("logos")
          .getPublicUrl(fallbackPath);
        publicImageUrl = pub.publicUrl;
      }

      const shopName = org.name || "Ma Boutique";
      const merchantWa = org.phone || OFFICIAL_WHATSAPP_DISPLAY;

      let { data: inserted, error: insErr } = await supabase
        .from("social_products")
        .insert({
          org_id: org.id,
          user_id: user.id,
          name: cleanName,
          price: Math.round(numericPrice),
          description: description.trim(),
          category,
          city: resolvedCity,
          shop_name: shopName,
          shop_logo_url: org.logoUrl || "",
          whatsapp_phone: merchantWa,
          image_url: publicImageUrl,
          sub_category: isAgri ? subCategory : "",
          agri_type: isAgri ? agriType : "",
          unit: isAgri ? unit : "",
          stock_qty: numericStock,
          sold_qty: 0,
          market_name: resolvedMarket,
          harvest_date: isAgri ? harvestDate : "",
        })
        .select("*")
        .single();

      if (insErr) {
        const fb = await supabase
          .from("social_products")
          .insert({
            org_id: org.id,
            user_id: user.id,
            name: cleanName,
            price: Math.round(numericPrice),
            description: description.trim(),
            category,
            city: resolvedCity,
            shop_name: shopName,
            shop_logo_url: org.logoUrl || "",
            whatsapp_phone: merchantWa,
            image_url: publicImageUrl,
          })
          .select("*")
          .single();
        inserted = fb.data;
        insErr = fb.error;
      }

      if (insErr) {
        setFormError(insErr.message);
        return;
      }

      if (inserted) {
        setProducts((prev) => [
          {
            id: String(inserted.id),
            name: String(inserted.name),
            price: Number(inserted.price),
            description: String(inserted.description ?? ""),
            category: String(inserted.category ?? category),
            city: String(inserted.city ?? resolvedCity),
            shopName: String(inserted.shop_name ?? shopName),
            shopLogoUrl: String(inserted.shop_logo_url ?? org.logoUrl ?? ""),
            whatsappPhone: String(inserted.whatsapp_phone ?? merchantWa),
            imageUrl: String(inserted.image_url),
            subCategory: String(inserted.sub_category ?? (isAgri ? subCategory : "")),
            agriType: String(inserted.agri_type ?? (isAgri ? agriType : "")),
            unit: String(inserted.unit ?? (isAgri ? unit : "")),
            stockQty: Number(inserted.stock_qty ?? numericStock),
            soldQty: Number(inserted.sold_qty ?? 0),
            marketName: String(inserted.market_name ?? resolvedMarket),
            harvestDate: String(inserted.harvest_date ?? (isAgri ? harvestDate : "")),
            whatsappCount: 0,
            tiktokCount: 0,
            facebookCount: 0,
            lastPublishedAt: null,
            createdAt: String(inserted.created_at),
          },
          ...prev,
        ]);
      }

      setName("");
      setPrice("");
      setDescription("");
      setPhotoFile(null);
      setPhotoPreview("");
      setShowForm(false);
      setFormSuccess(
        "✅ Produit / Service enregistré ! Il est maintenant visible sur /decouvrir et prêt à être publié en 1 clic."
      );
    } finally {
      setSaving(false);
    }
  }

  function buildSalesText(product: SocialProduct): string {
    const city = product.city || org.city || DEFAULT_MERCHANT_CITY;
    const shopName = product.shopName || org.name || "Ma Boutique";
    const formattedPrice = new Intl.NumberFormat("fr-FR").format(product.price);
    const desc = product.description?.trim()
      ? product.description.trim()
      : `${product.category} — Disponible dès maintenant !`;
    const merchantPhone =
      product.whatsappPhone || org.phone || OFFICIAL_WHATSAPP_DISPLAY;

    return `🔥 NOUVEAU à ${city} !
${shopName} - ${product.category}
${product.name} - ${formattedPrice} XAF seulement !
${desc}
📍 ${city} - Commandez vite sur WhatsApp : ${merchantPhone}
#Ndjamenan #Garoua #Douala #Ngaoundere #Cameroun #Tchad #Boutique`;
  }

  async function recordPublish(product: SocialProduct, channel: PublishChannel) {
    const nowIso = new Date().toISOString();
    const nextWa = product.whatsappCount + (channel === "whatsapp" ? 1 : 0);
    const nextTk = product.tiktokCount + (channel === "tiktok" ? 1 : 0);
    const nextFb = product.facebookCount + (channel === "facebook" ? 1 : 0);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              whatsappCount: nextWa,
              tiktokCount: nextTk,
              facebookCount: nextFb,
              lastPublishedAt: nowIso,
            }
          : p
      )
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from("social_products")
        .update({
          whatsapp_count: nextWa,
          tiktok_count: nextTk,
          facebook_count: nextFb,
          last_published_at: nowIso,
        })
        .eq("id", product.id);
    }
  }

  async function handlePublish(
    product: SocialProduct,
    channel: PublishChannel
  ) {
    setBlockedAlert(null);

    if (!isSubscriptionPaid) {
      setBlockedAlert(SUBSCRIPTION_BLOCK_MSG);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const salesText = buildSalesText(product);
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : OFFICIAL_SITE_URL;
    const productLink = `${origin}/decouvrir#produit-${product.id}`;
    const targetWaDigits = formatPhoneDigits(
      product.whatsappPhone || org.phone || OFFICIAL_WHATSAPP_DIGITS
    );

    if (channel === "whatsapp") {
      await copyTextSafe(salesText);
      const waUrl = `https://wa.me/${targetWaDigits}?text=${encodeURIComponent(
        salesText
      )}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setPublishFeedback({
        productId: product.id,
        channel: "whatsapp",
        message:
          "1. Télécharge ta photo, 2. Ouvre ton Statut WhatsApp, 3. Colle le texte",
        imageUrl: product.imageUrl,
        productName: product.name,
      });
    } else if (channel === "tiktok") {
      await downloadProductPhoto(product.imageUrl, product.name);
      await copyTextSafe(salesText);
      window.open(
        "https://www.tiktok.com/upload",
        "_blank",
        "noopener,noreferrer"
      );
      setPublishFeedback({
        productId: product.id,
        channel: "tiktok",
        message: "Photo téléchargée + Texte copié ! Colle-le dans TikTok",
      });
    } else {
      await copyTextSafe(salesText);
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        productLink
      )}`;
      window.open(fbUrl, "_blank", "noopener,noreferrer");
      setPublishFeedback({
        productId: product.id,
        channel: "facebook",
        message: "Texte copié, colle-le dans ta publication Facebook",
      });
    }

    await recordPublish(product, channel);
  }

  return (
    <WorkspaceShell>
      <div className="min-h-screen bg-white rounded-3xl border border-slate-200 p-4 sm:p-8 space-y-6 shadow-sm">
        {/* EN-TÊTE MOBILE-FIRST */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyAvatar logoUrl={org.logoUrl} name={org.name} size={42} />
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-emerald-700 truncate">
                {org.name || "Ma Boutique"}
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-[#0B1F3A]">
                📣 Publier mes Produits / Services en 1 clic
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/decouvrir"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-blue-50 text-[#0B1F3A] border border-blue-200 hover:bg-blue-100"
            >
              🌍 Voir la page publique /decouvrir →
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormError(null);
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-base font-black shadow-md transition-colors text-center"
          >
            {showForm
              ? "✖ Fermer le formulaire"
              : "➕ Ajouter un Service / Produit"}
          </button>
        </div>

        {/* RÈGLE ABONNEMENT : UNE SEULE CARTE SIMPLE (sans répétition ni bouton WhatsApp en double) */}
        {!isSubscriptionPaid ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-3">
            <div className="text-sm sm:text-base font-black text-[#0B1F3A]">
              🔒 Publication bloquée — Payez votre abonnement pour publier
            </div>
            <p className="text-xs sm:text-sm font-bold text-amber-950 leading-relaxed">
              {SUBSCRIPTION_BLOCK_MSG}
            </p>
            {blockedAlert ? (
              <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs sm:text-sm font-extrabold">
                ⚠️ {blockedAlert}
              </div>
            ) : null}
            <div>
              <Link
                href="/app/abonnement"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm"
              >
                💳 Payer mon abonnement
              </Link>
            </div>
          </div>
        ) : null}

        {formSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-extrabold">
            {formSuccess}
          </div>
        ) : null}

        {/* 6 CARTES IA AGRICULTURE (uniquement dans la vue Agriculture existante) */}
        {org.businessType === "agriculture" ||
        category === "Agriculture & Élevage" ||
        products.some((p) => p.category === "Agriculture & Élevage") ? (
          <AgricultureAiSection
            isSubscriptionPaid={isSubscriptionPaid}
            onAddTreatmentProduct={(title, suggestedPrice, desc) => {
              setCategory("Agriculture & Élevage");
              setSubCategory("Intrants");
              setAgriType("Pesticides");
              setName(title);
              setPrice(String(suggestedPrice));
              setDescription(desc);
              setShowForm(true);
            }}
            onPutHarvestOnSale={(crop, bags, pricePerBag) => {
              setCategory("Agriculture & Élevage");
              setSubCategory("Cultures");
              setAgriType(crop);
              setName(crop);
              setUnit("Sac 50kg");
              setStockQty(String(bags));
              setPrice(String(pricePerBag));
              setShowForm(true);
            }}
          />
        ) : null}

        {/* ÉTAPE 2 : FORMULAIRE AJOUTER UN SERVICE / PRODUIT */}
        {showForm ? (
          <form
            onSubmit={handleSaveProduct}
            className="p-5 sm:p-7 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-5"
          >
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F3A]">
              📸 Ajouter un Service / Produit
            </h2>

            {/* Photo obligatoire */}
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-800">
                1. Photo (obligatoire) *
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="cursor-pointer px-5 py-4 rounded-2xl bg-white border-2 border-dashed border-slate-400 hover:border-emerald-600 text-sm font-extrabold text-[#0B1F3A] text-center w-full sm:w-auto">
                  📷 Choisir une photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="w-28 h-28 object-cover rounded-2xl border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <span className="text-xs text-slate-500">
                    Photo depuis votre téléphone ou ordinateur (JPG/PNG)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1.5">
                  2. Nom du produit / service *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Poulet braisé, Moto-taxi, Robe soirée..."
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-base font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1.5">
                  3. Prix en XAF / FCFA *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-base font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-1.5">
                4. Description courte
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Livraison rapide partout en ville, qualité garantie..."
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-extrabold text-slate-800">
                  5. Ville (pré-remplie) *
                </label>
                <select
                  value={cityChoice}
                  onChange={(e) => setCityChoice(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-[#0B1F3A]"
                >
                  {AFRICA_CITIES.map((v) => (
                    <option key={v} value={v}>
                      📍 {v}
                    </option>
                  ))}
                </select>
                {cityChoice === "Autre" ? (
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Saisissez la ville..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm"
                  />
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-2">
                  6. Catégorie (pré-remplie) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-[#0B1F3A]"
                >
                  {AFRICA_SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formError ? (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">
                ⚠️ {formError}
              </div>
            ) : null}

            {/* Champs spéciaux Agriculture & Élevage */}
            {category === "Agriculture & Élevage" ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-4">
                <div className="text-sm sm:text-base font-black text-emerald-950">
                  🌾 Détails Récolte / Élevage (Service Agriculture Pro)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-extrabold text-emerald-900 mb-1.5">
                      Sous-catégorie *
                    </label>
                    <select
                      value={subCategory}
                      onChange={(e) => {
                        const nextSub = e.target.value;
                        setSubCategory(nextSub);
                        const found = AGRICULTURE_SUBCATEGORIES.find(
                          (s) => s.id === nextSub
                        );
                        if (found && found.types.length > 0) {
                          setAgriType(found.types[0]);
                          if (!name.trim()) setName(found.types[0]);
                        }
                      }}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-bold text-[#0B1F3A]"
                    >
                      {AGRICULTURE_SUBCATEGORIES.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.emoji} {sub.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-emerald-900 mb-1.5">
                      Produit / Type *
                    </label>
                    <select
                      value={agriType}
                      onChange={(e) => {
                        setAgriType(e.target.value);
                        setName(e.target.value);
                      }}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-bold text-[#0B1F3A]"
                    >
                      {(
                        AGRICULTURE_SUBCATEGORIES.find(
                          (s) => s.id === subCategory
                        )?.types || []
                      ).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-emerald-900 mb-1.5">
                      Unité spéciale *
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-bold text-[#0B1F3A]"
                    >
                      {AGRICULTURE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-emerald-900 mb-1.5">
                      Quantité en stock ({unit}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                      placeholder="Ex: 20"
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-emerald-900 mb-1.5">
                      Marché *
                    </label>
                    <select
                      value={marketChoice}
                      onChange={(e) => setMarketChoice(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-bold text-[#0B1F3A]"
                    >
                      {AGRICULTURE_MARKETS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    {marketChoice === "Autre" ? (
                      <input
                        type="text"
                        value={customMarket}
                        onChange={(e) => setCustomMarket(e.target.value)}
                        placeholder="Ex: Marché de Figuil"
                        className="mt-2 w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-sm"
                      />
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-emerald-900 mb-1.5">
                      Date de récolte
                    </label>
                    <input
                      type="date"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base sm:text-lg font-black shadow-md transition-colors disabled:opacity-50"
            >
              {saving ? "Enregistrement en cours..." : "💾 Enregistrer"}
            </button>
          </form>
        ) : null}

        {/* TABLEAU DE BORD AGRICOLE */}
        {(() => {
          const agriProducts = products.filter(
            (p) => p.category === "Agriculture & Élevage"
          );
          if (agriProducts.length === 0) return null;
          const totalStock = agriProducts.reduce(
            (sum, p) => sum + Math.max(0, p.stockQty),
            0
          );
          const totalSold = agriProducts.reduce(
            (sum, p) => sum + Math.max(0, p.soldQty),
            0
          );
          const totalLeft = Math.max(0, totalStock - totalSold);
          const totalRevenue = agriProducts.reduce(
            (sum, p) => sum + Math.max(0, p.soldQty) * p.price,
            0
          );
          return (
            <section className="p-5 rounded-3xl bg-emerald-950 text-white shadow-md space-y-3">
              <div className="text-sm sm:text-base font-black flex items-center gap-2">
                <span>🌾</span>
                <span>Tableau de bord Agricole</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-2xl bg-white/10">
                  <div className="text-emerald-200 font-bold">Stock total</div>
                  <div className="text-lg sm:text-xl font-black mt-0.5">
                    {totalStock} unités
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/10">
                  <div className="text-emerald-200 font-bold">Vendu</div>
                  <div className="text-lg sm:text-xl font-black mt-0.5">
                    {totalSold} unités
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/10">
                  <div className="text-emerald-200 font-bold">Reste</div>
                  <div className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
                    {totalLeft} unités
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/10">
                  <div className="text-emerald-200 font-bold">Recette totale</div>
                  <div className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">
                    {formatCFA(totalRevenue)}
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* LISTE EN CARTES + BOUTONS PUBLIER EN 1 CLIC + HISTORIQUE */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Chargement de vos produits et services...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="text-3xl">📦</div>
            <div className="text-base font-extrabold text-[#0B1F3A]">
              Aucun produit ou service enregistré
            </div>
            <p className="text-sm text-slate-600">
              Ajoutez votre premier produit ou service ci-dessus pour le
              publier en 1 clic.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => {
              const totalPublishes =
                product.whatsappCount +
                product.tiktokCount +
                product.facebookCount;
              const activeFeedback =
                publishFeedback?.productId === product.id
                  ? publishFeedback
                  : null;

              return (
                <div
                  key={product.id}
                  id={`produit-${product.id}`}
                  className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-60 w-full bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-[#0B1F3A] text-xs font-black shadow-sm">
                        {product.category}
                      </span>
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#0B1F3A]/90 text-white text-xs font-black shadow-sm">
                        📍 {product.city}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-black text-[#0B1F3A] leading-snug">
                          {product.name}
                        </h3>
                        <div className="text-xl font-black text-emerald-700 shrink-0">
                          {formatCFA(product.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <CompanyAvatar
                          logoUrl={product.shopLogoUrl || org.logoUrl}
                          name={product.shopName}
                          size={24}
                        />
                        <span className="truncate">
                          {product.shopName} · 📍 {product.city}
                        </span>
                      </div>
                      {product.description ? (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {product.description}
                        </p>
                      ) : null}

                      {product.category === "Agriculture & Élevage" ? (
                        <div className="mt-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                          <div className="font-extrabold text-emerald-950">
                            🌾 {product.agriType || product.name} ·{" "}
                            {Math.max(0, product.stockQty - product.soldQty)}{" "}
                            {product.unit || "unités"} disponibles ·{" "}
                            {formatCFA(product.price)} / {product.unit || "unité"}
                          </div>
                          <div className="text-emerald-800 font-semibold">
                            🏪 {product.marketName || `Marché de ${product.city}`}
                            {product.harvestDate
                              ? ` · 📅 Récolté le ${new Date(
                                  product.harvestDate
                                ).toLocaleDateString("fr-FR")}`
                              : ""}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              disabled={
                                sellingId === product.id ||
                                product.stockQty - product.soldQty <= 0
                              }
                              onClick={async () => {
                                setSellingId(product.id);
                                try {
                                  const nextSold = product.soldQty + 1;
                                  const supabase = createClient();
                                  await supabase
                                    .from("social_products")
                                    .update({ sold_qty: nextSold })
                                    .eq("id", product.id);
                                  setProducts((prev) =>
                                    prev.map((p) =>
                                      p.id === product.id
                                        ? { ...p, soldQty: nextSold }
                                        : p
                                    )
                                  );
                                } finally {
                                  setSellingId(null);
                                }
                              }}
                              className="px-3 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white font-extrabold disabled:opacity-40"
                            >
                              {sellingId === product.id
                                ? "Mise à jour..."
                                : "✅ Enregistrer 1 vente (-1 stock)"}
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!isSubscriptionPaid) {
                                  setBlockedAlert(SUBSCRIPTION_BLOCK_MSG);
                                  return;
                                }
                                const remaining = Math.max(
                                  0,
                                  product.stockQty - product.soldQty
                                );
                                const unitLabel = product.unit || "unités";
                                const harvestText = `Nouvelle récolte à ${product.city} ! ${product.agriType || product.name} frais, ${remaining} ${unitLabel} à ${formatAmountNumber(product.price)} XAF / ${unitLabel}. Commande par WhatsApp : ${product.whatsappPhone} - ${product.shopName}`;
                                await copyTextSafe(harvestText);
                                setPublishFeedback({
                                  productId: product.id,
                                  channel: "whatsapp",
                                  message: harvestText,
                                  imageUrl: product.imageUrl,
                                  productName: product.name,
                                });
                                window.open(
                                  `https://wa.me/?text=${encodeURIComponent(harvestText)}`,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
                            >
                              🌾 Publier ma récolte
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* ÉTAPE 3 : 3 GROS BOUTONS PUBLIER EN 1 CLIC */}
                  <div className="p-5 pt-3 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="text-xs font-black uppercase tracking-wider text-[#0B1F3A]">
                      🚀 PUBLIER EN 1 CLIC :
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handlePublish(product, "whatsapp")}
                        className={`w-full py-4 px-5 rounded-2xl text-base sm:text-lg font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                          isSubscriptionPaid
                            ? "bg-[#25D366] hover:bg-[#1fb857] text-white"
                            : "bg-slate-300 text-slate-600 cursor-not-allowed"
                        }`}
                      >
                        <span>💬</span>
                        <span>Statut WhatsApp</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handlePublish(product, "tiktok")}
                          className={`w-full py-4 px-4 rounded-2xl text-base font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                            isSubscriptionPaid
                              ? "bg-black hover:bg-neutral-800 text-white"
                              : "bg-slate-300 text-slate-600 cursor-not-allowed"
                          }`}
                        >
                          <span>🎵</span>
                          <span>TikTok</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePublish(product, "facebook")}
                          className={`w-full py-4 px-4 rounded-2xl text-base font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                            isSubscriptionPaid
                              ? "bg-[#1877F2] hover:bg-[#1464d0] text-white"
                              : "bg-slate-300 text-slate-600 cursor-not-allowed"
                          }`}
                        >
                          <span>📘</span>
                          <span>Facebook</span>
                        </button>
                      </div>
                    </div>

                    {activeFeedback ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2">
                        <div className="text-xs sm:text-sm font-black text-emerald-900">
                          ✅ {activeFeedback.message}
                        </div>
                        {activeFeedback.channel === "whatsapp" &&
                        activeFeedback.imageUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              downloadProductPhoto(
                                activeFeedback.imageUrl!,
                                activeFeedback.productName || "produit"
                              )
                            }
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black"
                          >
                            📥 Télécharger la photo pour Statut
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {/* HISTORIQUE */}
                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800">
                        📊 Publié {totalPublishes} fois sur WhatsApp / TikTok /
                        Facebook - Dernière publication :{" "}
                        {formatPublishDate(product.lastPublishedAt)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        WhatsApp : {product.whatsappCount} · TikTok :{" "}
                        {product.tiktokCount} · Facebook :{" "}
                        {product.facebookCount}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
