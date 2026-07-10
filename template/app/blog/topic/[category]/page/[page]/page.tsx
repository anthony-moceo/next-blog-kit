import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  blogConfig,
  CATEGORIES,
  getCategoryBySlug,
  getPostsByCategory,
  paginate,
  parsePageParam,
} from "@/lib/blog";
import { HubView } from "@/components/blog/hub-view";

export function generateStaticParams() {
  const out: { category: string; page: string }[] = [];
  for (const c of CATEGORIES) {
    const total = paginate(getPostsByCategory(c.slug), 1).totalPages;
    for (let p = 2; p <= total; p++) {
      out.push({ category: c.slug, page: String(p) });
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}): Promise<Metadata> {
  const { category, page } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return {};
  const n = parsePageParam(page);
  if (n === null) return {};
  const url = `${blogConfig.siteUrl}/blog/topic/${cat.slug}/page/${n}`;
  return {
    title: `${cat.title} — Page ${n} — ${blogConfig.siteName} ${blogConfig.blogTitle}`,
    description: cat.description,
    alternates: { canonical: url },
  };
}

export default async function TopicHubPaginatedPage({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}) {
  const { category, page } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();
  const n = parsePageParam(page);
  if (n === null) notFound();
  if (n === 1) redirect(`/blog/topic/${category}`);
  if (n > paginate(getPostsByCategory(category), 1).totalPages) notFound();
  return <HubView slug={category} page={n} />;
}
