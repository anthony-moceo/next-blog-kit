"use client";

import Link from "next/link";
import { blogConfig, type CtaCopy } from "@/lib/blog/config";

// CTA copy, destination, and the optional analytics hook all come from
// blog config (lib/blog/config.ts). Set cta.enabled: false there to remove
// CTAs entirely — these components then render nothing.

function copyFor(variant: string): CtaCopy {
  return blogConfig.cta.variants[variant] ?? blogConfig.cta.variants.default;
}

function trackClick(
  slug: string,
  location: "inline" | "bottom" | "sidebar",
  variant: string,
) {
  blogConfig.onCtaClick?.({ slug, location, variant });
}

const buttonCls =
  "inline-flex items-center justify-center rounded-md bg-[var(--blog-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--blog-accent-foreground)] transition-opacity hover:opacity-90";

export function BlogCTAInline({
  slug,
  variant = "default",
}: {
  slug: string;
  variant?: string;
}) {
  if (!blogConfig.cta.enabled) return null;
  const c = copyFor(variant);
  return (
    <aside className="my-10 rounded-xl border border-[var(--blog-accent)]/25 bg-[var(--blog-accent)]/[0.06] p-6 text-center backdrop-blur-sm">
      <p className="text-lg font-bold text-foreground">{c.inlineHeading}</p>
      <p className="mt-1 text-sm text-muted-foreground">{c.inlineBody}</p>
      <Link
        href={blogConfig.cta.href}
        onClick={() => trackClick(slug, "inline", variant)}
        className={`${buttonCls} mt-4`}
      >
        {c.inlineButton}
      </Link>
    </aside>
  );
}

export function BlogCTABottom({
  slug,
  variant = "default",
}: {
  slug: string;
  variant?: string;
}) {
  if (!blogConfig.cta.enabled) return null;
  const c = copyFor(variant);
  return (
    <aside className="mt-14 rounded-2xl border border-[var(--blog-accent)]/30 bg-[var(--blog-accent)]/[0.07] px-8 py-10 text-center">
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
        {c.bottomHeading}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        {c.bottomBody}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          href={blogConfig.cta.href}
          onClick={() => trackClick(slug, "bottom", variant)}
          className={buttonCls}
        >
          {c.bottomButton}
        </Link>
        {blogConfig.cta.bottomFinePrint && (
          <p className="text-xs text-muted-foreground/60">
            {blogConfig.cta.bottomFinePrint}
          </p>
        )}
      </div>
    </aside>
  );
}

export function BlogCTASidebar({
  slug,
  variant = "default",
}: {
  slug: string;
  variant?: string;
}) {
  if (!blogConfig.cta.enabled) return null;
  const c = copyFor(variant);
  return (
    <aside className="hidden xl:block sticky top-24 w-56 shrink-0 self-start ml-8">
      <div className="rounded-xl border border-[var(--blog-accent)]/25 bg-[var(--blog-accent)]/[0.06] p-5 text-center backdrop-blur-sm">
        <p className="text-sm font-bold text-foreground">{c.sidebarHeading}</p>
        <p className="mt-1 text-xs text-muted-foreground">{c.sidebarBody}</p>
        <Link
          href={blogConfig.cta.href}
          onClick={() => trackClick(slug, "sidebar", variant)}
          className={`${buttonCls} mt-3 w-full px-4 py-2 text-xs`}
        >
          {c.sidebarButton}
        </Link>
      </div>
    </aside>
  );
}
