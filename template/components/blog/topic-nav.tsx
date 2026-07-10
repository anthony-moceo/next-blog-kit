import Link from "next/link";
import { getAllCategories } from "@/lib/blog";

/** Row of topic-hub links — used on the blog landing and every hub (sibling
 * linking). Highlights the active hub. Hides empty hubs. */
export function TopicNav({ activeSlug }: { activeSlug?: string }) {
  const categories = getAllCategories().filter((c) => c.count > 0);
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition-colors ${
      active
        ? "border-[var(--blog-accent)]/60 bg-[var(--blog-accent)]/10 font-medium text-[var(--blog-accent)]"
        : "border-border/60 text-muted-foreground hover:border-[var(--blog-accent)]/50 hover:text-foreground"
    }`;

  return (
    <nav aria-label="Browse by topic" className="flex flex-wrap gap-2">
      <Link href="/blog" className={chip(!activeSlug)}>
        All posts
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/blog/topic/${c.slug}`}
          className={chip(c.slug === activeSlug)}
          aria-current={c.slug === activeSlug ? "page" : undefined}
        >
          {c.title} <span className="opacity-60">{c.count}</span>
        </Link>
      ))}
    </nav>
  );
}
