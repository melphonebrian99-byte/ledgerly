"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Route-level boundary for the authenticated area. A failed query should look
 * like a page that can be retried, not a blank screen with a stack trace.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="space-y-3 py-8 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-base font-medium">We couldn&rsquo;t load this page</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while reading your data. Nothing was changed —
            try again in a moment.
          </p>
        </div>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw aria-hidden />
          Try again
        </Button>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
