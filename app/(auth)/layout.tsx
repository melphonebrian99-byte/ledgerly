import Link from "next/link";
import { Wallet } from "lucide-react";

import { SITE_NAME } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_40%,black,transparent)]" />
        <div className="absolute top-1/3 left-1/2 h-80 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[110px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Wallet className="size-5" aria-hidden />
          </span>
          <span className="text-base font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>

        {children}
      </div>
    </main>
  );
}
