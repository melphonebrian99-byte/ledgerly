import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers.
 *
 * A new client is created for every request — never cache or share one across
 * requests, or users can end up sharing a session.
 *
 * `setAll` runs inside a try/catch because Server Components are not allowed to
 * write cookies in Next. In that case the write is a no-op and `proxy.ts`
 * is responsible for refreshing the session cookies.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component: the proxy refreshes the session on
          // the next navigation, so nothing is lost.
        }
      },
    },
  });
}
