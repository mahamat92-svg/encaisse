import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

function getFapshiConfig() {
  const nomCommercial = (process.env.FAPSHI_NOM_COMMERCIAL || "").trim();
  const apiUser = (process.env.FAPSHI_API_USER || "").trim();
  const apiKey = (process.env.FAPSHI_API_KEY || "").trim();
  const boutiqueId = (process.env.FAPSHI_BOUTIQUE_ID || "").trim();
  const boutiqueUrl = (process.env.FAPSHI_BOUTIQUE_URL || "").trim();
  const isSandbox =
    process.env.FAPSHI_ENV === "sandbox" || apiKey.startsWith("FAK_TEST_");
  const baseUrl = isSandbox
    ? "https://sandbox.fapshi.com"
    : "https://live.fapshi.com";

  return {
    nomCommercial,
    apiUser,
    apiKey,
    boutiqueId,
    boutiqueUrl,
    baseUrl,
  };
}

function normalizeCameroonPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("237") && digits.length >= 12) {
    return digits.slice(3);
  }
  return digits;
}

function resolvePlanAmount(planId: string, rawAmount?: number): number {
  if (planId === "pro") return 5000;
  if (planId === "business") return 15000;
  const parsed = Math.round(Number(rawAmount ?? 0));
  return parsed >= 100 ? parsed : 5000;
}

function resolveMedium(method: string): {
  medium: "orange money" | "mobile money";
  label: "Orange Money" | "MTN MoMo";
} {
  const lower = method.toLowerCase();
  if (lower.includes("orange")) {
    return { medium: "orange money", label: "Orange Money" };
  }
  return { medium: "mobile money", label: "MTN MoMo" };
}

