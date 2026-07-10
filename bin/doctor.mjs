// nextjs-blog-kit doctor — self-diagnosing install checks.
//
// Zero-dependency by design: frontmatter and config are read with small
// purpose-built parsers that cover the shapes the kit itself generates. When a
// file is too exotic to parse, the related checks are skipped with a warning
// instead of guessing.

import fs from "node:fs";
import path from "node:path";

const SLUG_RE = /^[a-zA-Z0-9._-]+$/;
const RESERVED_SLUGS = new Set(["rss.xml"]);
const KIT_DEPS = ["next-mdx-remote", "gray-matter", "remark-gfm", "rss", "@tailwindcss/typography"];

// ── Minimal YAML frontmatter parser ─────────────────────────────────────────
// Handles what the kit's frontmatter contract uses at the ROOT level: scalar
// strings/numbers/booleans, inline arrays, and block lists of scalars. Nested
// maps (seo:, faq:) are noted as present but not descended into.

function stripQuotes(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!m) return null;
  const data = {};
  const lines = m[1].split(/\r?\n/);
  let currentListKey = null;
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const rootKey = line.match(/^([A-Za-z_][\w-]*):(.*)$/);
    if (rootKey) {
      currentListKey = null;
      const key = rootKey[1];
      const rest = rootKey[2].trim();
      if (rest === "") {
        // Block value follows: list of scalars -> collect; nested map -> mark present.
        data[key] = data[key] ?? { __block: true, items: [] };
        currentListKey = key;
      } else if (rest.startsWith("[") && rest.endsWith("]")) {
        data[key] = rest === "[]" ? [] : rest.slice(1, -1).split(",").map(stripQuotes).filter(Boolean);
      } else {
        data[key] = stripQuotes(rest);
      }
      continue;
    }
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentListKey) {
      const item = listItem[1].trim();
      if (item.includes(":")) {
        // List of maps (faq) — mark as complex, don't collect.
        data[currentListKey] = { __block: true, complex: true };
        continue;
      }
      const bucket = data[currentListKey];
      if (bucket && bucket.__block && bucket.items) bucket.items.push(stripQuotes(item));
    }
  }
  // Flatten simple block lists to arrays; complex blocks stay marker objects.
  for (const [k, v] of Object.entries(data)) {
    if (v && v.__block && v.items && !v.complex) data[k] = v.items;
  }
  return data;
}

// ── Config extraction (regex-based, warns when it can't parse) ──────────────

function extractStringArray(src, key) {
  const m = src.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
  if (!m) return null;
  return (m[1].match(/["']([^"']+)["']/g) || []).map((s) => s.slice(1, -1));
}

export function parseConfig(src) {
  const catBlock = src.match(/categories:\s*\[([\s\S]*?)\n  \]/);
  let categories = null;
  if (catBlock) {
    categories = [];
    // Each category object: slug + tags array.
    const objRe = /\{[\s\S]*?slug:\s*["']([^"']+)["'][\s\S]*?tags:\s*\[([^\]]*)\][\s\S]*?\}/g;
    let m;
    while ((m = objRe.exec(catBlock[1])) !== null) {
      categories.push({
        slug: m[1],
        tags: (m[2].match(/["']([^"']+)["']/g) || []).map((s) => s.slice(1, -1)),
      });
    }
    if (!categories.length) categories = null;
  }
  return {
    categories,
    genericTags: extractStringArray(src, "genericTags"),
    brandNewsTags: extractStringArray(src, "brandNewsTags"),
    hasVariant: (name) => new RegExp(`(^|\\s)["']?${name}["']?:\\s*\\{`, "m").test(src),
  };
}

const normalizeTag = (t) => t.toLowerCase().trim().replace(/\s+/g, "-");

// ── The doctor ───────────────────────────────────────────────────────────────

