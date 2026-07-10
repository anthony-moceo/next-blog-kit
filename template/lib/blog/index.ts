// Public surface of the blog kit's data layer. Components and routes import
// from "@/lib/blog"; only config.ts is meant to be edited by hand.
export { blogConfig } from "./config";
export type { BlogConfig, BlogCategory, CtaCopy } from "./config";
export * from "./posts";
export {
  CATEGORIES,
  GENERIC_TAGS,
  BRAND_NEWS_TAGS,
  normalizeTag,
  categorySlugForTag,
} from "./categories";
export { getBlogSitemapEntries } from "./sitemap";
