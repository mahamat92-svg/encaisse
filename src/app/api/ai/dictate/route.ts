import { NextResponse } from "next/server";
import { parseInvoiceDictation } from "@/lib/ai-parser";

/**
 * Route API Backend (/api/ai/dictate) — Phase 8 (IA-1, IA-4, IA-5, ADM-3)
 * 1. Si GEMINI_API_KEY est configurée côté serveur, interroge Gemini 2.5 Flash-Lite
 *    en mode JSON structuré (~0,2 FCFA par dictée).
 * 2. Sinon (ou en cas de coupure Internet/quota), bascule automatiquement
 *    sur l'analyseur déterministe local à 0 FCFA.
 * 3. Retourne systématiquement les métriques (tokensIn, tokensOut, costMicroUsd)
 *    pour la journalisation dans la table `ai_usage`.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      applyVat?: boolean;
      catalogNames?: string[];
    };
    const text = (body.text ?? "").trim();
    const applyVat = Boolean(body.applyVat);
    const catalogNames = Array.isArray(body.catalogNames)
      ? body.catalogNames.slice(0, 30)
      : [];

    if (!text) {
      return NextResponse.json(
        { error: "Texte de dictée vide" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    if (geminiKey && geminiKey.length > 10) {
      try {
        const catalogContext =
          catalogNames.length > 0
            ? `\nArticles connus du catalogue : ${catalogNames.join(", ")}.`
            : "";

        const prompt = `Tu es un assistant de facturation pour PME, commerces et écoles privées au Cameroun (monnaie FCFA entière, sans centimes).${catalogContext}
Extrais les éléments de cette dictée (français ou anglais) en JSON strict selon ce schéma :
{"docType":"invoice"|"quote","clientName":"string","lines":[{"label":"string","quantity":number,"unitPrice":number}]}
Texte: """${text}"""`;

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            }),
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          const usage = data?.usageMetadata;
          const tokensIn = Number(
            usage?.promptTokenCount ?? Math.ceil(prompt.length / 4)
          );
          const tokensOut = Number(usage?.candidatesTokenCount ?? 90);
          // Gemini 2.5 Flash-Lite : ~$0.10 / 1M input, ~$0.40 / 1M output -> ~300 micro-USD (~0,18 FCFA)
          const costMicroUsd = Math.max(
            Math.round(tokensIn * 0.1 + tokensOut * 0.4),
            100
          );

          if (rawJson) {
            const parsedGemini = JSON.parse(rawJson);
            if (
              Array.isArray(parsedGemini.lines) &&
              parsedGemini.lines.length > 0
            ) {
              const vatRate = applyVat ? 0.1925 : 0;
              const lines = parsedGemini.lines.map(
                (l: {
                  label?: string;
                  quantity?: number;
                  unitPrice?: number;
                }) => {
                  const qty = Math.max(Number(l.quantity ?? 1), 1);
                  const up = Math.max(Math.round(Number(l.unitPrice ?? 0)), 0);
                  return {
                    label: String(l.label ?? "Article"),
                    quantity: qty,
                    unitPrice: up,
                    total: Math.round(qty * up),
                  };
                }
              );
              const subtotal = lines.reduce(
                (acc: number, x: { total: number }) => acc + x.total,
                0
              );
              const vat = Math.round(subtotal * vatRate);
              return NextResponse.json({
                provider: model,
                metrics: {
                  tokensIn,
                  tokensOut,
                  costMicroUsd,
                },
                result: {
                  docType:
                    parsedGemini.docType === "quote" ? "quote" : "invoice",
                  clientName: String(parsedGemini.clientName || "Client"),
                  lines,
                  subtotal,
                  vat,
                  total: subtotal + vat,
                  applyVat,
                },
              });
            }
          }
        }
      } catch {
        // Fallback transparent sur le moteur déterministe local à 0 FCFA
      }
    }

    const fallback = parseInvoiceDictation(text, applyVat);
    return NextResponse.json({
      provider: "local-free",
      metrics: {
        tokensIn: Math.ceil(text.length / 4),
        tokensOut: 60,
        costMicroUsd: 0,
      },
      result: fallback,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur IA" },
      { status: 500 }
    );
  }
}
