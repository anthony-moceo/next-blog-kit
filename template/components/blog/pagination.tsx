import Link from "next/link";

/** Numbered pagination. `basePath` is the page-1 URL (e.g. "/blog" or
 * "/blog/topic/guides"); page N lives at `${basePath}/page/N`. */
export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p === 1 ? basePath : `${basePath}/page/${p}`);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const linkCls =
    "rounded-md border border-border/60 px-3 py-1.5 text-sm transition-colors hover:border-[var(--blog-accent)]/50";

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex flex-wrap items-center justify-center gap-1.5"
    >
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={linkCls}>
          ← Previous
        </Link>
      )}
      {pages.map((p) =>
        p === page ? (
          <span
            key={p}
            aria-current="page"
            className="rounded-md border border-[var(--blog-accent)]/50 bg-[var(--blog-accent-2)]/20 px-3 py-1.5 text-sm font-semibold text-[var(--blog-accent)]"
          >
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} className={linkCls}>
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className={linkCls}>
          Next →
        </Link>
      )}
    </nav>
  );
}
