"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { formatCFA, getBusinessTypeLabels } from "@/lib/format";

const UNIT_OPTIONS = [
  "unité",
  "kg",
  "sac",
  "carton",
  "litre",
  "pièce",
  "heure",
  "jour",
  "tranche",
] as const;

export default function CatalogPage() {
  const { mode, org, addCatalogRecord, deleteCatalogRecord } = useAppState();
  const labels = getBusinessTypeLabels(org.businessType);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [unit, setUnit] = useState<string>(
    mode === "etablissement" ? "tranche" : "unité"
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function openNewForm() {
    setEditingId(null);
    setName("");
    setUnitPrice("");
    setUnit(mode === "etablissement" ? "tranche" : "unité");
    setErrorMsg(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = name.trim();
    const numericPrice = Number(unitPrice.replace(/\D/g, "")) || 0;
    if (!cleanName) {
      setErrorMsg("Veuillez saisir le nom du produit.");
      return;
    }
    if (numericPrice <= 0) {
      setErrorMsg("Veuillez saisir un prix valide en chiffres (XAF).");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await deleteCatalogRecord(editingId);
      }
      const res = await addCatalogRecord({
        name: cleanName,
        unit,
        unitPrice: numericPrice,
      });
      if (!res.ok) {
        setErrorMsg(res.error || "Erreur lors de l'ajout du produit.");
        return;
      }

      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setSuccessMsg("Produit ajouté !");
      setName("");
      setUnitPrice("");
      setUnit(mode === "etablissement" ? "tranche" : "unité");
      setEditingId(null);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setErrorMsg(null);
    const res = await deleteCatalogRecord(id);
    if (!res.ok) {
      setErrorMsg(res.error || "Impossible de supprimer ce produit.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyAvatar logoUrl={org.logoUrl} name={org.name} size={42} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] truncate">
              📦 {labels.products} — {org.name}
            </h1>
            <p className="text-xs text-slate-500">
              {org.catalog.length} produit(s) enregistré(s)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : openNewForm())}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-sm text-center"
        >
          {showForm ? "✖ Fermer" : `+ Ajouter (${labels.productSingular})`}
        </button>
      </div>

      {errorMsg ? (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 font-bold">
          ⚠️ {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 font-extrabold">
          ✅ {successMsg}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border-2 border-emerald-500/40 p-4 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-[#0B1F3A]">
              {editingId ? "✏️ Modifier le produit" : "➕ Nouveau produit"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-extrabold"
            >
              Fermer
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom du produit ou service *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pain, Riz 50kg, Tresse..."
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prix unitaire (XAF) — chiffres seulement *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={unitPrice}
                onChange={(e) =>
                  setUnitPrice(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Ex: 100"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-base font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unité *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-base bg-white font-semibold text-[#0B1F3A]"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white text-base font-extrabold shadow-md text-center"
          >
            {saving ? "Enregistrement..." : "💾 Enregistrer"}
          </button>
        </form>
      ) : null}

      {org.catalog.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl mx-auto">
            📦
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#0B1F3A]">
              Aucun produit enregistré
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ajoutez votre premier produit ou service pour pouvoir facturer
              rapidement.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-sm"
          >
            + Ajouter votre premier produit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {org.catalog.map((item) => (
            <div
              key={item.id}
              className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyAvatar
                    logoUrl={org.logoUrl}
                    name={org.name}
                    size={36}
                  />
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm sm:text-base text-[#0B1F3A] break-words">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Unité : {item.unit}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-base sm:text-lg text-emerald-700 whitespace-nowrap">
                    {formatCFA(item.unitPrice)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.vatApplicable ? "TVA incluse" : "Net de taxe"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(item.id);
                    setName(item.name);
                    setUnitPrice(String(item.unitPrice));
                    setUnit(item.unit || "unité");
                    setShowForm(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-extrabold text-center"
                >
                  ✏️ Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold text-center"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
