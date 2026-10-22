import { TriangleAlert } from "lucide-react";

/**
 * Rendered on the auth screens when the two public env vars are missing.
 *
 * Without this, sign-in fails with an opaque server error on a fresh checkout
 * and the reason lives only in the README.
 */
export function SetupNotice() {
  return (
    <div className="mb-4 flex gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="space-y-1 text-xs">
        <p className="font-medium text-warning">Supabase isn&apos;t configured</p>
        <p className="text-muted-foreground">
          Add{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">.env.local</code>,
          then restart the dev server. Submitting this form will fail until then.
        </p>
      </div>
    </div>
  );
}
