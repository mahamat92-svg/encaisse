"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { formatCFA } from "@/lib/format";
import { getLabels } from "@/lib/i18n";

export default function ClientsPage() {
  const { locale, mode, org, addClientRecord } = useAppState();
  const { m } = getLabels(locale, mode);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+237 ");
  const [city, setCity] = useState("Douala");
  const [className, setClassName] = useState("Terminale C");
  const [payerName, setPayerName] = useState("");

  const filtered = org.clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.payerName &&
        c.payerName.toLowerCase().includes(search.toLowerCase())) ||
      (c.className &&
        c.className.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await addClientRecord({
        name,
        phone,
        city,
        className: mode === "etablissement" ? className : undefined,
        payerName: mode === "etablissement" ? payerName : undefined,
      });
      if (!res.ok) {
        setError(res.error || "Erreur lors de l'enregistrement.");
        return;
      }
      setSuccessMsg(
        `✅ "${name.trim()}" a bien été enregistré et apparaît maintenant dans le sélecteur de Factures.`
      );
      setName("");
      setPayerName("");
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
            {mode === "etablissement"
              ? "🎓 Élèves & Parents Payeurs"
              : "👥 Clients & Comptes Débiteurs"}
          </h1>
          <p className="text-xs text-slate-500">
            Historique des créances, coordonnées WhatsApp et solde dû par{" "}
            {m.clientLabel.toLowerCase()} ({org.clients.length} enregistrés).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
        >
          {showAdd ? "Fermer" : `+ Ajouter un ${m.clientLabel.toLowerCase()}`}
        </button>
      </div>

      {successMsg ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
          {successMsg}
        </div>
      ) : null}

      {showAdd ? (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {mode === "etablissement"
                ? "Nom complet de l'élève *"
                : "Nom du client / entreprise *"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mahamat Bouba"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {mode === "etablissement" ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classe *
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du Parent Payeur *
                </label>
                <input
                  type="text"
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Téléphone WhatsApp *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {error ? (
            <div className="sm:col-span-3 p-3 rounded-xl bg-red-50 text-xs text-red-700 font-bold">
              ⚠️ {error}
            </div>
          ) : null}

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer la fiche"}
            </button>
          </div>
        </form>
      ) : null}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Rechercher un ${m.clientLabel.toLowerCase()} par nom, classe ou parent...`}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="font-extrabold text-base text-[#0B1F3A]">
                {c.name}
              </div>
              {c.className ? (
                <div className="text-xs text-slate-600">
                  🎓 Classe : <strong>{c.className}</strong> · Parent :{" "}
                  <strong>{c.payerName}</strong>
                </div>
              ) : (
                <div className="text-xs text-slate-600">
                  📍 {c.city} · Plafond crédit :{" "}
                  {c.creditLimit ? formatCFA(c.creditLimit) : "Aucun"}
                </div>
              )}
              <div className="text-xs text-slate-500">
                📱 WhatsApp : {c.phone}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500">Solde dû</div>
              <div
                className={`text-lg font-extrabold ${
                  c.balance > 0 ? "text-[#0B1F3A]" : "text-emerald-600"
                }`}
              >
                {formatCFA(c.balance)}
              </div>
              {c.overdueBalance > 0 ? (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                  En retard : {formatCFA(c.overdueBalance)}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  À jour
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
