import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url.startsWith("https://") &&
      !url.includes("votre-projet-id") &&
      !key.endsWith("...")
  );
}

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createBrowserClient(url, key, {
    cookieOptions: {
      maxAge: THIRTY_DAYS_SECONDS,
      path: "/",
      sameSite: "lax",
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

