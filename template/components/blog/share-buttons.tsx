"use client";

import { useState } from "react";
import { blogConfig } from "@/lib/blog/config";

export function ShareButtons({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${blogConfig.siteUrl}/blog/${slug}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Share:</span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border/60 hover:border-[var(--blog-accent)]/50 hover:text-[var(--blog-accent)] transition-colors"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Share on X
      </a>
      <button
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link"}
        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border/60 hover:border-[var(--blog-accent)]/50 hover:text-[var(--blog-accent)] transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.439a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364l1.757 1.757"
          />
        </svg>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
