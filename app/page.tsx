import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Lock,
  Receipt,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const primaryCta =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const secondaryCta =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

/* Illustrative figures for the product preview. Deliberately marked as demo
   data in the UI so no one mistakes this for their own account. */
const months = [
  { label: "May", income: 48, expense: 34 },
  { label: "Jun", income: 62, expense: 41 },
  { label: "Jul", income: 55, expense: 52 },
  { label: "Aug", income: 78, expense: 46 },
  { label: "Sep", income: 66, expense: 58 },
  { label: "Oct", income: 88, expense: 61 },
];

const categories = [
  { name: "Housing", share: 38, color: "bg-chart-1" },
  { name: "Food", share: 22, color: "bg-chart-2" },
  { name: "Transport", share: 14, color: "bg-chart-3" },
  { name: "Utilities", share: 11, color: "bg-chart-4" },
  { name: "Other", share: 15, color: "bg-chart-5" },
];

const features = [
  {
    icon: BarChart3,
    title: "A dashboard you actually read",
    body: "Balance, monthly income, and monthly spend at a glance, with a category breakdown that updates as you log activity.",
  },
  {
    icon: Receipt,
    title: "Transactions that stay tidy",
    body: "Add, edit, and delete entries with validated forms. Filter by month, type, or category without leaving the table.",
  },
  {
    icon: Target,
    title: "Budgets with a spine",
    body: "Set a monthly limit per category. Progress bars shift to amber at 80% and rose past 100%, with icons so the state never depends on color alone.",
  },
  {
    icon: Lock,
    title: "Private by construction",
    body: "Supabase Auth handles sign-in, and Postgres Row Level Security guarantees every query is scoped to your user at the database level.",
  },
];

export default function HomePage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      {/* Backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Wallet className="size-5" aria-hidden />
          </span>
          <span className="text-base font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>

        <nav aria-label="Account" className="flex items-center gap-2">
          <Link href="/login" className={secondaryCta}>
            Sign in
          </Link>
          <Link href="/signup" className={primaryCta}>
            Get started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-10 pb-16 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-positive" aria-hidden />
            Next.js 16 · Supabase · Tailwind v4
          </p>

          <h1 className="text-balance-tight text-4xl font-semibold tracking-tight sm:text-5xl">
            {SITE_TAGLINE}
            <span className="mt-2 block bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              every dollar accounted for.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Know what came in, what went out, and what is left before the month
            ends. Dark by default, fast everywhere, and yours alone.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={`${primaryCta} w-full sm:w-auto`}>
              Create your account
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/login" className={`${secondaryCta} w-full sm:w-auto`}>
              I already have one
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {["Free to start", "No card required", "Email + password"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-positive" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="rounded-2xl border border-border bg-card/70 p-2 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Overview
                  </p>
                  <p className="text-lg font-semibold tracking-tight">October 2026</p>
                </div>
                <span className="rounded-full border border-warning/40 bg-warning-muted px-2.5 py-0.5 text-[11px] font-medium text-warning">
                  Demo data
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Total balance</p>
                  <p className="tabular mt-1 text-2xl font-semibold tracking-tight">
                    $12,480.50
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-positive">
                    <TrendingUp className="size-3.5" aria-hidden />
                    +2.4% vs September
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-positive">
                    $4,250.00
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="size-3.5 text-positive" aria-hidden />
                    6 deposits
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-negative">
                    $2,915.35
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingDown className="size-3.5 text-negative" aria-hidden />
                    24 transactions
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Cash flow, last 6 months
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-positive" aria-hidden />
                        In
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-sm bg-negative" aria-hidden />
                        Out
                      </span>
                    </div>
                  </div>
                  <div className="flex h-28 items-end gap-2 sm:gap-3" aria-hidden>
                    {months.map((month) => (
                      <div key={month.label} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-24 w-full items-end justify-center gap-0.5">
                          <div
                            className="w-1/2 max-w-3 rounded-sm bg-positive/85"
                            style={{ height: `${month.income}%` }}
                          />
                          <div
                            className="w-1/2 max-w-3 rounded-sm bg-negative/85"
                            style={{ height: `${month.expense}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{month.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="mb-4 text-xs font-medium text-muted-foreground">
                    Where it went
                  </p>
                  <ul className="space-y-2.5">
                    {categories.map((category) => (
                      <li key={category.name}>
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                          <span className="text-foreground/90">{category.name}</span>
                          <span className="tabular text-muted-foreground">{category.share}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <div
                            className={`h-full rounded-full ${category.color}`}
                            style={{ width: `${category.share}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Preview with sample figures — your dashboard fills in from your own data.
          </p>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-primary/30 hover:bg-card"
            >
              <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <feature.icon className="size-4.5" aria-hidden />
              </span>
              <h2 className="text-sm font-semibold tracking-tight">{feature.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            {SITE_NAME} — a personal finance tracker.
          </p>
          <p>Next.js · Supabase · Tailwind CSS</p>
        </div>
      </footer>
    </main>
  );
}
