"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  MTN_MOMO_PAY_NUMBER,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
  ORANGE_MONEY_PAY_NUMBER,
  PAYMENT_BENEFICIARY_NAME,
} from "@/lib/format";

export default function AidePage() {
  const waHelpUrl = `https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}?text=${encodeURIComponent(
    "Bonjour InnovTech MHA Infinity, j'ai besoin d'aide sur Encaisse."
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0B1F3A]">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="rounded-3xl bg-emerald-50 border-2 border-emerald-500 p-6 sm:p-8 text-center space-y-4">
          <div className="text-4xl">💬</div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#0B1F3A]">
            Besoin d&apos;aide ? Nous sommes là !
          </h1>
          <p className="text-sm sm:text-base text-slate-700 max-w-xl mx-auto">
            Une question pour créer ton compte, te connecter, publier un produit
            ou valider ton paiement ? Écris-nous directement sur WhatsApp.
          </p>
          <div className="pt-2">
            <a
              href={waHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#1fb857] text-white text-base sm:text-lg font-black shadow-lg transition-colors"
            >
              <span>💬</span>
              <span>Écrire sur WhatsApp : {OFFICIAL_WHATSAPP_DISPLAY}</span>
            </a>
          </div>
          <div className="text-xs font-bold text-slate-600">
            📍 Ngaoundéré, Cameroun · 📧{" "}
            <a href={`mailto:${OFFICIAL_EMAIL}`} className="underline">
              {OFFICIAL_EMAIL}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
            <h2 className="text-base font-black text-[#0B1F3A]">
              🔐 Problème de connexion ?
            </h2>
            <p className="text-sm text-slate-600">
              Si tu as oublié ton mot de passe, clique sur{" "}
              <strong>&laquo; Mot de passe oublié ? &raquo;</strong> sur la page{" "}
              <Link href="/login" className="text-emerald-700 underline font-bold">
                Se connecter
              </Link>{" "}
              ou écris-nous sur WhatsApp.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
            <h2 className="text-base font-black text-[#0B1F3A]">
              💳 Comment payer l&apos;abonnement ?
            </h2>
            <p className="text-sm text-slate-600">
              Envoie le montant sur <strong>Orange Money : {ORANGE_MONEY_PAY_NUMBER}</strong>{" "}
              ou <strong>MTN MoMo : {MTN_MOMO_PAY_NUMBER}</strong> au nom de{" "}
              <strong>{PAYMENT_BENEFICIARY_NAME}</strong>, puis clique sur{" "}
              <strong>&laquo; J&apos;ai payé &raquo;</strong> dans{" "}
              <Link
                href="/app/abonnement"
                className="text-emerald-700 underline font-bold"
              >
                Mon Abonnement
              </Link>
              .
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
            <h2 className="text-base font-black text-[#0B1F3A]">
              📣 Comment publier en 1 clic ?
            </h2>
            <p className="text-sm text-slate-600">
              Va sur{" "}
              <Link
                href="/produits"
                className="text-emerald-700 underline font-bold"
              >
                Publier mes Produits
              </Link>
              , ajoute la photo et le prix, puis clique sur Statut WhatsApp,
              TikTok ou Facebook.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 space-y-2">
            <h2 className="text-base font-black text-[#0B1F3A]">
              🌍 Voir les produits par ville
            </h2>
            <p className="text-sm text-slate-600">
              Consulte tous les produits et services à N&apos;Djamena, Garoua,
              Douala, Ngaoundéré et Yaoundé sur{" "}
              <Link
                href="/decouvrir"
                className="text-emerald-700 underline font-bold"
              >
                Découvrir
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

