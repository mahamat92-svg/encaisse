"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/PublicHeaderFooter";
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
        setError(signInErr?.message || "Identifiants invalides.");
        setLoading(false);
        return;
      }

      // Vérifier que l'utilisateur a bien le rôle 'admin' dans Supabase
      const [{ data: platformAdminFlag }, { data: profileRow }, { data: myMemberships }] =
        await Promise.all([
          supabase.rpc("is_platform_admin"),
          supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle(),
          supabase
            .from("memberships")
            .select("role")
            .eq("user_id", data.user.id)
            .limit(1),
        ]);

      const profileRole = (profileRow as { role?: string } | null)?.role;
      const memberRole = myMemberships?.[0]?.role;
      const metaRole = data.user.user_metadata?.role;
      const isAllowedAdmin =
        Boolean(platformAdminFlag) ||
        profileRole === "admin" ||
        metaRole === "admin" ||
        memberRole === "owner";

      if (!isAllowedAdmin) {
        await supabase.auth.signOut();
        setError(
          "Accès refusé : seuls les utilisateurs avec role = 'admin' peuvent se connecter à l'administration."
        );
        setLoading(false);
        return;
      }

      await refreshOrgData();
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12">
      <div className="mb-6">
        <BrandLogo />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="space-y-1 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[#0B1F3A] text-xs font-extrabold uppercase tracking-wider">
            🔒 Accès Administrateur
          </span>
          <h1 className="text-2xl font-extrabold text-[#0B1F3A] pt-1">
            Connexion Admin
          </h1>
          <p className="text-xs text-slate-500">
            Réservé uniquement à l&apos;administrateur InnovTech Encaisse.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Adresse e-mail administrateur
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@domaine.com"
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
            {loading ? "Vérification en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-[#0B1F3A]"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

