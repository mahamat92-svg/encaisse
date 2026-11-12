"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { createClient } from "@/lib/supabase/client";

export default function OrgSettingsPage() {
  const { org, refreshOrgData } = useAppState();

  const [name, setName] = useState(org.name);
  const [city, setCity] = useState(org.city);
  const [niu, setNiu] = useState(org.niu);
  const [rccm, setRccm] = useState(org.rccm);
  const [mtn, setMtn] = useState(org.mtnMomoNumber);
  const [om, setOm] = useState(org.orangeMoneyNumber);
  const [vatRegistered, setVatRegistered] = useState(org.vatRegistered);

  // Clés API Fapshi (MTN MoMo & Orange Money Cameroun)
  const [fapshiApiUser, setFapshiApiUser] = useState(org.fapshi.apiUser);
  const [fapshiApiKey, setFapshiApiKey] = useState(org.fapshi.apiKey);
  const [fapshiEnv, setFapshiEnv] = useState<"sandbox" | "live">(
    org.fapshi.environment
  );

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setName(org.name);
    setCity(org.city);
    setNiu(org.niu);
    setRccm(org.rccm);
    setMtn(org.mtnMomoNumber);
    setOm(org.orangeMoneyNumber);
    setVatRegistered(org.vatRegistered);
    setFapshiApiUser(org.fapshi.apiUser);
    setFapshiApiKey(org.fapshi.apiKey);
    setFapshiEnv(org.fapshi.environment);
    setSaved(false);
  }, [org]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSaved(false);

    if (!org.isLiveDb) {
      setErrorMsg("Veuillez vous connecter pour enregistrer vos paramètres.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const footerConfig = JSON.stringify({
        fapshiApiUser: fapshiApiUser.trim(),
        fapshiApiKey: fapshiApiKey.trim(),
        fapshiEnv,
      });

      const { error } = await supabase
        .from("organizations")
        .update({
          name: name.trim(),
          city: city.trim() || null,
          niu: niu.trim() || null,
          rccm: rccm.trim() || null,
          mtn_momo_number: mtn.trim() || null,
          orange_money_number: om.trim() || null,
          vat_registered: vatRegistered,
          footer_note: footerConfig,
        })
        .eq("id", org.id);

      if (error) {
        setErrorMsg(error.message);
        return;
      }
      await refreshOrgData();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          ⚙️ Paramètres & Connexion Fapshi API
        </h1>
        <p className="text-xs text-slate-500">
          Configurez les informations de votre entreprise et connectez vos clés API Fapshi pour les paiements Mobile Money (MTN MoMo & Orange Money).
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1 : Clés API Fapshi */}
        <section className="bg-white rounded-2xl border-2 border-emerald-500/30 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Passerelle de paiement Mobile Money
              </span>
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">
                🔑 Clés API Fapshi (MTN MoMo & Orange Money)
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                fapshiApiUser && fapshiApiKey
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {fapshiApiUser && fapshiApiKey
                ? "🟢 Fapshi configuré"
                : "⚪ Non connecté"}
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
                placeholder="Collez votre apiuser Fapshi"
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
        </section>

        {/* Section 2 : Informations de l'entreprise */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-[#0B1F3A]">
            🏢 Informations de l&apos;entreprise
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom de l&apos;entreprise *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIU (Numéro d&apos;Identifiant Unique)
              </label>
              <input
                type="text"
                value={niu}
                onChange={(e) => setNiu(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                RCCM
              </label>
              <input
                type="text"
                value={rccm}
                onChange={(e) => setRccm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-1">
                💛 Numéro MTN Mobile Money
              </label>
              <input
                type="text"
                value={mtn}
                onChange={(e) => setMtn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-orange-800 mb-1">
                🧡 Numéro Orange Money
              </label>
              <input
                type="text"
                value={om}
                onChange={(e) => setOm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 pt-2">
            <input
              type="checkbox"
              checked={vatRegistered}
              onChange={(e) => setVatRegistered(e.target.checked)}
            />
            <span>Assujetti à la TVA (19,25 %)</span>
          </label>
        </section>

        {errorMsg ? (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
            ⚠️ {errorMsg}
          </div>
        ) : null}

        {saved ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
            ✅ Paramètres et clés Fapshi enregistrés dans Supabase.
          </div>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold shadow-sm"
          >
            {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
          </button>
        </div>
      </form>
    </div>
  );
}
