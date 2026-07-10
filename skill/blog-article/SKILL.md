---
name: blog-article
description: Write and publish a blog article for a next-blog-kit blog — topic gate, SEO/AEO-structured MDX draft, taxonomy check, and optional AI-generated hero image. Use when the user asks to write, draft, or publish a blog post or article.
---

# Blog Article Creation

Create one publish-ready MDX article for a repo using next-blog-kit
(file-based blog: `content/blog/*.mdx` + `public/images/blog/*`).

Work through the five phases in order. Do not skip the topic gate — the most
expensive failure mode is a well-written article that duplicates an existing
URL or serves no search intent.

## Phase 0 — Load context

1. Read `lib/blog/config.ts` (or `src/lib/blog/config.ts`): site name, URL,
   categories (slugs + the tags that map into them), CTA variants.
2. List `content/blog/` and skim titles/frontmatter of the 10 most related
   existing posts. Build a mental inventory of what already exists.
3. If the repo has its own style guide (`STYLE-GUIDE.md`, `CLAUDE.md` writing
   rules, brand docs), read it. It overrides the generic rules in
   `references/writing-rules.md`.

## Phase 1 — Topic gate (go / no-go)

Follow `references/topic-gate.md`. In short:

- State the target reader problem in one sentence and pick a primary keyword.
- Search `content/blog/` for the keyword, close variants, and the reader
  problem (`rg -il "keyword|variant" content/blog`).
- Decide: **net-new**, **refresh** (update an existing post instead),
  **consolidate**, or **stop** (an existing URL already serves the intent).
- If refreshing/consolidating, edit the existing file rather than creating a
  competing URL. Tell the user which decision you made and why.

## Phase 2 — Draft

Write the article as `content/blog/{slug}.mdx`. Requirements:

**Frontmatter contract** (all of these; see the sample post for shape):

```yaml
title: ""            # required
slug: ""             # keyword-rich, hyphenated; also the filename
date: "YYYY-MM-DD"   # today
author: ""           # omit to use config default
excerpt: ""          # 1-2 sentence search-result hook
heroImage: "/images/blog/{slug}-hero.jpg"
heroAlt: ""          # specific description of the actual image
tags: []             # MUST map to >=1 category in config (Phase 3)
seo:
  title: ""          # <60 chars
  description: ""    # <160 chars
faq:                 # for question-shaped topics; feeds FAQPage JSON-LD
  - question: ""
    answer: ""
ctaVariant: default  # or another variant defined in config
```

**Body** — follow `references/writing-rules.md` strictly. The load-bearing rules:

- 1,500–2,500 words for a full post (shorter only if the user asks).
- Open with a specific scene, stat, problem, or take — never generic setup.
  The first three paragraphs render before the inline CTA: answer the search
  intent in them.
- Primary keyword in title, first paragraph, meta description, slug, and at
  least two natural H2s. No stuffing.
- H2 sections (they build the table of contents). Direct answer sentence near
  the top of each section for AI answer engines.
- Use 2–4 MDX components where they genuinely help (available without
  imports): `<Callout type="tip|warning|info">`, `<InfoCard>`, `<QuickRef>`,
  `<Verdict>`, `<Divider>`.
- A visible `## Frequently Asked Questions` section that matches the
  frontmatter `faq` array (both, in sync).
- End guides/comparisons/recommendations with a `<Verdict>` block.
- 2–4 internal links to related posts (`/blog/...`) or site pages — verify
  each target exists.
- Product mentions (if the site has a product): 2–3, woven into examples and
  evidence, never a bolted-on sales section.

## Phase 3 — Taxonomy check

Every post must map to ≥1 configured category, or be intentionally
archive-only (its only non-generic tags are in `brandNewsTags`):

1. Normalize each tag (lowercase, spaces→hyphens).
2. Check each against the `tags` arrays in `config.categories`.
3. If nothing matches: either add an appropriate existing category's tag to
   the post, or (if the post opens a genuinely new topic area with more posts
   coming) propose a new category in config — ask the user before editing
   the taxonomy.

An orphaned post silently disappears from every topic hub — treat a failed
mapping as a blocker, not a warning.

## Phase 4 — Hero image (optional but default-on)

Follow `references/image-generation.md`. Summary of the provider ladder:

1. **Image-generation MCP tool available** (e.g. Gemini/nanobanana, or any
   `generate image` tool in your session) → use it.
2. **`LEONARDO_API_KEY` set** → Leonardo.ai REST API (script in the reference).
3. **`OPENAI_API_KEY` set** → gpt-image-1 (script in the reference).
4. **None** → skip generation; write a detailed prompt into your final report
   so the user can generate the image manually, and note that the post ships
   without `heroImage` until then (remove the frontmatter field rather than
   pointing at a missing file).

Output contract regardless of provider: landscape ~16:9 (1472×832 or
1536×1024), saved to `public/images/blog/{slug}-hero.jpg`, JPEG under ~400 KB
(re-encode if larger), no text/lettering in the image, and `heroAlt` written
to describe the actual generated image.

## Phase 5 — Verify before handing off

Run this checklist (it mirrors what a reviewer will check):

- [ ] Frontmatter complete; `slug` matches the filename.
- [ ] `heroImage` path matches a file that actually exists on disk (or the
      field is absent).
- [ ] Tags map to ≥1 category (Phase 3).
- [ ] Visible FAQ matches frontmatter `faq`.
- [ ] Every internal link target exists.
- [ ] No banned AI-tell phrases or long dashes (`references/writing-rules.md`
      zero-tolerance list) — re-scan the final text, not just the draft.
- [ ] `npm run build` (or at minimum a dev-server render of `/blog/{slug}`)
      succeeds.

Then report: the decision from the topic gate, the file(s) created, the
category hub(s) the post landed in, how the hero image was produced (or the
manual prompt), and anything left for the user.

Do not commit, push, or publish unless the user asks.
