import { NextResponse } from "next/server";
import { buildReminderMessage } from "@/lib/ai-parser";
import type { Locale, ReminderTone } from "@/lib/format";

/**
 * Route API Backend (/api/ai/reminder) — Phase 8 (IA-2 & IA-3)
 * Génère ou traduit (FR <-> EN) un message de relance WhatsApp adapté au contexte
 * camerounais (PME ou Établissement scolaire) avec coordonnées MTN MoMo / Orange Money.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orgName?: string;
      recipientName?: string;
      documentNumber?: string;
      balance?: number;
      dueDate?: string;
      daysOverdue?: number;
      tone?: ReminderTone;
      locale?: Locale;
      mtnMomo?: string;
      orangeMoney?: string;
      customInstruction?: string;
    };

    const orgName = body.orgName || "Notre Entreprise";
    const recipientName = body.recipientName || "Client";
    const documentNumber = body.documentNumber || "FAC-2026-0001";
    const balance = Number(body.balance ?? 0);
    const dueDate = body.dueDate || new Date().toISOString().slice(0, 10);
    const daysOverdue = Number(body.daysOverdue ?? 0);
    const tone: ReminderTone = body.tone || "courteous";
    const locale: Locale = body.locale === "en" ? "en" : "fr";
    const mtnMomo = body.mtnMomo || "Non renseigné";
    const orangeMoney = body.orangeMoney || "Non renseigné";
    const customInstruction = (body.customInstruction || "").trim();

    const baseMessage = buildReminderMessage({
      orgName,
      recipientName,
      documentNumber,
      balance,
      dueDate,
      daysOverdue,
      tone,
      locale,
      mtnMomo,
      orangeMoney,
    });

    const geminiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    if (geminiKey && geminiKey.length > 10) {
      try {
        const langLabel = locale === "en" ? "anglais (English)" : "français";
        const toneLabel =
          tone === "final"
            ? "dernier rappel ferme avant suspension"
            : tone === "firm"
            ? "rappel ferme mais respectueux"
            : "rappel courtois et chaleureux";

        const prompt = `Tu es l'assistant de recouvrement WhatsApp de "${orgName}" au Cameroun.
Rédige un message WhatsApp concis, professionnel et poli en ${langLabel} (ton : ${toneLabel}) destiné à "${recipientName}" pour la facture ${documentNumber} dont le solde restant est de ${balance} FCFA (retard : ${daysOverdue} jours).
Inclus obligatoirement les numéros Mobile Money :
- MTN MoMo : ${mtnMomo}
- Orange Money : ${orangeMoney}
${customInstruction ? `Consigne particulière : ${customInstruction}` : ""}
Réponds uniquement avec le texte du message WhatsApp prêt à envoyer, sans guillemets englobants.`;

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
              },
            }),
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const generatedText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          const usage = data?.usageMetadata;
          const tokensIn = Number(usage?.promptTokenCount ?? 120);
          const tokensOut = Number(usage?.candidatesTokenCount ?? 110);
          const costMicroUsd = Math.max(
            Math.round(tokensIn * 0.1 + tokensOut * 0.4),
            100
          );

          if (generatedText) {
            return NextResponse.json({
              provider: model,
              metrics: { tokensIn, tokensOut, costMicroUsd },
              message: generatedText,
            });
          }
        }
      } catch {
        // Fallback transparent vers le modèle local bilingue
      }
    }

    // Enrichissement local si une consigne spéciale (ex: échéancier) est demandée sans clé Gemini
    let finalLocal = baseMessage;
    if (customInstruction) {
      const addon =
        locale === "en"
          ? `\n\nNote: ${customInstruction}`
          : `\n\nNote : ${customInstruction}`;
      finalLocal = `${baseMessage}${addon}`;
    }

    return NextResponse.json({
      provider: "local-free",
      metrics: { tokensIn: 50, tokensOut: 80, costMicroUsd: 0 },
      message: finalLocal,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur génération relance" },
      { status: 500 }
    );
  }
}

