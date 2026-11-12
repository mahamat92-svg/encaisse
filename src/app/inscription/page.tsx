"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppState } from "@/components/AppContext";
import type { OrgMode } from "@/lib/format";

export default function RegisterPage() {
  const router = useRouter();
  const { setMode, refreshOrgData } = useAppState();
  const [orgMode, setOrgMode] = useState<OrgMode>("commerce");
  const [orgName, setOrgName] = useState("");
  const [city, setCity] = useState("Douala");
  const [phone, setPhone] = useState("+237 ");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!consent) {
      setError("Veuillez accepter la politique de protection des données (Loi n° 2024/017).");
      return;
    }

    setMode(orgMode);

    if (!isSupabaseConfigured()) {
      setInfo(
        "Mode Démo actif : redirection vers votre espace de travail avec vos paramètres..."
      );
      setTimeout(() => router.push("/app"), 800);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            city: city.trim(),
            org_name: orgName.trim(),
            org_mode: orgMode,
            locale: "fr",
          },
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        await supabase.rpc("create_organization", {
          p_name: orgName.trim(),
          p_mode: orgMode,
          p_city: city.trim(),
          p_phone: phone.trim(),
        });
        await refreshOrgData();
        router.push("/app");
      } else {
        setInfo(
          "Compte créé ! Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              14 jours d&apos;essai Pro offerts · Sans carte bancaire
            </span>
            <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
              Créer votre espace InnovTech Encaisse
            </h1>
            <p className="text-xs text-slate-500">
              Configurez votre entreprise ou établissement en moins de 60 secondes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choix du mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Choisissez le mode adapté à votre activité
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrgMode("commerce")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    orgMode === "commerce"
                      ? "border-2 border-emerald-600 bg-emerald-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-sm text-[#0B1F3A]">
                    🏪 Commerce & Services
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    PME, boutique, grossiste, BTP, prestataire
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrgMode("etablissement")}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    orgMode === "etablissement"
                      ? "border-2 border-emerald-600 bg-emerald-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-sm text-[#0B1F3A]">
                    🎓 Établissement Scolaire
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    École privée, collège, centre de formation
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {orgMode === "etablissement"
                    ? "Nom de l'établissement *"
                    : "Nom de l'entreprise / boutique *"}
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={
                    orgMode === "etablissement"
                      ? "Ex: Complexe Scolaire Les Lauréats"
                      : "Ex: Quincaillerie Ngo & Fils"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ville (Cameroun) *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Douala, Yaoundé, Bafoussam..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Votre nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Jean-Paul Fotso"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Téléphone WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XX XX XX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse e-mail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@entreprise.cm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe (8 caractères min.) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            {/* Consentement Loi 2024/017 (Case non pré-cochée obligatoire) */}
            <label className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                J&apos;accepte de manière libre et éclairée le traitement de mes données pour la gestion de mon compte, conformément à la{" "}
                <strong>Loi camerounaise n° 2024/017 du 23 décembre 2024</strong> relative à la protection des données à caractère personnel. Je comprends qu&apos;InnovTech Encaisse V1 n&apos;est pas un dispositif fiscal e-MECeF/DGI homologué (Règle R-6).
              </span>
            </label>

            {error ? (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                ⚠️ {error}
              </div>
            ) : null}

            {info ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                ✅ {info}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-sm transition-colors"
            >
              {loading
                ? "Création de votre espace sécurisé..."
                : "Créer mon entreprise et lancer l'essai Pro (14 jours)"}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Vous avez déjà un compte ?{" "}
            <Link href="/connexion" className="text-[#0B1F3A] font-bold underline">
              Se connecter
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

