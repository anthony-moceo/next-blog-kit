import RSS from "rss";
import { blogConfig, getAllPosts } from "@/lib/blog";

export async function GET() {
  const posts = getAllPosts();

  const feed = new RSS({
    title: `${blogConfig.siteName} ${blogConfig.blogTitle}`,
    description: blogConfig.blogDescription,
    site_url: blogConfig.siteUrl,
    feed_url: `${blogConfig.siteUrl}/blog/rss.xml`,
    language: "en",
  });

  for (const post of posts) {
    feed.item({
      title: post.title,
      description: post.excerpt,
      url: `${blogConfig.siteUrl}/blog/${post.slug}`,
      date: new Date(post.date),
      author: post.author,
      categories: post.tags || [],
    });
  }

  return new Response(feed.xml({ indent: true }), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
