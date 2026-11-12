"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  BUSINESS_SERVICES,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
  type BusinessType,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";

function InscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { org, isAdmin, refreshOrgData } = useAppState();

  const initialServiceParam = searchParams?.get("service") as BusinessType | null;
  const validInitialService: BusinessType = BUSINESS_SERVICES.some(
    (s) => s.id === initialServiceParam
  )
    ? (initialServiceParam as BusinessType)
    : org.businessType || "boutique";

  const [businessType, setBusinessType] =
    useState<BusinessType>(validInitialService);
  const [companyName, setCompanyName] = useState(org.name || "");
  const [whatsappPhone, setWhatsappPhone] = useState(
    org.phone || OFFICIAL_WHATSAPP_DIGITS
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (
      initialServiceParam &&
      BUSINESS_SERVICES.some((s) => s.id === initialServiceParam)
    ) {
      setBusinessType(initialServiceParam as BusinessType);
    }
  }, [initialServiceParam]);

  const selectedService =
    BUSINESS_SERVICES.find((s) => s.id === businessType) ?? BUSINESS_SERVICES[0];

  async function handleSaveServiceOrSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMsg("Supabase n'est pas configuré.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user: existingUser },
      } = await supabase.auth.getUser();

      // Cas 1 : L'administrateur est déjà connecté -> mettre à jour directement son métier dans merchant_settings
      if (existingUser && isAdmin && org.isLiveDb) {
        const cleanName = companyName.trim() || org.name || "InnovTech MHA Infinity";
        const cleanPhone = whatsappPhone.trim() || OFFICIAL_WHATSAPP_DIGITS;

        const { error: msErr } = await supabase.from("merchant_settings").upsert(
          {
            user_id: existingUser.id,
            org_id: org.id,
            company_name: cleanName,
            business_type: businessType,
            whatsapp_phone: cleanPhone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (msErr) {
          await supabase.from("merchant_settings").upsert(
            {
              user_id: existingUser.id,
              org_id: org.id,
              company_name: cleanName,
              whatsapp_phone: cleanPhone,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }

        const footerNoteJson = JSON.stringify({
          fapshiApiUser: org.fapshi.apiUser,
          fapshiApiKey: org.fapshi.apiKey,
          fapshiEnv: org.fapshi.environment,
          email: org.email,
          slogan: org.slogan,
          primaryColor: org.primaryColor,
          rccmNiu: org.rccmNiu,
          logoUrl: org.logoUrl,
          businessType,
        });

        await supabase
          .from("organizations")
          .update({
            name: cleanName,
            mode: businessType === "ecole" ? "etablissement" : "commerce",
            phone: cleanPhone,
            footer_note: footerNoteJson,
          })
          .eq("id", org.id);

        await refreshOrgData();
        router.push("/admin");
        return;
      }

      // Cas 2 : Inscription d'un nouveau compte avec choix du métier
      if (!email.trim() || !password.trim()) {
        setErrorMsg(
          "Veuillez renseigner votre email et mot de passe, ou cliquez sur le bouton WhatsApp ci-dessous."
        );
        setSaving(false);
        return;
      }

      const cleanName = companyName.trim() || "Mon Entreprise";
      const cleanPhone = whatsappPhone.trim() || OFFICIAL_WHATSAPP_DIGITS;

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            org_name: cleanName,
            business_type: businessType,
            org_mode: businessType === "ecole" ? "etablissement" : "commerce",
            phone: cleanPhone,
            role: "admin",
          },
        },
      });

      if (signUpErr) {
        setErrorMsg(signUpErr.message);
        return;
      }

      if (signUpData.user) {
        await supabase.from("merchant_settings").upsert(
          {
            user_id: signUpData.user.id,
            company_name: cleanName,
            business_type: businessType,
            whatsapp_phone: cleanPhone,
            email: email.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }

      setMessage(
        `Votre métier « ${selectedService.title} » a bien été enregistré ! Vous pouvez maintenant vous connecter ou nous écrire sur WhatsApp.`
      );
      await refreshOrgData();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setSaving(false);
    }
  }

  const whatsappDirectUrl = `https://wa.me/23566268503?text=${encodeURIComponent(
    `Bonjour InnovTech MHA Infinity, je veux activer le service : ${selectedService.emoji} ${selectedService.title} (${selectedService.subtitle}). Entreprise : ${
      companyName.trim() || "À préciser"
    }`
  )}`;

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2 border-b border-slate-100 pb-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Onboarding Multi-Services · InnovTech MHA Infinity
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
            Quel est votre métier ?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Choisissez parmi nos 6 services métiers. Votre choix est sauvegardé dans{" "}
            <code>merchant_settings.business_type</code> et adapte automatiquement votre espace d&apos;administration.
          </p>
        </div>

        <form onSubmit={handleSaveServiceOrSignup} className="space-y-6">
          {/* 6 choix de métier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BUSINESS_SERVICES.map((srv) => {
              const selected = businessType === srv.id;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => setBusinessType(srv.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                    selected
                      ? "border-emerald-600 bg-emerald-50/70 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{srv.emoji}</span>
                      {selected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                          Sélectionné
                        </span>
                      ) : null}
                    </div>
                    <div className="font-extrabold text-sm text-[#0B1F3A]">
                      {srv.title}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">
                      {srv.subtitle}
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 pt-1 border-t border-slate-200/70">
                    Labels : {srv.productsLabel} · {srv.clientsLabel}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom de votre organisation / structure *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={`Ex: Mon ${selectedService.title}`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone WhatsApp
              </label>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="23566268503"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            {!isAdmin ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email administrateur
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@monentreprise.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </>
            ) : null}
          </div>

          {errorMsg ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              ⚠️ {errorMsg}
            </div>
          ) : null}

          {message ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              ✅ {message}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs sm:text-sm font-extrabold shadow-sm disabled:opacity-50"
            >
              {saving
                ? "Enregistrement..."
                : isAdmin
                  ? `Enregistrer le métier « ${selectedService.title} » et ouvrir l'Admin`
                  : `Valider mon métier (${selectedService.title})`}
            </button>

            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs sm:text-sm font-extrabold text-center shadow-sm"
            >
              💬 Continuer sur WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})
            </a>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Déjà administrateur ?</span>
          <Link href="/login" className="font-extrabold text-[#0B1F3A] hover:underline">
            Se connecter à /login →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function InscriptionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
            Chargement des services...
          </div>
        }
      >
        <InscriptionContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}
