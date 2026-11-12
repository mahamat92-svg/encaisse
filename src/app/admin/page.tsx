"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAppState } from "@/components/AppContext";
import {
  buildInvoiceWhatsAppMessage,
  formatCFA,
  formatDate,
} from "@/lib/format";
import { WhatsAppShareButton } from "@/components/WhatsAppButton";

export default function AdminDashboardPage() {
  const {
    org,
    addCatalogRecord,
    deleteCatalogRecord,
    createDocumentRecord,
  } = useAppState();

  // Formulaire rapide Créer un produit
  const [prodName, setProdName] = useState("");
  const [prodUnit, setProdUnit] = useState("unité");
  const [prodPrice, setProdPrice] = useState("");
  const [savingProd, setSavingProd] = useState(false);

  // Formulaire rapide Créer une facture
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [invProduct, setInvProduct] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [savingInv, setSavingInv] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalRevenue = org.documents
    .filter((d) => d.docType === "invoice")
    .reduce((acc, d) => acc + d.total, 0);
  const totalCollected = org.payments
    .filter((p) => p.status === "valid")
    .reduce((acc, p) => acc + p.amount, 0);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://encaisse.vercel.app";

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setFeedback(null);
    setSavingProd(true);
    try {
      const res = await addCatalogRecord({
        name: prodName,
        unit: prodUnit,
        unitPrice: Number(prodPrice) || 0,
      });
      if (!res.ok) {
        setErrorMsg(res.error || "Erreur création produit");
        return;
      }
      setProdName("");
      setProdPrice("");
      setFeedback("✅ Produit enregistré dans Supabase.");
    } finally {
      setSavingProd(false);
    }
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setFeedback(null);
    setSavingInv(true);
    try {
      const res = await createDocumentRecord({
        docType: "invoice",
        newClientName: clientName,
        newClientPhone: clientPhone,
        dueDate: new Date().toISOString().slice(0, 10),
        label: invProduct,
        quantity: 1,
        unitPrice: Number(invAmount) || 0,
        applyVat: false,
      });
      if (!res.ok) {
        setErrorMsg(res.error || "Erreur création facture");
        return;
      }
      setClientName("");
      setClientPhone("");
      setInvProduct("");
      setInvAmount("");
      setFeedback(
        `✅ Facture ${res.number ?? ""} créée. Lien client : ${origin}/pay/${
          res.publicToken ?? ""
        }`
      );
    } finally {
      setSavingInv(false);
    }
  }

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              👑 Interface Administrateur (/admin)
            </span>
            <h1 className="text-2xl font-extrabold mt-2">
              Pilotage global : Chiffre d&apos;affaires, Factures, Clients & Stock
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Protégé par authentification Supabase (`role = &apos;admin&apos;`). Les clients n&apos;ont accès qu&apos;à `/pay/[invoice_id]`.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              /dashboard
            </Link>
            <Link
              href="/invoices"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              /invoices
            </Link>
            <Link
              href="/products"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              /products
            </Link>
            <Link
              href="/clients"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              /clients
            </Link>
          </div>
        </div>

        {feedback ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
            {feedback}
          </div>
        ) : null}

        {errorMsg ? (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800">
            ⚠️ {errorMsg}
          </div>
        ) : null}

        {/* KPIs Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">
              Chiffre d&apos;affaires total
            </div>
            <div className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
              {formatCFA(totalRevenue)}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">
              Encaissé : {formatCFA(totalCollected)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">
              Toutes les factures
            </div>
            <div className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
              {org.documents.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {org.documents.filter((d) => d.balance > 0).length} en attente de
              paiement
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">
              Tous les clients
            </div>
            <div className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
              {org.clients.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Base clients isolée RLS
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold uppercase text-slate-500">
              Produits & Stock
            </div>
            <div className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
              {org.catalog.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Articles actifs au catalogue
            </div>
          </div>
        </div>

        {/* Actions rapides Admin : Créer Facture + Créer Produit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Créer une facture */}
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
          >
            <div className="font-extrabold text-sm text-[#0B1F3A]">
              🧾 Créer une facture (génère un lien client `/pay/[invoice_id]`)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client *"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Téléphone WhatsApp (237...)"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <input
                type="text"
                required
                value={invProduct}
                onChange={(e) => setInvProduct(e.target.value)}
                placeholder="Nom du produit *"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <input
                type="number"
                min={1}
                required
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                placeholder="Montant (XAF) *"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingInv}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold disabled:opacity-50"
            >
              {savingInv ? "Création..." : "+ Créer la facture"}
            </button>
          </form>

          {/* Créer un produit / stock */}
          <form
            onSubmit={handleCreateProduct}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
          >
            <div className="font-extrabold text-sm text-[#0B1F3A]">
              📦 Ajouter un produit au stock / catalogue
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Nom du produit *"
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <input
                type="text"
                required
                value={prodUnit}
                onChange={(e) => setProdUnit(e.target.value)}
                placeholder="Unité"
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <input
              type="number"
              min={1}
              required
              value={prodPrice}
              onChange={(e) => setProdPrice(e.target.value)}
              placeholder="Prix unitaire (XAF) *"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              disabled={savingProd}
              className="w-full py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold disabled:opacity-50"
            >
              {savingProd ? "Enregistrement..." : "+ Ajouter le produit"}
            </button>
          </form>
        </div>

        {/* Liste de toutes les factures */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-[#0B1F3A]">
              🧾 Toutes les factures ({org.documents.length})
            </h2>
            <Link
              href="/invoices"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Gérer dans /invoices →
            </Link>
          </div>

          {org.documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              Aucune facture enregistrée (0 XAF).
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {org.documents.map((doc) => {
                const productName =
                  doc.lines.map((l) => l.label).join(", ") || "Commande";
                const payUrl = `${origin}/pay/${doc.publicToken}`;
                const waMsg = buildInvoiceWhatsAppMessage({
                  clientName: doc.clientName,
                  invoiceNumber: doc.number,
                  amount: doc.total,
                  productName,
                  paymentUrl: payUrl,
                });

                return (
                  <div
                    key={doc.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-[#0B1F3A]">
                        {doc.number}
                      </span>{" "}
                      — <span className="font-semibold">{doc.clientName}</span>
                      <div className="text-slate-500">
                        {productName} · {formatDate(doc.issueDate)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-[#0B1F3A]">
                        {formatCFA(doc.total)}
                      </span>
                      <Link
                        href={`/pay/${doc.publicToken}`}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                      >
                        🔗 Lien client (/pay)
                      </Link>
                      <WhatsAppShareButton
                        phone={doc.whatsappPhone}
                        message={waMsg}
                        label="Envoyer sur WhatsApp"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Liste des produits et des clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="font-extrabold text-base text-[#0B1F3A]">
              📦 Stock / Produits ({org.catalog.length})
            </h2>
            {org.catalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Aucun produit dans le catalogue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {org.catalog.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-slate-500">Unité : {item.unit}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-[#0B1F3A]">
                        {formatCFA(item.unitPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteCatalogRecord(item.id)}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="font-extrabold text-base text-[#0B1F3A]">
              👥 Tous les clients ({org.clients.length})
            </h2>
            {org.clients.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                Aucun client enregistré.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {org.clients.map((c) => (
                  <div
                    key={c.id}
                    className="py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-slate-500">
                        {c.phone || "Sans téléphone"}
                      </div>
                    </div>
                    <div className="font-extrabold text-[#0B1F3A]">
                      Reste dû : {formatCFA(c.balance)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
