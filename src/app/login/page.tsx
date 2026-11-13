"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicFooter, PublicNavbar } from "@/components/PublicHeaderFooter";
import { useAppState } from "@/components/AppContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_DISPLAY,
  translateAuthOrNetworkError,
} from "@/lib/format";

export default function AdminLoginPage() {
  const router = useRouter();
  const { userEmail, loadingData, refreshOrgData } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Mot de passe oublié & renvoi de code (délai 60s, jamais de blocage total)
  const [forgotMode, setForgotMode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [showResendHelp, setShowResendHelp] = useState(false);

  // Si déjà connecté (session 30 jours), rediriger directement vers le tableau de bord
  useEffect(() => {
    if (!loadingData && userEmail) {
      router.replace("/dashboard");
    }
  }, [loadingData, userEmail, router]);

  // Compteur de 60 secondes entre chaque envoi d'email
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);

    if (!isSupabaseConfigured()) {
      setError("La connexion au serveur n'est pas configurée.");
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInErr } = await supabase.auth.signInWithPassword(
        {
          email: cleanEmail,
          password,
        }
      );

      if (signInErr || !data.user) {
        const raw = signInErr?.message || "";
        const friendly = translateAuthOrNetworkError(raw);
        setError(friendly);
        if (
          raw.toLowerCase().includes("confirm") ||
          raw.toLowerCase().includes("rate")
        ) {
          setShowResendHelp(true);
        }
        setLoading(false);
        return;
      }

      await refreshOrgData();
      router.replace("/dashboard");
    } catch (err) {
      setError(
        translateAuthOrNetworkError(
          err instanceof Error ? err.message : "Erreur réseau"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetLink(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setInfoMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Saisis d'abord ton adresse email ci-dessus.");
      return;
    }
    if (cooldown > 0) {
      setError(`Attends ${cooldown} secondes avant de renvoyer un email.`);
      return;
    }

    setSendingCode(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        { redirectTo: origin ? `${origin}/login` : undefined }
      );
      if (resetErr) {
        setError(translateAuthOrNetworkError(resetErr.message));
        return;
      }
      setCooldown(60);
      setInfoMsg(
        "✅ Un lien simple pour changer ton mot de passe a été envoyé à ton email (vérifie aussi les spams)."
      );
    } catch (err) {
      setError(
        translateAuthOrNetworkError(
          err instanceof Error ? err.message : "Erreur réseau"
        )
      );
    } finally {
      setSendingCode(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    setInfoMsg(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Saisis ton email pour renvoyer le code.");
      return;
    }
    if (cooldown > 0) {
      setError(`Attends ${cooldown} secondes avant de renvoyer le code.`);
      return;
    }

    setSendingCode(true);
    try {
      const supabase = createClient();
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });
      if (resendErr) {
        setError(translateAuthOrNetworkError(resendErr.message));
        return;
      }
      setCooldown(60);
      setInfoMsg(
        "✅ Code / lien renvoyé ! Vérifie ta boîte email ou tes spams."
      );
    } catch (err) {
      setError(
        translateAuthOrNetworkError(
          err instanceof Error ? err.message : "Erreur réseau"
        )
      );
    } finally {
      setSendingCode(false);
    }
  }

  const whatsappLoginHelpUrl = `https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}?text=${encodeURIComponent(
    `Bonjour InnovTech MHA Infinity, j'ai besoin d'aide pour me connecter à mon compte (${email.trim() || "mon email"}).`
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1F3A]">
      <PublicNavbar />

      <main className="flex-1 bg-gradient-to-b from-[#0B1F3A] via-[#0B1F3A] to-[#132D54] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
          <div className="space-y-2 text-center">
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
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-[#0B1F3A] text-xs font-extrabold uppercase tracking-wider">
              🔒 Espace Commerçant &amp; Admin
            </span>
            <h1 className="text-2xl font-extrabold text-[#0B1F3A] pt-1">
              {forgotMode ? "Mot de passe oublié" : "Se connecter"}
            </h1>
            <p className="text-xs text-slate-500">
              {forgotMode
                ? "Reçois un lien simple par email pour créer un nouveau mot de passe."
                : "Reste connecté 30 jours sur ton téléphone."}
            </p>
          </div>

          {!forgotMode ? (
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
                  placeholder="ton-email@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setError(null);
                      setInfoMsg(null);
                    }}
                    className="text-xs font-extrabold text-emerald-700 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                />
              </div>

              {error ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 font-bold space-y-2">
                  <div>⚠️ {error}</div>
                  {showResendHelp ? (
                    <button
                      type="button"
                      disabled={sendingCode || cooldown > 0}
                      onClick={handleResendCode}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0B1F3A] text-white text-xs font-extrabold disabled:opacity-50"
                    >
                      {cooldown > 0
                        ? `Renvoyer le code (${cooldown}s)`
                        : sendingCode
                          ? "Envoi..."
                          : "📩 Renvoyer le code"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {infoMsg ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-bold">
                  {infoMsg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 text-white font-extrabold text-base transition-colors shadow-sm"
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ton adresse Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton-email@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                />
              </div>

              {error ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 font-bold">
                  ⚠️ {error}
                </div>
              ) : null}

              {infoMsg ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-bold">
                  {infoMsg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={sendingCode || cooldown > 0}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-base shadow-sm"
              >
                {cooldown > 0
                  ? `Renvoyer le code (${cooldown}s)`
                  : sendingCode
                    ? "Envoi en cours..."
                    : "📩 Envoyer le lien de récupération"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError(null);
                }}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] font-bold text-sm"
              >
                ← Retour à la connexion
              </button>
            </form>
          )}

          {/* Option secours si email lent : Se connecter avec WhatsApp / Aide WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-center">
            <div className="text-xs font-bold text-slate-700">
              L&apos;email n&apos;arrive pas ou tu as besoin d&apos;aide ?
            </div>
            <a
              href={whatsappLoginHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1fb857] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm"
            >
              <span>💬</span>
              <span>
                Se connecter avec WhatsApp ({OFFICIAL_WHATSAPP_DISPLAY})
              </span>
            </a>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center space-y-2.5">
            <div>
              <Link
                href="/signup"
                className="text-xs sm:text-sm font-extrabold text-emerald-700 hover:underline"
              >
                Pas encore de compte ? Créer mon compte gratuit
              </Link>
            </div>
            <div className="text-xs font-bold text-slate-600">
              Support:{" "}
              <a
                href={`mailto:${OFFICIAL_EMAIL}`}
                className="text-[#0B1F3A] underline"
              >
                {OFFICIAL_EMAIL}
              </a>
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
