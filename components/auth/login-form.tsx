"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn, TriangleAlert } from "lucide-react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/actions/auth";
import {
  fieldErrorsFrom,
  formValues,
  IDLE_AUTH_STATE,
  signInSchema,
} from "@/lib/validation/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, IDLE_AUTH_STATE);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Server errors and client errors are merged; a field the client just
  // complained about takes precedence over a stale server message.
  const errors = { ...state.fieldErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const parsed = signInSchema.safeParse(
      formValues(new FormData(event.currentTarget), ["email", "password"]),
    );

    if (!parsed.success) {
      // Stop before the server action runs. The server validates again anyway;
      // this is purely to save a round trip on obvious mistakes.
      event.preventDefault();
      setClientErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    setClientErrors({});
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {/* role="alert" is itself an assertive live region; no extra wrapper
          needed, and nesting one causes double announcements in some readers. */}
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-negative/40 bg-negative/10 px-3 py-2 text-xs text-negative"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <AuthField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={errors.email}
      />

      <AuthField
        id="password"
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        error={errors.password}
        trailing={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </Button>
        }
      />

      <Button type="submit" className="h-10 w-full" disabled={isPending}>
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="size-4" aria-hidden />
        )}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Need an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
