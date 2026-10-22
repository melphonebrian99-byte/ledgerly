import Link from "next/link";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign-up with Supabase Auth arrives in step 4 of the build.
      </p>

      <div className="mt-5 rounded-lg border border-dashed border-border bg-background/50 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">Form coming next</p>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
