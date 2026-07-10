// Tests for `next-blog-kit doctor` against a synthetic installed host.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runDoctor, parseFrontmatter } from "../bin/doctor.mjs";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "cli.mjs");

/** A host with the kit installed and all deps declared (not actually resolved — doctor only reads package.json). */
function makeInstalledHost() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbk-doctor-"));
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({
      name: "host",
      dependencies: {
        next: "^15.0.0",
        "next-mdx-remote": "^6",
        "gray-matter": "^4",
        "remark-gfm": "^4",
        rss: "^1.2.2",
        "@tailwindcss/typography": "^0.5",
      },
      devDependencies: { typescript: "^5", "@types/rss": "^0" },
    })
  );
  fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } })
  );
  execFileSync(process.execPath, [CLI, "init"], { cwd: dir });
  // Wire CSS the way the README instructs.
  fs.writeFileSync(
    path.join(dir, "src", "app", "globals.css"),
    '@import "tailwindcss";\n@plugin "@tailwindcss/typography";\n@import "../../styles/blog.css";\n'
  );
  return dir;
}

test("doctor passes on a healthy install", () => {
  const host = makeInstalledHost();
  const { errors, warnings } = runDoctor(host);
  assert.deepEqual(errors, []);
  assert.deepEqual(
    warnings.filter((w) => !w.includes("Empty topic hub")),
    []
  );
  // The default config ships a `comparisons` category the sample post doesn't fill.
  assert.ok(warnings.some((w) => w.includes("comparisons")));
});

test("doctor flags duplicate slugs, missing heroes, orphan tags, broken links", () => {
  const host = makeInstalledHost();
  fs.writeFileSync(
    path.join(host, "content", "blog", "broken.mdx"),
    [
      "---",
      'title: "Broken Post"',
      "slug: hello-world",
      'date: "not-a-date"',
      "heroImage: /images/blog/missing-hero.jpg",
      "tags:",
      "  - unmapped-tag",
      "---",
      "",
      "Links to [a ghost](/blog/does-not-exist).",
    ].join("\n")
  );
  const { errors, warnings } = runDoctor(host);
  assert.ok(errors.some((e) => e.includes('Duplicate slug "hello-world"')), "duplicate slug");
  assert.ok(errors.some((e) => e.includes("invalid date")), "invalid date");
  assert.ok(errors.some((e) => e.includes("missing-hero.jpg")), "missing hero file");
  assert.ok(warnings.some((w) => w.includes("map to no category")), "orphan tags");
  assert.ok(warnings.some((w) => w.includes("/blog/does-not-exist")), "broken link");
});

test("doctor errors on missing deps and alias", () => {
  const host = makeInstalledHost();
  fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ name: "host", dependencies: { next: "^15.0.0" } }));
  fs.rmSync(path.join(host, "tsconfig.json"));
  const { errors } = runDoctor(host);
  assert.ok(errors.some((e) => e.includes("Missing dependencies")));
  assert.ok(errors.some((e) => e.includes('"@/*"')));
});

test("doctor exits non-zero via CLI on errors", () => {
  const host = makeInstalledHost();
  fs.writeFileSync(path.join(host, "content", "blog", "bad.mdx"), '---\ntitle: "X"\nslug: rss.xml\n---\nBody.\n');
  let code = 0;
  try {
    execFileSync(process.execPath, [CLI, "doctor"], { cwd: host, encoding: "utf8" });
  } catch (e) {
    code = e.status;
  }
  assert.notEqual(code, 0);
});

test("frontmatter parser handles the contract shapes", () => {
  const fm = parseFrontmatter(
    [
      "---",
      'title: "Quoted Title"',
      "slug: my-post",
      "date: 2026-01-05",
      "tags: [a, b]",
      "heroImage: /images/blog/x.jpg",
      "seo:",
      '  title: "nested ignored"',
      "faq:",
      '  - question: "Q?"',
      '    answer: "A."',
      "---",
      "body",
    ].join("\n")
  );
  assert.equal(fm.title, "Quoted Title");
  assert.equal(fm.slug, "my-post");
  assert.equal(fm.date, "2026-01-05");
  assert.deepEqual(fm.tags, ["a", "b"]);
  assert.equal(fm.heroImage, "/images/blog/x.jpg");
});
