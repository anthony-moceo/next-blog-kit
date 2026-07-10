import React from "react";

/* ─── Callout ─── */
const calloutConfig = {
  tip: { icon: "💡", bgClass: "bg-[var(--blog-accent)]/8", borderColor: "var(--blog-accent)" },
  warning: { icon: "⚠️", bgClass: "bg-orange-500/8", borderColor: "#f97316" },
  info: { icon: "ℹ️", bgClass: "bg-[var(--blog-accent-2)]/15", borderColor: "var(--blog-accent-2)" },
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
      <div className="flex gap-3 items-start">
        <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">{cfg.icon}</span>
        <div className="blog-callout-content text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── InfoCard ─── */
// A titled comparison/spec card for reviews and roundups: name, up to three
// labeled facts, and free-form notes. (Generalized from the original GameCard.)
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
    <div className="blog-info-card my-8 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30 bg-[var(--blog-accent-2)]/10">
        <h4 className="text-lg font-bold text-[var(--blog-accent)] m-0">{name}</h4>
        {bestFor && <p className="text-sm text-muted-foreground mt-1 mb-0 italic">{bestFor}</p>}
      </div>
      <div className="px-5 py-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
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
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    i <= dots ? "bg-[var(--blog-accent)]" : "bg-foreground/15"
                  }`}
                />
              ))}
            </span>
          </span>
        )}
      </div>
      {children && (
        <div className="px-5 pb-4 text-sm [&>p]:mb-2 [&>p:last-child]:mb-0">
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
      className="blog-verdict my-10 rounded-xl border-2 px-6 py-5 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>h4]:mt-0 [&>h4]:text-[var(--blog-accent)]"
      style={{ borderColor: "var(--blog-accent)", background: "color-mix(in oklch, var(--blog-accent) 6%, transparent)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl" aria-hidden="true">🎯</span>
        <span className="font-bold text-[var(--blog-accent)] text-lg">The Verdict</span>
      </div>
      <div className="text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
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
      <span className="text-[var(--blog-accent)]/60 text-lg">✦</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/40" />
    </div>
  );
}
