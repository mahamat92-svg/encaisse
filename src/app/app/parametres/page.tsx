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
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setName(org.name);
    setCity(org.city);
    setNiu(org.niu === "Non renseigné" ? "" : org.niu);
    setRccm(org.rccm === "Non renseigné" ? "" : org.rccm);
    setMtn(org.mtnMomoNumber.startsWith("À configurer") ? "" : org.mtnMomoNumber);
    setOm(org.orangeMoneyNumber.startsWith("À configurer") ? "" : org.orangeMoneyNumber);
    setVatRegistered(org.vatRegistered);
    setSaved(false);
  }, [org]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSaved(false);

    if (org.isLiveDb) {
      setSaving(true);
      try {
        const supabase = createClient();
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
          })
          .eq("id", org.id);

        if (error) {
          setErrorMsg(error.message);
          return;
        }
        await refreshOrgData();
      } finally {
        setSaving(false);
      }
    }

    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          ⚙️ Paramètres de l&apos;entreprise & Mobile Money
        </h1>
        <p className="text-xs text-slate-500">
          Ces informations apparaissent automatiquement sur vos devis, factures, reçus PDF et messages de relance WhatsApp (ORG-2 & ORG-3).
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Raison sociale / Nom de l&apos;établissement
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
              Ville & Quartier
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
              NIU (Numéro d&apos;Identifiant Unique — DGI Cameroun)
            </label>
            <input
              type="text"
              value={niu}
              onChange={(e) => setNiu(e.target.value)}
              placeholder="Ex: M052116044812A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Numéro RCCM
            </label>
            <input
              type="text"
              value={rccm}
              onChange={(e) => setRccm(e.target.value)}
              placeholder="Ex: RC/DLA/2021/B/3412"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-amber-800 mb-1">
              💛 Numéro MTN Mobile Money (affiché aux clients)
            </label>
            <input
              type="text"
              value={mtn}
              onChange={(e) => setMtn(e.target.value)}
              placeholder="Ex: 677 84 12 90 (Nom : ...)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-800 mb-1">
              🧡 Numéro Orange Money (affiché aux clients)
            </label>
            <input
              type="text"
              value={om}
              onChange={(e) => setOm(e.target.value)}
              placeholder="Ex: 699 11 45 20 (Nom : ...)"
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
          <span>Entreprise assujettie à la TVA au Cameroun (19,25 %)</span>
        </label>

        {errorMsg ? (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
            ⚠️ {errorMsg}
          </div>
        ) : null}

        {saved ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
            ✅ Paramètres enregistrés avec succès.
          </div>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white text-xs font-extrabold"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
