import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { blogConfig } from "./config";
import {
  CATEGORIES,
  type BlogCategory,
  normalizeTag,
  categorySlugForTag,
  GENERIC_TAGS,
  BRAND_NEWS_TAGS,
} from "./categories";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function normalizeCtaVariant(raw: unknown): string {
  if (typeof raw === "string" && raw in blogConfig.cta.variants) return raw;
  return "default";
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  authorBio: string;
  excerpt: string;
  description?: string;
  heroImage?: string;
  heroAlt?: string;
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  faq?: { question: string; answer: string }[];
  ctaVariant: string;
  content: string;
}

type PostMeta = Omit<BlogPost, "content">;

// === Frontmatter normalization ===
// gray-matter hands back whatever the YAML says: `tags: how-to` is a string,
// an unquoted `date:` is a Date object, `seo:` may be anything. Coerce every
// field to the shape the rest of the kit assumes so one typo in one post can't
// crash every blog route; throw (with the filename) only for mistakes that
// would corrupt public URLs.

const SLUG_RE = /^[a-zA-Z0-9._-]+$/;
// Static routes under /blog take precedence over /blog/[slug]. A post using
// one of these values would be listed and added to the sitemap, but its article
// page could never be reached.
//
// "page" and "topic" are deliberately NOT reserved: those folders have no
// page.tsx at their own level (only nested under [page]/[category]), so
// single-segment requests like /blog/page backtrack to [slug] and render the
// post — verified empirically. Only rss.xml/route.ts owns its exact path.
const RESERVED_SLUGS = new Set(["rss.xml"]);

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

function asStringArray(v: unknown): string[] | undefined {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) {
    const out = v.map(asString).filter((s): s is string => !!s);
    return out.length ? out : undefined;
  }
  return undefined;
}

function normalizeDate(v: unknown, file: string): string {
  if (v == null || v === "") return new Date().toISOString();
  const d = v instanceof Date ? v : new Date(String(v));
  if (isNaN(d.getTime())) {
    throw new Error(`[blog] Invalid \`date\` in content/blog/${file}: ${JSON.stringify(v)}`);
  }
  // YAML parses an unquoted YYYY-MM-DD value as a Date at UTC midnight. Keep
  // that value date-only so formatBlogDate applies its calendar-date/UTC path
  // instead of shifting it to the previous day in negative UTC offsets.
  return v instanceof Date ? d.toISOString().slice(0, 10) : String(v);
}

function normalizeMeta(file: string, data: Record<string, unknown>): PostMeta {
  const slug = asString(data.slug) || file.replace(/\.mdx$/, "");
  if (!SLUG_RE.test(slug) || slug === "." || slug === "..") {
    throw new Error(
      `[blog] Invalid slug ${JSON.stringify(slug)} in content/blog/${file} — use only letters, digits, hyphens, dots, underscores.`
    );
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    throw new Error(
      `[blog] Reserved slug ${JSON.stringify(slug)} in content/blog/${file} — this URL is used by a built-in blog route.`
    );
  }
  const seoRaw = (typeof data.seo === "object" && data.seo) || {};
  const seo = {
    title: asString((seoRaw as Record<string, unknown>).title),
    description: asString((seoRaw as Record<string, unknown>).description),
    ogImage: asString((seoRaw as Record<string, unknown>).ogImage),
  };
  const faq = Array.isArray(data.faq)
    ? data.faq
        .map((f) => ({
          question: asString((f as Record<string, unknown>)?.question),
          answer: asString((f as Record<string, unknown>)?.answer),
        }))
        .filter((f): f is { question: string; answer: string } => !!f.question && !!f.answer)
    : undefined;
  const description = asString(data.description);

  return {
    slug,
    title: asString(data.title) || "Untitled",
    date: normalizeDate(data.date, file),
    author: asString(data.author) || blogConfig.defaultAuthor,
    authorBio: asString(data.authorBio) || blogConfig.defaultAuthorBio,
    // Fall back to `description` so listing cards / related posts / RSS never
    // render a blank summary when a post omits `excerpt`.
    excerpt: asString(data.excerpt) || description || "",
    description,
    heroImage: asString(data.heroImage),
    heroAlt: asString(data.heroAlt),
    tags: asStringArray(data.tags),
    seo: seo.title || seo.description || seo.ogImage ? seo : undefined,
    faq: faq?.length ? faq : undefined,
    ctaVariant: normalizeCtaVariant(data.ctaVariant),
  };
}

// === Corpus index ===
// Single scan produces both the sorted post list and a slug->filename map.
// Duplicate slugs are a build error, not a silent last-writer-wins: two files
// resolving to the same slug means listings/RSS/sitemap advertise a URL that
// serves only one of them, decided by filesystem order.
//
// Build/prod memo: the corpus changes only on deploy (a new .mdx -> rebuild),
// and this runs many times across a full build. Cache in production to avoid
// re-reading + re-parsing every post on each call; skip in dev so edits
// hot-reload.

