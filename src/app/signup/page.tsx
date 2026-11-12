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

const METIER_RADIO_OPTIONS: Array<{
  id: BusinessType;
  label: string;
  emoji: string;
}> = [
  { id: "boutique", label: "Boutique", emoji: "🛒" },
  { id: "ecole", label: "École", emoji: "🎓" },
  { id: "clinique", label: "Clinique", emoji: "🏥" },
  { id: "immobilier", label: "Immobilier", emoji: "🏠" },
  { id: "artisan", label: "Artisan", emoji: "✂️" },
  { id: "ong", label: "ONG", emoji: "🤝" },
];

function translateSignupError(msg: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already")
  ) {
    return "Cette adresse email est déjà utilisée par un compte existant. Veuillez vous connecter ou utiliser un autre email.";
  }
  if (lower.includes("password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (lower.includes("invalid email")) {
    return "Veuillez saisir une adresse email valide.";
  }
  return msg;
}

function SignupCardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshOrgData } = useAppState();

  const serviceParam = searchParams?.get("service") as BusinessType | null;
  const planParam = searchParams?.get("plan") || "trial";

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState(OFFICIAL_WHATSAPP_DIGITS);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const cleanFullName = fullName.trim();
    const cleanCompany = companyName.trim();
    const cleanPhone = whatsappPhone.trim() || OFFICIAL_WHATSAPP_DIGITS;
    const cleanEmail = email.trim();

    if (!cleanFullName || !cleanCompany || !cleanEmail || !password) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Les deux mots de passe ne correspondent pas.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMsg("La connexion Supabase n'est pas configurée.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const nowIso = new Date().toISOString();
      const trialExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // 1. Créer l'utilisateur avec Supabase Auth signUp(email, password)
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
            plan: "trial",
            trial_expires_at: trialExpiresAt,
          },
        },
      });

      if (signUpErr) {
        setErrorMsg(translateSignupError(signUpErr.message));
        setLoading(false);
        return;
      }

      // Supabase renvoie identities = [] si l'email existe déjà
      if (
        signUpData?.user &&
        Array.isArray(signUpData.user.identities) &&
        signUpData.user.identities.length === 0
      ) {
        setErrorMsg(
          "Cette adresse email est déjà utilisée par un compte existant. Veuillez vous connecter."
        );
        setLoading(false);
        return;
      }

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
        // 2. Créer l'organisation dans Supabase
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

        // 3. Insérer dans la table 'merchant_settings': user_id, company_name, phone, business_type, plan='trial', created_at=now()
        const { error: msFullErr } = await supabase
          .from("merchant_settings")
          .upsert(
            {
              user_id: activeUser.id,
              org_id: orgId,
              company_name: cleanCompany,
              phone: cleanPhone,
              whatsapp_phone: cleanPhone,
              business_type: businessType,
              plan: "trial",
              email: cleanEmail,
              primary_color: "green",
              created_at: nowIso,
              updated_at: nowIso,
            },
            { onConflict: "user_id" }
          );

        if (msFullErr) {
          // Fallback si certaines colonnes (phone, plan, created_at) n'ont pas encore été ajoutées via SQL
          await supabase.from("merchant_settings").upsert(
            {
              user_id: activeUser.id,
              org_id: orgId,
              company_name: cleanCompany,
              whatsapp_phone: cleanPhone,
              email: cleanEmail,
              primary_color: "green",
              updated_at: nowIso,
            },
            { onConflict: "user_id" }
          );
        }

        // 4. Créer les 7 jours d'essai gratuit dans subscriptions
        await supabase.from("subscriptions").upsert(
          {
            user_id: activeUser.id,
            plan: selectedPlan || "trial",
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
          ? translateSignupError(err.message)
          : "Erreur lors de la création du compte."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5 text-center border-b border-slate-100 pb-5">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            🎁 7 jours gratuits, sans carte bancaire
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] pt-1">
            Créer mon compte - InnovTech MHA Infinity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            7 jours gratuits, sans carte bancaire
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
                placeholder="Ex: Mahamat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom de votre entreprise *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Boutique Bouba"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Ex: 23566268503"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de passe (min 6 caractères) *
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmer mot de passe *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez votre mot de passe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Choisissez votre métier (6 boutons radio) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700">
              Choisissez votre métier *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {METIER_RADIO_OPTIONS.map((opt) => {
                const checked = businessType === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`cursor-pointer flex items-center gap-2.5 p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      checked
                        ? "border-emerald-600 bg-emerald-50 text-[#0B1F3A] shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={opt.id}
                      checked={checked}
                      onChange={() => setBusinessType(opt.id)}
                      className="accent-emerald-600 w-4 h-4 shrink-0"
                    />
                    <span>
                      {opt.emoji} {opt.label}
                    </span>
                  </label>
                );
              })}
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
            className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold shadow-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Création de votre compte..." : "Créer mon compte gratuit"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <div>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-extrabold text-[#0B1F3A] hover:underline"
            >
              Déjà un compte ? Se connecter
            </Link>
          </div>
          <div>
            <a
              href="https://wa.me/23566268503"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#128C7E] hover:underline"
            >
              💬 Assistance WhatsApp : +235 66 26 85 03
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B1F3A]">
      <PublicNavbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-white">
            Chargement...
          </div>
        }
      >
        <SignupCardContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}
