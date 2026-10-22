"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";
import { cn } from "cn";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-4" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
              <Wallet className="size-4" aria-hidden />
            </span>
            {SITE_NAME}
          </SheetTitle>
          <SheetDescription className="text-xs">Personal finance tracker</SheetDescription>
        </SheetHeader>

        <nav aria-label="Main" className="space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
