"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Placeholder account control.
 *
 * There is no session yet — auth lands in step 4. Rather than fake a signed-in
 * user, this shows an explicit "not signed in" state with the two real
 * destinations. Step 4 swaps the body for the user's email and a sign-out
 * action, without changing the menu structure.
 */
export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-7">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <UserRound className="size-3.5" aria-hidden />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="text-xs font-normal text-muted-foreground">Not signed in</span>
          <Badge variant="outline" className="text-[10px]">
            Guest
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/login">
            <LogIn className="size-4" aria-hidden />
            Sign in
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/signup">Create account</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
