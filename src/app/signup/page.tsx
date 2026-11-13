"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import {
  AFRICA_CITIES,
  AFRICA_SERVICE_CATEGORIES,
  BUSINESS_SERVICES,
  COUNTRY_OPTIONS,
  DEFAULT_MERCHANT_CITY,
  DEFAULT_MERCHANT_COUNTRY,
  DEFAULT_MERCHANT_REGION,
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
  translateAuthOrNetworkError,
  type BusinessType,
} from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";

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
  const [city, setCity] = useState<string>(DEFAULT_MERCHANT_CITY);
  const [customCity, setCustomCity] = useState("");
  const [country, setCountry] = useState<string>(DEFAULT_MERCHANT_COUNTRY);
  const [serviceCategory, setServiceCategory] = useState<string>(
    AFRICA_SERVICE_CATEGORIES[0].id
  );
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
    const cleanCity =
      city === "Autre"
        ? customCity.trim() || DEFAULT_MERCHANT_CITY
        : city.trim() || DEFAULT_MERCHANT_CITY;
    const cleanCountry = country.trim() || DEFAULT_MERCHANT_COUNTRY;

    if (!cleanFullName || !cleanCompany || !cleanEmail || !password || !cleanCity) {
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
            city: cleanCity,
            country: cleanCountry,
            business_type: businessType,
            service_category: serviceCategory,
            org_mode: businessType === "ecole" ? "etablissement" : "commerce",
            role: "admin",
            plan: "trial",
            trial_expires_at: trialExpiresAt,
          },
        },
      });

      if (signUpErr) {
        setErrorMsg(translateAuthOrNetworkError(signUpErr.message));
        setLoading(false);
        return;
      }

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
        // 2. Créer l'organisation dans Supabase avec la ville manuelle saisie
        let orgId: string | null = null;
        const { data: createdOrgId } = await supabase.rpc(
          "create_organization",
          {
            p_name: cleanCompany,
            p_mode: businessType === "ecole" ? "etablissement" : "commerce",
            p_city: `${cleanCity}, ${cleanCountry}`,
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
                serviceCategory,
                email: cleanEmail,
                city: cleanCity,
                region: DEFAULT_MERCHANT_REGION,
                country: cleanCountry,
                primaryColor: "green",
              }),
            })
            .eq("id", orgId);
        }

        // 3. Insérer dans la table 'merchant_settings': user_id, company_name, phone, business_type, city, country, plan='trial', created_at=now()
        const { error: msFullErr } = await supabase
          .from("merchant_settings")
          .upsert(
            {
              user_id: activeUser.id,
              org_id: orgId,
              company_name: cleanCompany,
              phone: cleanPhone,
              whatsapp_phone: cleanPhone,
              city: cleanCity,
              region: DEFAULT_MERCHANT_REGION,
              country: cleanCountry,
              address_city: `${cleanCity}, ${cleanCountry}`,
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
          await supabase.from("merchant_settings").upsert(
            {
              user_id: activeUser.id,
              org_id: orgId,
              company_name: cleanCompany,
              whatsapp_phone: cleanPhone,
              address_city: `${cleanCity}, ${cleanCountry}`,
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
      router.replace("/dashboard");
    } catch (err) {
      setErrorMsg(
        translateAuthOrNetworkError(
          err instanceof Error
            ? err.message
            : "Problème de connexion, vérifie ton internet et réessaie"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center border-b border-slate-100 pb-5">
          <div className="flex justify-center">
            <div className="w-[80px] h-[80px] rounded-2xl bg-[#0B1F3A] border border-emerald-500/40 shadow-md overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="InnovTech MHA Infinity"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
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
                placeholder={OFFICIAL_EMAIL}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Ville + Pays */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ville *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-semibold text-[#0B1F3A]"
              >
                {AFRICA_CITIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {city === "Autre" ? (
                <input
                  type="text"
                  required
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Saisissez votre ville..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pays *
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-semibold text-[#0B1F3A]"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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

          {/* Catégorie de Service (8 catégories Afrique) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700">
              Catégorie de Service *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AFRICA_SERVICE_CATEGORIES.map((cat) => {
                const checked = serviceCategory === cat.id;
                return (
                  <label
                    key={cat.id}
                    className={`cursor-pointer flex items-start gap-2.5 p-3 rounded-xl border-2 text-xs transition-all ${checked
                        ? "border-emerald-600 bg-emerald-50 text-[#0B1F3A] shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                      }`}
                  >
                    <input
                      type="radio"
                      name="serviceCategory"
                      value={cat.id}
                      checked={checked}
                      onChange={() => {
                        setServiceCategory(cat.id);
                        setBusinessType(cat.businessType);
                      }}
                      className="accent-emerald-600 w-4 h-4 mt-0.5 shrink-0"
                    />
                    <div>
                      <div className="font-extrabold">
                        {cat.emoji} {cat.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {cat.examples}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {errorMsg ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 space-y-2">
              <div>⚠️ {errorMsg}</div>
              <a
                href={`https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}?text=${encodeURIComponent(
                  `Bonjour InnovTech MHA Infinity, j'ai besoin d'aide pour créer mon compte (${email || "mon email"}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] text-white text-xs font-extrabold"
              >
                💬 Contacter l&apos;aide WhatsApp {OFFICIAL_WHATSAPP_DISPLAY}
              </a>
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
          <div className="text-xs font-bold text-slate-600">
            Support:{" "}
            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="text-[#0B1F3A] underline"
            >
              {OFFICIAL_EMAIL}
            </a>{" "}
            ·{" "}
            <a
              href="https://wa.me/23566268503"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#128C7E] underline"
            >
              WhatsApp: +235 66 26 85 03
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
