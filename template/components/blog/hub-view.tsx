import { notFound } from "next/navigation";
import {
  blogConfig,
  getCategoryBySlug,
  getPostsByCategory,
  paginate,
} from "@/lib/blog";
import { JsonLd, buildBlogCategoryJsonLd } from "@/lib/blog/json-ld";
import { TopicNav } from "./topic-nav";
import { PostGrid } from "./post-grid";
import { Pagination } from "./pagination";
import { Breadcrumbs } from "./breadcrumbs";

/** Shared body for /blog/topic/[category] (page 1) and its /page/[page]. */
export function HubView({ slug, page }: { slug: string; page: number }) {
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = getPostsByCategory(slug);
  // An empty hub is exactly the thin page this taxonomy exists to avoid —
  // 404 it (topic nav and sitemap already hide empty hubs).
  if (posts.length === 0) notFound();
  const { items, page: current, totalPages } = paginate(posts, page);
  const basePath = `/blog/topic/${slug}`;
  const canonical = `${blogConfig.siteUrl}${basePath}${
    current > 1 ? `/page/${current}` : ""
  }`;

  return (
    <>
      {current === 1 &&
        buildBlogCategoryJsonLd({
          title: category.title,
          description: category.description,
          url: canonical,
          posts,
        }).map((schema, i) => <JsonLd key={i} data={schema} />)}
      <main className="min-h-screen px-6 pb-16 pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { name: "Home", href: "/" },
                { name: "Blog", href: "/blog" },
                { name: category.title, href: basePath },
              ]}
            />
          </div>
          <h1 className="mb-2 text-4xl font-bold">
            {category.title}
            {current > 1 ? ` — Page ${current}` : ""}
          </h1>
          <p className="mb-8 max-w-2xl text-muted-foreground">
            {category.description}
          </p>
          <div className="mb-10">
            <TopicNav activeSlug={slug} />
          </div>
          <PostGrid posts={items} />
          <Pagination basePath={basePath} page={current} totalPages={totalPages} />
        </div>
      </main>
    </>
  );
}
