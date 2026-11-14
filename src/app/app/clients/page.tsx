"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { FacebookBlueIcon } from "@/components/ExcelInvoiceTable";
import { formatCFA, getBusinessTypeLabels } from "@/lib/format";

export default function ClientsPage() {
  const { mode, org, addClientRecord, deleteClientRecord } = useAppState();
  const labels = getBusinessTypeLabels(org.businessType);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [expandedBalanceId, setExpandedBalanceId] = useState<string | null>(null);
  const [className, setClassName] = useState("");
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
        facebookUrl,
        className: mode === "etablissement" ? className : undefined,
        payerName: mode === "etablissement" ? payerName : undefined,
      });
      if (!res.ok) {
        setError(res.error || "Erreur lors de l'enregistrement.");
        return;
      }
      setSuccessMsg(`Client "${name.trim()}" enregistré dans Supabase.`);
      setName("");
      setPhone("");
      setCity("");
      setFacebookUrl("");
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
            👥 {labels.clients}
          </h1>
          <p className="text-xs text-slate-500">
            Répertoire réel de vos {labels.clients.toLowerCase()} enregistrés dans Supabase ({org.clients.length} élément(s)).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
        >
          {showAdd ? "Fermer" : `+ Ajouter (${labels.clientSingular})`}
        </button>
      </div>

      {successMsg ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
          ✅ {successMsg}
        </div>
      ) : null}

      {showAdd ? (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nom complet du client *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom et prénom ou entreprise"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
              placeholder="Ville"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Téléphone WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 ..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lien Facebook (optionnel)
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/innovtechmha"
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
              {saving ? "Enregistrement..." : "Enregistrer le client"}
            </button>
          </div>
        </form>
      ) : null}

      {org.clients.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl mx-auto">
            👥
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#0B1F3A]">
              Aucun client enregistré
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Votre liste de clients est vide. Ajoutez votre premier client pour suivre ses commandes et ses paiements.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
          >
            + Ajouter votre premier client
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client par nom..."
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const momoBal = Number(c.mobileMoneyBalance ?? 0);
              const cardBal = Number(c.bankCardBalance ?? 0);
              const totalWallet = momoBal + cardBal;
              const momoPct =
                totalWallet > 0 ? Math.round((momoBal / totalWallet) * 100) : 50;
              const fbHref = c.facebookUrl?.trim()
                ? c.facebookUrl.trim().startsWith("http")
                  ? c.facebookUrl.trim()
                  : `https://${c.facebookUrl.trim()}`
                : "";
              return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-[#0B1F3A] truncate">
                        {c.name}
                      </span>
                      {fbHref ? (
                        <a
                          href={fbHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir le profil Facebook"
                          className="text-[#1877F2] hover:opacity-80 shrink-0"
                        >
                          <FacebookBlueIcon className="w-4 h-4" />
                        </a>
                      ) : null}
                    </div>
                    {c.city ? (
                      <div className="text-xs text-slate-600">📍 {c.city}</div>
                    ) : null}
                    {c.phone ? (
                      <div className="text-xs text-slate-500">📱 {c.phone}</div>
                    ) : null}
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-xs text-slate-500">Solde dû</div>
                    <div
                      className={`text-lg font-extrabold ${
                        c.balance > 0 ? "text-[#0B1F3A]" : "text-emerald-600"
                      }`}
                    >
                      {formatCFA(c.balance)}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteClientRecord(c.id)}
                      className="text-[11px] text-red-600 hover:underline font-semibold"
                    >
                      Archiver
                    </button>
                  </div>
                </div>

                {/* Solde Mobile Money + Carte Bancaire du client */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-700">
                      Mobile Money : {formatCFA(momoBal)} | Carte : {formatCFA(cardBal)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBalanceId(
                          expandedBalanceId === c.id ? null : c.id
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-slate-200 text-[#0B1F3A] font-extrabold hover:bg-slate-100"
                    >
                      Voir solde
                    </button>
                  </div>
                  <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${momoPct}%` }}
                    />
                  </div>
                  {expandedBalanceId === c.id ? (
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>📱 Mobile Money</span>
                        <span>{formatCFA(momoBal)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-700">
                        <span>💳 Carte Bancaire</span>
                        <span>{formatCFA(cardBal)}</span>
                      </div>
                      <div className="flex justify-between font-black text-[#0B1F3A] pt-1 border-t border-slate-200">
                        <span>Total client</span>
                        <span>{formatCFA(totalWallet)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
