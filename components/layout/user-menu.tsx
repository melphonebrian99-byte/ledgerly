"use client";

import { LogOut, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";

export function UserMenu({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Account menu for ${email}`}
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="flex items-center gap-1.5 text-[11px] font-normal text-muted-foreground">
            <UserRound className="size-3" aria-hidden />
            Signed in as
          </span>
          <span className="block truncate text-xs font-medium">{email}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/*
          A form rather than an onClick: submitting a server action works before
          hydration, and the redirect happens on the server where the session
          cookies actually live.
        */}
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer">
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
