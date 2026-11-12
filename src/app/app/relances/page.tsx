"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import {
  buildWhatsAppLink,
  formatCFA,
  type Locale,
  type ReminderTone,
} from "@/lib/format";
import { buildReminderMessage } from "@/lib/ai-parser";
import { createClient } from "@/lib/supabase/client";

export default function RemindersPage() {
  const { org, refreshOrgData } = useAppState();

  const [tones, setTones] = useState<Record<string, ReminderTone>>({});
  const [locales, setLocales] = useState<Record<string, Locale>>({});
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<string[]>([]);

  async function handleAiRewrite(
    remId: string,
    recipientName: string,
    documentNumber: string,
    balance: number,
    dueDate: string,
    daysOverdue: number,
    tone: ReminderTone,
    locale: Locale
  ) {
    setLoadingAiId(remId);
    try {
      const resp = await fetch("/api/ai/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: org.name,
          recipientName,
          documentNumber,
          balance,
          dueDate,
          daysOverdue,
          tone,
          locale,
          mtnMomo: org.mtnMomoNumber,
          orangeMoney: org.orangeMoneyNumber,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.message) {
        setCustomMessages((prev) => ({ ...prev, [remId]: data.message }));
      }
    } finally {
      setLoadingAiId(null);
    }
  }

  async function handleLogReminder(
    remId: string,
    documentId: string,
    tone: ReminderTone,
    message: string
  ) {
    if (!sentIds.includes(remId)) {
      setSentIds([...sentIds, remId]);
    }
    if (org.isLiveDb) {
      try {
        const supabase = createClient();
        await supabase.rpc("log_reminder", {
          p_doc: documentId,
          p_tone: tone,
          p_message: message,
        });
        await refreshOrgData();
      } catch {
        // Non-bloquant pour l'ouverture de WhatsApp
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
            💬 Relances WhatsApp Intelligentes (FR / EN)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calendrier J-3, Jour J, J+3, J+7, J+15 · Choisissez le ton (Courtois, Ferme, Dernier rappel), la langue (FR/EN) et envoyez en 1 clic à 0 FCFA.
          </p>
        </div>
        <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
          ⏰ Règle REL-5 : Aucune relance automatique entre 20h et 8h ni le dimanche.
        </div>
      </div>

      {org.reminders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-sm">
          <div className="text-lg font-extrabold text-[#0B1F3A]">
            🎉 Aucune facture en retard de paiement !
          </div>
          <p className="text-xs text-slate-500">
            Dès qu&apos;une facture émise dépassera son échéance ou approchera de J-3, elle apparaîtra automatiquement ici avec son message WhatsApp pré-rédigé.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {org.reminders.map((rem) => {
          const activeTone = tones[rem.id] ?? rem.suggestedTone;
          const activeLocale = locales[rem.id] ?? rem.locale;
          const defaultMsg = buildReminderMessage({
            orgName: org.name,
            recipientName: rem.payerName || rem.clientName,
            documentNumber: rem.documentNumber,
            balance: rem.balance,
            dueDate: rem.dueDate,
            daysOverdue: rem.daysOverdue,
            tone: activeTone,
            locale: activeLocale,
            mtnMomo: org.mtnMomoNumber,
            orangeMoney: org.orangeMoneyNumber,
          });
          const message = customMessages[rem.id] ?? defaultMsg;
          const waUrl = buildWhatsAppLink(rem.whatsappPhone, message);
          const isSent = sentIds.includes(rem.id);

          return (
            <div
              key={rem.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-[#0B1F3A]">
                      {rem.clientName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      Retard J+{rem.daysOverdue}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Facture <strong>{rem.documentNumber}</strong> · Solde à récupérer :{" "}
                    <strong className="text-[#0B1F3A]">{formatCFA(rem.balance)}</strong> · WhatsApp :{" "}
                    {rem.whatsappPhone}
                  </div>
                </div>

                {/* Sélecteur de ton (REL-3) + Langue FR/EN (IA-3) */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    {(
                      [
                        { id: "courteous", label: "🤝 Courtois" },
                        { id: "firm", label: "⚡ Ferme" },
                        { id: "final", label: "🚨 Dernier rappel" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTones({ ...tones, [rem.id]: t.id });
                          setCustomMessages((prev) => {
                            const next = { ...prev };
                            delete next[rem.id];
                            return next;
                          });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                          activeTone === t.id
                            ? "bg-[#0B1F3A] text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextLoc: Locale = activeLocale === "fr" ? "en" : "fr";
                      setLocales({ ...locales, [rem.id]: nextLoc });
                      setCustomMessages((prev) => {
                        const next = { ...prev };
                        delete next[rem.id];
                        return next;
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-extrabold text-[#0B1F3A] hover:bg-slate-50"
                  >
                    {activeLocale === "fr" ? "🇫🇷 FR → 🇬🇧 EN" : "🇬🇧 EN → 🇫🇷 FR"}
                  </button>

                  <button
                    type="button"
                    disabled={loadingAiId === rem.id}
                    onClick={() =>
                      handleAiRewrite(
                        rem.id,
                        rem.payerName || rem.clientName,
                        rem.documentNumber,
                        rem.balance,
                        rem.dueDate,
                        rem.daysOverdue,
                        activeTone,
                        activeLocale
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100"
                  >
                    {loadingAiId === rem.id ? "✨ IA..." : "✨ Nuancer par IA"}
                  </button>
                </div>
              </div>

              <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 leading-relaxed">
                {message}
              </pre>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isSent
                    ? "✅ Relance journalisée dans l'historique (log_reminder)"
                    : "Prêt à envoyer via WhatsApp"}
                </span>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    handleLogReminder(rem.id, rem.documentId, activeTone, message)
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                >
                  <span>💬 Ouvrir WhatsApp et envoyer</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
