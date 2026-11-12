"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  BUSINESS_SERVICES,
  OFFICIAL_WHATSAPP_ACCOUNT_URL,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
} from "@/lib/format";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      {/* Section Héro */}
      <section className="bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] text-white py-16 sm:py-24 px-4 sm:px-6 flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span>🌍 InnovTech MHA Infinity</span>
              <span>•</span>
              <span>MTN MoMo · Orange Money · Fapshi · WhatsApp</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Une seule plateforme, tous vos métiers.{" "}
              <span className="text-emerald-400">Choisissez votre service.</span>
            </h1>

            {/* Questions ? WhatsApp: +235 66 26 85 03 sous le titre principal */}
            <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 text-sm sm:text-base font-extrabold text-white">
              <span>💬 Questions ? WhatsApp:</span>
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] hover:underline"
              >
                {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
            </div>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-medium">
              Encaisse, École, Clinique, Immobilier, Artisan, ONG - Facturation + Paiement Orange Money / MTN MoMo / Fapshi / WhatsApp
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/services"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0B1F3A] font-extrabold text-sm sm:text-base shadow-lg transition-colors"
              >
                Choisir mon service →
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm sm:text-base border border-white/20 transition-colors"
              >
                Se connecter
              </Link>
              <a
                href={OFFICIAL_WHATSAPP_ACCOUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-sm sm:text-base shadow-lg transition-colors"
              >
                💬 WhatsApp {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs sm:text-sm">
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-[#F5A524]">
                  6 Métiers
                </div>
                <div className="text-slate-300">
                  Boutique, École, Clinique, Immo, Artisan, ONG
                </div>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-emerald-400">
                  Fapshi & MoMo
                </div>
                <div className="text-slate-300">
                  Paiement Mobile Money direct
                </div>
              </div>
              <div>
                <div className="font-extrabold text-lg sm:text-xl text-white">
                  100% RLS
                </div>
                <div className="text-slate-300">
                  Accès Admin & Client séparés
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  Multi-Services SaaS · InnovTech MHA Infinity
                </span>
                <h2 className="font-extrabold text-lg text-[#0B1F3A]">
                  Quel est votre métier ?
                </h2>
                <p className="text-xs text-slate-500">
                  L&apos;interface s&apos;adapte automatiquement à votre activité (Boutique, École, Clinique, Immobilier, Artisan ou ONG).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {BUSINESS_SERVICES.map((srv) => (
                  <Link
                    key={srv.id}
                    href={`/inscription?service=${srv.id}`}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-1"
                  >
                    <div className="font-extrabold text-[#0B1F3A] flex items-center gap-1.5">
                      <span className="text-base">{srv.emoji}</span>
                      <span>{srv.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      {srv.subtitle}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/login"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold text-center shadow-sm transition-colors"
                >
                  Se connecter à l&apos;administration →
                </Link>
                <Link
                  href="/services"
                  className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-extrabold text-center border border-emerald-200 transition-colors"
                >
                  Voir les 6 services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aperçu des 6 services sur la page d'accueil */}
      <section className="py-14 px-4 sm:px-6 bg-[#F8FAFC] flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Nos 6 Solutions Métiers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
              Choisissez le service adapté à votre organisation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Besoin d&apos;accompagnement ? Écrivez-nous directement sur WhatsApp au{" "}
              <a
                href={OFFICIAL_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#128C7E] hover:underline"
              >
                {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BUSINESS_SERVICES.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl">
                    {srv.emoji}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                    {srv.title}
                  </h3>
                  <p className="text-xs font-bold text-emerald-700">
                    {srv.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {srv.features.map((f) => (
                      <span
                        key={f}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href={`/inscription?service=${srv.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold text-center transition-colors"
                  >
                    Choisir ce service
                  </Link>
                  <a
                    href={`https://wa.me/23566268503?text=${encodeURIComponent(
                      `Bonjour InnovTech MHA Infinity, je choisis le service : ${srv.title} (${srv.subtitle}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-xs font-extrabold text-center transition-colors"
                  >
                    💬 Activer sur WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
