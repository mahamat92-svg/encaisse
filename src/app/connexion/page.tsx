"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { useAppState } from "@/components/AppContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { refreshOrgData } = useAppState();
  const [email, setEmail] = useState("mustaphamahamat98@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      router.push("/app");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        setLoading(false);
        return;
      }
      await refreshOrgData();
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Accès sécurisé RLS
            </span>
            <h1 className="text-2xl font-extrabold text-[#0B1F3A]">
              Connexion à InnovTech Encaisse
            </h1>
            <p className="text-xs text-slate-500">
              Retrouvez vos factures, vos encaissements Mobile Money et vos relances du jour.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse e-mail
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
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            {error ? (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                ⚠️ {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white font-extrabold text-sm transition-colors"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-600">
            <Link
              href="/app"
              className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100"
            >
              Explorer directement en Mode Démo →
            </Link>
            <div>
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-[#0B1F3A] font-bold underline">
                Créer mon entreprise (14 jours Pro offerts)
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

