"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { formatCFA } from "@/lib/format";
import { getLabels } from "@/lib/i18n";

export default function CatalogPage() {
  const { locale, mode, org, addCatalogRecord } = useAppState();
  const { m } = getLabels(locale, mode);

  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState(10000);
  const [unit, setUnit] = useState(
    mode === "etablissement" ? "tranche" : "unité"
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setUnit(mode === "etablissement" ? "tranche" : "unité");
  }, [mode]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await addCatalogRecord({
        name,
        unit,
        unitPrice,
      });
      if (!res.ok) {
        setErrorMsg(res.error || "Erreur lors de l'ajout.");
        return;
      }
      setSuccessMsg(`✅ "${name.trim()}" a bien été ajouté à votre catalogue.`);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
          📦 {m.catalogLabel}
        </h1>
        <p className="text-xs text-slate-500">
          Vos tarifs pré-enregistrés en FCFA pour facturer en moins de 30 secondes ({org.catalog.length} éléments).
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Désignation *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              mode === "etablissement"
                ? "Ex: Scolarité 3ème Tranche"
                : "Ex: Sac de ciment 50 kg"
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Prix unitaire (FCFA) *
          </label>
          <input
            type="number"
            min={0}
            step={500}
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold"
        >
          {saving ? "Enregistrement..." : "+ Ajouter au catalogue"}
        </button>
      </form>

      {errorMsg ? (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-semibold">
          ⚠️ {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
          {successMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {org.catalog.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-sm text-[#0B1F3A]">
                {item.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Unité : {item.unit}{" "}
                {item.className ? `· ${item.className}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-base text-emerald-700">
                {formatCFA(item.unitPrice)}
              </div>
              <div className="text-[11px] text-slate-400">
                {item.vatApplicable ? "TVA 19,25% applicable" : "Net de taxe"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
