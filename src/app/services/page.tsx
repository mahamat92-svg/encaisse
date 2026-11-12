"use client";

import React from "react";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  BUSINESS_SERVICES,
  OFFICIAL_WHATSAPP_DISPLAY,
  OFFICIAL_WHATSAPP_URL,
} from "@/lib/format";

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12 w-full">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Multi-Services SaaS · InnovTech MHA Infinity
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0B1F3A] leading-tight">
            Une seule plateforme, tous vos métiers. Choisissez votre service.
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Encaisse, École, Clinique, Immobilier, Artisan, ONG - Facturation + Paiement Orange Money / MTN MoMo / Fapshi / WhatsApp
          </p>
          <div className="pt-1">
            <a
              href={OFFICIAL_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors"
            >
              <span>💬 Questions ? WhatsApp: {OFFICIAL_WHATSAPP_DISPLAY}</span>
            </a>
          </div>
        </div>

        {/* 6 Grandes Cartes Cliquables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BUSINESS_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 p-6 sm:p-7 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl">
                    {srv.emoji}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider">
                    {srv.id}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-[#0B1F3A]">
                    {srv.emoji} {srv.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">
                    {srv.subtitle}
                  </p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                  {srv.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 font-semibold">
                      <span className="text-emerald-600 font-extrabold">✔</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-slate-500">
                    <span className="text-emerald-600 font-extrabold">✔</span>
                    <span>
                      Menu adapté :{" "}
                      <strong className="text-slate-800">{srv.productsLabel}</strong> &{" "}
                      <strong className="text-slate-800">{srv.clientsLabel}</strong>
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  href={`/inscription?service=${srv.id}`}
                  className="block w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold text-center shadow-sm transition-colors"
                >
                  Choisir ce service →
                </Link>
                <a
                  href={`https://wa.me/23566268503?text=${encodeURIComponent(
                    `Bonjour InnovTech MHA Infinity, je veux choisir le service ${srv.title} (${srv.subtitle}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-extrabold text-center shadow-sm transition-colors"
                >
                  💬 Choisir sur WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bandeau Contact WhatsApp */}
        <div className="bg-[#0B1F3A] text-white rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-extrabold">
            Besoin d&apos;une configuration sur mesure pour votre métier ?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Notre équipe à Ngaoundéré configure votre espace (Boutique, École, Clinique, Immobilier, Artisan ou ONG) avec votre logo et vos clés Fapshi.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/23566268503?text=${encodeURIComponent(
                "Bonjour InnovTech MHA Infinity, je veux un compte"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-sm shadow-md"
            >
              💬 Discuter sur WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})
            </a>
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm"
            >
              Se connecter à mon compte
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
