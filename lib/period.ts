/**
 * Calendar-month helpers for date-only values.
 *
 * Two conventions keep month handling honest:
 *   * A "month key" is `YYYY-MM` — what goes in a URL (`?month=2026-10`).
 *   * A "month start" is `YYYY-MM-01` — what the `date` columns store.
 *
 * `occurred_on` is a `date`, so it has no timezone. The only place a timezone
 * matters is deciding *which* month "today" belongs to. That decision is made
 * in the user's local zone rather than the server's: a month is a human
 * calendar concept, and a server in UTC would flip the month three hours late
 * for a Nairobi user. Everything else is pure string/UTC arithmetic.
 */

/** The app's users are in Kenya; KES is the only supported currency. */
export const APP_TIME_ZONE = "Africa/Nairobi";

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/;
const ISO_DATE = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Today as `YYYY-MM-DD` in the app's timezone. */
export function todayISO(now: Date = new Date()): string {
  // en-CA is the locale whose short date format is already ISO-ordered.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The month a date falls in: `2026-10-23` -> `2026-10`. */
export function monthKeyOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(now: Date = new Date()): string {
  return monthKeyOf(todayISO(now));
}

/** `2026-10` -> `2026-10-01`. */
export function monthStart(key: string): string {
  return `${key}-01`;
}

/**
 * Validates a `?month=` parameter, falling back to the current month.
 * A malformed value must not 500 the page — it just means "no filter".
 */
export function normalizeMonthKey(value: unknown): string {
  if (typeof value === "string" && MONTH_KEY.test(value)) return value;
  return currentMonthKey();
}

/** Month arithmetic on the first of the month, in UTC to avoid DST edges. */
export function addMonths(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

/**
 * Half-open range for a month: `[start, end)`. Use `.gte(start).lt(end)` so no
 * transaction is skipped or double-counted by an inclusive end date.
 */
export function monthRange(key: string): { start: string; end: string } {
  return { start: monthStart(key), end: monthStart(addMonths(key, 1)) };
}

/** `2026-10` -> `October 2026`. */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** `2026-10-23` -> `Fri 23 Oct`. Parsed as UTC so it never shifts a day. */
export function formatDayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** `2026-10-23` -> `23 October 2026`, for tooltips and titles. */
export function formatDateLong(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function isISODate(value: string): boolean {
  return ISO_DATE.test(value);
}

/** True when `key` is after the current month — used to disable "next". */
export function isFutureMonth(key: string, now: Date = new Date()): boolean {
  return key > currentMonthKey(now);
}
