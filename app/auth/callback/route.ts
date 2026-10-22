import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the confirmation link and any other Supabase email link.
 *
 * Two flows arrive here:
 *  - `token_hash` + `type` — the default for email templates; verified with
 *    verifyOtp, no browser-stored PKCE verifier required. This is the one our
 *    default templates use, and it works even if the link is opened on a
 *    different device from the sign-up.
 *  - `code` — the PKCE flow, exchanged for a session against the verifier
 *    cookie set at sign-up.
 *
 * Both are handled so changing the email template later cannot silently break
 * confirmation.
 */

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeRedirectPath(url.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Supabase isn't configured, so the confirmation link can't be verified.",
        )}`,
        url.origin,
      ),
    );
  }

  // Supabase reports expired/used links as query params on the callback itself
  // when the template redirects straight here.
  const upstreamError =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (upstreamError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(upstreamError)}`, url.origin),
    );
  }

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const code = url.searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && type && ALLOWED_OTP_TYPES.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    // verifyOtp writes the session cookies through the server client; the
    // redirect response Next builds afterwards carries them with it.
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const message =
    "That link is invalid or has already been used. Request a fresh one by signing up again, or sign in if you already confirmed.";

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(message)}`, url.origin),
  );
}
