"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { useAppState } from "@/components/AppContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshOrgData } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase n'est pas configuré.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr || !data.user) {
        setError("Email ou mot de passe incorrect. Veuillez réessayer.");
        setLoading(false);
        return;
      }

      await refreshOrgData();
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1F3A]">
      <PublicNavbar />

      <main className="flex-1 bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[#0B1F3A] text-xs font-extrabold uppercase tracking-wider">
              🔒 Espace Commerçant & Admin
            </span>
            <h1 className="text-2xl font-extrabold text-[#0B1F3A] pt-1">
              Se connecter
            </h1>
            <p className="text-xs text-slate-500">
              Accédez à votre tableau de bord InnovTech MHA Infinity.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email
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
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
                ⚠️ {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white font-extrabold text-sm transition-colors shadow-sm"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-2.5">
            <div>
              <Link
                href="/signup"
                className="text-xs sm:text-sm font-extrabold text-emerald-700 hover:underline"
              >
                Pas encore de compte ? Créer mon compte gratuit
              </Link>
            </div>
            <div>
              <Link
                href="/"
                className="text-xs font-bold text-slate-500 hover:text-[#0B1F3A]"
              >
                ← Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