export function runDoctor(cwd) {
  const ok = [];
  const warnings = [];
  const errors = [];
  const pass = (msg) => ok.push(msg);
  const warn = (msg) => warnings.push(msg);
  const err = (msg) => errors.push(msg);

  // 1. Host project shape
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    err("No package.json found — run doctor at the root of your Next.js project.");
    return { ok, warnings, errors };
  }
  let deps = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    deps = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    err("package.json is not valid JSON.");
    return { ok, warnings, errors };
  }

  if (!deps.next) err("`next` is not a dependency — this doesn't look like a Next.js project.");
  else {
    const major = parseInt(String(deps.next).replace(/^[^\d]*/, ""), 10);
    if (Number.isInteger(major) && major < 15) {
      err(`next@${deps.next} — the kit requires Next.js 15+ (Promise-based route params).`);
    } else {
      pass(`Next.js dependency: ${deps.next}`);
    }
  }

  const nodeMajor = parseInt(process.versions.node, 10);
  if (nodeMajor < 18) err(`Node ${process.versions.node} — Next.js 15 requires Node 18.18+.`);
  else pass(`Node ${process.versions.node}`);

  const missingDeps = KIT_DEPS.filter((d) => !deps[d]);
  if (missingDeps.length) err(`Missing dependencies: ${missingDeps.join(", ")} — npm install ${missingDeps.join(" ")}`);
  else pass("All kit dependencies installed");
  if (deps.typescript && !deps["@types/rss"]) warn("TypeScript project without @types/rss — `npm i -D @types/rss` to fix typechecking.");

  // 2. Kit files in place (src-aware)
  const srcDir = fs.existsSync(path.join(cwd, "src", "app")) ? "src" : "";
  const codeRoot = srcDir ? path.join(cwd, srcDir) : cwd;
  if (!fs.existsSync(path.join(codeRoot, "app"))) err("No app/ directory — the kit requires the App Router.");

  const required = [
    ["app/blog/page.tsx", "blog index route"],
    ["app/blog/[slug]/page.tsx", "article route"],
    ["app/blog/topic/[category]/page.tsx", "topic hub route"],
    ["app/blog/rss.xml/route.ts", "RSS route"],
    ["lib/blog/config.ts", "blog config"],
    ["lib/blog/posts.ts", "posts library"],
    ["components/blog/post-grid.tsx", "blog components"],
  ];
  const missingFiles = required.filter(([rel]) => !fs.existsSync(path.join(codeRoot, rel)));
  if (missingFiles.length) {
    err(`Missing kit files: ${missingFiles.map(([rel]) => path.join(srcDir, rel)).join(", ")} — re-run \`npx nextjs-blog-kit init\`.`);
  } else {
    pass(`Kit files present${srcDir ? " (src/ layout)" : ""}`);
  }

  // 3. Path alias
  let aliasOk = false;
  for (const f of ["tsconfig.json", "jsconfig.json"]) {
    const p = path.join(cwd, f);
    if (fs.existsSync(p) && fs.readFileSync(p, "utf8").includes('"@/*"')) aliasOk = true;
  }
  if (aliasOk) pass('Path alias "@/*" configured');
  else err('No "@/*" path alias in tsconfig.json/jsconfig.json — the kit\'s imports will not resolve.');

  // 4. CSS wiring (best effort — search css files near the app root)
  const cssFiles = [];
  const cssSearchDirs = [path.join(codeRoot, "app"), path.join(cwd, "styles"), codeRoot];
  for (const dir of cssSearchDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".css")) cssFiles.push(path.join(dir, entry.name));
    }
  }
  const cssText = cssFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  if (!/blog\.css/.test(cssText)) warn("styles/blog.css doesn't appear to be imported in your global CSS — accent variables will be missing.");
  else pass("blog.css imported");
  if (!/@tailwindcss\/typography|@plugin\s+["']@tailwindcss\/typography/.test(cssText)) {
    warn('Typography plugin not detected in CSS — add `@plugin "@tailwindcss/typography";` for prose styling.');
  } else pass("Typography plugin wired");

  // 5. Content checks
  const blogDir = path.join(cwd, "content", "blog");
  if (!fs.existsSync(blogDir)) {
    err("content/blog/ does not exist — posts have nowhere to live.");
    return { ok, warnings, errors };
  }
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));
  if (!files.length) warn("content/blog/ has no .mdx posts yet.");
  else pass(`${files.length} post(s) in content/blog`);

  // Config parse for taxonomy/CTA checks
  let config = null;
  const configPath = path.join(codeRoot, "lib/blog/config.ts");
  if (fs.existsSync(configPath)) {
    config = parseConfig(fs.readFileSync(configPath, "utf8"));
    if (!config.categories) {
      warn("Couldn't parse categories from lib/blog/config.ts — skipping taxonomy checks.");
    }
  }

  const tagToCategory = new Map();
  if (config?.categories) {
    for (const cat of config.categories) for (const t of cat.tags) tagToCategory.set(normalizeTag(t), cat.slug);
  }
  const genericTags = new Set((config?.genericTags ?? []).map(normalizeTag));
  const brandNewsTags = new Set((config?.brandNewsTags ?? []).map(normalizeTag));

  const slugToFile = new Map();
  const allSlugs = new Set();
  const categoryCounts = new Map((config?.categories ?? []).map((c) => [c.slug, 0]));
  const bodies = new Map();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), "utf-8");
    const fm = parseFrontmatter(raw);
    bodies.set(file, raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, ""));
    if (!fm) {
      err(`${file}: no frontmatter block found.`);
      continue;
    }
    const slug = typeof fm.slug === "string" && fm.slug ? fm.slug : file.replace(/\.mdx$/, "");

    if (!SLUG_RE.test(slug) || slug === "." || slug === "..") err(`${file}: invalid slug ${JSON.stringify(slug)}.`);
    if (RESERVED_SLUGS.has(slug.toLowerCase())) err(`${file}: slug "${slug}" collides with a built-in blog route.`);
    if (slugToFile.has(slug)) err(`Duplicate slug "${slug}": ${slugToFile.get(slug)} and ${file}.`);
    slugToFile.set(slug, file);
    allSlugs.add(slug);

    if (!fm.title) warn(`${file}: missing title.`);
    if (fm.date) {
      const dateStr = fm.date instanceof Object ? "" : String(fm.date);
      if (isNaN(new Date(dateStr).getTime())) err(`${file}: invalid date ${JSON.stringify(dateStr)}.`);
    } else warn(`${file}: missing date (will default to build time).`);
    if (!fm.excerpt && !fm.description) warn(`${file}: no excerpt or description — listing cards will be blank.`);

    if (typeof fm.heroImage === "string" && fm.heroImage) {
      if (!fs.existsSync(path.join(cwd, "public", fm.heroImage))) {
        err(`${file}: heroImage ${fm.heroImage} does not exist under public/.`);
      }
      if (!fm.heroAlt) warn(`${file}: heroImage without heroAlt.`);
    }

    // Match runtime semantics: posts.ts coerces a scalar `tags:` to a one-item array.
    const tags = Array.isArray(fm.tags)
      ? fm.tags.map(normalizeTag)
      : typeof fm.tags === "string" && fm.tags
        ? [normalizeTag(fm.tags)]
        : [];
    if (!tags.length) warn(`${file}: no tags — the post won't appear in any topic hub.`);
    else if (config?.categories) {
      const hubs = new Set(tags.map((t) => tagToCategory.get(t)).filter(Boolean));
      for (const h of hubs) categoryCounts.set(h, (categoryCounts.get(h) ?? 0) + 1);
      const nonGeneric = tags.filter((t) => !genericTags.has(t));
      const archiveOnly = nonGeneric.length > 0 && nonGeneric.every((t) => brandNewsTags.has(t));
      if (!hubs.size && !archiveOnly) {
        warn(`${file}: tags [${tags.join(", ")}] map to no category — orphaned from all topic hubs.`);
      }
    }

    if (typeof fm.ctaVariant === "string" && config && !config.hasVariant(fm.ctaVariant)) {
      warn(`${file}: ctaVariant "${fm.ctaVariant}" not found in config — will fall back to default.`);
    }
  }

  // Empty hubs
  if (config?.categories) {
    const empty = [...categoryCounts.entries()].filter(([, n]) => n === 0).map(([slug]) => slug);
    if (empty.length) warn(`Empty topic hub(s) (will 404): ${empty.join(", ")} — add posts or remove the category.`);
    else if (config.categories.length) pass("Every topic hub has posts");
  }

  // Broken internal blog links
  let brokenLinks = 0;
  const hubSlugs = new Set((config?.categories ?? []).map((c) => c.slug));
  for (const [file, body] of bodies) {
    const linkRe = /\]\(\/blog\/([^)#?\s]+)/g;
    let m;
    while ((m = linkRe.exec(body)) !== null) {
      const target = m[1].replace(/\/$/, "");
      if (target.startsWith("topic/")) {
        const hub = target.split("/")[1];
        if (hubSlugs.size && !hubSlugs.has(hub)) { warn(`${file}: links to /blog/topic/${hub} — no such category.`); brokenLinks++; }
      } else if (target.startsWith("page/")) {
        continue; // pagination links — page count varies, skip
      } else if (!allSlugs.has(target)) {
        warn(`${file}: links to /blog/${target} — no post with that slug.`);
        brokenLinks++;
      }
    }
  }
  if (!brokenLinks && files.length) pass("Internal /blog links resolve");

  return { ok, warnings, errors };
}

export function printReport({ ok, warnings, errors }) {
  console.log("\nnextjs-blog-kit doctor\n");
  for (const msg of ok) console.log(`  ✓ ${msg}`);
  for (const msg of warnings) console.log(`  ⚠ ${msg}`);
  for (const msg of errors) console.log(`  ✖ ${msg}`);
  console.log(
    `\n${errors.length} error(s), ${warnings.length} warning(s)` +
      (errors.length ? " — fix errors before deploying." : warnings.length ? "" : " — all clear.")
  );
  return errors.length ? 1 : 0;
}