interface CorpusIndex {
  posts: PostMeta[];
  slugToFile: Map<string, string>;
}

let cachedIndex: CorpusIndex | null = null;

function getIndex(): CorpusIndex {
  if (cachedIndex && process.env.NODE_ENV === "production") return cachedIndex;
  const empty: CorpusIndex = { posts: [], slugToFile: new Map() };
  if (!fs.existsSync(BLOG_DIR)) return empty;

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  const slugToFile = new Map<string, string>();
  const posts: PostMeta[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    const meta = normalizeMeta(file, data);
    const existing = slugToFile.get(meta.slug);
    if (existing) {
      throw new Error(
        `[blog] Duplicate slug "${meta.slug}": content/blog/${existing} and content/blog/${file} resolve to the same /blog/${meta.slug} URL. Rename one file or set a distinct \`slug\` in its frontmatter.`
      );
    }
    slugToFile.set(meta.slug, file);
    posts.push(meta);
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cachedIndex = { posts, slugToFile };
  return cachedIndex;
}

export function getAllPosts(): Omit<BlogPost, "content">[] {
  return getIndex().posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const file = getIndex().slugToFile.get(slug);
  if (!file) return null;
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
  const { data, content } = matter(raw);
  return { ...normalizeMeta(file, data), content };
}

export function getRelatedPosts(
  currentSlug: string,
  tags?: string[],
  limit = 3
): Omit<BlogPost, "content">[] {
  if (!tags || tags.length === 0) return [];
  const all = getAllPosts().filter((p) => p.slug !== currentSlug);
  const scored = all.map((post) => {
    const overlap = (post.tags || []).filter((t) => tags.includes(t)).length;
    return { ...post, score: overlap };
  });
  return scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// === Topic categories + pagination ===

export const POSTS_PER_PAGE = blogConfig.postsPerPage;

function normalizedTags(post: { tags?: string[] }): string[] {
  return (post.tags ?? []).map(normalizeTag);
}

/** Category slugs a post belongs to, in CATEGORIES order, deduped. */
export function getPostCategorySlugs(post: { tags?: string[] }): string[] {
  const matched = new Set<string>();
  for (const t of normalizedTags(post)) {
    const slug = categorySlugForTag(t);
    if (slug) matched.add(slug);
  }
  return CATEGORIES.filter((c) => matched.has(c.slug)).map((c) => c.slug);
}

export function getCategoriesForPost(post: { tags?: string[] }): BlogCategory[] {
  const slugs = new Set(getPostCategorySlugs(post));
  return CATEGORIES.filter((c) => slugs.has(c.slug));
}

/** Primary category = most matching tags; tie-break by CATEGORIES order. */
export function getPrimaryCategory(post: { tags?: string[] }): BlogCategory | null {
  const tags = new Set(normalizedTags(post));
  let best: BlogCategory | null = null;
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    const score = cat.tags.reduce(
      (n, t) => n + (tags.has(normalizeTag(t)) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
}

/** True when a post's only non-generic tags are brand/news (archive-only, no hub). */
export function isArchiveOnly(post: { tags?: string[] }): boolean {
  const nonGeneric = normalizedTags(post).filter((t) => !GENERIC_TAGS.has(t));
  return nonGeneric.length > 0 && nonGeneric.every((t) => BRAND_NEWS_TAGS.has(t));
}

export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getPostsByCategory(slug: string): PostMeta[] {
  return getAllPosts().filter((p) => getPostCategorySlugs(p).includes(slug));
}

/** All categories with post counts, in CATEGORIES order. */
export function getAllCategories(): (BlogCategory & { count: number })[] {
  const posts = getAllPosts();
  return CATEGORIES.map((c) => ({
    ...c,
    count: posts.filter((p) => getPostCategorySlugs(p).includes(c.slug)).length,
  }));
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
}

export function paginate<T>(
  items: T[],
  page: number,
  perPage = POSTS_PER_PAGE
): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clamped = Math.min(Math.max(1, page), totalPages);
  const start = (clamped - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: clamped,
    totalPages,
    total,
    perPage,
  };
}

/** Format a post date for display, e.g. "March 5, 2026". */
export function formatBlogDate(
  date: string,
  month: "long" | "short" = "long"
): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const value = new Date(dateOnly ? `${date}T00:00:00Z` : date);
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
    ...(dateOnly && { timeZone: "UTC" }),
  });
}

/** Parse a /page/[n] route param to a positive integer, or null if invalid. */
export function parsePageParam(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}
