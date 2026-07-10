import type { MetadataRoute } from "next";
import { blogConfig } from "./config";
import { getAllPosts, getAllCategories, POSTS_PER_PAGE } from "./posts";

/**
 * All blog URLs (index, posts, paginated archive, topic hubs + their pages)
 * as sitemap entries. Spread this into your app/sitemap.ts:
 *
 *   import { getBlogSitemapEntries } from "@/lib/blog";
 *   export default function sitemap(): MetadataRoute.Sitemap {
 *     return [
 *       { url: "https://example.com", lastModified: new Date() },
 *       ...getBlogSitemapEntries(),
 *     ];
 *   }
 */
export function getBlogSitemapEntries(): MetadataRoute.Sitemap {
  const baseUrl = blogConfig.siteUrl;
  const now = new Date();
  const posts = getAllPosts();
  const categories = getAllCategories();

  return [
    { url: `${baseUrl}/blog`, lastModified: now },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
    })),
    // Paginated archive (page 1 is /blog above)
    ...Array.from(
      { length: Math.max(0, Math.ceil(posts.length / POSTS_PER_PAGE) - 1) },
      (_, i) => ({ url: `${baseUrl}/blog/page/${i + 2}`, lastModified: now }),
    ),
    // Topic hubs + their paginated pages
    ...categories
      .filter((c) => c.count > 0)
      .flatMap((c) =>
        Array.from(
          { length: Math.ceil(c.count / POSTS_PER_PAGE) },
          (_, i) => ({
            url:
              i === 0
                ? `${baseUrl}/blog/topic/${c.slug}`
                : `${baseUrl}/blog/topic/${c.slug}/page/${i + 1}`,
            lastModified: now,
          }),
        ),
      ),
  ];
}
