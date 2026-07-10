// blog.config — the single place you customize next-blog-kit.
//
// Everything the blog renders (site identity, taxonomy, CTAs, analytics) is
// driven from this file. The rest of lib/blog and components/blog should not
// need editing for a normal integration.

/** Copy for one CTA variant across its three placements (inline / bottom / sidebar). */
export interface CtaCopy {
  inlineHeading: string;
  inlineBody: string;
  inlineButton: string;
  bottomHeading: string;
  bottomBody: string;
  bottomButton: string;
  sidebarHeading: string;
  sidebarBody: string;
  sidebarButton: string;
}

export interface BlogCategory {
  slug: string;
  title: string;
  description: string;
  /** Normalized tags (lowercase, spaces→hyphens) that map a post into this category. */
  tags: string[];
}

export interface BlogConfig {
  /** Site name, used in metadata titles ("Post — {siteName}") and JSON-LD publisher. */
  siteName: string;
  /** Absolute origin with no trailing slash, e.g. "https://example.com". */
  siteUrl: string;
  /** H1 + metadata title for /blog. */
  blogTitle: string;
  /** Meta description + intro line for /blog. */
  blogDescription: string;
  /** Used when a post omits `author` in frontmatter. */
  defaultAuthor: string;
  /** Used when a post omits `authorBio` in frontmatter. */
  defaultAuthorBio: string;
  /** Site-relative fallback OG image when a post has no seo.ogImage or heroImage. */
  defaultOgImage: string;
  postsPerPage: number;
  /**
   * Curated topic hubs. Do NOT generate a hub per raw tag — a long-tailed tag
   * corpus means dozens of thin pages, the opposite of the SEO goal. Curate a
   * handful of canonical categories and map normalized tags into them.
   * Order matters: earlier categories win the tie-break for a post's PRIMARY
   * category (put highest-conversion-intent hubs first).
   */
  categories: BlogCategory[];
  /**
   * Non-discriminating tags that appear across nearly every post and carry no
   * topical signal — excluded from category mapping.
   */
  genericTags: string[];
  /**
   * Brand/news tags: posts whose only non-generic tags are these get NO hub
   * (archive-only by design) and don't count as taxonomy-coverage orphans.
   */
  brandNewsTags: string[];
  cta: {
    /** Master switch — when false, no CTA blocks render anywhere. */
    enabled: boolean;
    /** Where CTA buttons link, e.g. "/signup". */
    href: string;
    /** Small print under the bottom CTA button; empty string hides it. */
    bottomFinePrint: string;
    /**
     * Named copy sets. "default" is required; add more and select per-post via
     * `ctaVariant` frontmatter. Unknown frontmatter values fall back to "default".
     */
    variants: Record<string, CtaCopy>;
  };
  /**
   * Optional client-side analytics hook, fired on any CTA click. Wire it to
   * PostHog, Plausible, GA — whatever the host app uses. Leave undefined for none.
   */
  onCtaClick?: (event: {
    slug: string;
    location: "inline" | "bottom" | "sidebar";
    variant: string;
  }) => void;
}

export const blogConfig: BlogConfig = {
  siteName: "My Site",
  siteUrl: "https://example.com",
  blogTitle: "Blog",
  blogDescription: "Guides, deep dives, and updates from the team.",
  defaultAuthor: "The Team",
  defaultAuthorBio: "We write about what we build.",
  defaultOgImage: "/images/og-default.jpg",
  postsPerPage: 12,

  categories: [
    {
      slug: "guides",
      title: "Guides",
      description: "Step-by-step guides and how-tos.",
      tags: ["guide-topic", "how-to", "tutorial"],
    },
    {
      slug: "comparisons",
      title: "Comparisons & Reviews",
      description: "Honest comparisons and best-of roundups.",
      tags: ["comparison", "review", "best-of"],
    },
  ],
  genericTags: ["guide", "guides", "tips"],
  brandNewsTags: ["announcement", "changelog", "company"],

  cta: {
    enabled: true,
    href: "/",
    bottomFinePrint: "No credit card required",
    variants: {
      default: {
        inlineHeading: "Ready to try it?",
        inlineBody: "See what this article is about, first-hand.",
        inlineButton: "Get Started",
        bottomHeading: "Start today",
        bottomBody: "Everything you just read, in one tool. Free to try.",
        bottomButton: "Get Started",
        sidebarHeading: "Try it free",
        sidebarBody: "No setup required.",
        sidebarButton: "Start Free",
      },
    },
  },

  // onCtaClick: ({ slug, location, variant }) => {
  //   window.posthog?.capture("blog_cta_clicked", { slug, location, variant });
  // },
};
