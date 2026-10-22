"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrorsFrom,
  formValues,
  signInSchema,
  signUpSchema,
  type AuthFormState,
} from "@/lib/validation/auth";

const NOT_CONFIGURED_MESSAGE =
  "Supabase isn't configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.";

/**
 * Translates GoTrue's error strings into something a person can act on.
 * Unknown messages pass through rather than being swallowed — a vague
 * "something went wrong" is worse than the server's own words.
 */
function friendlyAuthError(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "That email and password don't match. Check them and try again.";
  }
  if (text.includes("email not confirmed")) {
    return "Confirm your email before signing in — the link is in your inbox.";
  }
  if (text.includes("user already registered")) {
    return "That email already has an account. Sign in instead.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (text.includes("password should be")) {
    return "That password was rejected. Use at least 8 characters.";
  }
  if (text.includes("invalid email") || text.includes("unable to validate email")) {
    return "That email address was rejected by the auth server.";
  }

  return message;
}

/**
 * Best-effort absolute origin for the confirmation link.
 *
 * The `origin` header is present on form posts from our own pages. Behind a
 * proxy it can be missing, hence the forwarded-proto fallback. Getting this
 * wrong only affects the link in the email, never the session.
 */
async function requestOrigin(): Promise<string> {
  const requestHeaders = await headers();

  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function signIn(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(formValues(formData, ["email", "password"]));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: NOT_CONFIGURED_MESSAGE };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  // Deliberately outside any try/catch: `redirect` signals by throwing, and a
  // surrounding catch would swallow the navigation.
  //
  // Typed routes only accept literal paths, but `next` is user-supplied. The
  // cast is safe because safeRedirectPath has already rejected anything that
  // leaves this origin (no `//host`, no backslashes, no absolute URLs).
  const destination = safeRedirectPath(
    formData.get("next")?.toString(),
  ) as Parameters<typeof redirect>[0];

  redirect(destination);
}

export async function signUp(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(
    formValues(formData, ["email", "password", "confirmPassword"]),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: NOT_CONFIGURED_MESSAGE };
  }

  const supabase = await createClient();
  const origin = await requestOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Email confirmation is on, so the account is not usable until this link
      // is followed. The callback route exchanges the token for a session.
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  // Confirmation disabled would hand back a session immediately. Support both
  // configurations rather than assuming the dashboard setting.
  if (data.session) {
    redirect("/dashboard");
  }

  // Deliberately the same response whether or not the address was already
  // registered: with confirmations on, Supabase returns an obfuscated user for
  // existing emails, and a different message here would turn this form into an
  // account-enumeration oracle.
  return {
    status: "success",
    email: parsed.data.email,
    message: "Check your inbox to confirm your email address.",
  };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
