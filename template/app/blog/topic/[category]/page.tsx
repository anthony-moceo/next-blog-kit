import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogConfig, getAllCategories, getCategoryBySlug } from "@/lib/blog";
import { HubView } from "@/components/blog/hub-view";

export function generateStaticParams() {
  // Empty hubs 404 (see HubView) — don't prerender them.
  return getAllCategories()
    .filter((c) => c.count > 0)
    .map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return {};
  const url = `${blogConfig.siteUrl}/blog/topic/${cat.slug}`;
  const title = `${cat.title} — ${blogConfig.siteName} ${blogConfig.blogTitle}`;
  return {
    title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: cat.description,
      type: "website",
      url,
      siteName: blogConfig.siteName,
      images: [blogConfig.defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cat.description,
      images: [blogConfig.defaultOgImage],
    },
  };
}

export default async function TopicHubPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!getCategoryBySlug(category)) notFound();
  return <HubView slug={category} page={1} />;
}
