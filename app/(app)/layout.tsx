import Link from "next/link";
import { Wallet } from "lucide-react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { SITE_NAME } from "@/lib/site";

/**
 * Shell for the authenticated area.
 *
 * No auth guard yet — that is step 4, which adds the `getUser()` check here and
 * redirects to /login. The layout structure will not need to change.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
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
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
