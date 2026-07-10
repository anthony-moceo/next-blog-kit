import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function templateFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, "template", relativePath), "utf8");
}

test("article content is compiled as one MDX document with an AST-injected CTA", () => {
  const page = templateFile("app/blog/[slug]/page.tsx");

  assert.equal((page.match(/<MDXRemote\b/g) || []).length, 1);
  assert.match(page, /source=\{post\.content\}/);
  assert.match(page, /remarkPlugins: \[remarkGfm, remarkInjectInlineCta\]/);
  assert.doesNotMatch(page, /splitContentAtParagraph/);
});

test("heading IDs use visible text on both sides of the TOC mapping", () => {
  const page = templateFile("app/blog/[slug]/page.tsx");

  assert.match(page, /headingTextFromMarkdown\(match\[1\]\)/);
  assert.match(page, /reactNodeText\(props\.children\)/);
  assert.match(page, /let fence: \{ marker: string; length: number \} \| null = null/);
  assert.match(page, /closing\[1\]\[0\] === fence\.marker/);
  assert.doesNotMatch(page, /String\(props\.children/);
});

test("reserved post URLs, calendar dates, and sticky CTA safeguards remain enabled", () => {
  const posts = templateFile("lib/blog/posts.ts");
  const cta = templateFile("components/blog/blog-cta.tsx");

  assert.match(posts, /RESERVED_SLUGS = new Set\(\["rss\.xml"\]\)/);
  assert.match(posts, /d\.toISOString\(\)\.slice\(0, 10\)/);
  assert.match(posts, /timeZone: "UTC"/);
  assert.match(cta, /\bsticky\b[^"\n]*\bself-start\b/);
});
