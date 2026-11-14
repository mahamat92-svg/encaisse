import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeCameroonPhone } from "@/lib/fapshi";
import {
  activatePaidSubscriptionAndCreditBalance,
  getFapshiServerConfig,
  resolvePlanAmount,
} from "@/lib/fapshi-server";

function resolveOperator(method: string): {
  medium: "orange money" | "mobile money";
  service: "orange" | "mtn";
  label: "Orange Money" | "MTN MoMo";
} {
  const lower = method.toLowerCase();
  if (lower.includes("orange")) {
    return {
      medium: "orange money",
      service: "orange",
      label: "Orange Money",
    };
  }
  return {
    medium: "mobile money",
    service: "mtn",
    label: "MTN MoMo",
  };
}

export async function POST(request: Request) {
  try {
    const config = getFapshiServerConfig();
    if (!config.apiUser || !config.apiKey) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          fapshiStatus: "FAILED",
          error:
            "Configuration Fapshi manquante côté serveur (FAPSHI_API_USER / FAPSHI_API_KEY).",
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
    const { medium, service, label: methodLabel } = resolveOperator(
      body.method || ""
    );

    const parsedPhone = normalizeCameroonPhone(body.phone || "");
    if (!parsedPhone.valid) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          fapshiStatus: "FAILED",
          error: "Numéro invalide, vérifie ton numéro : ex 640633834",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const customerName =
      (body.customerName || "").trim() || config.nomCommercial;

    const cleanBoutiquePrefix = (config.boutiqueId || "MHA").replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
    const externalId = `${cleanBoutiquePrefix}-${planId}-${Date.now()}`.slice(
      0,
      95
    );

    // Fapshi Direct Pay attend les 9 chiffres locaux (6XXXXXXXX) sans '+' ni espace
    const phoneForFapshi = parsedPhone.local9;

    const payload = {
      amount,
      phone: phoneForFapshi,
      medium,
      service,
      name: customerName,
      email: user?.email || "client@innovtech-mha.com",
      userId: user?.id || cleanBoutiquePrefix,
      externalId,
      redirectUrl: `${config.appUrl}/app/abonnement`,
      webhook: `${config.appUrl}/api/fapshi/webhook`,
      message: `Abonnement ${planId === "business" ? "Business" : "Pro"} - ${config.nomCommercial}`,
    };

    const fapshiRes = await fetch(`${config.baseUrl}/direct-pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiuser: config.apiUser,
        apikey: config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const fapshiData = await fapshiRes.json().catch(() => ({}));
    const transId =
      typeof fapshiData?.transId === "string" ? fapshiData.transId : null;
    const fapshiMsg =
      typeof fapshiData?.message === "string" ? fapshiData.message.trim() : "";
    const fapshiErr =
      typeof fapshiData?.error === "string" ? fapshiData.error.trim() : "";

    console.log("[FAPSHI DIRECT-PAY]", {
      baseUrl: config.baseUrl,
      httpStatus: fapshiRes.status,
      transId,
      phoneSent: phoneForFapshi,
      service,
      amount,
      message: fapshiMsg,
      error: fapshiErr,
    });

    const failedAtInit = !fapshiRes.ok || !transId;
    const errorReason =
      fapshiMsg || fapshiErr || (failedAtInit ? `HTTP ${fapshiRes.status}` : "");

    let paymentId: string | null = null;
    if (user) {
      const { data: inserted } = await supabase
        .from("fapshi_payments")
        .insert({
          user_id: user.id,
          org_id: body.orgId || null,
          nom: customerName,
          phone: parsedPhone.display,
          phone_sent: phoneForFapshi,
          operator: service,
          montant: amount,
          methode: methodLabel,
          plan_id: planId,
          trans_id: transId,
          external_id: externalId,
          statut: "En attente",
          fapshi_status: failedAtInit ? "FAILED" : "PENDING",
          fapshi_error: failedAtInit ? errorReason : null,
        })
        .select("id")
        .maybeSingle();

      if (inserted?.id) {
        paymentId = inserted.id;
      }
    }

    if (failedAtInit) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          fapshiStatus: "FAILED",
          paymentId,
          error: errorReason
            ? `Fapshi a refusé : ${errorReason}`
            : "Fapshi a refusé la demande de paiement.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      transId,
      paymentId,
      amount,
      phoneDisplay: parsedPhone.display,
      phoneSent: phoneForFapshi,
      methode: methodLabel,
      status: "En attente",
      fapshiStatus: "PENDING",
      message: `On a envoyé une demande à ${parsedPhone.display}. Regarde ton téléphone, tape ton code PIN ${methodLabel}.`,
    });
  } catch (err) {
    console.error("[FAPSHI DIRECT-PAY ERROR]", err);
    return NextResponse.json(
      {
        ok: false,
        status: "En attente",
        fapshiStatus: "FAILED",
        error:
          err instanceof Error && err.message
            ? `Fapshi a refusé : ${err.message}`
            : "Erreur serveur lors de l'appel Fapshi.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const wantHistory = url.searchParams.get("history") === "1";
    const wantAllAdmin = url.searchParams.get("all") === "1";
    const transId = (url.searchParams.get("transId") || "").trim();
    const paymentId = (url.searchParams.get("paymentId") || "").trim();
    const planId =
      url.searchParams.get("planId") === "business" ? "business" : "pro";
    const amountParam = Math.round(Number(url.searchParams.get("amount") || 0));

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (wantHistory) {
      if (!user) {
        return NextResponse.json({ ok: true, payments: [] });
      }

      if (wantAllAdmin) {
        const { data: isAdmin } = await supabase.rpc("is_platform_admin");
        if (isAdmin) {
          const { data, error } = await supabase
            .from("fapshi_payments")
            .select(
              "id, user_id, nom, phone, phone_sent, operator, montant, methode, plan_id, trans_id, statut, fapshi_status, fapshi_error, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(50);

          return NextResponse.json({
            ok: true,
            payments: error ? [] : data || [],
          });
        }
      }

      const { data, error } = await supabase
        .from("fapshi_payments")
        .select(
          "id, nom, phone, phone_sent, operator, montant, methode, plan_id, trans_id, statut, fapshi_status, fapshi_error, created_at"
        )
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

    const config = getFapshiServerConfig();
    if (!config.apiUser || !config.apiKey) {
      return NextResponse.json(
        {
          ok: false,
          status: "En attente",
          error: "Configuration Fapshi manquante côté serveur.",
        },
        { status: 500 }
      );
    }

    const statusRes = await fetch(
      `${config.baseUrl}/payment-status/${encodeURIComponent(transId)}`,
      {
        method: "GET",
        headers: {
          apiuser: config.apiUser,
          apikey: config.apiKey,
        },
        cache: "no-store",
      }
    );

    const statusData = await statusRes.json().catch(() => ({}));
    const rawStatus = String(statusData?.status || "").toUpperCase();
    const fapshiStatusMsg =
      typeof statusData?.message === "string" ? statusData.message.trim() : "";
    const fapshiStatusErr =
      typeof statusData?.error === "string" ? statusData.error.trim() : "";
    const paidAmount =
      Math.round(Number(statusData?.amount || amountParam || 0)) ||
      resolvePlanAmount(planId);

    console.log("[FAPSHI PAYMENT-STATUS]", {
      transId,
      httpStatus: statusRes.status,
      status: rawStatus,
      message: fapshiStatusMsg,
      error: fapshiStatusErr,
    });

    if (rawStatus === "SUCCESSFUL") {
      if (user) {
        await activatePaidSubscriptionAndCreditBalance({
          supabase,
          userId: user.id,
          planId,
          paidAmount,
          transId,
          paymentId: paymentId || null,
        });
      }

      return NextResponse.json({
        ok: true,
        status: "Réussi",
        fapshiStatus: "SUCCESS",
        amount: paidAmount,
        message: "Paiement réussi ✅ Merci",
      });
    }

    if (rawStatus === "FAILED" || rawStatus === "EXPIRED") {
      const errDetail = fapshiStatusMsg || fapshiStatusErr || rawStatus;
      if (user) {
        await supabase
          .from("fapshi_payments")
          .update({
            fapshi_status: "FAILED",
            fapshi_error: errDetail,
          })
          .eq("trans_id", transId);
      }

      return NextResponse.json({
        ok: false,
        status: "En attente",
        fapshiStatus: "FAILED",
        message: `Fapshi a refusé : ${errDetail}`,
      });
    }

    if (!statusRes.ok && (fapshiStatusMsg || fapshiStatusErr)) {
      return NextResponse.json({
        ok: false,
        status: "En attente",
        fapshiStatus: "PENDING",
        message: `Fapshi a refusé : ${fapshiStatusMsg || fapshiStatusErr}`,
      });
    }

    return NextResponse.json({
      ok: true,
      status: "En attente",
      fapshiStatus: "PENDING",
      message: "En attente de validation sur votre téléphone...",
    });
  } catch (err) {
    console.error("[FAPSHI PAYMENT-STATUS ERROR]", err);
    return NextResponse.json(
      {
        ok: false,
        status: "En attente",
        fapshiStatus: "FAILED",
        message:
          err instanceof Error && err.message
            ? `Fapshi a refusé : ${err.message}`
            : "Erreur lors de la vérification Fapshi.",
      },
      { status: 500 }
    );
  }
}
