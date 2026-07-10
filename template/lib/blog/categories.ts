// Taxonomy helpers. The taxonomy itself (categories, generic tags, brand/news
// tags) lives in ./config — edit it there, not here.
//
// Coverage rule: every post should land in >=1 category EXCEPT brand/news-only
// posts (archive-only by design). The blog-article skill checks this before
// publishing; see the README for an optional CI test that enforces it.

import { blogConfig, type BlogCategory } from "./config";

export type { BlogCategory };

export const CATEGORIES: BlogCategory[] = blogConfig.categories;

export const GENERIC_TAGS = new Set<string>(blogConfig.genericTags);

export const BRAND_NEWS_TAGS = new Set<string>(blogConfig.brandNewsTags);

/** Lowercase + collapse whitespace to hyphens, e.g. "My Topic" -> "my-topic". */
export function normalizeTag(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, "-");
}

/** tag -> category slug lookup, built once from CATEGORIES. */
const TAG_TO_CATEGORY: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const cat of CATEGORIES) {
    for (const t of cat.tags) m.set(normalizeTag(t), cat.slug);
  }
  return m;
})();

export function categorySlugForTag(normalizedTag: string): string | undefined {
  return TAG_TO_CATEGORY.get(normalizedTag);
}
