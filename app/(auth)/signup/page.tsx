import { SetupNotice } from "@/components/auth/setup-notice";
import { SignupForm } from "@/components/auth/signup-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        One account keeps your transactions and budgets in sync.
      </p>

      <div className="mt-5">
        {!isSupabaseConfigured() ? <SetupNotice /> : null}
        <SignupForm />
      </div>
    </div>
  );
}
