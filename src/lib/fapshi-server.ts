import { createServerSupabase } from "@/lib/supabase/server";

export interface FapshiServerConfig {
  nomCommercial: string;
  apiUser: string;
  apiKey: string;
  boutiqueId: string;
  boutiqueUrl: string;
  baseUrl: string;
  isSandbox: boolean;
  appUrl: string;
}

export function getFapshiServerConfig(): FapshiServerConfig {
  const nomCommercial = (process.env.FAPSHI_NOM_COMMERCIAL || "Hadja production").trim();
  const apiUser = (process.env.FAPSHI_API_USER || "").trim();
  const apiKey = (process.env.FAPSHI_API_KEY || "").trim();
  const boutiqueId = (process.env.FAPSHI_BOUTIQUE_ID || "").trim();
  const boutiqueUrl = (process.env.FAPSHI_BOUTIQUE_URL || "").trim();

  const explicitBaseUrl = (process.env.FAPSHI_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const isSandbox = explicitBaseUrl
    ? explicitBaseUrl.includes("sandbox")
    : process.env.FAPSHI_ENV === "sandbox" || apiKey.startsWith("FAK_TEST_");

  const baseUrl =
    explicitBaseUrl ||
    (isSandbox ? "https://sandbox.fapshi.com" : "https://live.fapshi.com");

  const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  const appUrl =
    rawAppUrl && !rawAppUrl.includes("localhost")
      ? rawAppUrl
      : "https://encaisse-pi.vercel.app";

  return {
    nomCommercial,
    apiUser,
    apiKey,
    boutiqueId,
    boutiqueUrl,
    baseUrl,
    isSandbox,
    appUrl,
  };
}

export function resolvePlanAmount(planId: string, rawAmount?: number): number {
  if (planId === "pro") return 5000;
  if (planId === "business") return 15000;
  const parsed = Math.round(Number(rawAmount ?? 0));
  return parsed >= 100 ? parsed : 5000;
}

export async function activatePaidSubscriptionAndCreditBalance(params: {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  userId: string;
  planId: "pro" | "business";
  paidAmount: number;
  transId: string;
  paymentId?: string | null;
}) {
  const { supabase, userId, planId, paidAmount, transId, paymentId } = params;

  // 1. Marquer le paiement comme Réussi / SUCCESS
  const updateFields = {
    statut: "Réussi",
    fapshi_status: "SUCCESS",
    fapshi_error: null,
  };

  if (paymentId) {
    await supabase
      .from("fapshi_payments")
      .update(updateFields)
      .eq("id", paymentId);
  } else {
    await supabase
      .from("fapshi_payments")
      .update(updateFields)
      .eq("trans_id", transId);
  }

  // 2. Activer l'abonnement Pro / Business (Payé) pour 30 jours
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: planId,
      status: "active",
      expires_at: expiresAt,
    },
    { onConflict: "user_id" }
  );

  // 3. Incrémenter le solde Mobile Money du premier client si présent
  const { data: firstClient } = await supabase
    .from("clients")
    .select("id, mobile_money_balance")
    .eq("user_id", userId)
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
