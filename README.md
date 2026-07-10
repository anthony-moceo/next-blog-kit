# next-blog-kit

A copy-in MDX blog for Next.js (App Router). One command drops a complete,
SEO-serious blog into your repo — you own the code, shadcn-style. Plus an
optional [Claude Code](https://claude.com/claude-code) skill that writes
publish-ready articles with AI-generated hero images.

Extracted from a production blog running 120+ posts.

## What you get

- **File-based content** — `content/blog/*.mdx` with a typed frontmatter
  contract, parsed with gray-matter, rendered with `next-mdx-remote` (RSC).
- **Routes** — listing with pagination (`/blog`, `/blog/page/N`), article
  pages, curated topic hubs (`/blog/topic/[category]` + pagination), RSS.
- **SEO layer** — Article/FAQPage/CollectionPage/BreadcrumbList JSON-LD,
  canonical URLs, OG/Twitter metadata, sitemap entries, self-canonical
  paginated archives.
- **Article UX** — auto table of contents from H2s, breadcrumbs, author bio,
  share buttons, tag-scored related posts.
- **MDX components** — `<Callout>`, `<InfoCard>`, `<QuickRef>`, `<Verdict>`,
  `<Divider>` available in every post without imports.
- **Conversion CTAs** — inline / bottom / sticky-sidebar CTA blocks with named
  copy variants selectable per-post, an analytics callback hook, and a single
  off switch.
- **One config file** — site identity, taxonomy, CTAs, analytics: all in
  `lib/blog/config.ts`. Nothing else needs editing.

## Requirements

- Next.js 15+ (App Router) — the routes use Next 15's Promise-based route params
- Tailwind CSS v4 (+ `@tailwindcss/typography`)
- A `@/*` path alias in tsconfig (create-next-app default)

## Install

```bash
cd your-next-app
npx next-blog-kit init
npm install next-mdx-remote gray-matter remark-gfm rss @tailwindcss/typography
npm install -D @types/rss   # TypeScript projects
```

Then:

1. **Edit `lib/blog/config.ts`** — site name, URL, categories, CTA copy.
2. **Import the styles** — add to your global CSS:
   ```css
   @plugin "@tailwindcss/typography";
   @import "../styles/blog.css"; /* adjust path */
   ```
3. **Wire the sitemap** — in your `app/sitemap.ts`:
   ```ts
   import { getBlogSitemapEntries } from "@/lib/blog";

   export default function sitemap(): MetadataRoute.Sitemap {
     return [
       { url: "https://example.com", lastModified: new Date() },
       ...getBlogSitemapEntries(),
     ];
   }
   ```
4. `npm run dev` and open `/blog` — a sample post is included; delete it when
   you have real content.

`init` never overwrites existing files (use `--force` if you want it to), and
detects `src/` layouts automatically.

## Theming

Components use two accent variables (set in `styles/blog.css`):

| Variable | Role |
|---|---|
| `--blog-accent` | links, highlights, buttons |
| `--blog-accent-foreground` | text on accent-colored buttons |
| `--blog-accent-2` | tinted surfaces (category chips, CTA backgrounds) |

They also use shadcn/ui-style semantic tokens (`border`, `card`, `foreground`,
`muted-foreground`). If your app doesn't define those, uncomment the fallback
block in `styles/blog.css`.

## The taxonomy (read this before adding categories)

Topic hubs are **curated, not generated**. A long-tailed tag corpus would mean
dozens of thin hub pages — the opposite of the SEO goal. Instead you define a
handful of canonical categories in config and map normalized tags into them:

- A post's tags decide which hubs it appears in; its **primary** category
  (most matching tags, config order breaks ties) is what post cards link to.
- `genericTags` ("guide", "tips", …) carry no topical signal and are ignored.
- `brandNewsTags` ("announcement", …) make a post archive-only by design.

**Coverage rule:** every post should map to ≥1 category or be intentionally
archive-only — an orphaned post appears in no hub. The blog-article skill
checks this on every article. To enforce it in CI (recommended once the blog
matters), add this vitest test:

```ts
import { describe, test, expect } from "vitest";
import { getAllPosts, getPostCategorySlugs, isArchiveOnly, getAllCategories } from "@/lib/blog";

describe("blog taxonomy coverage gate", () => {
  const posts = getAllPosts();

  test("every post maps to >=1 category, except brand/news-only posts", () => {
    const orphans = posts
      .filter((p) => getPostCategorySlugs(p).length === 0 && !isArchiveOnly(p))
      .map((p) => ({ slug: p.slug, tags: p.tags }));
    expect(orphans).toEqual([]);
  });

  test("every category hub is non-empty", () => {
    const empty = getAllCategories().filter((c) => c.count === 0).map((c) => c.slug);
    expect(empty).toEqual([]);
  });
});
```

## Frontmatter contract

```yaml
---
title: "Post Title"              # required
slug: "keyword-rich-slug"        # optional; defaults to filename
date: "2026-01-01"               # required
author: "Jane Doe"               # optional; config default
authorBio: "Short byline."       # optional; config default
excerpt: "Search-result hook."   # listing cards, RSS, OG description
description: "Fallback excerpt." # optional
heroImage: "/images/blog/slug-hero.jpg"  # optional
heroAlt: "Specific alt text."
tags: [how-to, comparison]       # map these to your config categories
seo:
  title: "Custom SEO title"      # <60 chars
  description: "Meta description under 160 chars."
  ogImage: "/images/custom-og.jpg"
faq:                             # renders FAQPage JSON-LD
  - question: "Reader-phrased question?"
    answer: "Direct answer."
ctaVariant: default              # any variant key from config
---
```

## The authoring skill (Claude Code)

```bash
npx next-blog-kit skill
```

Installs `.claude/skills/blog-article/` into your repo. Then in Claude Code:

> write a blog post about choosing between X and Y

The skill runs a full editorial pipeline, not just "generate text":

1. **Topic gate** — searches your existing corpus, classifies the work as
   net-new / refresh / consolidate, and stops instead of creating a
   duplicate-intent URL.
2. **Draft** — 1,500–2,500 word MDX with the frontmatter contract, SEO/AEO
   structure (keyword placement, extractable answers, FAQ + JSON-LD), MDX
   components, internal links, and hard anti-AI-slop writing rules.
3. **Taxonomy check** — verifies the post's tags land it in ≥1 topic hub.
4. **Hero image (optional)** — provider ladder: any image-gen MCP tool in the
   session → Leonardo.ai (`LEONARDO_API_KEY`) → OpenAI (`OPENAI_API_KEY`) →
   emits a manual prompt. Output contract: 16:9 JPEG under 400 KB at
   `public/images/blog/{slug}-hero.jpg`, no baked-in text.
5. **Verify** — heroImage path matches a real file, FAQ sync, internal links
   resolve, build passes.

## License

MIT
