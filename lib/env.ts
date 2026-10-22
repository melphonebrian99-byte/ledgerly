/**
 * Single access point for Supabase configuration.
 *
 * `NEXT_PUBLIC_*` variables are inlined at build time, so they must be read as
 * static property accesses (no computed keys) for the bundler to see them.
 *
 * The service-role key is intentionally absent: it bypasses Row Level Security
 * and must never be reachable from this app. If a future feature needs it,
 * that feature belongs in a separate server process, not here.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both vars are present. Lets the app build and render before a
 * Supabase project exists, instead of crashing on import. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      [
        "Supabase is not configured.",
        "Copy .env.example to .env.local and set:",
        "  NEXT_PUBLIC_SUPABASE_URL",
        "  NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "Then restart the dev server (env vars are read at startup).",
      ].join("\n"),
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
