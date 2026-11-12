"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";
import {
  buildWhatsAppLink,
  computeLineTotals,
  formatCFA,
  formatDate,
} from "@/lib/format";

export default function DocumentsPage() {
  const { mode, org, createDocumentRecord } = useAppState();

  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [docType, setDocType] = useState<"invoice" | "quote">("invoice");
  const [clientId, setClientId] = useState(org.clients[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("2026-11-25");
  const [label, setLabel] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(25000);
  const [applyVat, setApplyVat] = useState(org.vatRegistered);

  React.useEffect(() => {
    if (
      org.clients.length > 0 &&
      !org.clients.some((c) => c.id === clientId)
    ) {
      setClientId(org.clients[0].id);
    }
  }, [org.clients, clientId]);

  React.useEffect(() => {
    setApplyVat(org.vatRegistered);
  }, [org.vatRegistered]);

  const filteredDocs = org.documents.filter((d) => {
    if (filter === "unpaid") return d.balance > 0;
    if (filter === "paid") return d.status === "paid";
    return true;
  });

  async function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await createDocumentRecord({
        docType,
        clientId: clientId || org.clients[0]?.id || "",
        dueDate,
        label,
        quantity,
        unitPrice,
        applyVat,
      });
      if (!res.ok) {
        setError(res.error || "Erreur lors de la création.");
        return;
      }
      setSuccessMsg(
        `✅ Document officiel ${res.number ?? ""} émis et enregistré avec succès !`
      );
      setShowCreate(false);
      setLabel("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
            🧾 Factures, Devis & Reçus
          </h1>
          <p className="text-xs text-slate-500">
            Numérotation continue garantie sans trou (`issue_document`) · Verrouillage automatique après émission (Règle DOC-7).
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/app/ia"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
          >
            ✨ Créer par dictée IA
          </Link>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
          >
            {showCreate ? "Fermer" : "+ Nouveau document"}
          </button>
        </div>
      </div>

      {successMsg ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
          {successMsg}
        </div>
      ) : null}

      {showCreate ? (
        <form
          onSubmit={handleCreateDocument}
          className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-sm space-y-4"
        >
          <div className="font-extrabold text-sm text-[#0B1F3A]">
            Émettre un nouveau document officiel
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Type de document
              </label>
              <select
                value={docType}
                onChange={(e) =>
                  setDocType(e.target.value as "invoice" | "quote")
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              >
                <option value="invoice">Facture (FAC)</option>
                <option value="quote">Devis (DEV)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {mode === "etablissement" ? "Élève / Apprenant" : "Client"} (
                {org.clients.length} disponibles)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              >
                {org.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.className ? `(${c.className})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date d&apos;échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Sélecteur rapide depuis le Catalogue */}
          {org.catalog.length > 0 ? (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500">
                Remplir en 1 clic depuis votre catalogue :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {org.catalog.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLabel(item.name);
                      setUnitPrice(item.unitPrice);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold text-slate-700 border border-slate-200"
                  >
                    + {item.name} ({formatCFA(item.unitPrice)})
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Désignation de l&apos;article ou frais *
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={
                  mode === "etablissement"
                    ? "Ex: Scolarité 2ème Tranche Terminale C"
                    : "Ex: Sacs de ciment CIMENCAM 42.5"
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantité
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prix unitaire (FCFA)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {error ? (
            <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 font-bold">
              ⚠️ {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={applyVat}
                onChange={(e) => setApplyVat(e.target.checked)}
              />
              <span>Appliquer la TVA camerounaise (19,25 %)</span>
            </label>

            <div className="flex items-center gap-4">
              <div className="text-sm font-extrabold text-[#0B1F3A]">
                Total TTC :{" "}
                {formatCFA(
                  computeLineTotals(
                    quantity,
                    unitPrice,
                    0,
                    applyVat ? 1925 : 0
                  ).total
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
              >
                {saving ? "Émission en cours..." : "Émettre et numéroter"}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <div className="flex gap-2 text-xs font-bold">
        {[
          { id: "all", label: `Tous (${org.documents.length})` },
          {
            id: "unpaid",
            label: `À encaisser (${
              org.documents.filter((d) => d.balance > 0).length
            })`,
          },
          {
            id: "paid",
            label: `Soldés (${
              org.documents.filter((d) => d.status === "paid").length
            })`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition-colors ${
              filter === tab.id
                ? "bg-[#0B1F3A] text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredDocs.map((doc) => {
          const shareUrl = `${
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:3000"
          }/f/${doc.publicToken}`;
          const waMsg = `Bonjour ${doc.clientName},\nVoici votre facture *${doc.number}* (${org.name}) d'un montant de *${formatCFA(
            doc.total
          )}* (Reste à payer : *${formatCFA(
            doc.balance
          )}*).\n📄 Consultez et téléchargez le PDF ici : ${shareUrl}`;

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-[#0B1F3A]">
                    {doc.number}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      doc.status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : doc.daysOverdue > 0
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {doc.status === "paid"
                      ? "Payée"
                      : doc.daysOverdue > 0
                        ? `En retard (J+${doc.daysOverdue})`
                        : doc.status === "partially_paid"
                          ? "Partiellement payée"
                          : "Émise"}
                  </span>
                </div>

                <div className="font-semibold text-sm text-slate-800">
                  {doc.clientName}
                </div>
                <div className="text-xs text-slate-500">
                  Émise le {formatDate(doc.issueDate)} · Échéance :{" "}
                  {formatDate(doc.dueDate)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500">
                    Total : {formatCFA(doc.total)}
                  </div>
                  <div className="text-base font-extrabold text-[#0B1F3A]">
                    Reste dû : {formatCFA(doc.balance)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/f/${doc.publicToken}`}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    📄 Aperçu PDF
                  </Link>
                  <a
                    href={buildWhatsAppLink(doc.whatsappPhone, waMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    💬 Envoyer WhatsApp
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
