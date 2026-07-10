import React from "react";

/* Inline SVG icons (lucide paths) — consistent cross-platform, themeable via
 * currentColor, no icon dependency. */
function Icon({ path, className = "" }: { path: React.ReactNode; className?: string }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const icons = {
  lightbulb: (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
};

/* ─── Callout ─── */
const calloutConfig = {
  tip: {
    icon: icons.lightbulb,
    iconClass: "text-[var(--blog-accent)]",
    bgClass: "bg-[var(--blog-accent)]/8",
    borderColor: "var(--blog-accent)",
  },
  warning: {
    icon: icons.alert,
    iconClass: "text-orange-500",
    bgClass: "bg-orange-500/8",
    borderColor: "#f97316",
  },
  info: {
    icon: icons.info,
    iconClass: "text-[var(--blog-accent-2)]",
    bgClass: "bg-[var(--blog-accent-2)]/10",
    borderColor: "var(--blog-accent-2)",
  },
};

export function Callout({
  type = "info",
  children,
}: {
  type?: "tip" | "warning" | "info";
  children: React.ReactNode;
}) {
  const cfg = calloutConfig[type] || calloutConfig.info;
  return (
    <div
      className={`blog-callout my-6 rounded-lg border-l-4 px-5 py-4 ${cfg.bgClass}`}
      style={{ borderLeftColor: cfg.borderColor }}
    >
      <div className="flex items-start gap-3">
        <Icon path={cfg.icon} className={`mt-0.5 ${cfg.iconClass}`} />
        {/* [&>p]:mt-0 overrides the typography plugin's paragraph top margin,
            which otherwise pushes the text out of line with the icon. */}
        <div className="blog-callout-content text-sm leading-relaxed [&>p]:mt-0 [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── InfoCard ─── */
// A titled comparison/spec card for reviews and roundups: name, up to three
// labeled facts, and free-form notes.
const ratingDots: Record<string, number> = { low: 1, medium: 2, high: 3 };

export function InfoCard({
  name,
  facts = [],
  rating,
  ratingLabel = "Rating",
  bestFor,
  children,
}: {
  name: string;
  /** Short labeled facts shown in a row, e.g. [{ label: "Price", value: "$10/mo" }] */
  facts?: { label: string; value: string }[];
  /** Optional low/medium/high dot scale (e.g. complexity, difficulty). */
  rating?: "low" | "medium" | "high";
  ratingLabel?: string;
  bestFor?: string;
  children?: React.ReactNode;
}) {
  const dots = rating ? ratingDots[rating] || 0 : 0;
  return (
    <div className="blog-info-card my-8 overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
      <div className="border-b border-border/30 bg-[var(--blog-accent)]/[0.06] px-5 py-4">
        <h4 className="m-0 text-lg font-bold text-[var(--blog-accent)]">{name}</h4>
        {bestFor && <p className="mb-0 mt-1 text-sm italic text-muted-foreground">{bestFor}</p>}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 px-5 py-3 text-sm">
        {facts.map((f) => (
          <span key={f.label} className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{f.label}:</span>
            <span className="font-medium">{f.value}</span>
          </span>
        ))}
        {rating && (
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{ratingLabel}:</span>
            <span className="flex gap-1" role="img" aria-label={`${rating} ${ratingLabel.toLowerCase()} (${dots} of 3)`}>
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    i <= dots ? "bg-[var(--blog-accent)]" : "bg-foreground/15"
                  }`}
                />
              ))}
            </span>
          </span>
        )}
      </div>
      {children && (
        <div className="px-5 pb-4 text-sm [&>p]:mt-0 [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── QuickRef ─── */
// Wrap an ordered/unordered list to render its items as a responsive card grid.
export function QuickRef({ children }: { children: React.ReactNode }) {
  return (
    <div className="blog-quick-ref my-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 [&>ol]:contents [&>ul]:contents [&_li]:rounded-lg [&_li]:border [&_li]:border-border/40 [&_li]:bg-card/50 [&_li]:px-4 [&_li]:py-3 [&_li]:text-sm [&_li]:list-none [&_li]:m-0 [&_li_strong]:text-[var(--blog-accent)]">
      {children}
    </div>
  );
}

/* ─── Verdict ─── */
// Decision box for guides, comparisons, and recommendation posts.
export function Verdict({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="blog-verdict my-10 rounded-xl border-2 px-6 py-5 [&>h4]:mt-0 [&>h4]:text-[var(--blog-accent)]"
      style={{ borderColor: "var(--blog-accent)", background: "color-mix(in oklch, var(--blog-accent) 6%, transparent)" }}
    >
      <div className="mb-3 flex items-center gap-2 text-[var(--blog-accent)]">
        <Icon path={icons.target} />
        <span className="text-lg font-bold">The Verdict</span>
      </div>
      <div className="text-sm leading-relaxed [&>p]:mt-0 [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

/* ─── Divider ─── */
export function Divider() {
  return (
    <div className="blog-divider my-10 flex items-center justify-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/40" />
      <svg
        className="h-2.5 w-2.5 rotate-45 text-[var(--blog-accent)]/60"
        viewBox="0 0 10 10"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect width="10" height="10" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/40" />
    </div>
  );
}
