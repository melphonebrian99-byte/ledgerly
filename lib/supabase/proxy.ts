import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/** Routes that need a session. Kept in one place so it cannot drift per page. */
const PROTECTED_PREFIXES = ["/dashboard", "/transactions", "/budgets"];

/** Routes a signed-in user has no reason to see. */
const AUTH_PATHS = ["/login", "/signup"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Carries the auth cookies — and the no-store headers that come with them — onto
 * a redirect response.
 *
 * Building a fresh `NextResponse.redirect` and returning it would silently drop
 * a token that was rotated during `getUser()` above. That failure mode looks
 * like "randomly signed out on every navigation" and is miserable to debug.
 */
function redirectPreservingAuthCookies(url: URL, response: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  for (const header of ["cache-control", "pragma", "expires"]) {
    const value = response.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }

  return redirectResponse;
}

/**
 * Refreshes the Supabase session cookie on every matched request, then applies
 * the coarse route guard.
 *
 * Called from `proxy.ts` (Next 16's replacement for `middleware.ts`).
 *
 * Why refresh at all: the access token is short-lived. Without a refresh on each
 * navigation, a user would be silently logged out mid-session. The response we
 * return must be the one that carries the rotated cookies — writing them to a
 * different response loses them.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Before a Supabase project is configured the app still has to boot, so this
  // is a no-op rather than a 500 on every route. The layout guard in
  // app/(app)/layout.tsx still keeps the app area behind a session.
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

  let user = null;

  try {
    // Must be called before the response is committed, otherwise a token refresh
    // lands after the cookie write window closes. getUser() also validates the
    // token with the auth server rather than trusting the cookie contents.
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth server unreachable. Let the request through rather than 500 every
    // page; the layout guard still resolves the user and redirects if needed.
    return response;
  }

  const pathname = request.nextUrl.pathname;

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    // Remember where they were headed so sign-in can send them back.
    redirectUrl.searchParams.set("next", pathname);
    return redirectPreservingAuthCookies(redirectUrl, response);
  }

  if (user && AUTH_PATHS.includes(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return redirectPreservingAuthCookies(redirectUrl, response);
  }

  return response;
}
