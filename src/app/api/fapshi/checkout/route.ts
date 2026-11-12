import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Math.round(Number(body.amount ?? 0));
    const apiUser = typeof body.apiUser === "string" ? body.apiUser.trim() : "";
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const env = body.environment === "sandbox" ? "sandbox" : "live";
    const redirectUrl =
      typeof body.redirectUrl === "string" ? body.redirectUrl : "";
    const externalId =
      typeof body.externalId === "string" ? body.externalId : "";
    const message =
      typeof body.message === "string" ? body.message : "Facture Encaisse";

    if (!apiUser || !apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Clés API Fapshi non configurées dans Paramètres. Vous pouvez régler par Mobile Money et confirmer le paiement ci-dessous.",
        },
        { status: 400 }
      );
    }

    if (amount < 100) {
      return NextResponse.json(
        { ok: false, error: "Le montant minimum Fapshi est de 100 XAF." },
        { status: 400 }
      );
    }

    const baseUrl =
      env === "sandbox"
        ? "https://sandbox.fapshi.com"
        : "https://live.fapshi.com";

    const fapshiRes = await fetch(`${baseUrl}/initiate-pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiuser: apiUser,
        apikey: apiKey,
      },
      body: JSON.stringify({
        amount,
        redirectUrl,
        externalId,
        message,
      }),
    });

    const data = await fapshiRes.json().catch(() => ({}));
    if (!fapshiRes.ok || !data?.link) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data?.message ||
            "Impossible de générer le lien de paiement Fapshi. Vérifiez vos clés API dans Paramètres.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      link: data.link,
      transId: data.transId,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erreur serveur Fapshi",
      },
      { status: 500 }
    );
  }
}
