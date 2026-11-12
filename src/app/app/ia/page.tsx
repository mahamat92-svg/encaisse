"use client";

import React, { useState } from "react";
import { useAppState } from "@/components/AppContext";
import { parseInvoiceDictation, type ParsedDictation } from "@/lib/ai-parser";
import {
  buildWhatsAppLink,
  formatCFA,
  type Locale,
  type ReminderTone,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

export default function AiStudioPage() {
  const { mode, org, refreshOrgData } = useAppState();

  const [input, setInput] = useState("");
  const [applyVat, setApplyVat] = useState(org.vatRegistered);
  const [approvedNumber, setApprovedNumber] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [aiParsed, setAiParsed] = useState<ParsedDictation | null>(null);
  const [providerUsed, setProviderUsed] = useState<string>("local-free");
  const [analyzing, setAnalyzing] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"fr-FR" | "en-US">("fr-FR");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // État pour l'Assistant IA de Relance Bilingue (basé uniquement sur les vraies données)
  const [remClient, setRemClient] = useState(org.clients[0]?.name || "");
  const [remDocNumber, setRemDocNumber] = useState(
    org.documents[0]?.number || ""
  );
  const [remBalance, setRemBalance] = useState(org.documents[0]?.balance || 0);
  const [remDays, setRemDays] = useState(org.documents[0]?.daysOverdue || 0);
  const [remTone, setRemTone] = useState<ReminderTone>("courteous");
  const [remLocale, setRemLocale] = useState<Locale>("fr");
  const [remCustom, setRemCustom] = useState("");
  const [remOutput, setRemOutput] = useState("");
  const [remLoading, setRemLoading] = useState(false);

  React.useEffect(() => {
    setApplyVat(org.vatRegistered);
    setRemClient(org.clients[0]?.name || "");
    setRemDocNumber(org.documents[0]?.number || "");
    setRemBalance(org.documents[0]?.balance || 0);
  }, [org.vatRegistered, org.clients, org.documents]);

  const parsed = input.trim()
    ? aiParsed ?? parseInvoiceDictation(input, applyVat)
    : null;

  function handleVoiceDictation() {
    setErrorMsg(null);
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setErrorMsg(
        "La dictée vocale nécessite Google Chrome ou Microsoft Edge. Vous pouvez saisir votre phrase au clavier."
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition: any = new (SpeechRecognitionCtor as any)();
      recognition.lang = voiceLang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setListening(true);
      recognition.start();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
          setAiParsed(null);
          setApprovedNumber(null);
        }
        setListening(false);
      };

      recognition.onerror = () => {
        setListening(false);
        setErrorMsg(
          "Microphone non autorisé ou aucune voix détectée. Vérifiez l'accès au micro dans votre navigateur."
        );
      };

      recognition.onend = () => {
        setListening(false);
      };
    } catch {
      setListening(false);
    }
  }

  async function handleAnalyzeWithApi() {
    if (!input.trim()) return;
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      if (org.isLiveDb) {
        const supabase = createClient();
        const { error: quotaErr } = await supabase.rpc("consume_quota", {
          p_org: org.id,
          p_metric: "ai_dictations",
          p_amount: 1,
        });
        if (quotaErr && quotaErr.message.includes("QUOTA_EXCEEDED")) {
          throw new Error(
            "Quota mensuel de dictées IA atteint pour votre formule. Passez à la formule supérieure dans l'onglet Abonnement."
          );
        }
      }

      const resp = await fetch("/api/ai/dictate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          applyVat,
          catalogNames: org.catalog.map((c) => c.name),
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.result) {
        setAiParsed(data.result);
        setProviderUsed(data.provider || "local-free");
        if (org.isLiveDb) {
          const supabase = createClient();
          await supabase.rpc("log_ai_usage", {
            p_org: org.id,
            p_feature: "invoice_dictation",
            p_model: String(data.provider || "local-free"),
            p_tokens_in: Number(data.metrics?.tokensIn ?? 40),
            p_tokens_out: Number(data.metrics?.tokensOut ?? 80),
            p_cost_micro_usd: Number(data.metrics?.costMicroUsd ?? 0),
          });
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur d'analyse IA");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerateReminderAi() {
    if (!remClient.trim() || !remDocNumber.trim()) {
      setErrorMsg("Veuillez renseigner le destinataire et le numéro de facture.");
      return;
    }
    setRemLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch("/api/ai/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: org.name,
          recipientName: remClient,
          documentNumber: remDocNumber,
          balance: remBalance,
          daysOverdue: remDays,
          tone: remTone,
          locale: remLocale,
          mtnMomo: org.mtnMomoNumber,
          orangeMoney: org.orangeMoneyNumber,
          customInstruction: remCustom,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.message) {
        setRemOutput(data.message);
        if (org.isLiveDb) {
          const supabase = createClient();
          await supabase.rpc("log_ai_usage", {
            p_org: org.id,
            p_feature: "whatsapp_reminder_ai",
            p_model: String(data.provider || "local-free"),
            p_tokens_in: Number(data.metrics?.tokensIn ?? 60),
            p_tokens_out: Number(data.metrics?.tokensOut ?? 90),
            p_cost_micro_usd: Number(data.metrics?.costMicroUsd ?? 0),
          });
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur génération IA");
    } finally {
      setRemLoading(false);
    }
  }

  async function handleApprove() {
    setErrorMsg(null);
    if (!parsed) return;
    if (!org.isLiveDb) {
      setErrorMsg("Vous devez être connecté à votre compte Supabase pour émettre un document.");
      return;
    }

    setIssuing(true);
    try {
      const supabase = createClient();

      let clientId = org.clients.find(
        (c) => c.name.toLowerCase() === parsed.clientName.toLowerCase()
      )?.id;

      if (!clientId) {
        const { data: newClient, error: cliErr } = await supabase
          .from("clients")
          .insert({
            org_id: org.id,
            kind: mode === "etablissement" ? "student" : "customer",
            name: parsed.clientName,
            city: org.city,
            locale: "fr",
          })
          .select("id")
          .single();

        if (cliErr || !newClient) {
          throw new Error(cliErr?.message || "Impossible de créer le client.");
        }
        clientId = newClient.id;
      }

      const { data: draftDoc, error: docErr } = await supabase
        .from("documents")
        .insert({
          org_id: org.id,
          doc_type: parsed.docType,
          client_id: clientId,
          locale: "fr",
        })
        .select("id, public_token")
        .single();

      if (docErr || !draftDoc) {
        throw new Error(docErr?.message || "Impossible de créer le brouillon.");
      }

      const vatBp = applyVat ? org.vatRateBp : 0;
      const linesPayload = parsed.lines.map((l, idx) => ({
        org_id: org.id,
        document_id: draftDoc.id,
        position: idx + 1,
        label: l.label,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        discount: 0,
        vat_rate_bp: vatBp,
      }));

      const { error: linesErr } = await supabase
        .from("document_lines")
        .insert(linesPayload);

      if (linesErr) {
        throw new Error(linesErr.message);
      }

      const { data: issued, error: issueErr } = await supabase.rpc(
        "issue_document",
        { p_doc: draftDoc.id }
      );

      if (issueErr) {
        throw new Error(issueErr.message);
      }

      setApprovedNumber(issued?.number || "");
      setPublicToken(draftDoc.public_token);
      await refreshOrgData();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Erreur lors de l'émission"
      );
    } finally {
      setIssuing(false);
    }
  }

  const publicUrl =
    typeof window !== "undefined" && publicToken
      ? `${window.location.origin}/f/${publicToken}`
      : "";

  const waShareMessage = parsed
    ? `Bonjour ${parsed.clientName},\nVoici votre ${
        parsed.docType === "quote" ? "devis" : "facture"
      } *${approvedNumber ?? "BROUILLON"}* (${org.name}) d'un montant total de *${formatCFA(
        parsed.total
      )}*.\n${publicUrl ? `Lien PDF : ${publicUrl}\n` : ""}• MTN MoMo : ${
        org.mtnMomoNumber
      }\n• Orange Money : ${org.orangeMoneyNumber}`
    : "";

  return (
    <div className="space-y-8">
      <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
          <span>✨ Atelier IA</span>
          <span>•</span>
          <span>Moteur actif : {providerUsed}</span>
        </div>
        <h1 className="text-2xl font-extrabold">
          Dictée vocale & écrite → Facture + Assistant Relances Bilingue
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
          Parlez au microphone ou écrivez votre vente en français ou en anglais. L&apos;IA prépare le brouillon mais ne crée jamais une facture sans votre validation.
        </p>
      </div>

      {errorMsg ? (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
          ⚠️ {errorMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-extrabold text-[#0B1F3A]">
              1. Dictée vocale ou texte libre
            </label>
            <div className="flex items-center gap-2">
              <select
                value={voiceLang}
                onChange={(e) =>
                  setVoiceLang(e.target.value as "fr-FR" | "en-US")
                }
                className="text-[11px] font-bold border border-slate-300 rounded-lg px-2 py-1.5 text-slate-700"
              >
                <option value="fr-FR">🎙️ Micro FR</option>
                <option value="en-US">🎙️ Mic EN</option>
              </select>
              <button
                type="button"
                onClick={handleVoiceDictation}
                className={`text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-colors ${
                  listening
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                }`}
              >
                {listening ? "🔴 Écoute en cours..." : "🎙️ Parler au micro"}
              </button>
              <button
                type="button"
                onClick={handleAnalyzeWithApi}
                disabled={analyzing || !input.trim()}
                className="text-[11px] font-bold text-white bg-[#0B1F3A] hover:bg-[#132D54] disabled:opacity-50 px-3 py-1.5 rounded-lg"
              >
                {analyzing ? "Analyse IA..." : "⚡ Structurer via IA"}
              </button>
            </div>
          </div>

          <textarea
            rows={4}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setAiParsed(null);
              setApprovedNumber(null);
            }}
            className="w-full p-3.5 rounded-xl border border-slate-300 text-sm leading-relaxed"
            placeholder="Saisissez ou dictez votre facture ici..."
          />

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 pt-2">
            <input
              type="checkbox"
              checked={applyVat}
              onChange={(e) => {
                setApplyVat(e.target.checked);
                setAiParsed(null);
              }}
            />
            <span>Inclure la TVA (19,25 %)</span>
          </label>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-sm space-y-4">
          {!parsed ? (
            <div className="p-8 text-center space-y-2">
              <div className="text-3xl">🎙️</div>
              <h2 className="text-base font-extrabold text-[#0B1F3A]">
                Aucune dictée en cours
              </h2>
              <p className="text-xs text-slate-500">
                Écrivez ou dictez une vente à gauche pour prévisualiser la facture avant création.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    2. Brouillon structuré (Validation humaine obligatoire)
                  </span>
                  <h2 className="text-lg font-extrabold text-[#0B1F3A]">
                    {parsed.docType === "quote" ? "DEVIS" : "FACTURE"} — {parsed.clientName}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-[#0B1F3A]">
                  {approvedNumber ?? "BROUILLON"}
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {parsed.lines.map((line, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{line.label}</div>
                      <div className="text-slate-500">
                        {line.quantity} × {formatCFA(line.unitPrice)}
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      {formatCFA(line.total)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total HT</span>
                  <span className="font-semibold">{formatCFA(parsed.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>TVA (19,25 %)</span>
                  <span className="font-semibold">{formatCFA(parsed.vat)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#0B1F3A] pt-1 border-t border-slate-200">
                  <span>Total TTC à payer</span>
                  <span>{formatCFA(parsed.total)}</span>
                </div>
              </div>

              {approvedNumber ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="text-xs font-bold text-emerald-900">
                    ✅ Document validé et numéroté en base : {approvedNumber}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={buildWhatsAppLink("", waShareMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
                    >
                      💬 Envoyer maintenant sur WhatsApp
                    </a>
                    {publicToken ? (
                      <a
                        href={`/f/${publicToken}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0B1F3A] text-xs font-bold"
                      >
                        🖨️ Voir / Imprimer le PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={issuing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-sm"
                >
                  {issuing
                    ? "Émission et numérotation en cours..."
                    : `✔ Créer la facture (${formatCFA(parsed.total)})`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODULE 2 : Rédacteur & Traducteur IA de Relances WhatsApp */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Recouvrement Bilingue FR / EN
            </span>
            <h2 className="text-lg font-extrabold text-[#0B1F3A]">
              💬 Assistant IA de rédaction & traduction de relances WhatsApp
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Destinataire (Client / Parent)
            </label>
            <input
              type="text"
              value={remClient}
              onChange={(e) => setRemClient(e.target.value)}
              placeholder="Nom du client"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              N° Facture & Solde (XAF)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={remDocNumber}
                onChange={(e) => setRemDocNumber(e.target.value)}
                placeholder="N° facture"
                className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={remBalance}
                onChange={(e) => setRemBalance(Number(e.target.value))}
                className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ton & Jours de retard
            </label>
            <div className="flex gap-2">
              <select
                value={remTone}
                onChange={(e) => setRemTone(e.target.value as ReminderTone)}
                className="w-2/3 px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="courteous">🤝 Courtois</option>
                <option value="firm">⚡ Ferme</option>
                <option value="final">🚨 Dernier rappel</option>
              </select>
              <input
                type="number"
                min={0}
                value={remDays}
                onChange={(e) => setRemDays(Number(e.target.value))}
                className="w-1/3 px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Langue du message
            </label>
            <select
              value={remLocale}
              onChange={(e) => setRemLocale(e.target.value as Locale)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Consigne particulière (optionnel)
            </label>
            <input
              type="text"
              value={remCustom}
              onChange={(e) => setRemCustom(e.target.value)}
              placeholder="Instruction optionnelle..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateReminderAi}
            disabled={remLoading}
            className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#132D54] text-white text-xs font-extrabold shrink-0"
          >
            {remLoading
              ? "Génération en cours..."
              : "✨ Rédiger / Traduire la relance"}
          </button>
        </div>

        {remOutput ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
              {remOutput}
            </pre>
            <div className="flex justify-end">
              <a
                href={buildWhatsAppLink("", remOutput)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
              >
                💬 Ouvrir dans WhatsApp
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
