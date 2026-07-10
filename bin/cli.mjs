#!/usr/bin/env node
// next-blog-kit CLI — shadcn-style copy-in installer.
//
//   npx next-blog-kit init     copy the blog (routes, components, lib, content) into this repo
//   npx next-blog-kit skill    copy the blog-article authoring skill into .claude/skills/
//
// The copied code is yours: edit it freely.
//
// Write discipline: every run preflights the FULL destination set before
// touching the filesystem. Any collision aborts the whole run with a report —
// no partial installs. `--force` proceeds instead, backing up each overwritten
// file to .next-blog-kit-backup/ first.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(KIT_ROOT, "template");
const SKILL_SRC = path.join(KIT_ROOT, "skill", "blog-article");

const cwd = process.cwd();
const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("-"));
const force = args.includes("--force");

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

/** Recursively collect [srcAbs, relPath] file pairs under dir. */
function collectFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(abs, base));
    else out.push([abs, path.relative(base, abs)]);
  }
  return out;
}

/** Flatten copy groups into one plan of {src, dest} with dest under destRoot. */
function buildPlan(groups) {
  const plan = [];
  for (const g of groups) {
    if (!fs.existsSync(g.from)) continue;
    for (const [src, rel] of collectFiles(g.from)) {
      plan.push({ src, dest: path.join(g.to, rel) });
    }
  }
  return plan;
}

/**
 * Execute a plan atomically-by-contract: preflight every destination first;
 * on any collision without --force, abort having written NOTHING. With
 * --force, back up each existing file before overwriting.
 */
function executePlan(plan, label) {
  const collisions = plan.filter((p) => fs.existsSync(p.dest));

  if (collisions.length && !force) {
    console.error(`\n✖ ${label}: ${collisions.length} file(s) already exist — nothing was written.\n`);
    for (const p of collisions) console.error(`  ! ${path.relative(cwd, p.dest)}`);
    console.error(
      `\n  Re-run with --force to overwrite (existing files are backed up to .next-blog-kit-backup/ first),\n  or move the conflicting files out of the way.`
    );
    process.exit(1);
  }

  let backupDir = null;
  if (collisions.length) {
    backupDir = path.join(cwd, ".next-blog-kit-backup", new Date().toISOString().replace(/[:.]/g, "-"));
    for (const p of collisions) {
      const rel = path.relative(cwd, p.dest);
      const backupPath = path.join(backupDir, rel);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(p.dest, backupPath);
    }
  }

  for (const p of plan) {
    fs.mkdirSync(path.dirname(p.dest), { recursive: true });
    fs.copyFileSync(p.src, p.dest);
  }

  return { written: plan.map((p) => path.relative(cwd, p.dest)), backupDir };
}

function detectSrcDir() {
  // Copy app/, components/, lib/ under src/ when the host uses a src layout.
  return fs.existsSync(path.join(cwd, "src", "app")) ? "src" : "";
}

function checkHost() {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) fail("No package.json here — run this at the root of a Next.js project.");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!deps.next) fail("This doesn't look like a Next.js project (no `next` in package.json).");
  const major = parseInt(String(deps.next).replace(/^[^\d]*/, ""), 10);
  if (Number.isInteger(major) && major < 15) {
    console.warn(
      `⚠ next-blog-kit targets Next.js 15+ (Promise-based route params); found next@${deps.next}. The copied routes will fail type checking on Next 14.`
    );
  }
  const appDir = fs.existsSync(path.join(cwd, "src", "app")) || fs.existsSync(path.join(cwd, "app"));
  if (!appDir) fail("No app/ directory found — next-blog-kit requires the App Router.");
  return deps;
}

function checkAlias() {
  // The copied code imports via "@/lib/blog" etc. Verify the host has the alias.
  for (const f of ["tsconfig.json", "jsconfig.json"]) {
    const p = path.join(cwd, f);
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf8");
      if (raw.includes('"@/*"')) return true;
    } catch {
      /* fall through */
    }
  }
  return false;
}

