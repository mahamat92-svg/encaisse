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

  const examples =
    mode === "etablissement"
      ? [
          "Facture pour Ewane Samuel Junior : 1 scolarité 2ème tranche à 95000, 1 bus scolaire à 45000",
          "Facture pour Ndi Grace Bih : 1 inscription annuelle à 25000, 1 première tranche à 100000",
        ]
      : [
          "Facture pour Moussa : 3 sacs de ciment à 5500, 10 barres de fer à 4200, livraison 2000",
          "Devis pour Entreprise Fotso : 5 seaux de peinture à 38000, main d'œuvre 45000",
        ];

  const [input, setInput] = useState(examples[0]);
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

  // État pour l'Assistant IA de Relance Bilingue (IA-2 & IA-3)
  const [remClient, setRemClient] = useState(
    org.clients[0]?.name || "M. Kamga Jean-Paul"
  );
  const [remDocNumber, setRemDocNumber] = useState(
    org.documents[0]?.number || "FAC-2026-0001"
  );
  const [remBalance, setRemBalance] = useState(
    org.documents[0]?.balance || 65000
  );
  const [remDays, setRemDays] = useState(org.documents[0]?.daysOverdue || 7);
  const [remTone, setRemTone] = useState<ReminderTone>("courteous");
  const [remLocale, setRemLocale] = useState<Locale>("fr");
  const [remCustom, setRemCustom] = useState("");
  const [remOutput, setRemOutput] = useState("");
  const [remLoading, setRemLoading] = useState(false);

  React.useEffect(() => {
    setInput(
      mode === "etablissement"
        ? "Facture pour Ewane Samuel Junior : 1 scolarité 2ème tranche à 95000, 1 bus scolaire à 45000"
        : "Facture pour Moussa : 3 sacs de ciment à 5500, 10 barres de fer à 4200, livraison 2000"
    );
    setApplyVat(org.vatRegistered);
    setApprovedNumber(null);
    setPublicToken(null);
    setAiParsed(null);
    setRemClient(org.clients[0]?.name || "Client");
    setRemDocNumber(org.documents[0]?.number || "FAC-2026-0001");
    setRemBalance(org.documents[0]?.balance || 65000);
  }, [mode, org.vatRegistered, org.clients, org.documents]);

  const parsed = aiParsed ?? parseInvoiceDictation(input, applyVat);

  // Dictée vocale au microphone (Web Speech API native à 0 FCFA)
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
    if (!org.isLiveDb) {
      const prefix = parsed.docType === "quote" ? "DEV" : "FAC";
      setApprovedNumber(`${prefix}-2026-0099`);
      return;
    }

    setIssuing(true);
    try {
      const supabase = createClient();

      // 1. Chercher un client existant du même nom ou le créer automatiquement
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

      // 2. Créer le document en brouillon
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

      // 3. Insérer toutes les lignes dictées
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

      // 4. Émettre et verrouiller via la RPC issue_document
      const { data: issued, error: issueErr } = await supabase.rpc(
        "issue_document",
        { p_doc: draftDoc.id }
      );

      if (issueErr) {
        throw new Error(issueErr.message);
      }

      setApprovedNumber(issued?.number || "FAC-2026-0001");
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

  const waShareMessage = `Bonjour ${parsed.clientName},\nVoici votre ${
    parsed.docType === "quote" ? "devis" : "facture"
  } *${approvedNumber ?? "BROUILLON"}* (${org.name}) d'un montant total de *${formatCFA(
    parsed.total
  )}*.\n${publicUrl ? `Lien PDF : ${publicUrl}\n` : ""}• MTN MoMo : ${
    org.mtnMomoNumber
  }\n• Orange Money : ${org.orangeMoneyNumber}`;

  return (
    <div className="space-y-8">
      <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
          <span>✨ Atelier IA Phase 8 (Exigences IA-1 à IA-6)</span>
          <span>•</span>
          <span>Moteur actif : {providerUsed}</span>
        </div>
        <h1 className="text-2xl font-extrabold">
          Dictée vocale & écrite → Brouillon de facture + Assistant Relances Bilingue
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
          Parlez au microphone ou écrivez votre vente en français ou en anglais. Conformément à la règle de sécurité <strong>IA-5</strong>, l&apos;IA prépare le brouillon mais ne publie jamais un document sans votre clic de validation.
        </p>
      </div>

      {errorMsg ? (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
          ⚠️ {errorMsg}
        </div>
      ) : null}

      {/* MODULE 1 : Dictée vocale & texte -> Facture / Devis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Zone de saisie + Micro */}
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
                disabled={analyzing}
                className="text-[11px] font-bold text-white bg-[#0B1F3A] hover:bg-[#132D54] px-3 py-1.5 rounded-lg"
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
            placeholder="Ex: Facture pour Moussa : 3 sacs de ciment à 5500, livraison 2000"
          />

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500">
              Exemples rapides à tester en 1 clic :
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setInput(ex);
                    setAiParsed(null);
                    setApprovedNumber(null);
                  }}
                  className="text-left text-xs p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
                >
                  « {ex} »
                </button>
              ))}
            </div>
          </div>

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

        {/* Brouillon structuré généré en direct */}
        <div className="lg:col-span-6 bg-white rounded-2xl border-2 border-emerald-500/40 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                2. Brouillon structuré (Validation humaine obligatoire — Règle IA-5)
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
                : `✔ Je vérifie et j'émets ce document (${formatCFA(parsed.total)})`}
            </button>
          )}
        </div>
      </div>

      {/* MODULE 2 : Rédacteur & Traducteur IA de Relances WhatsApp (IA-2 & IA-3) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Service IA-2 & IA-3 · Recouvrement Bilingue FR / EN
            </span>
            <h2 className="text-lg font-extrabold text-[#0B1F3A]">
              💬 Assistant IA de rédaction & traduction de relances WhatsApp
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Adapte le ton (Courtois, Ferme, Dernier rappel) et la langue du destinataire
          </span>
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
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              N° Facture & Solde (FCFA)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={remDocNumber}
                onChange={(e) => setRemDocNumber(e.target.value)}
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
              <option value="fr">🇫🇷 Français (Francophone)</option>
              <option value="en">🇬🇧 English (Anglophone)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Consigne particulière (optionnel — ex: proposer un paiement en 2 fois d&apos;ici vendredi)
            </label>
            <input
              type="text"
              value={remCustom}
              onChange={(e) => setRemCustom(e.target.value)}
              placeholder="Ex: Proposer d'envoyer une avance de 30 000 FCFA aujourd'hui par MTN MoMo"
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
