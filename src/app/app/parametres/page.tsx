"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import {
  BRAND_COLOR_PALETTE,
  BUSINESS_SERVICES,
  OFFICIAL_WHATSAPP_DIGITS,
  type BrandColorChoice,
  type BusinessType,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

export default function MerchantSettingsFormPage() {
  const { org, refreshOrgData } = useAppState();

  // Champs demandés pour 'merchant_settings'
  const [companyName, setCompanyName] = useState(org.name);
  const [businessType, setBusinessType] = useState<BusinessType>(
    org.businessType || "boutique"
  );
  const [logoUrl, setLogoUrl] = useState(org.logoUrl);
  const [whatsappPhone, setWhatsappPhone] = useState(
    org.phone || OFFICIAL_WHATSAPP_DIGITS
  );
  const [addressCity, setAddressCity] = useState(org.city);
  const [email, setEmail] = useState(org.email);
  const [rccmNiu, setRccmNiu] = useState(org.rccmNiu);
  const [slogan, setSlogan] = useState(org.slogan);
  const [primaryColor, setPrimaryColor] = useState<BrandColorChoice>(
    org.primaryColor || "green"
  );

  // Numéros Mobile Money & Clés API Fapshi
  const [mtnMomo, setMtnMomo] = useState(org.mtnMomoNumber);
  const [orangeMoney, setOrangeMoney] = useState(org.orangeMoneyNumber);
  const [fapshiApiUser, setFapshiApiUser] = useState(org.fapshi.apiUser);
  const [fapshiApiKey, setFapshiApiKey] = useState(org.fapshi.apiKey);
  const [fapshiEnv, setFapshiEnv] = useState<"sandbox" | "live">(
    org.fapshi.environment
  );

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setCompanyName(org.name);
    setBusinessType(org.businessType || "boutique");
    setLogoUrl(org.logoUrl);
    setWhatsappPhone(org.phone || OFFICIAL_WHATSAPP_DIGITS);
    setAddressCity(org.city);
    setEmail(org.email);
    setRccmNiu(org.rccmNiu);
    setSlogan(org.slogan);
    setPrimaryColor(org.primaryColor || "green");
    setMtnMomo(org.mtnMomoNumber);
    setOrangeMoney(org.orangeMoneyNumber);
    setFapshiApiUser(org.fapshi.apiUser);
    setFapshiApiKey(org.fapshi.apiKey);
    setFapshiEnv(org.fapshi.environment);
  }, [org]);

  // Upload du logo PNG/JPG vers Supabase Storage bucket 'logos' + aperçu immédiat
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setUploadingLogo(true);

    // Préparer aussi un Data URL léger en secours au cas où le bucket 'logos' n'est pas encore créé
    const readAsDataUrl = (): Promise<string> =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${org.id || "merchant"}/logo-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "image/png",
        });

      if (!upErr) {
        const { data: pubData } = supabase.storage
          .from("logos")
          .getPublicUrl(filePath);
        if (pubData?.publicUrl) {
          setLogoUrl(pubData.publicUrl);
          return;
        }
      }

      // Fallback automatique en Data URL si le bucket 'logos' n'a pas encore été exécuté dans SQL Editor
      const dataUrl = await readAsDataUrl();
      if (dataUrl) {
        setLogoUrl(dataUrl);
      } else if (upErr) {
        setErrorMsg(`Upload logo : ${upErr.message}`);
      }
    } catch (err) {
      const dataUrl = await readAsDataUrl();
      if (dataUrl) {
        setLogoUrl(dataUrl);
      } else {
        setErrorMsg(
          err instanceof Error ? err.message : "Erreur lors de l'upload du logo"
        );
      }
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSaved(false);

    if (!org.isLiveDb) {
      setErrorMsg(
        "Vous devez être connecté en tant qu'administrateur pour enregistrer vos paramètres."
      );
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Session administrateur introuvable.");
      }

      const cleanPhone = whatsappPhone.trim() || OFFICIAL_WHATSAPP_DIGITS;

      // 1. Enregistrer dans la table Supabase 'merchant_settings' (une ligne par admin)
      const { error: msErr } = await supabase.from("merchant_settings").upsert(
        {
          user_id: user.id,
          org_id: org.id,
          company_name: companyName.trim(),
          business_type: businessType,
          logo_url: logoUrl || null,
          whatsapp_phone: cleanPhone,
          address_city: addressCity.trim() || null,
          email: email.trim() || null,
          rccm_niu: rccmNiu.trim() || null,
          slogan: slogan.trim() || null,
          primary_color: primaryColor,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      // Si la colonne business_type n'existe pas encore dans merchant_settings, sauvegarder sans elle
      if (msErr) {
        await supabase.from("merchant_settings").upsert(
          {
            user_id: user.id,
            org_id: org.id,
            company_name: companyName.trim(),
            logo_url: logoUrl || null,
            whatsapp_phone: cleanPhone,
            address_city: addressCity.trim() || null,
            email: email.trim() || null,
            rccm_niu: rccmNiu.trim() || null,
            slogan: slogan.trim() || null,
            primary_color: primaryColor,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }

      // 2. Synchroniser également avec la table 'organizations' pour les factures publiques, métier et Fapshi
      const footerNoteJson = JSON.stringify({
        fapshiApiUser: fapshiApiUser.trim(),
        fapshiApiKey: fapshiApiKey.trim(),
        fapshiEnv,
        email: email.trim(),
        slogan: slogan.trim(),
        primaryColor,
        rccmNiu: rccmNiu.trim(),
        logoUrl: logoUrl || "",
        businessType,
      });

      const { error: orgErr } = await supabase
        .from("organizations")
        .update({
          name: companyName.trim(),
          mode: businessType === "ecole" ? "etablissement" : "commerce",
          logo_url: logoUrl || null,
          city: addressCity.trim() || null,
          phone: cleanPhone,
          rccm: rccmNiu.trim() || null,
          mtn_momo_number: mtnMomo.trim() || null,
          orange_money_number: orangeMoney.trim() || null,
          footer_note: footerNoteJson,
        })
        .eq("id", org.id);

      if (orgErr) {
        throw new Error(orgErr.message);
      }

      await refreshOrgData();
      setSaved(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  }

  const activePalette = BRAND_COLOR_PALETTE[primaryColor];

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-1">
          🔒 Admin uniquement · /admin/settings
        </span>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          🏢 Paramètres de mon Entreprise
        </h1>
        <p className="text-xs text-slate-500">
          Personnalisez l&apos;identité visuelle de vos factures professionnelles (logo, slogan, couleur, coordonnées) et vos clés API Fapshi.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1 : Identité & Branding de l'entreprise (merchant_settings) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0B1F3A]">
                1. Identité visuelle & Coordonnées sur les Factures (`merchant_settings`)
              </h2>
              <p className="text-xs text-slate-500">
                Ces informations s&apos;affichent automatiquement en haut et en bas de toutes vos factures `/pay/[invoice_id]` et `/invoices/[id]`.
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold text-white self-start sm:self-center"
              style={{ backgroundColor: activePalette.hex }}
            >
              Thème actif : {activePalette.label}
            </span>
          </div>

          {/* Upload Logo + Aperçu en direct */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo entreprise"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl text-white flex items-center justify-center text-2xl font-extrabold shrink-0 shadow-sm"
                  style={{ backgroundColor: activePalette.hex }}
                >
                  {(companyName || "E").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="text-xs font-extrabold text-[#0B1F3A]">
                  Logo de l&apos;entreprise (PNG / JPG)
                </div>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Stocké dans le bucket Supabase Storage <code>logos</code> et inclus sur vos factures et téléchargements PDF.
                </p>
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    Supprimer le logo
                  </button>
                ) : null}
              </div>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold shadow-sm shrink-0">
              <span>
                {uploadingLogo ? "Upload en cours..." : "📷 Choisir un logo (PNG/JPG)"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Quel est votre métier ? (merchant_settings.business_type) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-extrabold text-[#0B1F3A]">
              Quel est votre métier ? (`merchant_settings.business_type`) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BUSINESS_SERVICES.map((srv) => {
                const active = businessType === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setBusinessType(srv.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-[#0B1F3A] flex items-center justify-between">
                      <span>
                        {srv.emoji} {srv.title}
                      </span>
                      {active ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          Actif
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {srv.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Champs de merchant_settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom de l&apos;entreprise *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: InnovTech MHA Infinity"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Slogan
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Facturation 30s"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone WhatsApp (pré-rempli : 23566268503)
              </label>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="23566268503"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse / Ville
              </label>
              <input
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="Ex: Ngaoundéré, Adamawa"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email professionnel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                RCCM / NIU (optionnel)
              </label>
              <input
                type="text"
                value={rccmNiu}
                onChange={(e) => setRccmNiu(e.target.value)}
                placeholder="Ex: RC/NGA/2026/B/001 · NIU M0126..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Sélecteur de couleur principale : Vert / Bleu / Or */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Couleur principale des factures (Vert / Bleu / Or)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["green", "blue", "gold"] as BrandColorChoice[]).map(
                (colKey) => {
                  const item = BRAND_COLOR_PALETTE[colKey];
                  const selected = primaryColor === colKey;
                  return (
                    <button
                      key={colKey}
                      type="button"
                      onClick={() => setPrimaryColor(colKey)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selected
                          ? "border-[#0B1F3A] bg-slate-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: item.hex }}
                      />
                      <div>
                        <div className="text-xs font-extrabold text-[#0B1F3A]">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {selected ? "Sélectionné" : "Choisir"}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2 : Clés API Fapshi & Mobile Money */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Passerelle de paiement Mobile Money
              </span>
              <h2 className="text-base font-extrabold text-[#0B1F3A]">
                2. Connexion des clés API Fapshi & Numéros Mobile Money
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${fapshiApiUser && fapshiApiKey
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
                }`}
            >
              {fapshiApiUser && fapshiApiKey
                ? "🟢 Fapshi configuré"
                : "⚪ Non configuré"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fapshi API User (`apiuser`)
              </label>
              <input
                type="text"
                value={fapshiApiUser}
                onChange={(e) => setFapshiApiUser(e.target.value)}
                placeholder="Votre apiuser Fapshi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fapshi API Key (`apikey`)
              </label>
              <input
                type="password"
                value={fapshiApiKey}
                onChange={(e) => setFapshiApiKey(e.target.value)}
                placeholder="FAK_..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Environnement Fapshi
              </label>
              <select
                value={fapshiEnv}
                onChange={(e) =>
                  setFapshiEnv(e.target.value as "sandbox" | "live")
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="live">Production (Live)</option>
                <option value="sandbox">Test (Sandbox)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro MTN Mobile Money
              </label>
              <input
                type="text"
                value={mtnMomo}
                onChange={(e) => setMtnMomo(e.target.value)}
                placeholder="Ex: 677 00 00 00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro Orange Money
              </label>
              <input
                type="text"
                value={orangeMoney}
                onChange={(e) => setOrangeMoney(e.target.value)}
                placeholder="Ex: 699 00 00 00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        </section>

        {errorMsg ? (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
            ⚠️ {errorMsg}
          </div>
        ) : null}

        {saved ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
            ✅ Paramètres de votre entreprise et logo enregistrés dans Supabase (`merchant_settings`).
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm disabled:opacity-50"
        >
          {saving
            ? "Enregistrement dans Supabase..."
            : "Enregistrer les paramètres de mon entreprise"}
        </button>
      </form>
    </div>
  );
}
