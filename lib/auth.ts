import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * The current user, or null.
 *
 * `getUser()` rather than `getSession()`: the latter only decodes whatever
 * cookie the browser sent, which is trivially forged. `getUser()` revalidates
 * the token with the auth server.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) return null;
  return data.user;
}

/**
 * Guard for the authenticated area.
 *
 * `proxy.ts` redirects unauthenticated requests first, which avoids rendering
 * the shell at all. This is the authoritative check, because a proxy matcher is
 * easy to widen by accident and layouts also render on client-side navigation.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
