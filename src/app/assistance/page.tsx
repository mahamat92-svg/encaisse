"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  buildWhatsAppLink,
  DEFAULT_MERCHANT_LOCATION_LABEL,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

export default function HelpCenterPage() {
  const { org, supabaseReady } = useAppState();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const supportPhone = OFFICIAL_WHATSAPP_DIGITS;

  const faqs = [
    {
      q: "Comment fonctionne l'envoi de factures et relances sur WhatsApp à 0 FCFA ?",
      a: "En V1, InnovTech Encaisse génère un lien officiel wa.me avec le message poli pré-rédigé par l'IA et le lien de la facture. Lorsque vous cliquez sur « Envoyer sur WhatsApp », votre application WhatsApp s'ouvre directement sur le numéro du client ou du parent d'élève : vous n'avez aucun frais d'API Meta à payer.",
    },
    {
      q: "Comment éviter les faux SMS de paiement Mobile Money ?",
      a: "Chaque paiement enregistré avec une référence MTN MoMo ou Orange Money est contrôlé par un index unique en base de données (Règle PAY-5). Si un client tente de réutiliser une ancienne référence de transaction, le système la bloque immédiatement avec l'alerte DUPLICATE_REFERENCE.",
    },
    {
      q: "Puis-je utiliser InnovTech Encaisse pour une école privée ET pour un commerce ?",
      a: "Oui ! Un même compte utilisateur peut gérer plusieurs entreprises ou établissements (jusqu'à 5 en tant que propriétaire), chacun totalement isolé grâce à la sécurité Row Level Security (RLS).",
    },
    {
      q: "Comment payer mon abonnement InnovTech Encaisse au Cameroun ?",
      a: "Depuis la page Abonnement de votre espace, vous choisissez votre formule (2 500 à 50 000 FCFA), effectuez le dépôt par MTN MoMo ou Orange Money aux coordonnées affichées, puis saisissez la référence de transaction. Votre abonnement est activé dès validation.",
    },
  ];

  async function handleTicket(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (supabaseReady && org.isLiveDb) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("support_tickets").insert({
            org_id: org.id,
            user_id: user.id,
            subject: subject.trim(),
            message: message.trim(),
          });
        }
      }
      setSubmitted(true);
      setSubject("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1F3A] text-white p-6 sm:p-8 rounded-2xl">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Centre d&apos;assistance Francophone & Anglophone
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Besoin d&apos;aide ? Notre équipe vous répond sur WhatsApp
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              📍 {DEFAULT_MERCHANT_LOCATION_LABEL} | 📧 Email:{" "}
              <a href={`mailto:${OFFICIAL_EMAIL}`} className="underline text-white">
                {OFFICIAL_EMAIL}
              </a>{" "}
              | 📱 WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}
            </p>
          </div>
          <a
            href={buildWhatsAppLink(
              supportPhone,
              "Bonjour l'équipe InnovTech Encaisse, j'ai besoin d'assistance :"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] font-extrabold text-sm shadow"
          >
            <span>💬 Écrire au support WhatsApp</span>
          </a>
        </div>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-[#0B1F3A]">
            Questions fréquentes (FAQ)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm"
              >
                <h3 className="font-bold text-sm text-[#0B1F3A]">{item.q}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Formulaire de ticket support (AIDE-3) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-[#0B1F3A]">
            Signaler un problème ou demander une fonctionnalité
          </h2>
          <form onSubmit={handleTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sujet de votre demande *
              </label>
              <input
                type="text"
                required
                minLength={3}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Question sur l'importation d'une classe de 6ème"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Détails *
              </label>
              <textarea
                rows={4}
                required
                minLength={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Expliquez votre besoin ou le problème rencontré..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            {submitted ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                ✅ Votre ticket a bien été enregistré et transmis à l&apos;espace Super-Administrateur.
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white text-xs font-bold"
            >
              {submitting ? "Envoi en cours..." : "Envoyer le ticket au support"}
            </button>
          </form>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
