import { NextResponse } from "next/server";

const VILLAGE_COORDS: Record<string, { lat: number; lon: number }> = {
  Ngaoundéré: { lat: 7.3167, lon: 13.5833 },
  Meiganga: { lat: 6.5167, lon: 14.3 },
  Touboro: { lat: 7.7667, lon: 15.3667 },
  Tibati: { lat: 6.4667, lon: 12.6333 },
  Banyo: { lat: 6.75, lon: 11.8167 },
  Garoua: { lat: 9.3, lon: 13.4 },
  Maroua: { lat: 10.591, lon: 14.3159 },
  Kousseri: { lat: 12.0769, lon: 15.0306 },
  "N'Djamena": { lat: 12.1348, lon: 15.0557 },
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "weather" | "doctor" | "chat";
      village?: string;
      culture?: string;
      question?: string;
      fulfulde?: boolean;
      imageBase64?: string;
      imageMime?: string;
    };

    const action = body.action;

    if (action === "weather") {
      const village = body.village || "Ngaoundéré";
      const culture = body.culture || "Maïs";
      const coords = VILLAGE_COORDS[village] || VILLAGE_COORDS["Ngaoundéré"];

      let rain3Days = 0;
      let rainTomorrow = 0;
      let tempMax = 29;

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=precipitation_sum,temperature_2m_max&forecast_days=3&timezone=Africa%2FDouala`;
        const res = await fetch(url, { next: { revalidate: 1800 } });
        if (res.ok) {
          const data = await res.json();
          const rains: number[] = data?.daily?.precipitation_sum || [0, 0, 0];
          const temps: number[] = data?.daily?.temperature_2m_max || [29];
          rain3Days = Math.round(
            rains.slice(0, 3).reduce((a: number, b: number) => a + (Number(b) || 0), 0) * 10
          ) / 10;
          rainTomorrow = Number(rains[1] ?? rains[0] ?? 0);
          tempMax = Math.round(Number(temps[0] ?? 29));
        }
      } catch {
        // Fallback déterministe si hors-ligne
        rain3Days = 8.4;
        rainTomorrow = 4.2;
        tempMax = 28;
      }

      const shouldWater = rainTomorrow < 2 && rain3Days < 5;
      const advice =
        rainTomorrow >= 2
          ? `N'arrose pas, pluie prévue demain à ${village} (${rain3Days} mm sur 3 jours). Bon moment pour ton ${culture}.`
          : rain3Days >= 5
            ? `Sème ton ${culture} dans 2 jours à ${village}, il va pleuvoir (${rain3Days} mm prévus).`
            : `Temps sec à ${village} (${tempMax}°C). Arrose ton ${culture} tôt le matin ou le soir.`;

      return NextResponse.json({
        village,
        culture,
        rain3Days,
        rainTomorrow,
        tempMax,
        shouldWater,
        waterStatus: shouldWater ? "Arrose aujourd'hui" : "N'arrose pas",
        advice,
      });
    }

    if (action === "doctor") {
      const geminiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

      if (geminiKey && geminiKey.length > 10 && body.imageBase64) {
        try {
          const base64Data = body.imageBase64.replace(
            /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
            ""
          );
          const mimeType = body.imageMime || "image/jpeg";
          const prompt = `Tu es un agronome pour l'Adamaoua et le Sahel (Cameroun/Tchad). Analyse cette photo de feuille malade. Réponds en JSON strict avec 3 champs en français très simple : {"maladie":"string","gravite":"Faible|Modérée|Élevée","traitement":"string courte et pratique disponible localement"}`;

          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              }),
            }
          );

          if (resp.ok) {
            const data = await resp.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.maladie && parsed.traitement) {
                return NextResponse.json({
                  maladie: String(parsed.maladie),
                  gravite: String(parsed.gravite || "Modérée"),
                  traitement: String(parsed.traitement),
                });
              }
            }
          }
        } catch {
          // Fallback local ci-dessous
        }
      }

      return NextResponse.json({
        maladie: "Taches foliaires / Cercosporiose",
        gravite: "Modérée",
        traitement:
          "Enlève les feuilles très abîmées, pulvérise du savon noir + huile de neem (ou fongicide doux) tôt le matin, et espace l'arrosage au pied.",
      });
    }

    if (action === "chat") {
      const question = (body.question || "").trim();
      const fulfulde = Boolean(body.fulfulde);
      if (!question) {
        return NextResponse.json(
          { error: "Écris ta question d'abord." },
          { status: 400 }
        );
      }

      const geminiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

      if (geminiKey && geminiKey.length > 10) {
        try {
          const langInstruction = fulfulde
            ? "Réponds en français simple et court (3 phrases max), puis ajoute une courte traduction en Fulfulde (Adamaoua)."
            : "Réponds en français très simple, court et pratique (3 phrases max), adapté aux paysans de l'Adamaoua et du Sahel.";
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Tu es un conseiller agricole pour l'Adamaoua et le Sahel (Ngaoundéré, Garoua, Maroua, N'Djamena). ${langInstruction}\nQuestion du paysan : ${question}`,
                      },
                    ],
                  },
                ],
                generationConfig: { temperature: 0.3 },
              }),
            }
          );

          if (resp.ok) {
            const data = await resp.json();
            const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answer) {
              return NextResponse.json({ answer: answer.trim() });
            }
          }
        } catch {
          // Fallback ci-dessous
        }
      }

      const qLower = question.toLowerCase();
      let baseAnswer =
        "Pour l'Adamaoua et le Sahel, prépare bien le sol avant les premières pluies, utilise du compost ou fumier bien décomposé et sème en lignes espacées de 75 cm.";
      if (qLower.includes("maïs") || qLower.includes("mais")) {
        baseAnswer =
          "Pour le maïs : sème dès que la pluie est régulière (2 graines par poquet), mets de l'engrais NPK au semis et sarcle 2 semaines après.";
      } else if (qLower.includes("mil") || qLower.includes("sorgho")) {
        baseAnswer =
          "Le mil résiste bien à la chaleur : sème en début de saison des pluies, éclaircis à 2 plants par poquet et surveille les oiseaux à la récolte.";
      } else if (qLower.includes("engrais") || qLower.includes("fumier")) {
        baseAnswer =
          "Mélange du fumier de bœuf bien sec avec un peu d'engrais NPK au pied des plants, jamais directement sur les feuilles.";
      }

      const finalAnswer = fulfulde
        ? `${baseAnswer}\n\n🗣️ Fulfulde : Remugo bee ndiyam e birni Adamaoua : remu wakkati ndiyam fuɗɗii, waɗu birni bee hakkiilo.`
        : baseAnswer;

      return NextResponse.json({ answer: finalAnswer });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur Agriculture IA" },
      { status: 500 }
    );
  }
}
