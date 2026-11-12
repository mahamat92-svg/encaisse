"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { formatCFA, getBusinessTypeLabels } from "@/lib/format";

export default function CatalogPage() {
  const { mode, org, addCatalogRecord, deleteCatalogRecord } = useAppState();
  const labels = getBusinessTypeLabels(org.businessType);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [unit, setUnit] = useState(
    mode === "etablissement" ? "tranche" : "unité"
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await addCatalogRecord({
        name,
        unit,
        unitPrice: Number(unitPrice) || 0,
      });
      if (!res.ok) {
        setErrorMsg(res.error || "Erreur lors de l'ajout du produit.");
        return;
      }
      setSuccessMsg(`Produit "${name.trim()}" enregistré dans Supabase.`);
      setName("");
      setUnitPrice("");
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
            📦 {labels.products}
          </h1>
          <p className="text-xs text-slate-500">
            Gérez vos {labels.products.toLowerCase()} et tarifs réels enregistrés dans Supabase ({org.catalog.length} élément(s)).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
        >
          {showForm ? "Fermer" : `+ Ajouter (${labels.productSingular})`}
        </button>
      </div>

      {errorMsg ? (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
          ⚠️ {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
          ✅ {successMsg}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nom du produit ou service *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Saisissez le nom du produit"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prix unitaire (XAF) *
            </label>
            <input
              type="number"
              min={0}
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Unité
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white text-xs font-extrabold shrink-0"
              >
                {saving ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {/* État vide si aucun produit n'existe */}
      {org.catalog.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl mx-auto">
            📦
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#0B1F3A]">
              Aucun produit enregistré
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Votre catalogue est vide. Ajoutez votre premier produit ou service pour pouvoir facturer rapidement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
          >
            + Ajouter votre premier produit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {org.catalog.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4"
            >
              <div>
                <div className="font-bold text-sm text-[#0B1F3A]">
                  {item.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Unité : {item.unit}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-extrabold text-base text-emerald-700">
                    {formatCFA(item.unitPrice)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.vatApplicable ? "TVA incluse" : "Net de taxe"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
