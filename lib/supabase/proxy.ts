import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session cookie on every matched request and returns a
 * response that carries any rotated cookies.
 *
 * Called from `proxy.ts` (Next 16's replacement for `middleware.ts`).
 *
 * Why this file exists at all: the access token is short-lived. Without a
 * refresh on each navigation, a user would be silently logged out mid-session.
 * The important detail is that the response object must be the one we return —
 * writing cookies to a different response loses them.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Before a Supabase project is configured the app still has to boot, so this
  // is a no-op rather than a 500 on every route.
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        // Keep the forwarded request in sync, then rebuild the response so the
        // new cookies are attached to the response the browser receives.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        // @supabase/ssr supplies no-store cache headers when it writes auth
        // cookies. Dropping them risks a CDN caching one user's session
        // response and serving it to another.
        Object.entries(headersToSet).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  // Must be called before the response is committed, otherwise a token refresh
  // lands after the cookie write window closes. getUser() also validates the
  // token with the auth server rather than trusting the cookie contents.
  await supabase.auth.getUser();

  return response;
}
