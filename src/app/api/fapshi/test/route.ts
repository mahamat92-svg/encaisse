import { NextResponse } from "next/server";
import { getFapshiServerConfig } from "@/lib/fapshi-server";

export async function GET() {
  const config = getFapshiServerConfig();

  if (!config.apiUser || !config.apiKey) {
    return NextResponse.json(
      {
        ok: false,
        keyValid: false,
        mode: config.isSandbox ? "sandbox" : "live",
        baseUrl: config.baseUrl,
        appUrl: config.appUrl,
        message: "FAPSHI_API_USER ou FAPSHI_API_KEY manquant côté serveur.",
      },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${config.baseUrl}/balance`, {
      method: "GET",
      headers: {
        apiuser: config.apiUser,
        apikey: config.apiKey,
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    const keyValid = res.status !== 401 && res.status !== 403;

    console.log("[FAPSHI TEST CONNECTION]", {
      baseUrl: config.baseUrl,
      mode: config.isSandbox ? "sandbox" : "live",
      httpStatus: res.status,
      keyValid,
      message: data?.message,
    });

    return NextResponse.json({
      ok: res.ok && keyValid,
      keyValid,
      mode: config.isSandbox ? "sandbox" : "live",
      baseUrl: config.baseUrl,
      appUrl: config.appUrl,
      fapshiHttpStatus: res.status,
      balance: typeof data?.balance === "number" ? data.balance : null,
      message: res.ok
        ? `Connexion Fapshi (${config.isSandbox ? "SANDBOX" : "LIVE"}) valide.`
        : data?.message || `Réponse Fapshi HTTP ${res.status}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        keyValid: false,
        mode: config.isSandbox ? "sandbox" : "live",
        baseUrl: config.baseUrl,
        appUrl: config.appUrl,
        message:
          err instanceof Error ? err.message : "Impossible de joindre Fapshi.",
      },
      { status: 500 }
    );
  }
}