export async function POST(request: Request) {
  try {
    const { nomCommercial, apiUser, apiKey, boutiqueId, baseUrl } =
      getFapshiConfig();

    if (!apiUser || !apiKey) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          error:
            "Configuration Fapshi incomplète côté serveur (FAPSHI_API_KEY manquant dans .env.local / Vercel).",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      planId?: string;
      amount?: number;
      method?: string;
      phone?: string;
      customerName?: string;
      orgId?: string;
    };

    const planId = body.planId === "business" ? "business" : "pro";
    const amount = resolvePlanAmount(planId, body.amount);
    const { medium, label: methodLabel } = resolveMedium(body.method || "");
    const rawPhone = (body.phone || "").trim();
    const normalizedPhone = normalizeCameroonPhone(rawPhone);
    const customerName =
      (body.customerName || "").trim() || nomCommercial || "Client InnovTech";

    if (normalizedPhone.length < 9) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          error: "Numéro Mobile Money invalide (ex: +237 6XX XX XX XX).",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cleanBoutiquePrefix = (boutiqueId || "MHA").replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
    const externalId = `${cleanBoutiquePrefix}-${planId}-${Date.now()}`.slice(
      0,
      95
    );

    const payload = {
      amount,
      phone: normalizedPhone,
      medium,
      name: customerName,
      email: user?.email || undefined,
      userId: user?.id || cleanBoutiquePrefix,
      externalId,
      message: `Abonnement ${planId === "business" ? "Business" : "Pro"} - ${nomCommercial || "InnovTech MHA Infinity"}`,
    };

    const fapshiRes = await fetch(`${baseUrl}/direct-pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiuser: apiUser,
        apikey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const fapshiData = await fapshiRes.json().catch(() => ({}));
    const transId =
      typeof fapshiData?.transId === "string" ? fapshiData.transId : null;
    const fapshiMsg =
      typeof fapshiData?.message === "string" ? fapshiData.message.trim() : "";

    // Enregistrer dans l'historique fapshi_payments avec statut initial "En attente"
    let paymentId: string | null = null;
    if (user) {
      const { data: inserted } = await supabase
        .from("fapshi_payments")
        .insert({
          user_id: user.id,
          org_id: body.orgId || null,
          nom: customerName,
          phone: rawPhone || normalizedPhone,
          montant: amount,
          methode: methodLabel,
          plan_id: planId,
          trans_id: transId,
          external_id: externalId,
          statut: "En attente",
        })
        .select("id")
        .maybeSingle();

      if (inserted?.id) {
        paymentId = inserted.id;
      }
    }

    if (!fapshiRes.ok || !transId) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          paymentId,
          error: fapshiMsg
            ? `Erreur Fapshi : ${fapshiMsg}`
            : "Paiement échoué, réessaie",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      transId,
      paymentId,
      amount,
      methode: methodLabel,
      status: "En attente",
      message:
        fapshiMsg ||
        "Demande envoyée sur votre téléphone. Validez avec votre code PIN.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: "En attente",
        error:
          err instanceof Error && err.message
            ? `Erreur Fapshi : ${err.message}`
            : "Paiement échoué, réessaie",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const wantHistory = url.searchParams.get("history") === "1";
    const transId = (url.searchParams.get("transId") || "").trim();
    const paymentId = (url.searchParams.get("paymentId") || "").trim();
    const planId = url.searchParams.get("planId") === "business" ? "business" : "pro";
    const amountParam = Math.round(Number(url.searchParams.get("amount") || 0));

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (wantHistory) {
      if (!user) {
        return NextResponse.json({ ok: true, payments: [] });
      }
      const { data, error } = await supabase
        .from("fapshi_payments")
        .select("id, nom, phone, montant, methode, plan_id, trans_id, statut, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      return NextResponse.json({
        ok: true,
        payments: error ? [] : data || [],
      });
    }

    if (!transId) {
      return NextResponse.json(
        { ok: false, status: "En attente", error: "transId manquant." },
        { status: 400 }
      );
    }

    const { apiUser, apiKey, baseUrl } = getFapshiConfig();
    if (!apiUser || !apiKey) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          error: "Configuration Fapshi incomplète côté serveur.",
        },
        { status: 500 }
      );
    }

    const statusRes = await fetch(
      `${baseUrl}/payment-status/${encodeURIComponent(transId)}`,
      {
        method: "GET",
        headers: {
          apiuser: apiUser,
          apikey: apiKey,
        },
        cache: "no-store",
      }
    );

    const statusData = await statusRes.json().catch(() => ({}));
    const rawStatus = String(statusData?.status || "").toUpperCase();
    const fapshiStatusMsg =
      typeof statusData?.message === "string" ? statusData.message.trim() : "";
    const paidAmount =
      Math.round(Number(statusData?.amount || amountParam || 0)) ||
      resolvePlanAmount(planId);

    if (rawStatus === "SUCCESSFUL") {
      if (user) {
        const updateQuery = paymentId
          ? supabase
              .from("fapshi_payments")
              .update({ statut: "Réussi" })
              .eq("id", paymentId)
              .eq("user_id", user.id)
          : supabase
              .from("fapshi_payments")
              .update({ statut: "Réussi" })
              .eq("trans_id", transId)
              .eq("user_id", user.id);

        await updateQuery;

        const expiresAt = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        await supabase.from("subscriptions").upsert(
          {
            user_id: user.id,
            plan: planId,
            status: "active",
            expires_at: expiresAt,
          },
          { onConflict: "user_id" }
        );

        const { data: firstClient } = await supabase
          .from("clients")
          .select("id, mobile_money_balance")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstClient?.id) {
          const nextBalance =
            Number(firstClient.mobile_money_balance || 0) + paidAmount;
          await supabase
            .from("clients")
            .update({ mobile_money_balance: nextBalance })
            .eq("id", firstClient.id);
        }
      }

      return NextResponse.json({
        ok: true,
        status: "Réussi",
        fapshiStatus: rawStatus,
        amount: paidAmount,
        message: "Paiement réussi ✅ Merci",
      });
    }

    if (rawStatus === "FAILED" || rawStatus === "EXPIRED") {
      return NextResponse.json({
        ok: false,
        status: "En attente",
        fapshiStatus: rawStatus,
        message: fapshiStatusMsg
          ? `Erreur Fapshi (${rawStatus}) : ${fapshiStatusMsg}`
          : `Paiement échoué (${rawStatus}), réessaie`,
      });
    }

    if (!statusRes.ok && fapshiStatusMsg) {
      return NextResponse.json({
        ok: false,
        status: "En attente",
        message: `Erreur Fapshi : ${fapshiStatusMsg}`,
      });
    }

    return NextResponse.json({
      ok: true,
      status: "En attente",
      fapshiStatus: rawStatus || "PENDING",
      message: "En attente de validation sur votre téléphone...",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: "En attente",
        message:
          err instanceof Error && err.message
            ? `Erreur Fapshi : ${err.message}`
            : "Paiement échoué, réessaie",
      },
      { status: 500 }
    );
  }
}
