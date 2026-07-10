import { blogConfig } from "./config";
import type { BlogPost } from "./posts";

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Serialize JSON-LD for safe embedding in a <script> tag. JSON.stringify does
 * NOT escape `<`, `>`, or `&`, so a `</script>` sequence in any field would
 * break out of the tag (stored XSS). Escaping these to their \u forms keeps the
 * JSON valid while making a script-tag breakout impossible — a latent foot-gun
 * today (inputs are author-controlled), but a hard guarantee once any
 * user-generated string is ever passed in.
 */
function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Renders a JSON-LD script tag for structured data */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

/** Build Article structured data from a blog post */
export function buildArticleJsonLd(post: BlogPost, slug: string) {
  const baseUrl = blogConfig.siteUrl;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    ...(post.heroImage && { image: `${baseUrl}${post.heroImage}` }),
    author: {
      "@type": "Person",
      name: post.author,
      description: post.authorBio,
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: blogConfig.siteName,
      url: baseUrl,
    },
    mainEntityOfPage: `${baseUrl}/blog/${slug}`,
  };
}

/** Build CollectionPage + BreadcrumbList for the /blog index */
export function buildBlogIndexJsonLd(
  posts: Pick<BlogPost, "slug" | "title">[],
) {
  const baseUrl = blogConfig.siteUrl;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${blogConfig.blogTitle} — ${blogConfig.siteName}`,
      description: blogConfig.blogDescription,
      url: `${baseUrl}/blog`,
      publisher: {
        "@type": "Organization",
        name: blogConfig.siteName,
        url: baseUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: posts.length,
        itemListElement: posts.slice(0, 30).map((post, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${baseUrl}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${baseUrl}/blog`,
        },
      ],
    },
  ];
}

/** Generic BreadcrumbList (Home > … > current). `item` is the absolute URL. */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** Build CollectionPage + BreadcrumbList for a /blog/topic/[category] hub page */
export function buildBlogCategoryJsonLd(opts: {
  title: string;
  description: string;
  url: string;
  posts: Pick<BlogPost, "slug" | "title">[];
}) {
  const baseUrl = blogConfig.siteUrl;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: opts.title,
      description: opts.description,
      url: opts.url,
      publisher: {
        "@type": "Organization",
        name: blogConfig.siteName,
        url: baseUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: opts.posts.length,
        itemListElement: opts.posts.map((post, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${baseUrl}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    },
    buildBreadcrumbJsonLd([
      { name: "Home", url: baseUrl },
      { name: "Blog", url: `${baseUrl}/blog` },
      { name: opts.title, url: opts.url },
    ]),
  ];
}

/** Build FAQPage structured data from a blog post's FAQ section */
export function buildFaqJsonLd(faq: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
