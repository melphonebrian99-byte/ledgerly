import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` and the exported function to
 * `proxy` (a default export also works). This runs before every matched request.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets. Without this, the proxy would run for every CSS/JS
  // chunk and image request, which is pure overhead and can break asset
  // delivery if the logic ever redirects.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)",
  ],
};
