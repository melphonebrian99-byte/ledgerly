import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | undefined;

/**
 * Browser-side Supabase client.
 *
 * Memoized on purpose: creating a client per call spawns extra auth listeners
 * and token-refresh timers, which produces duplicate session events in React
 * strict mode.
 */
export function createClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient<Database>(url, anonKey);
  }
  return browserClient;
}
