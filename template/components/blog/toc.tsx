"use client";

import { useEffect, useState } from "react";

/**
 * Table of contents with active-section highlighting. Server-renders the full
 * list (crawlers and no-JS readers see everything); an IntersectionObserver
 * lights up the section currently in view.
 */
export function TableOfContents({
  headings,
}: {
  headings: { text: string; id: string }[];
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length < 2) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // Highlight the first in-view heading, in document order.
        const current = headings.find((h) => visible.has(h.id));
        if (current) setActive(current.id);
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="mb-10 rounded-xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        In this article
      </h2>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "true" : undefined}
              className={`block border-l-2 py-1 pl-3 text-sm transition-colors ${
                active === h.id
                  ? "border-[var(--blog-accent)] text-[var(--blog-accent)]"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
