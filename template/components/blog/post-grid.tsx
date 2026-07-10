import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog";
import { getPrimaryCategory, formatBlogDate } from "@/lib/blog";

type PostCard = Omit<BlogPost, "content">;

function MetaRow({ post, className = "" }: { post: PostCard; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      <time>{formatBlogDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingTime} min read</span>
    </div>
  );
}

function CategoryChip({ post }: { post: PostCard }) {
  const primary = getPrimaryCategory(post);
  if (!primary) return null;
  return (
    <Link
      href={`/blog/topic/${primary.slug}`}
      className="inline-block rounded-full bg-[var(--blog-accent-2)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--blog-accent)] transition-colors hover:bg-[var(--blog-accent-2)]/30"
    >
      {primary.title}
    </Link>
  );
}

/** Large treatment for the newest post — image beside text on wide screens. */
export function FeaturedPost({ post }: { post: PostCard }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 hover:border-[var(--blog-accent)]/40 hover:shadow-[0_8px_30px_-12px_var(--blog-accent-2)]">
      <div className="grid md:grid-cols-2">
        {post.heroImage && (
          <div className="relative h-56 w-full overflow-hidden md:h-full md:min-h-72">
            <Image
              src={post.heroImage}
              alt={post.heroAlt || post.title}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
        <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
          <div className="relative z-10 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--blog-accent)]">
              Latest
            </span>
            <CategoryChip post={post} />
          </div>
          <h2 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
              <span className="transition-colors group-hover:text-[var(--blog-accent)]">
                {post.title}
              </span>
            </Link>
          </h2>
          {post.excerpt && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {post.excerpt}
            </p>
          )}
          <MetaRow post={post} className="mt-1" />
        </div>
      </div>
    </article>
  );
}

/** Responsive grid of post cards. Each card links to its post and to its
 * primary topic hub (internal linking) instead of dumping raw tags. */
export function PostGrid({ posts }: { posts: PostCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <article
          key={post.slug}
          className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--blog-accent)]/40 hover:shadow-[0_8px_24px_-12px_var(--blog-accent-2)]"
        >
          {post.heroImage && (
            <div className="relative h-44 w-full overflow-hidden">
              <Image
                src={post.heroImage}
                alt={post.heroAlt || post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <MetaRow post={post} />
            <h2 className="text-lg font-semibold leading-snug">
              <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                <span className="transition-colors group-hover:text-[var(--blog-accent)]">
                  {post.title}
                </span>
              </Link>
            </h2>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
            <div className="relative z-10 mt-auto pt-2">
              <CategoryChip post={post} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
