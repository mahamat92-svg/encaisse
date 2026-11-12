"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  BUSINESS_SERVICES,
  OFFICIAL_WHATSAPP_DIGITS,
  type BusinessType,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshOrgData } = useAppState();

  const serviceParam = searchParams?.get("service") as BusinessType | null;
  const planParam = searchParams?.get("plan") || "pro";

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState(OFFICIAL_WHATSAPP_DIGITS);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("boutique");
  const [selectedPlan, setSelectedPlan] = useState<string>(planParam);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (
      serviceParam &&
      BUSINESS_SERVICES.some((s) => s.id === serviceParam)
    ) {
      setBusinessType(serviceParam);
    }
    if (planParam) {
      setSelectedPlan(planParam);
    }
  }, [serviceParam, planParam]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured()) {
      setErrorMsg("Supabase n'est pas configuré.");
      return;
    }

    const cleanFullName = fullName.trim();
    const cleanCompany = companyName.trim();
    const cleanPhone = whatsappPhone.trim() || OFFICIAL_WHATSAPP_DIGITS;
    const cleanEmail = email.trim();

    if (!cleanFullName || !cleanCompany || !cleanEmail || !password) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const trialExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // 1. Créer l'utilisateur dans Supabase Auth avec 7 jours d'essai gratuit
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
            org_name: cleanCompany,
            phone: cleanPhone,
            business_type: businessType,
            org_mode: businessType === "ecole" ? "etablissement" : "commerce",
            role: "admin",
            plan: selectedPlan,
            trial_expires_at: trialExpiresAt,
          },
        },
      });

      if (signUpErr) {
        setErrorMsg(signUpErr.message);
        setLoading(false);
        return;
      }

      // Si aucune session active n'est retournée immédiatement, tenter une connexion directe
      let activeUser = signUpData.user;
      if (!signUpData.session) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInData?.user) {
          activeUser = signInData.user;
        }
      }

      if (activeUser) {
        // 2. Créer l'organisation dans Supabase si nécessaire
        let orgId: string | null = null;
        const { data: createdOrgId } = await supabase.rpc(
          "create_organization",
          {
            p_name: cleanCompany,
            p_mode: businessType === "ecole" ? "etablissement" : "commerce",
            p_city: "Ngaoundéré",
            p_phone: cleanPhone,
          }
        );
        if (createdOrgId) {
          orgId = String(createdOrgId);
        }

        // Synchroniser businessType dans organizations.footer_note
        if (orgId) {
          await supabase
            .from("organizations")
            .update({
              footer_note: JSON.stringify({
                businessType,
                email: cleanEmail,
                primaryColor: "green",
              }),
            })
            .eq("id", orgId);
        }

        // 3. Créer la ligne dans merchant_settings avec business_type, phone, company_name
        const { error: msErr } = await supabase.from("merchant_settings").upsert(
          {
            user_id: activeUser.id,
            org_id: orgId,
            company_name: cleanCompany,
            business_type: businessType,
            whatsapp_phone: cleanPhone,
            email: cleanEmail,
            primary_color: "green",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (msErr) {
          await supabase.from("merchant_settings").upsert(
            {
              user_id: activeUser.id,
              org_id: orgId,
              company_name: cleanCompany,
              whatsapp_phone: cleanPhone,
              email: cleanEmail,
              primary_color: "green",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }

        // 4. Créer l'abonnement d'essai gratuit de 7 jours dans la table 'subscriptions'
        await supabase.from("subscriptions").upsert(
          {
            user_id: activeUser.id,
            plan: selectedPlan || "pro",
            status: "trial",
            expires_at: trialExpiresAt,
          },
          { onConflict: "user_id" }
        );
      }

      await refreshOrgData();
      router.replace("/admin/dashboard");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du compte."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1.5 text-center border-b border-slate-100 pb-5">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            🎁 7 Jours d&apos;essai gratuit · Sans carte bancaire
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] pt-1">
            Créer mon compte InnovTech MHA Infinity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Choisissez votre métier et démarrez immédiatement votre espace d&apos;administration.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Mahamat Bouba"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom entreprise *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: InnovTech MHA Infinity"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone WhatsApp (ex: 23566268503) *
              </label>
              <input
                type="tel"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="23566268503"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Choix métier *
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-semibold text-[#0B1F3A]"
              >
                <option value="boutique">🛒 Boutique (Produits, Stock, Factures)</option>
                <option value="ecole">🎓 École (Élèves, Classes, Frais scolaires)</option>
                <option value="clinique">🏥 Clinique (Patients, Soins, Consultations)</option>
                <option value="immobilier">🏠 Immobilier (Maisons, Locataires, Loyers)</option>
                <option value="artisan">✂️ Artisan (Commandes, Clients, Rendez-vous)</option>
                <option value="ong">🤝 ONG (Membres, Cotisations, Projets)</option>
              </select>
            </div>
          </div>

          {/* Cartes rapides de choix métier */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {BUSINESS_SERVICES.map((srv) => {
              const active = businessType === srv.id;
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => setBusinessType(srv.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    active
                      ? "border-emerald-600 bg-emerald-50 font-extrabold text-[#0B1F3A]"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <div>
                    {srv.emoji} {srv.title}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de passe *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {errorMsg ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              ⚠️ {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-md transition-colors disabled:opacity-50"
          >
            {loading
              ? "Création de votre compte en cours..."
              : "Créer mon compte gratuitement"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <Link href="/login" className="font-extrabold text-[#0B1F3A] hover:underline">
            Déjà un compte ? Se connecter →
          </Link>
          <a
            href="https://wa.me/23566268503"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#128C7E] hover:underline"
          >
            💬 Aide WhatsApp : +235 66 26 85 03
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
            Chargement du formulaire d&apos;inscription...
          </div>
        }
      >
        <SignupFormContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}

