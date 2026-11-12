import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "InnovTech Encaisse SaaS",
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}

