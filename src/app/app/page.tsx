"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";
import {
  buildInvoiceWhatsAppMessage,
  buildWhatsAppLink,
  formatCFA,
  formatDate,
} from "@/lib/format";
import { buildReminderMessage } from "@/lib/ai-parser";
import { WhatsAppIcon, WhatsAppShareButton } from "@/components/WhatsAppButton";

interface CreatedWhatsAppSale {
  clientName: string;
  clientPhone: string;
  invoiceNumber: string;
  productName: string;
  amount: number;
  publicToken: string;
}

export default function DashboardPage() {
  const { org, loadingData, createDocumentRecord } = useAppState();

  // État pour FEATURE 2 : "Nouvelle vente WhatsApp"
  const [showWaForm, setShowWaForm] = useState(false);
  const [waClientName, setWaClientName] = useState("");
  const [waClientPhone, setWaClientPhone] = useState("");
  const [waProduct, setWaProduct] = useState("");
  const [waAmount, setWaAmount] = useState("");
  const [savingWa, setSavingWa] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [createdSale, setCreatedSale] = useState<CreatedWhatsAppSale | null>(
    null
  );

  const totalSales = org.documents
    .filter((d) => d.docType === "invoice")
    .reduce((acc, d) => acc + d.total, 0);
  const salesCount = org.documents.filter(
    (d) => d.docType === "invoice"
  ).length;
  const receivable = org.documents
    .filter((d) => d.docType === "invoice")
    .reduce((acc, d) => acc + d.balance, 0);
  const collectedTotal = org.payments
    .filter((p) => p.status === "valid")
    .reduce((acc, p) => acc + p.amount, 0);

  const isEmptyWorkspace =
    org.catalog.length === 0 &&
    org.documents.length === 0 &&
    org.clients.length === 0;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://encaisse.vercel.app";

  async function handleCreateWhatsAppOrder(e: React.FormEvent) {
    e.preventDefault();
    setWaError(null);
    setCreatedSale(null);

    const cleanName = waClientName.trim();
    const cleanPhone = waClientPhone.trim();
    const cleanProduct = waProduct.trim();
    const numAmount = Math.round(Number(waAmount));

    if (!cleanName || !cleanProduct || !numAmount || numAmount <= 0) {
      setWaError(
        "Veuillez remplir le nom du client, le produit et un montant valide."
      );
      return;
    }

    setSavingWa(true);
    try {
      const res = await createDocumentRecord({
        docType: "invoice",
        newClientName: cleanName,
        newClientPhone: cleanPhone,
        dueDate: new Date().toISOString().slice(0, 10),
        label: cleanProduct,
        quantity: 1,
        unitPrice: numAmount,
        applyVat: false,
      });

      if (!res.ok) {
        setWaError(
          res.error || "Erreur lors de l'enregistrement dans Supabase."
        );
        return;
      }

      setCreatedSale({
        clientName: cleanName,
        clientPhone: cleanPhone,
        invoiceNumber: res.number || "FAC",
        productName: cleanProduct,
        amount: numAmount,
        publicToken: res.publicToken || "",
      });

      setWaClientName("");
      setWaClientPhone("");
      setWaProduct("");
      setWaAmount("");
    } finally {
      setSavingWa(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête de l'entreprise */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
            Tableau de bord
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A]">
            {org.name || "Mon Entreprise"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {org.city ? `📍 ${org.city} · ` : ""}
            Données en temps réel connectées à Supabase
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowWaForm(!showWaForm);
              setCreatedSale(null);
              setWaError(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>Nouvelle vente WhatsApp</span>
          </button>

          <Link
            href="/app/catalogue"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs sm:text-sm font-bold"
          >
            + Ajouter un produit
          </Link>
          <Link
            href="/app/documents"
            className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-bold shadow-sm"
          >
            + Créer une facture
          </Link>
        </div>
      </div>

      {/* FEATURE 2 : Formulaire "Nouvelle vente WhatsApp" + bouton d'envoi automatique après sauvegarde */}
      {showWaForm ? (
        <div className="bg-white rounded-2xl border-2 border-[#25D366] p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center">
                <WhatsAppIcon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-[#0B1F3A]">
                  Nouvelle vente WhatsApp
                </h2>
                <p className="text-xs text-slate-500">
                  Crée une vraie facture dans Supabase et prépare l&apos;envoi immédiat sur WhatsApp.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowWaForm(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕ Fermer
            </button>
          </div>

          {createdSale ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                  ✅ Facture enregistrée dans Supabase
                </div>
                <div className="text-base font-extrabold text-[#0B1F3A]">
                  {createdSale.invoiceNumber} — {createdSale.clientName} (
                  {formatCFA(createdSale.amount)})
                </div>
                <p className="text-xs text-slate-600">
                  Produit : <strong>{createdSale.productName}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <WhatsAppShareButton
                  phone={createdSale.clientPhone}
                  message={buildInvoiceWhatsAppMessage({
                    clientName: createdSale.clientName,
                    invoiceNumber: createdSale.invoiceNumber,
                    amount: createdSale.amount,
                    productName: createdSale.productName,
                    paymentUrl: `${origin}/f/${createdSale.publicToken}`,
                  })}
                  label="Envoyer sur WhatsApp"
                />

                {createdSale.publicToken ? (
                  <Link
                    href={`/f/${createdSale.publicToken}`}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0B1F3A] text-xs sm:text-sm font-bold hover:bg-slate-50"
                  >
                    📄 Voir la facture
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => setCreatedSale(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  + Autre vente WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateWhatsAppOrder} className="space-y-4">
              {org.catalog.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-500">
                    Choisir un produit existant :
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {org.catalog.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setWaProduct(item.name);
                          setWaAmount(String(item.unitPrice));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-xs font-semibold text-slate-700 border border-slate-200"
                      >
                        {item.name} ({formatCFA(item.unitPrice)})
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom client *
                  </label>
                  <input
                    type="text"
                    required
                    value={waClientName}
                    onChange={(e) => setWaClientName(e.target.value)}
                    placeholder="Nom du client"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Téléphone WhatsApp (237...)
                  </label>
                  <input
                    type="tel"
                    value={waClientPhone}
                    onChange={(e) => setWaClientPhone(e.target.value)}
                    placeholder="237..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Produit *
                  </label>
                  <input
                    type="text"
                    required
                    value={waProduct}
                    onChange={(e) => setWaProduct(e.target.value)}
                    placeholder="Nom du produit ou service"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Montant (XAF) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={waAmount}
                    onChange={(e) => setWaAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {waError ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
                  ⚠️ {waError}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingWa}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-sm disabled:opacity-50"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>
                    {savingWa
                      ? "Enregistrement..."
                      : "Enregistrer & Préparer l'envoi WhatsApp"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {/* 4 Cartes KPI (affichent 0 XAF et 0 vente si la base est vide) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Chiffre d&apos;affaires facturé
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
            {formatCFA(totalSales)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {salesCount}{" "}
            {salesCount > 1 ? "ventes / factures" : "vente / facture"}
          </div>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Total encaissé
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {formatCFA(collectedTotal)}
          </div>
          <div className="text-xs text-emerald-800 mt-1">
            {org.payments.length}{" "}
            {org.payments.length > 1 ? "paiements reçus" : "paiement reçu"}
          </div>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Reste à encaisser
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-2">
            {formatCFA(receivable)}
          </div>
          <div className="text-xs text-amber-800 mt-1">
            {org.documents.filter((d) => d.balance > 0).length} facture(s) en
            attente
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Catalogue & Clients
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
            {org.catalog.length} produit(s)
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {org.clients.length} client(s) enregistré(s)
          </div>
        </div>
      </div>

      {/* État vide principal si aucune donnée n'existe encore */}
      {!loadingData && isEmptyWorkspace ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center max-w-2xl mx-auto my-6 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-2xl mx-auto">
            📦
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-[#0B1F3A]">
              Votre espace est prêt et vierge (0 XAF)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Aucune donnée fictive n&apos;a été ajoutée. Commencez par enregistrer votre premier produit ou lancez une vente WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowWaForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-extrabold shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Nouvelle vente WhatsApp</span>
            </button>
            <Link
              href="/app/catalogue"
              className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold shadow-sm"
            >
              + Ajouter mon premier produit
            </Link>
            <Link
              href="/app/parametres"
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold"
            >
              ⚙️ Connecter Fapshi API
            </Link>
          </div>
        </div>
      ) : null}

      {/* Dernières commandes / factures réelles */}
      {org.documents.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-[#0B1F3A]">
              🧾 Dernières commandes & factures
            </h2>
            <Link
              href="/app/documents"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Voir toutes les factures →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {org.documents.slice(0, 5).map((doc) => {
              const productName =
                doc.lines.map((l) => l.label).join(", ") || "votre commande";
              const paymentUrl = `${origin}/f/${doc.publicToken}`;
              const waMsg = buildInvoiceWhatsAppMessage({
                clientName: doc.clientName,
                invoiceNumber: doc.number,
                amount: doc.total,
                productName,
                paymentUrl,
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
                      {productName} · Date : {formatDate(doc.issueDate)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-sm text-[#0B1F3A]">
                        {formatCFA(doc.total)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Reste : {formatCFA(doc.balance)}
                      </div>
                    </div>
                    <Link
                      href={`/f/${doc.publicToken}`}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                    >
                      📄 Facture
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
        </div>
      ) : null}

      {/* Relances en attente (uniquement s'il y en a réellement) */}
      {org.reminders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="font-extrabold text-base text-[#0B1F3A]">
            💬 Relances WhatsApp à envoyer
          </h2>
          <div className="space-y-3">
            {org.reminders.map((rem) => {
              const msg = buildReminderMessage({
                orgName: org.name,
                recipientName: rem.payerName || rem.clientName,
                documentNumber: rem.documentNumber,
                balance: rem.balance,
                dueDate: rem.dueDate,
                daysOverdue: rem.daysOverdue,
                tone: rem.suggestedTone,
                locale: rem.locale,
                mtnMomo: org.mtnMomoNumber,
                orangeMoney: org.orangeMoneyNumber,
              });
              const waUrl = buildWhatsAppLink(rem.whatsappPhone, msg);
              return (
                <div
                  key={rem.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-[#0B1F3A]">
                      {rem.clientName} — {rem.documentNumber}
                    </div>
                    <div className="text-xs text-slate-600">
                      Reste dû : <strong>{formatCFA(rem.balance)}</strong>
                    </div>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Envoyer sur WhatsApp</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
