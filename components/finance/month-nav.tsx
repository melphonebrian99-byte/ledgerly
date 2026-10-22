import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addMonths, isFutureMonth, monthLabel } from "@/lib/period";

/**
 * Month stepper for the list pages. Links rather than client state so the
 * selected month lives in the URL: shareable, back-button friendly, and the
 * server renders the right rows on first paint.
 */
export function MonthNav({
  month,
  basePath,
}: {
  month: string;
  basePath: "/transactions" | "/budgets";
}) {
  const previous = addMonths(month, -1);
  const next = addMonths(month, 1);
  const atCurrentMonth = isFutureMonth(next);

  return (
    <nav aria-label="Month" className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon">
        <Link
          href={{ pathname: basePath, query: { month: previous } }}
          aria-label={`Previous month, ${monthLabel(previous)}`}
        >
          <ChevronLeft aria-hidden />
        </Link>
      </Button>
      <span className="min-w-36 text-center text-sm font-medium tabular-nums">
        {monthLabel(month)}
      </span>
      {atCurrentMonth ? (
        <Button variant="ghost" size="icon" disabled aria-label="Already at the current month">
          <ChevronRight aria-hidden />
        </Button>
      ) : (
        <Button asChild variant="ghost" size="icon">
          <Link
            href={{ pathname: basePath, query: { month: next } }}
            aria-label={`Next month, ${monthLabel(next)}`}
          >
            <ChevronRight aria-hidden />
          </Link>
        </Button>
      )}
    </nav>
  );
}
