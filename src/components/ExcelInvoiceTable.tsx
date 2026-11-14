"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useAppState } from "@/components/AppContext";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { formatAmountNumber, formatCFA } from "@/lib/format";

interface ExcelRow {
  id: string;
  product: string;
  quantity: number;
  unitPrice: number;
}

export function FacebookBlueIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.326V1.326C24 .597 23.403 0 22.675 0z" />
    </svg>
  );
}

export function ExcelInvoiceTable({
  onInvoiceSaved,
}: {
  onInvoiceSaved?: (info: { number: string; total: number; channel: string }) => void;
}) {
  const { org, createDocumentRecord } = useAppState();

  const [customLogo, setCustomLogo] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [newClientName, setNewClientName] = useState<string>("");
  const [newClientPhone, setNewClientPhone] = useState<string>("");
  const [clientFacebook, setClientFacebook] = useState<string>("");

  const [rows, setRows] = useState<ExcelRow[]>([
    { id: "r-1", product: "Produit 1", quantity: 2, unitPrice: 15000 },
    { id: "r-2", product: "Produit 2", quantity: 1, unitPrice: 10000 },
  ]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [applyVat, setApplyVat] = useState<boolean>(false);
  const [paymentChannel, setPaymentChannel] = useState<
    "mobile_money" | "bank_card" | "cash"
  >("mobile_money");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedClient = org.clients.find((c) => c.id === clientId);
  const effectiveFacebook =
    selectedClient?.facebookUrl?.trim() || clientFacebook.trim();
  const effectiveClientName =
    selectedClient?.name || newClientName.trim() || "Client";

  const subtotal = rows.reduce(
    (sum, r) =>
      sum + Math.max(0, Number(r.quantity) || 0) * Math.max(0, Number(r.unitPrice) || 0),
    0
  );
  const clampedDiscountPct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = Math.round((subtotal * clampedDiscountPct) / 100);
  const netAfterDiscount = Math.max(0, subtotal - discountAmount);
  const vatAmount = applyVat ? Math.round((netAfterDiscount * 1925) / 10000) : 0;
  const grandTotal = netAfterDiscount + vatAmount;

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function duplicateRow(row: ExcelRow) {
    setRows((prev) => [
      ...prev,
      {
        ...row,
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    ]);
  }

  function updateRow(id: string, patch: Partial<Omit<ExcelRow, "id">>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleExportExcel() {
    const sheetRows = rows.map((r) => ({
      Produit: r.product || "Article",
      Quantité: Number(r.quantity) || 0,
      "Prix Unitaire FCFA": Number(r.unitPrice) || 0,
      "Total FCFA":
        (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
    }));
    sheetRows.push({
      Produit: "Sous-Total",
      Quantité: rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
      "Prix Unitaire FCFA": 0,
      "Total FCFA": subtotal,
    });
    if (discountAmount > 0) {
      sheetRows.push({
        Produit: `Remise (${clampedDiscountPct}%)`,
        Quantité: 0,
        "Prix Unitaire FCFA": 0,
        "Total FCFA": -discountAmount,
      });
    }
    if (vatAmount > 0) {
      sheetRows.push({
        Produit: "TVA (19,25%)",
        Quantité: 0,
        "Prix Unitaire FCFA": 0,
        "Total FCFA": vatAmount,
      });
    }
    sheetRows.push({
      Produit: "TOTAL À PAYER",
      Quantité: 0,
      "Prix Unitaire FCFA": 0,
      "Total FCFA": grandTotal,
    });

    const ws = XLSX.utils.json_to_sheet(sheetRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Facture");
    XLSX.writeFile(wb, `facture-${effectiveClientName.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
  }

  function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet) return;
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          wb.Sheets[firstSheet]
        );
        const imported: ExcelRow[] = [];
        for (const item of json) {
          const prod = String(
            item["Produit"] ?? item["produit"] ?? item["Product"] ?? item["Nom"] ?? ""
          ).trim();
          if (
            !prod ||
            prod.toUpperCase().includes("SOUS-TOTAL") ||
            prod.toUpperCase().includes("TOTAL") ||
            prod.toUpperCase().includes("REMISE") ||
            prod.toUpperCase().includes("TVA")
          ) {
            continue;
          }
          const qty = Number(
            item["Quantité"] ?? item["quantite"] ?? item["Qty"] ?? 1
          );
          const price = Number(
            item["Prix Unitaire FCFA"] ??
              item["Prix"] ??
              item["prix"] ??
              item["UnitPrice"] ??
              0
          );
          imported.push({
            id: `imp-${Date.now()}-${imported.length}`,
            product: prod,
            quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
            unitPrice: Number.isFinite(price) && price >= 0 ? price : 0,
          });
        }
        if (imported.length > 0) {
          setRows(imported);
          setFeedback(`✅ ${imported.length} ligne(s) importée(s) depuis Excel.`);
        } else {
          setErrorMsg(
            "Aucune ligne valide trouvée. Colonnes attendues : Produit | Quantité | Prix Unitaire FCFA"
          );
        }
      } catch {
        setErrorMsg("Impossible de lire ce fichier Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function handleSaveExcelInvoice() {
    setErrorMsg(null);
    setFeedback(null);
    const validLines = rows
      .map((r) => ({
        label: r.product.trim(),
        quantity: Math.max(1, Number(r.quantity) || 1),
        unitPrice: Math.max(0, Number(r.unitPrice) || 0),
      }))
      .filter((l) => l.label.length > 0);

    if (validLines.length === 0) {
      setErrorMsg("Ajoute au moins un produit dans le tableau.");
      return;
    }
    if (!clientId && !newClientName.trim()) {
      setErrorMsg("Sélectionne un client ou saisis le nom du client.");
      return;
    }

    setSaving(true);
    try {
      const res = await createDocumentRecord({
        docType: "invoice",
        clientId: clientId || undefined,
        newClientName: !clientId ? newClientName.trim() : undefined,
        newClientPhone: !clientId ? newClientPhone.trim() : undefined,
        dueDate: new Date().toISOString().slice(0, 10),
        label: validLines[0].label,
        quantity: validLines[0].quantity,
        unitPrice: validLines[0].unitPrice,
        lines: validLines,
        discountAmount,
        paidAmount: grandTotal,
        paymentChannel,
        applyVat,
      });
      if (!res.ok) {
        setErrorMsg(res.error || "Erreur lors de l'enregistrement.");
        return;
      }
      setFeedback(
        `✅ Facture ${res.number || ""} enregistrée (${formatCFA(grandTotal)}) — Solde ${
          paymentChannel === "mobile_money"
            ? "Mobile Money"
            : paymentChannel === "bank_card"
              ? "Carte Bancaire"
              : "Espèces"
        } mis à jour !`
      );
      onInvoiceSaved?.({
        number: res.number || "FAC",
        total: grandTotal,
        channel: paymentChannel,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
      {/* Barre d'actions Excel / PDF / Logo (masquée à l'impression) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 no-print">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#0B1F3A]">
            📊 Tableau Excel Facture Intégré
          </h2>
          <p className="text-xs text-slate-500">
            Calcul automatique en direct, import/export Excel (.xlsx) et impression PDF propre.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-extrabold text-[#0B1F3A]">
            🖼️ Importer mon Logo
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
          <label className="cursor-pointer px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-extrabold text-blue-900">
            📥 Importer Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
          >
            📤 Exporter Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold"
          >
            🖨️ Imprimer / PDF
          </button>
        </div>
      </div>

      {/* En-tête Facture imprimable avec Logo Entreprise + Client + Lien Facebook */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyAvatar
            logoUrl={customLogo || org.logoUrl}
            name={org.name || "Entreprise"}
            size={56}
          />
          <div className="min-w-0">
            <div className="text-base font-black text-[#0B1F3A] truncate">
              {org.name}
            </div>
            <div className="text-xs text-slate-600 truncate">
              {org.address || org.city} · {org.phone}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <div className="text-xs font-bold uppercase text-slate-500">
            Client facturé
          </div>
          <div className="text-sm font-black text-[#0B1F3A]">
            {effectiveClientName}
          </div>
          {effectiveFacebook ? (
            <a
              href={
                effectiveFacebook.startsWith("http")
                  ? effectiveFacebook
                  : `https://${effectiveFacebook}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1877F2] hover:underline"
            >
              <FacebookBlueIcon className="w-3.5 h-3.5" />
              <span>{effectiveFacebook}</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* Sélecteur Client + Paiement (masqué à l'impression) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Client
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#0B1F3A]"
          >
            <option value="">-- Nouveau client --</option>
            {org.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        </div>

        {!clientId ? (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom du client *
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Ex: Mahamat"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lien Facebook du client (optionnel)
              </label>
              <input
                type="url"
                value={clientFacebook}
                onChange={(e) => setClientFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mode de paiement (crédite le solde client)
            </label>
            <select
              value={paymentChannel}
              onChange={(e) =>
                setPaymentChannel(
                  e.target.value as "mobile_money" | "bank_card" | "cash"
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#0B1F3A]"
            >
              <option value="mobile_money">
                📱 Mobile Money (Orange / MTN / Wave)
              </option>
              <option value="bank_card">💳 Carte Bancaire (Visa / Mastercard)</option>
              <option value="cash">💵 Espèces</option>
            </select>
          </div>
        )}
      </div>

      {!clientId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 no-print">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Téléphone client
            </label>
            <input
              type="tel"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Ex: 699 00 00 00"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mode de paiement
            </label>
            <select
              value={paymentChannel}
              onChange={(e) =>
                setPaymentChannel(
                  e.target.value as "mobile_money" | "bank_card" | "cash"
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#0B1F3A]"
            >
              <option value="mobile_money">
                📱 Mobile Money (Orange / MTN / Wave)
              </option>
              <option value="bank_card">💳 Carte Bancaire (Visa / Mastercard)</option>
              <option value="cash">💵 Espèces</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Tableau Excel éditable */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="bg-[#0B1F3A] text-white text-xs font-extrabold uppercase">
              <th className="py-3 px-3">Produit</th>
              <th className="py-3 px-3 w-24">Quantité</th>
              <th className="py-3 px-3 w-40">Prix Unitaire FCFA</th>
              <th className="py-3 px-3 w-36 text-right">Total FCFA</th>
              <th className="py-3 px-3 w-36 text-center no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs sm:text-sm bg-white">
            {rows.map((row) => {
              const rowTotal =
                Math.max(0, Number(row.quantity) || 0) *
                Math.max(0, Number(row.unitPrice) || 0);
              return (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.product}
                      onChange={(e) =>
                        updateRow(row.id, { product: e.target.value })
                      }
                      placeholder="Nom du produit..."
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-semibold text-[#0B1F3A]"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(row.id, {
                          quantity: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-bold text-center"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={row.unitPrice}
                      onChange={(e) =>
                        updateRow(row.id, {
                          unitPrice: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-bold text-right"
                    />
                  </td>
                  <td className="p-2 text-right font-black text-emerald-700 whitespace-nowrap">
                    {formatAmountNumber(rowTotal)} FCFA
                  </td>
                  <td className="p-2 text-center no-print">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => duplicateRow(row)}
                        title="Dupliquer ligne"
                        className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold"
                      >
                        Dupliquer
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        title="Supprimer une ligne"
                        className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={addRow}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-extrabold border border-slate-300"
        >
          + Ajouter une ligne
        </button>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
          <label className="inline-flex items-center gap-2">
            <span>Remise (%) :</span>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-right font-bold"
            />
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyVat}
              onChange={(e) => setApplyVat(e.target.checked)}
            />
            <span>TVA (19,25%)</span>
          </label>
        </div>
      </div>

      {/* Totaux en bas : Sous-Total, Remise, TVA, TOTAL À PAYER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2 max-w-md ml-auto">
        <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600">
          <span>Sous-Total</span>
          <span>{formatCFA(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm font-bold text-amber-700">
          <span>Remise ({clampedDiscountPct}%)</span>
          <span>- {formatCFA(discountAmount)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600">
          <span>TVA {applyVat ? "(19,25%)" : "(0%)"}</span>
          <span>{formatCFA(vatAmount)}</span>
        </div>
        <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
          <span className="text-sm sm:text-base font-black text-[#0B1F3A]">
            TOTAL À PAYER
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700">
            {formatCFA(grandTotal)}
          </span>
        </div>
      </div>

      {errorMsg ? (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 no-print">
          ⚠️ {errorMsg}
        </div>
      ) : null}
      {feedback ? (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 no-print">
          {feedback}
        </div>
      ) : null}

      <div className="flex justify-end no-print">
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveExcelInvoice}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-sm disabled:opacity-50"
        >
          {saving
            ? "Enregistrement..."
            : "💾 Enregistrer la facture & créditer le solde"}
        </button>
      </div>
    </div>
  );
}
