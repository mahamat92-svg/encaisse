"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/components/AppContext";

interface ChatMessage {
  id: string;
  sender: "user" | "ia";
  text: string;
  service?: string;
  time: string;
}

const BLOCKED_MSG =
  "Paye ton abonnement pour parler à l'IA Guide, elle va te montrer tout le SaaS.";

const QUICK_PROMPTS = [
  "Je veux vendre",
  "Facture Excel",
  "C'est quoi mon solde ?",
  "Je veux inscrire un élève",
  "Agriculture & Élevage",
  "Combien coûte l'abonnement ?",
];

function formatTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function FloatingIaGuide() {
  const { userEmail, org, isAdmin } = useAppState();
  const [open, setOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ia",
      text: "Bonjour ! Je suis ton IA Guide 🤖. Pose-moi n'importe quelle question en français simple, je te montre où cliquer et quoi faire.",
      service: "Général",
      time: formatTime(),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = Boolean(userEmail);
  const isPaid = isLoggedIn && (isAdmin || org.subscriptionStatus === "active");

  // Masquer le bouton flottant si un autre champ du site ouvre le clavier mobile
  useEffect(() => {
    function handleFocusIn(e: FocusEvent) {
      const el = e.target as HTMLElement | null;
      if (!el || el.dataset?.iaGuideInput === "true") return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        setKeyboardOpen(true);
      }
    }
    function handleFocusOut() {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active.dataset?.iaGuideInput === "true") {
          setKeyboardOpen(false);
          return;
        }
        const tag = active.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          setKeyboardOpen(false);
        }
      }, 150);
    }

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // Charger l'historique sauvegardé quand l'utilisateur payé ouvre le chat
  useEffect(() => {
    if (!open || !isLoggedIn || !isPaid || historyLoaded) return;
    let active = true;

    fetch("/api/ia-guide")
      .then((res) => res.json())
      .then((data) => {
        if (!active || !Array.isArray(data?.messages)) return;
        if (data.messages.length > 0) {
          const loaded: ChatMessage[] = [];
          for (const row of data.messages as Array<{
            id: string;
            question: string;
            reponse: string;
            service_concerne?: string;
            date?: string;
          }>) {
            loaded.push({
              id: `${row.id}-q`,
              sender: "user",
              text: row.question,
              time: formatTime(row.date),
            });
            loaded.push({
              id: `${row.id}-r`,
              sender: "ia",
              text: row.reponse,
              service: row.service_concerne,
              time: formatTime(row.date),
            });
          }
          setMessages((prev) => [prev[0], ...loaded]);
        }
        setHistoryLoaded(true);
      })
      .catch(() => {
        setHistoryLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [open, isLoggedIn, isPaid, historyLoaded]);

  // Scroll auto en bas à chaque nouveau message
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  async function sendQuestion(rawText?: string) {
    const text = (rawText ?? question).trim();
    if (!text || sending) return;

    if (!isLoggedIn || !isPaid) {
      setMessages((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          sender: "user",
          text,
          time: formatTime(),
        },
        {
          id: `b-${Date.now()}`,
          sender: "ia",
          text: BLOCKED_MSG,
          time: formatTime(),
        },
      ]);
      if (!rawText) setQuestion("");
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: formatTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!rawText) setQuestion("");
    setSending(true);

    try {
      const res = await fetch("/api/ia-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();

      const replyText =
        res.ok && typeof data?.reponse === "string"
          ? data.reponse
          : typeof data?.error === "string"
            ? data.error
            : "Désolé, réessaie dans un instant.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ia-${Date.now()}`,
          sender: "ia",
          text: replyText,
          service: data?.service_concerne,
          time: formatTime(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ia",
          text: "Problème de connexion. Vérifie internet et réessaie.",
          time: formatTime(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (keyboardOpen && !open) return null;

  return (
    <div className="no-print">
      {/* Bouton flottant sur toutes les pages */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Parler à l'IA"
          className="fixed bottom-20 lg:bottom-6 right-20 z-40 flex items-center gap-2 rounded-full bg-[#166534] hover:bg-[#14532D] text-white font-semibold text-xs sm:text-sm px-4 py-3 shadow-lg border-2 border-white transition-transform hover:scale-105 cursor-pointer"
        >
          <span>Parler à l&apos;IA 🤖</span>
        </button>
      )}

      {/* Fenêtre Chat style WhatsApp */}
      {open && (
        <div
          role="dialog"
          aria-label="IA Guide InnovTech MHA Infinity"
          className="fixed bottom-4 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[390px] max-h-[82vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* En-tête WhatsApp vert #166534 */}
          <div className="bg-[#166534] text-white px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-lg shrink-0">
                🤖
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">
                  IA Guide — InnovTech MHA
                </p>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-300" />
                  <span>Répond en français simple</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat IA"
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Règle d'abonnement Payé */}
          {!isLoggedIn || !isPaid ? (
            <div className="p-5 bg-[#F8FAFC] flex flex-col gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mx-auto">
                🔒
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {BLOCKED_MSG}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Offres : Gratuit (7 jours) • <strong>Pro 5 000 FCFA/mois</strong> •{" "}
                <strong>Business 15 000 FCFA/mois</strong>.
                <br />
                Orange Money : <strong>640 633 034</strong> / MTN MoMo :{" "}
                <strong>651 465 708</strong> (MAHAMAT BOUBA).
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Link
                  href={isLoggedIn ? "/app/abonnement" : "/connexion"}
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-[#166534] hover:bg-[#14532D] text-white font-semibold text-xs py-2.5 px-3 transition-colors"
                >
                  {isLoggedIn ? "Activer mon abonnement" : "Se connecter / S'inscrire"}
                </Link>
                <a
                  href="https://wa.me/23566268503"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-xs py-2.5 px-3 hover:bg-slate-50"
                >
                  Aide WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Zone des messages style WhatsApp */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto bg-[#F8FAFC] p-3.5 space-y-3 min-h-[260px] max-h-[48vh]"
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm whitespace-pre-line ${
                          isUser
                            ? "bg-[#166534] text-white rounded-br-sm"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                        }`}
                      >
                        {!isUser && msg.service && (
                          <span className="inline-block mb-1 text-[10px] font-bold uppercase tracking-wide text-[#166534] bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            {msg.service}
                          </span>
                        )}
                        <p>{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 text-right ${
                            isUser ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs shadow-sm">
                      L&apos;IA Guide écrit...
                    </div>
                  </div>
                )}
              </div>

              {/* Questions rapides */}
              <div className="bg-white border-t border-slate-100 px-3 py-2 flex gap-1.5 overflow-x-auto">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={sending}
                    onClick={() => sendQuestion(prompt)}
                    className="shrink-0 text-[11px] font-medium bg-[#F8FAFC] hover:bg-emerald-50 text-[#166534] border border-slate-200 hover:border-emerald-300 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Zone de saisie */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendQuestion();
                }}
                className="bg-white border-t border-slate-200 p-2.5 flex items-center gap-2"
              >
                <input
                  type="text"
                  data-ia-guide-input="true"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Écris ta question ici..."
                  disabled={sending}
                  className="flex-1 rounded-full bg-[#F8FAFC] border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#166534]"
                />
                <button
                  type="submit"
                  disabled={sending || !question.trim()}
                  className="rounded-full bg-[#166534] hover:bg-[#14532D] disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 transition-colors cursor-pointer shrink-0"
                >
                  Envoyer
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
