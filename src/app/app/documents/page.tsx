"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { ExcelInvoiceTable } from "@/components/ExcelInvoiceTable";
import {
  buildInvoiceWhatsAppMessage,
  formatAmountNumber,
  formatCFA,
  formatDate,
} from "@/lib/format";
import { WhatsAppShareButton } from "@/components/WhatsAppButton";

interface InvoiceFormLine {
  id: string;
  label: string;
  quantity: number;
  unitPrice: string;
}

interface CreatedInvoiceShare {
  clientName: string;
  clientPhone: string;
  invoiceNumber: string;
  productName: string;
  linesSummary: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  publicToken: string;
}

export default function DocumentsPage() {
  const { org, createDocumentRecord } = useAppState();

  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showExcelMode, setShowExcelMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<CreatedInvoiceShare | null>(
    null
  );

  const [docType, setDocType] = useState<"invoice" | "quote">("invoice");
  const [clientId, setClientId] = useState<string>("");
  const [newClientName, setNewClientName] = useState<string>("");
  const [newClientPhone, setNewClientPhone] = useState<string>("");
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [lines, setLines] = useState<InvoiceFormLine[]>([
    { id: "line-1", label: "", quantity: 1, unitPrice: "" },
  ]);
  const [discountInput, setDiscountInput] = useState<string>("");
  const [paidInput, setPaidInput] = useState<string>("");
  const [applyVat, setApplyVat] = useState(org.vatRegistered);

  React.useEffect(() => {
    setApplyVat(org.vatRegistered);
  }, [org.vatRegistered]);

  // Calcul automatique en direct
  const totalQuantity = lines.reduce(
    (sum, l) => sum + Math.max(0, Number(l.quantity) || 0),
    0
  );
  const subtotalAmount = lines.reduce(
    (sum, l) =>
      sum +
      Math.max(0, Number(l.quantity) || 0) *
        Math.max(0, Number(l.unitPrice) || 0),
    0
  );
  const discountVal = Math.max(0, Math.round(Number(discountInput) || 0));
  const totalToPay = Math.max(0, subtotalAmount - discountVal);
  const paidVal = Math.max(0, Math.round(Number(paidInput) || 0));
  const remainingToPay = Math.max(0, totalToPay - paidVal);

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: "",
        quantity: 1,
        unitPrice: "",
      },
    ]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  function updateLine(
    id: string,
    patch: Partial<Pick<InvoiceFormLine, "label" | "quantity" | "unitPrice">>
  ) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://encaisse.vercel.app";

  const filteredDocs = org.documents.filter((d) => {
    if (filter === "unpaid") return d.balance > 0;
    if (filter === "paid") return d.status === "paid";
    return true;
  });

  async function handleCreateDocument(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLastCreated(null);
    setSaving(true);
    try {
      const validLines = lines
        .map((l) => ({
          label: l.label.trim(),
          quantity: Math.max(1, Number(l.quantity) || 1),
          unitPrice: Math.max(0, Number(l.unitPrice) || 0),
        }))
        .filter((l) => l.label.length > 0);

      if (validLines.length === 0) {
        setError("Veuillez saisir au moins un produit.");
        return;
      }

      const selectedClient = org.clients.find((c) => c.id === clientId);
      const finalClientName = selectedClient
        ? selectedClient.name
        : newClientName.trim();
      const finalClientPhone = selectedClient
        ? selectedClient.phone
        : newClientPhone.trim();

      const linesSummary = validLines
        .map(
          (l) =>
            `${l.label} ${l.quantity} x ${formatAmountNumber(l.unitPrice)} = ${formatAmountNumber(l.quantity * l.unitPrice)}`
        )
        .join(", ");

      const res = await createDocumentRecord({
        docType,
        clientId: clientId || undefined,
        newClientName: !clientId ? newClientName : undefined,
        newClientPhone: !clientId ? newClientPhone : undefined,
        dueDate,
        label: validLines[0].label,
        quantity: validLines[0].quantity,
        unitPrice: validLines[0].unitPrice,
        lines: validLines,
        discountAmount: discountVal,
        paidAmount: paidVal,
        applyVat: false,
      });
      if (!res.ok) {
        setError(res.error || "Erreur lors de la création de la facture.");
        return;
      }

      setLastCreated({
        clientName: finalClientName || "Client",
        clientPhone: finalClientPhone || "",
        invoiceNumber: res.number || "FAC",
        productName: validLines.map((l) => l.label).join(", "),
        linesSummary,
        amount: totalToPay,
        paidAmount: paidVal,
        balanceAmount: remainingToPay,
        publicToken: res.publicToken || "",
      });

      setShowCreate(false);
      setLines([{ id: "line-1", label: "", quantity: 1, unitPrice: "" }]);
      setDiscountInput("");
      setPaidInput("");
      setNewClientName("");
      setNewClientPhone("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
            🧾 Commandes & Factures
          </h1>
          <p className="text-xs text-slate-500">
            Toutes vos commandes et factures réelles enregistrées dans Supabase ({org.documents.length} document(s)).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowExcelMode(!showExcelMode)}
            className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold shadow-sm"
          >
            {showExcelMode ? "Fermer Excel" : "📊 Tableau Excel Intégré"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
          >
            {showCreate ? "Fermer" : "+ Créer une facture"}
          </button>
        </div>
      </div>

      {showExcelMode ? <ExcelInvoiceTable /> : null}

      {/* Bandeau d'envoi WhatsApp immédiat après création de facture */}
      {lastCreated ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-extrabold text-emerald-900">
              ✅ Facture {lastCreated.invoiceNumber} créée dans Supabase pour{" "}
              {lastCreated.clientName} ({formatCFA(lastCreated.amount)})
            </div>
            <p className="text-xs text-emerald-800">
              Produit : <strong>{lastCreated.productName}</strong> — Envoyez-la maintenant sur WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppShareButton
              phone={lastCreated.clientPhone}
              message={buildInvoiceWhatsAppMessage({
                clientName: lastCreated.clientName,
                invoiceNumber: lastCreated.invoiceNumber,
                amount: lastCreated.amount,
                paidAmount: lastCreated.paidAmount,
                balanceAmount: lastCreated.balanceAmount,
                productName: lastCreated.productName,
                linesSummary: lastCreated.linesSummary,
                paymentUrl: `${origin}/pay/${lastCreated.publicToken}`,
                merchantName: org.name,
                merchantCity: org.city,
                merchantPhone: org.phone,
                footerMessage: org.footerMessage,
              })}
              label="Envoyer sur WhatsApp"
              invoiceShare={{
                invoiceNumber: lastCreated.invoiceNumber,
                clientName: lastCreated.clientName,
                clientPhone: lastCreated.clientPhone,
                productName: lastCreated.productName,
                quantity: 1,
                unitPrice: lastCreated.amount,
                amount: lastCreated.amount,
                paymentUrl: `${origin}/pay/${lastCreated.publicToken}`,
                merchantName: org.name,
                merchantCity: org.city,
                merchantPhone: org.phone,
                merchantEmail: org.email,
                merchantRccmNiu: org.rccmNiu,
                merchantLogoUrl: org.logoUrl,
                primaryColor: org.primaryColor,
              }}
            />
            {lastCreated.publicToken ? (
              <Link
                href={`/invoices/${lastCreated.publicToken}`}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0B1F3A] text-xs font-extrabold"
              >
                👁️ Aperçu de ma facture
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <form
          onSubmit={handleCreateDocument}
          className="bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-sm space-y-4"
        >
          <div className="font-extrabold text-sm text-[#0B1F3A]">
            Créer une nouvelle commande / facture
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="invoice">Facture / Commande (FAC)</option>
                <option value="quote">Devis (DEV)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client existant
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="">-- Nouveau client (saisir ci-dessous) --</option>
                {org.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {!clientId ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du client *
                </label>
                <input
                  type="text"
                  required={!clientId}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nom complet du client"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Téléphone WhatsApp du client (237...)
                </label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="237..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                />
              </div>
            </div>
          ) : null}

          {/* En-tête entreprise du client sur la facture */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <CompanyAvatar logoUrl={org.logoUrl} name={org.name} size={44} />
            <div className="min-w-0 text-xs">
              <div className="font-extrabold text-[#0B1F3A] truncate">
                {org.name}
              </div>
              <div className="text-slate-600 truncate">
                {org.address || org.city} · WhatsApp : {org.phone}
              </div>
            </div>
          </div>

          {/* Lignes de produits avec calcul en direct */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase text-[#0B1F3A]">
                Produits / Services ({lines.length})
              </div>
              <button
                type="button"
                onClick={addLine}
                className="px-3 py-1.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold"
              >
                + Ajouter un produit
              </button>
            </div>

            {lines.map((line, idx) => {
              const lineTotal =
                Math.max(0, Number(line.quantity) || 0) *
                Math.max(0, Number(line.unitPrice) || 0);
              return (
                <div
                  key={line.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-600">
                      Ligne {idx + 1}
                    </span>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Supprimer
                      </button>
                    ) : null}
                  </div>

                  {org.catalog.length > 0 ? (
                    <select
                      value=""
                      onChange={(e) => {
                        const found = org.catalog.find(
                          (c) => c.id === e.target.value
                        );
                        if (found) {
                          updateLine(line.id, {
                            label: found.name,
                            unitPrice: String(found.unitPrice),
                          });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-[#0B1F3A]"
                    >
                      <option value="">
                        -- Choisir vite dans mon catalogue --
                      </option>
                      {org.catalog.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({formatCFA(item.unitPrice)})
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Produit / Service *
                      </label>
                      <input
                        type="text"
                        required
                        value={line.label}
                        onChange={(e) =>
                          updateLine(line.id, { label: e.target.value })
                        }
                        placeholder="Ex: Mil 50kg, Pain, Riz..."
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prix (XAF) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(line.id, { unitPrice: e.target.value })
                        }
                        placeholder="0"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2 text-left sm:text-right">
                      <div className="text-[11px] font-bold text-slate-500">
                        Total ligne
                      </div>
                      <div className="text-sm font-black text-emerald-700">
                        {formatCFA(lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Réduction & Déjà payé + Calculs automatiques en direct */}
          <div className="p-4 rounded-2xl bg-[#0B1F3A]/5 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Réduction (XAF, optionnel)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Montant déjà payé (XAF)
                </label>
                <input
                  type="number"
                  min={0}
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Quantité totale</span>
                <span>{totalQuantity} au total</span>
              </div>
              <div className="flex justify-between text-slate-700 font-bold">
                <span>Sous-total</span>
                <span>{formatCFA(subtotalAmount)}</span>
              </div>
              {discountVal > 0 ? (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Réduction</span>
                  <span>- {formatCFA(discountVal)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-black text-[#0B1F3A] pt-1 border-t border-slate-200">
                <span>TOTAL À PAYER</span>
                <span>{formatCFA(totalToPay)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-bold">
                <span>Montant déjà payé</span>
                <span>{formatCFA(paidVal)}</span>
              </div>
              <div
                className={`flex justify-between text-base font-black ${
                  remainingToPay === 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                <span>RESTE À PAYER</span>
                <span>
                  {remainingToPay === 0
                    ? "0 XAF · ✅ Payé"
                    : formatCFA(remainingToPay)}
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 font-bold">
              ⚠️ {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm disabled:opacity-50"
          >
            {saving ? "Création en cours..." : "✅ Créer la facture"}
          </button>
        </form>
      ) : null}

      {/* État vide si aucune commande / facture n'existe */}
      {org.documents.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl mx-auto">
            🧾
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-[#0B1F3A]">
              Aucune commande ou facture pour le moment
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Aucune facture n&apos;est créée automatiquement. Cliquez sur le bouton ci-dessous pour émettre votre première facture officielle.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
          >
            + Créer votre première facture
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 text-xs font-bold">
            {[
              { id: "all", label: `Toutes (${org.documents.length})` },
              {
                id: "unpaid",
                label: `À encaisser (${
                  org.documents.filter((d) => d.balance > 0).length
                })`,
              },
              {
                id: "paid",
                label: `Payées (${
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
              const paymentUrl = `${origin}/pay/${doc.publicToken}`;
              const productName =
                doc.lines.map((l) => l.label).join(", ") || "votre commande";
              const linesSummary = doc.lines
                .map(
                  (l) =>
                    `${l.label} ${l.quantity} x ${formatAmountNumber(l.unitPrice)} = ${formatAmountNumber(l.total)}`
                )
                .join(", ");
              const waMsg = buildInvoiceWhatsAppMessage({
                clientName: doc.clientName,
                invoiceNumber: doc.number,
                amount: doc.total,
                paidAmount: doc.paidTotal,
                balanceAmount: doc.balance,
                productName,
                linesSummary,
                paymentUrl,
                merchantName: org.name,
                merchantCity: org.city,
                merchantPhone: org.phone,
                footerMessage: org.footerMessage,
              });

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
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.status === "paid" ? "Payée" : "Émise"}
                      </span>
                    </div>

                    <div className="font-semibold text-sm text-slate-800">
                      {doc.clientName}
                      {doc.whatsappPhone ? (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          ({doc.whatsappPhone})
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">
                      Produit : <strong>{productName}</strong> · Date :{" "}
                      {formatDate(doc.issueDate)}
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
                        href={`/invoices/${doc.publicToken}`}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-extrabold text-[#0B1F3A]"
                      >
                        👁️ Aperçu de ma facture
                      </Link>
                      <WhatsAppShareButton
                        phone={doc.whatsappPhone}
                        message={waMsg}
                        label="Envoyer sur WhatsApp"
                        invoiceShare={{
                          invoiceNumber: doc.number,
                          issueDate: doc.issueDate,
                          clientName: doc.clientName,
                          clientPhone: doc.whatsappPhone,
                          productName,
                          quantity: doc.lines[0]?.quantity || 1,
                          unitPrice: doc.lines[0]?.unitPrice || doc.total,
                          amount: doc.total,
                          paymentUrl,
                          merchantName: org.name,
                          merchantCity: org.city,
                          merchantPhone: org.phone,
                          merchantEmail: org.email,
                          merchantRccmNiu: org.rccmNiu,
                          merchantLogoUrl: org.logoUrl,
                          primaryColor: org.primaryColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section 2 séparée : Relances WhatsApp à envoyer */}
          {org.documents.some((d) => d.status !== "paid" && d.balance > 0) ? (
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-[#0B1F3A]">
                💬 Relances WhatsApp à envoyer
              </h2>
              <div className="space-y-3">
                {org.documents
                  .filter((d) => d.status !== "paid" && d.balance > 0)
                  .slice(0, 5)
                  .map((doc) => {
                    const paymentUrl = `${origin}/pay/${doc.publicToken}`;
                    const productName =
                      doc.lines.map((l) => l.label).join(", ") || "votre commande";
                    const waMsg = buildInvoiceWhatsAppMessage({
                      clientName: doc.clientName,
                      invoiceNumber: doc.number,
                      amount: doc.balance,
                      productName,
                      paymentUrl,
                      merchantName: org.name,
                      merchantCity: org.city,
                      merchantPhone: org.phone,
                      footerMessage: org.footerMessage,
                    });
                    return (
                      <div
                        key={`relance-${doc.id}`}
                        className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[#0B1F3A] truncate">
                            {doc.clientName} — {doc.number}
                          </div>
                          <div className="text-xs text-slate-600">
                            Reste dû : <strong>{formatCFA(doc.balance)}</strong>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/invoices/${doc.publicToken}`}
                            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#0B1F3A]"
                          >
                            👁️ Aperçu de ma facture
                          </Link>
                          <WhatsAppShareButton
                            phone={doc.whatsappPhone}
                            message={waMsg}
                            label="Relancer sur WhatsApp"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          ) : null}

          {/* Résumé mensuel calculé depuis Supabase */}
          {(() => {
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(
              now.getMonth() + 1
            ).padStart(2, "0")}`;
            const monthRevenue = org.documents
              .filter((d) => (d.issueDate || "").startsWith(monthKey))
              .reduce((sum, d) => sum + (d.paidTotal || 0), 0);
            const paidCount = org.documents.filter(
              (d) => d.status === "paid" || d.balance === 0
            ).length;
            const unpaidCount = org.documents.filter(
              (d) => d.balance > 0
            ).length;
            const totalToCollect = org.documents.reduce(
              (sum, d) => sum + Math.max(0, d.balance || 0),
              0
            );
            return (
              <section className="p-4 sm:p-5 rounded-2xl bg-[#0B1F3A] text-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-slate-300 font-semibold">
                    Recettes totales ce mois
                  </div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {formatCFA(monthRevenue)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-300 font-semibold">
                    Factures payées
                  </div>
                  <div className="text-base font-black mt-0.5">{paidCount}</div>
                </div>
                <div>
                  <div className="text-slate-300 font-semibold">
                    Factures impayées
                  </div>
                  <div className="text-base font-black text-amber-300 mt-0.5">
                    {unpaidCount}
                  </div>
                </div>
                <div>
                  <div className="text-slate-300 font-semibold">
                    Reste à encaisser
                  </div>
                  <div className="text-base font-black text-red-300 mt-0.5">
                    {formatCFA(totalToCollect)}
                  </div>
                </div>
              </section>
            );
          })()}
        </>
      )}
    </div>
  );
}
