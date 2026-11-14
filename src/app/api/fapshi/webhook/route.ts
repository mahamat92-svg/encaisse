import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  activatePaidSubscriptionAndCreditBalance,
  getFapshiServerConfig,
  resolvePlanAmount,
} from "@/lib/fapshi-server";

export async function POST(request: Request) {
  try {
    const config = getFapshiServerConfig();
    const headerApiKey =
      request.headers.get("apikey") ||
      request.headers.get("x-fapshi-apikey") ||
      "";

    if (headerApiKey && config.apiKey && headerApiKey !== config.apiKey) {
      console.warn("[FAPSHI WEBHOOK] Clé API invalide reçue dans le header.");
      return NextResponse.json(
        { ok: false, error: "Signature / API key invalide" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      transId?: string;
      status?: string;
      amount?: number;
      externalId?: string;
      userId?: string;
      message?: string;
    };

    const transId = (body.transId || "").trim();
    console.log("[FAPSHI WEBHOOK RECEIVED]", {
      transId,
      status: body.status,
      amount: body.amount,
      externalId: body.externalId,
      message: body.message,
    });

    if (!transId) {
      return NextResponse.json(
        { ok: false, error: "transId manquant" },
        { status: 400 }
      );
    }

    if (!config.apiUser || !config.apiKey) {
      return NextResponse.json(
        { ok: false, error: "FAPSHI_API_USER / FAPSHI_API_KEY manquants" },
        { status: 500 }
      );
    }

    // Re-vérifier le statut réel directement auprès de Fapshi pour sécuriser le webhook
    const verifyRes = await fetch(
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

    const verifyData = await verifyRes.json().catch(() => ({}));
    const confirmedStatus = String(
      verifyData?.status || body.status || ""
    ).toUpperCase();

    console.log("[FAPSHI WEBHOOK VERIFIED]", {
      transId,
      confirmedStatus,
      httpStatus: verifyRes.status,
    });

    const supabase = await createServerSupabase();
    const { data: paymentRow } = await supabase
      .from("fapshi_payments")
      .select("id, user_id, plan_id, montant")
      .eq("trans_id", transId)
      .maybeSingle();

    if (confirmedStatus === "SUCCESSFUL") {
      const targetUserId = paymentRow?.user_id || body.userId || "";
      const planId =
        paymentRow?.plan_id === "business" ? "business" : "pro";
      const paidAmount =
        Math.round(Number(verifyData?.amount || paymentRow?.montant || body.amount || 0)) ||
        resolvePlanAmount(planId);

      if (targetUserId) {
        await activatePaidSubscriptionAndCreditBalance({
          supabase,
          userId: targetUserId,
          planId,
          paidAmount,
          transId,
          paymentId: paymentRow?.id || null,
        });
      } else {
        await supabase
          .from("fapshi_payments")
          .update({
            statut: "Réussi",
            fapshi_status: "SUCCESS",
            fapshi_error: null,
          })
          .eq("trans_id", transId);
      }

      return NextResponse.json({
        ok: true,
        transId,
        status: "PAID",
      });
    }

    if (confirmedStatus === "FAILED" || confirmedStatus === "EXPIRED") {
      await supabase
        .from("fapshi_payments")
        .update({
          fapshi_status: "FAILED",
          fapshi_error:
            typeof verifyData?.message === "string"
              ? verifyData.message
              : confirmedStatus,
        })
        .eq("trans_id", transId);

      return NextResponse.json({
        ok: true,
        transId,
        status: "FAILED",
      });
    }

    return NextResponse.json({
      ok: true,
      transId,
      status: "PENDING",
    });
  } catch (err) {
    console.error("[FAPSHI WEBHOOK ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Erreur traitement webhook Fapshi" },
      { status: 500 }
    );
  }
}
