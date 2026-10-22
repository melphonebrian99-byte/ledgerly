/**
 * Returns a path that is safe to redirect to.
 *
 * Anything user-supplied that ends up in a redirect needs this: without it,
 * `/login?next=https://evil.example` (or `//evil.example`, which browsers read
 * as protocol-relative) turns the sign-in form into an open redirect that
 * borrows our domain's trust.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) return fallback;

  const isAbsolutePath = value.startsWith("/");
  const isProtocolRelative = value.startsWith("//");
  const hasBackslash = value.includes("\\");

  if (!isAbsolutePath || isProtocolRelative || hasBackslash) return fallback;

  return value;
}
