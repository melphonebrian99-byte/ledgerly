import Link from "next/link";
import { Wallet } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { requireUser } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

/**
 * Every route below this layout reads the session cookie, so none of them may be
 * prerendered. Without this, a build that happened to run before Supabase was
 * configured would bake a static "redirect to /login" response into the output
 * and keep serving it even once credentials exist.
 */
export const dynamic = "force-dynamic";

/**
 * Shell for the authenticated area.
 *
 * The guard lives here rather than in each page: every route below this layout
 * needs a user, and a per-page check is a check someone eventually forgets.
 * `proxy.ts` also redirects earlier so the shell never renders for a signed-out
 * visitor, but this is the authoritative check.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
          <div className="flex items-center gap-1.5">
            <MobileNav />
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold tracking-tight lg:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Wallet className="size-4 text-primary" aria-hidden />
              {SITE_NAME}
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <UserMenu email={user.email ?? "Signed in"} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