function init() {
  const deps = checkHost();
  const srcDir = detectSrcDir();

  // Route/lib/component trees go under src/ (if present); content, public,
  // and styles always live at the project root.
  const codeRoot = srcDir ? path.join(cwd, srcDir) : cwd;
  const plan = buildPlan([
    { from: path.join(TEMPLATE, "app"), to: path.join(codeRoot, "app") },
    { from: path.join(TEMPLATE, "components"), to: path.join(codeRoot, "components") },
    { from: path.join(TEMPLATE, "lib"), to: path.join(codeRoot, "lib") },
    { from: path.join(TEMPLATE, "content"), to: path.join(cwd, "content") },
    { from: path.join(TEMPLATE, "public"), to: path.join(cwd, "public") },
    { from: path.join(TEMPLATE, "styles"), to: path.join(cwd, "styles") },
  ]);

  const { written, backupDir } = executePlan(plan, "init");

  console.log(`\nnext-blog-kit init — ${written.length} files written${srcDir ? " (src/ layout detected)" : ""}\n`);
  for (const f of written) console.log(`  + ${f}`);
  if (backupDir) {
    console.log(`\n  Overwritten files were backed up to ${path.relative(cwd, backupDir)}/`);
  }

  const wanted = ["next-mdx-remote", "gray-matter", "remark-gfm", "rss", "@tailwindcss/typography"];
  if (deps.typescript) wanted.push("@types/rss");
  const missing = wanted.filter((d) => !deps[d]);

  console.log("\nNext steps:");
  let step = 1;
  if (missing.length) console.log(`  ${step++}. Install deps:  npm install ${missing.join(" ")}`);
  console.log(`  ${step++}. Edit ${srcDir ? "src/" : ""}lib/blog/config.ts — site name, URL, categories, CTAs.`);
  console.log(`  ${step++}. Import styles/blog.css in your root layout (and add the typography plugin: @plugin "@tailwindcss/typography" in your CSS).`);
  console.log(`  ${step++}. Add blog URLs to your sitemap:  ...getBlogSitemapEntries()  (from "@/lib/blog").`);
  console.log(`  ${step++}. Delete the sample post in content/blog when you have real content.`);
  if (!checkAlias()) {
    console.log('\n  ⚠ No "@/*" path alias found in tsconfig.json — the copied files import via "@/".');
    console.log('    Add:  "paths": { "@/*": ["./' + (srcDir ? "src/" : "") + '*"] }  under compilerOptions.');
  }
  console.log("\n  Optional: npx next-blog-kit skill   (installs the blog-article authoring skill for Claude Code)\n");
}

function skill() {
  if (!fs.existsSync(SKILL_SRC)) fail("Skill source not found in the package.");
  const dest = path.join(cwd, ".claude", "skills", "blog-article");
  const plan = buildPlan([{ from: SKILL_SRC, to: dest }]);

  const { written, backupDir } = executePlan(plan, "skill");

  console.log(`\nnext-blog-kit skill — ${written.length} files written to .claude/skills/blog-article`);
  for (const f of written) console.log(`  + ${f}`);
  if (backupDir) {
    console.log(`  Overwritten files were backed up to ${path.relative(cwd, backupDir)}/`);
  }
  console.log('\nUse it in Claude Code with: "/blog-article <topic>" or "write a blog post about …"\n');
}

switch (command) {
  case "init":
    init();
    break;
  case "skill":
    skill();
    break;
  default:
    console.log(`
next-blog-kit — file-based MDX blog for Next.js (App Router)

Usage:
  npx next-blog-kit init     Copy blog routes, components, lib, and content scaffold into this repo
  npx next-blog-kit skill    Copy the blog-article authoring skill into .claude/skills/

Flags:
  --force    Overwrite existing files (each is backed up to .next-blog-kit-backup/ first)
`);
}
