import Link from "next/link";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome back. The sign-in form is wired up in step 4 of the build.
      </p>

      <div className="mt-5 rounded-lg border border-dashed border-border bg-background/50 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">Form coming next</p>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Need an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
