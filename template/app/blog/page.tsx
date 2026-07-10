import type { Metadata } from "next";
import { blogConfig } from "@/lib/blog";
import { ArchiveView } from "@/components/blog/archive-view";

const title = `${blogConfig.blogTitle} — ${blogConfig.siteName}`;

export const metadata: Metadata = {
  title,
  description: blogConfig.blogDescription,
  alternates: { canonical: `${blogConfig.siteUrl}/blog` },
  openGraph: {
    title,
    description: blogConfig.blogDescription,
    type: "website",
    url: `${blogConfig.siteUrl}/blog`,
    siteName: blogConfig.siteName,
    images: [blogConfig.defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: blogConfig.blogDescription,
    images: [blogConfig.defaultOgImage],
  },
};

export default function BlogIndex() {
  return <ArchiveView page={1} />;
}
