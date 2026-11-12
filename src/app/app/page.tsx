"use client";

import React from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";
import { buildWhatsAppLink, formatCFA, formatDate } from "@/lib/format";
import { buildReminderMessage } from "@/lib/ai-parser";

export default function DashboardPage() {
  const { org, loadingData } = useAppState();

  const totalSales = org.documents
    .filter((d) => d.docType === "invoice")
    .reduce((acc, d) => acc + d.total, 0);
  const salesCount = org.documents.filter((d) => d.docType === "invoice").length;
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
          <Link
            href="/app/catalogue"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs sm:text-sm font-bold"
          >
            + Ajouter un produit
          </Link>
          <Link
            href="/app/documents"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm"
          >
            + Créer une facture
          </Link>
        </div>
      </div>

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
            {salesCount} {salesCount > 1 ? "ventes / factures" : "vente / facture"}
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
            {org.documents.filter((d) => d.balance > 0).length} facture(s) en attente
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
              Aucune donnée fictive n&apos;a été ajoutée. Commencez par enregistrer votre premier produit ou créez directement votre première commande / facture.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/app/catalogue"
              className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold shadow-sm"
            >
              + Ajouter mon premier produit
            </Link>
            <Link
              href="/app/documents"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm"
            >
              + Créer ma première facture
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
            {org.documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-extrabold text-[#0B1F3A]">
                    {doc.number}
                  </span>{" "}
                  — <span className="font-semibold">{doc.clientName}</span>
                  <div className="text-slate-500">
                    Date : {formatDate(doc.issueDate)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-[#0B1F3A]">
                      {formatCFA(doc.total)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Reste : {formatCFA(doc.balance)}
                    </div>
                  </div>
                  <Link
                    href={`/f/${doc.publicToken}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                  >
                    PDF
                  </Link>
                </div>
              </div>
            ))}
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
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    💬 Relancer sur WhatsApp
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
