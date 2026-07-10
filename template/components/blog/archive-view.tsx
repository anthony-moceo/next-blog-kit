import { blogConfig, getAllPosts, paginate } from "@/lib/blog";
import { JsonLd, buildBlogIndexJsonLd } from "@/lib/blog/json-ld";
import { TopicNav } from "./topic-nav";
import { PostGrid } from "./post-grid";
import { Pagination } from "./pagination";

/** Shared body for /blog (page 1) and /blog/page/[page]. */
export function ArchiveView({ page }: { page: number }) {
  const all = getAllPosts();
  const { items, page: current, totalPages } = paginate(all, page);
  const schemas = buildBlogIndexJsonLd(all);

  return (
    <>
      {/* CollectionPage schema represents the whole collection — emit on page 1 only. */}
      {current === 1 && schemas.map((schema, i) => <JsonLd key={i} data={schema} />)}
      <main className="min-h-screen px-6 pb-16 pt-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 text-4xl font-bold">
            {blogConfig.blogTitle}
            {current > 1 ? ` — Page ${current}` : ""}
          </h1>
          <p className="mb-8 text-muted-foreground">{blogConfig.blogDescription}</p>
          <div className="mb-10">
            <TopicNav />
          </div>
          <PostGrid posts={items} />
          <Pagination basePath="/blog" page={current} totalPages={totalPages} />
        </div>
      </main>
    </>
  );
}
