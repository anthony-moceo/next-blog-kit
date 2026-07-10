import Link from "next/link";
import { blogConfig } from "@/lib/blog";
import { JsonLd, buildBreadcrumbJsonLd } from "@/lib/blog/json-ld";

/** Visual breadcrumb trail + BreadcrumbList JSON-LD. The last item is the
 * current page (rendered as text). `href` values are site-relative. */
export function Breadcrumbs({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd(
          items.map((i) => ({ name: i.name, url: `${blogConfig.siteUrl}${i.href}` }))
        )}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">›</span>}
              {i < items.length - 1 ? (
                <Link href={item.href} className="hover:text-foreground">
                  {item.name}
                </Link>
              ) : (
                <span className="text-foreground">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
