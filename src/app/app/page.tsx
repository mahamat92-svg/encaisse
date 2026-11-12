"use client";

import React from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";
import { buildWhatsAppLink, formatCFA } from "@/lib/format";
import { getLabels } from "@/lib/i18n";
import { buildReminderMessage } from "@/lib/ai-parser";

export default function DashboardPage() {
  const { locale, mode, org } = useAppState();
  const { t, m } = getLabels(locale, mode);

  const receivable = org.documents.reduce((acc, d) => acc + d.balance, 0);
  const overdue = org.documents
    .filter((d) => d.daysOverdue > 0)
    .reduce((acc, d) => acc + d.balance, 0);
  const collectedMonth = org.payments
    .filter((p) => p.status === "valid")
    .reduce((acc, p) => acc + p.amount, 0);
  const remindersCount = org.reminders.length;

  const debtors = [...org.clients]
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* En-tête de l'entreprise */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
            <span>{mode === "etablissement" ? "🎓" : "🏪"}</span>
            <span>{m.title}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A]">
            {org.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            📍 {org.city} · NIU : {org.niu} · Essai Pro actif ({org.trialDaysLeft} jours restants)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/ia"
            className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-bold shadow-sm"
          >
            ✨ Dictée IA (30s)
          </Link>
          <Link
            href="/app/documents"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm"
          >
            + Nouvelle facture
          </Link>
        </div>
      </div>

      {/* 4 Cartes KPI (DASH-1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.kpi.receivable}
          </div>
          <div className="text-2xl font-extrabold text-[#0B1F3A] mt-2">
            {formatCFA(receivable)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Sur {org.documents.filter((d) => d.balance > 0).length} factures ouvertes
          </div>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            {t.kpi.collectedMonth}
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {formatCFA(collectedMonth)}
          </div>
          <div className="text-xs text-emerald-800 mt-1">
            {org.payments.length} reçus officiels émis
          </div>
        </div>

        <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-red-800">
            {t.kpi.overdue}
          </div>
          <div className="text-2xl font-extrabold text-red-700 mt-2">
            {formatCFA(overdue)}
          </div>
          <div className="text-xs text-red-700 mt-1">
            Échéance dépassée (à relancer)
          </div>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
            {t.kpi.remindersToday}
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-2">
            {remindersCount} {remindersCount > 1 ? "dossiers" : "dossier"}
          </div>
          <Link
            href="/app/relances"
            className="inline-block text-xs font-bold text-[#0B1F3A] underline mt-1"
          >
            Ouvrir la file WhatsApp →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File "À relancer aujourd'hui" */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-[#0B1F3A]">
                💬 À relancer aujourd&apos;hui sur WhatsApp
              </h2>
              <p className="text-xs text-slate-500">
                1 clic ouvre WhatsApp avec le message IA poli et vos numéros Mobile Money.
              </p>
            </div>
            <Link
              href="/app/relances"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Tout voir →
            </Link>
          </div>

          {org.reminders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              🎉 Aucune facture en retard à relancer aujourd&apos;hui !
            </div>
          ) : (
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0B1F3A]">
                          {rem.clientName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                          Retard J+{rem.daysOverdue}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Facture <strong>{rem.documentNumber}</strong> · Reste dû :{" "}
                        <strong className="text-[#0B1F3A]">{formatCFA(rem.balance)}</strong>
                      </div>
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-sm"
                    >
                      <span>💬 Relancer sur WhatsApp</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 5 des débiteurs */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-[#0B1F3A]">
                📋 Qui me doit combien (Top débiteurs)
              </h2>
              <p className="text-xs text-slate-500">
                Soldes cumulés en temps réel par {m.clientLabel.toLowerCase()}.
              </p>
            </div>
            <Link
              href="/app/clients"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Liste complète →
            </Link>
          </div>

          {debtors.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
              Aucun solde débiteur en cours.
            </div>
          ) : (
            <div className="space-y-2.5">
              {debtors.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-sm text-[#0B1F3A]">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {c.className ? `${c.className} · ${c.payerName}` : `${c.city} · ${c.phone}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-[#0B1F3A]">
                      {formatCFA(c.balance)}
                    </div>
                    {c.overdueBalance > 0 ? (
                      <div className="text-[11px] font-bold text-red-600">
                        dont {formatCFA(c.overdueBalance)} échu
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-600 font-medium">
                        Dans les délais
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
