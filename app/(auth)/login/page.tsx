import { TriangleAlert } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { SetupNotice } from "@/components/auth/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const next = typeof params.next === "string" ? safeRedirectPath(params.next) : undefined;

  return (
    <div className="rounded-xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick up where you left off.
      </p>

      <div className="mt-5">
        {!isSupabaseConfigured() ? <SetupNotice /> : null}

        {error ? (
          <p
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-negative/40 bg-negative/10 px-3 py-2 text-xs text-negative"
          >
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        <LoginForm next={next} />
      </div>
    </div>
  );
}
