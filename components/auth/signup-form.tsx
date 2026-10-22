"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, MailCheck, TriangleAlert, UserPlus } from "lucide-react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/actions/auth";
import {
  fieldErrorsFrom,
  formValues,
  IDLE_AUTH_STATE,
  signUpSchema,
} from "@/lib/validation/auth";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, IDLE_AUTH_STATE);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const errors = { ...state.fieldErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const parsed = signUpSchema.safeParse(
      formValues(new FormData(event.currentTarget), [
        "email",
        "password",
        "confirmPassword",
      ]),
    );

    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    setClientErrors({});
  }

  // The account exists but is unusable until the emailed link is followed, so
  // show a destination screen rather than an empty form that looks like it did
  // nothing.
  if (state.status === "success" && !dismissed) {
    return (
      <div className="space-y-4">
        <span className="flex size-10 items-center justify-center rounded-lg bg-positive/15 text-positive">
          <MailCheck className="size-5" aria-hidden />
        </span>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight">Confirm your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{state.email}</span>.
          </p>
        </div>

        <p className="rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs text-muted-foreground">
          The link is valid for 24 hours. If it doesn&apos;t arrive, check your spam
          folder — the email comes from Supabase, not from this app.
        </p>

        <div className="flex flex-col gap-2">
          <Button asChild className="h-10 w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
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
        autoComplete="new-password"
        required
        error={errors.password}
        hint="At least 8 characters."
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

      <AuthField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        type={showConfirm ? "text" : "password"}
        autoComplete="new-password"
        required
        error={errors.confirmPassword}
        trailing={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            aria-pressed={showConfirm}
            onClick={() => setShowConfirm((visible) => !visible)}
          >
            {showConfirm ? (
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
          <UserPlus className="size-4" aria-hidden />
        )}
        {isPending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
