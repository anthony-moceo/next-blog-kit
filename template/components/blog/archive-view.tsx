import { blogConfig, getAllPosts, paginate } from "@/lib/blog";
import { JsonLd, buildBlogIndexJsonLd } from "@/lib/blog/json-ld";
import { TopicNav } from "./topic-nav";
import { PostGrid, FeaturedPost } from "./post-grid";
import { Pagination } from "./pagination";

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border px-8 py-16 text-center">
      <p className="text-lg font-semibold">No posts yet</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add your first article as an <code className="rounded bg-[var(--blog-accent-2)]/10 px-1.5 py-0.5">.mdx</code> file
        in <code className="rounded bg-[var(--blog-accent-2)]/10 px-1.5 py-0.5">content/blog/</code>, then restart the
        dev server. Run <code className="rounded bg-[var(--blog-accent-2)]/10 px-1.5 py-0.5">npx nextjs-blog-kit doctor</code> to
        check the frontmatter.
      </p>
    </div>
  );
}

/** Shared body for /blog (page 1) and /blog/page/[page]. */
export function ArchiveView({ page }: { page: number }) {
  const all = getAllPosts();
  const { items, page: current, totalPages } = paginate(all, page);
  const schemas = buildBlogIndexJsonLd(all);

  // Page 1 leads with the newest post at full width.
  const showFeatured = current === 1 && items.length > 1;
  const [featured, ...rest] = items;
  const gridPosts = showFeatured ? rest : items;

  return (
    <>
      {/* CollectionPage schema represents the whole collection — emit on page 1 only. */}
      {current === 1 && schemas.map((schema, i) => <JsonLd key={i} data={schema} />)}
      <main className="min-h-screen px-6 pb-16 pt-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {blogConfig.blogTitle}
              {current > 1 ? ` — Page ${current}` : ""}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              {blogConfig.blogDescription}
            </p>
          </header>
          <div className="mb-10">
            <TopicNav />
          </div>
          {all.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {showFeatured && (
                <div className="mb-10">
                  <FeaturedPost post={featured} />
                </div>
              )}
              <PostGrid posts={gridPosts} />
            </>
          )}
          <Pagination basePath="/blog" page={current} totalPages={totalPages} />
        </div>
      </main>
    </>
  );
}
