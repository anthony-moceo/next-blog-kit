import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog";
import { getPrimaryCategory, formatBlogDate } from "@/lib/blog";

type PostCard = Omit<BlogPost, "content">;

/** Responsive grid of post cards. Each card links to its post and to its
 * primary topic hub (internal linking) instead of dumping raw tags. */
export function PostGrid({ posts }: { posts: PostCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const primary = getPrimaryCategory(post);
        return (
          <article
            key={post.slug}
            className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-[var(--blog-accent)]/50"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              {post.heroImage && (
                <div className="relative h-44 w-full">
                  <Image
                    src={post.heroImage}
                    alt={post.heroAlt || post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="p-5">
                <time className="text-xs text-muted-foreground">
                  {formatBlogDate(post.date)}
                </time>
                <h2 className="mt-1 text-lg font-semibold transition-colors group-hover:text-[var(--blog-accent)]">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
              </div>
            </Link>
            {primary && (
              <div className="mt-auto px-5 pb-5">
                <Link
                  href={`/blog/topic/${primary.slug}`}
                  className="inline-block rounded-full bg-[var(--blog-accent-2)]/20 px-2 py-0.5 text-xs text-[var(--blog-accent)] transition-colors hover:bg-[var(--blog-accent-2)]/30"
                >
                  {primary.title}
                </Link>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
