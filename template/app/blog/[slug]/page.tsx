import {
  blogConfig,
  getPostBySlug,
  getAllPosts,
  getRelatedPosts,
  getPrimaryCategory,
  getCategoriesForPost,
  formatBlogDate,
} from "@/lib/blog";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ShareButtons } from "@/components/blog/share-buttons";
import { Callout, InfoCard, QuickRef, Verdict, Divider } from "@/components/blog/mdx-components";
import { BlogCTAInline, BlogCTABottom, BlogCTASidebar } from "@/components/blog/blog-cta";
import { JsonLd, buildArticleJsonLd, buildFaqJsonLd } from "@/lib/blog/json-ld";
import { Breadcrumbs } from "@/components/blog/breadcrumbs";
import { isValidElement, type ComponentProps, type ReactNode } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.description || post.excerpt;
  const ogImage = post.seo?.ogImage || post.heroImage || blogConfig.defaultOgImage;

  return {
    title: `${title} — ${blogConfig.siteName}`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${blogConfig.siteUrl}/blog/${slug}`,
    },
  };
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Convert common inline Markdown in an ATX heading to its visible text. */
function headingTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/\s+#+\s*$/, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/`+([^`]+)`+/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1")
    .trim();
}

/** Extract the visible text from the React children produced for a heading. */
function reactNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(reactNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return reactNodeText(node.props.children);
  }
  return "";
}

/** Dedupes repeated heading slugs GitHub-style: "setup", "setup-1", "setup-2". */
function makeIdAllocator() {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

/** Extract H2 headings from markdown for table of contents */
function extractHeadings(content: string): { text: string; id: string }[] {
  const headings: { text: string; id: string }[] = [];
  const allocId = makeIdAllocator();
  let fence: { marker: string; length: number } | null = null;

  for (const line of content.split("\n")) {
    if (fence) {
      const closing = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
      if (
        closing &&
        closing[1][0] === fence.marker &&
        closing[1].length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }

    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (opening) {
      fence = { marker: opening[1][0], length: opening[1].length };
      continue;
    }

    const match = line.match(/^##\s+(.+)$/);
    if (!match) continue;
    const text = headingTextFromMarkdown(match[1]);
    headings.push({ text, id: allocId(text) });
  }
  return headings;
}

function TableOfContents({
  headings,
}: {
  headings: { text: string; id: string }[];
}) {
  if (headings.length < 2) return null;
  return (
    <nav aria-label="Table of contents" className="mb-10 p-5 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        In this article
      </h2>
      <ul className="space-y-2">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="text-sm text-muted-foreground hover:text-[var(--blog-accent)] transition-colors"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface MdxRoot {
  children: Array<{ type: string; [key: string]: unknown }>;
}

/**
 * Inject the inline CTA after the third top-level paragraph while preserving a
 * single MDX document. Keeping one syntax tree means reference links,
 * footnotes, and list structure continue to work across the CTA.
 */
function remarkInjectInlineCta() {
  return (tree: MdxRoot) => {
    let paragraphs = 0;
    const after = tree.children.findIndex(
      (node) => node.type === "paragraph" && ++paragraphs === 3
    );
    const cta = {
      type: "mdxJsxFlowElement",
      name: "InlineCTA",
      attributes: [],
      children: [],
    };
    if (after === -1) tree.children.push(cta);
    else tree.children.splice(after + 1, 0, cta);
  };
}

/** Custom MDX components for heading IDs and the injected inline CTA. */
function createMdxComponents(slug: string, variant: string) {
  const allocId = makeIdAllocator();
  return {
    h2: (props: ComponentProps<"h2">) => {
      const text = reactNodeText(props.children);
      return <h2 id={allocId(text)} {...props} />;
    },
    InlineCTA: () => (
      <div className="not-prose">
        <BlogCTAInline slug={slug} variant={variant} />
      </div>
    ),
    Callout,
    InfoCard,
    QuickRef,
    Verdict,
    Divider,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, post.tags);
  const headings = extractHeadings(post.content);
  const primary = getPrimaryCategory(post);
  const categories = getCategoriesForPost(post);
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    ...(primary
      ? [{ name: primary.title, href: `/blog/topic/${primary.slug}` }]
      : []),
    { name: post.title, href: `/blog/${slug}` },
  ];

  const articleData = buildArticleJsonLd(post, slug);
  const faqData = post.faq?.length ? buildFaqJsonLd(post.faq) : null;

  return (
    <>
      <JsonLd data={articleData} />
      {faqData && <JsonLd data={faqData} />}
      <main className="min-h-screen pt-8 pb-16 px-6">
        <div className="mx-auto max-w-5xl xl:flex xl:gap-0 xl:justify-center">
        <article className="max-w-3xl">
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {post.heroImage && (
            <div className="relative w-full h-64 sm:h-80 mb-8 rounded-xl overflow-hidden">
              <Image
                src={post.heroImage}
                alt={post.heroAlt || post.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 672px, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <time className="text-sm text-muted-foreground">
            {formatBlogDate(post.date)}
          </time>
          <span className="text-sm text-muted-foreground mx-2">·</span>
          <span className="text-sm text-muted-foreground">{post.author}</span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          {categories.length > 0 && (
            <div className="flex gap-2 mb-10 flex-wrap">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/blog/topic/${c.slug}`}
                  className="text-xs px-2.5 py-1 rounded-full bg-[var(--blog-accent-2)]/20 text-[var(--blog-accent)] font-medium hover:bg-[var(--blog-accent-2)]/30 transition-colors"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          )}

          <TableOfContents headings={headings} />

          <div className="blog-prose prose prose-lg dark:prose-invert max-w-none">
            <MDXRemote
              source={post.content}
              components={createMdxComponents(slug, post.ctaVariant)}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm, remarkInjectInlineCta],
                },
              }}
            />
          </div>

          {/* Author section */}
          <div className="mt-12 pt-8 border-t border-border/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--blog-accent-2)] flex items-center justify-center text-[var(--blog-accent)] font-bold text-base">
              {post.author
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Written by {post.author}
              </p>
              <p className="text-xs text-muted-foreground">
                {post.authorBio}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40">
            <ShareButtons title={post.title} slug={post.slug} />
          </div>

          <BlogCTABottom slug={slug} variant={post.ctaVariant} />

          {related.length > 0 && (
            <section className="mt-14 pt-10 border-t border-border/40">
              <h2 className="text-2xl font-bold mb-6">
                Related Posts
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group block rounded-xl border border-border/60 bg-card/50 p-5 hover:border-[var(--blog-accent)]/50 hover:bg-card transition-all duration-200"
                  >
                    <time className="text-xs text-muted-foreground">
                      {formatBlogDate(r.date, "short")}
                    </time>
                    <h3 className="text-sm font-semibold mt-2 group-hover:text-[var(--blog-accent)] transition-colors">
                      {r.title}
                    </h3>
                    {r.excerpt && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {r.excerpt}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
        <BlogCTASidebar slug={slug} variant={post.ctaVariant} />
        </div>
      </main>
    </>
  );
}
