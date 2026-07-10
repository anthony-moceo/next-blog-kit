import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { blogConfig, getAllPosts, paginate, parsePageParam } from "@/lib/blog";
import { ArchiveView } from "@/components/blog/archive-view";

function totalArchivePages(): number {
  return paginate(getAllPosts(), 1).totalPages;
}

export function generateStaticParams() {
  const total = totalArchivePages();
  // Page 1 is /blog; generate 2..total here.
  return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const n = parsePageParam(page);
  if (n === null) return {}; // invalid page → the route 404s; metadata is moot
  return {
    title: `${blogConfig.blogTitle} — Page ${n} — ${blogConfig.siteName}`,
    description: blogConfig.blogDescription,
    // Self-canonical (not page 1) so deep archive pages stay indexable.
    alternates: { canonical: `${blogConfig.siteUrl}/blog/page/${n}` },
  };
}

export default async function BlogArchivePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const n = parsePageParam(page);
  if (n === null) notFound();
  if (n === 1) redirect("/blog"); // /blog/page/1 -> /blog (avoid a duplicate of page 1)
  if (n > totalArchivePages()) notFound();
  return <ArchiveView page={n} />;
}
