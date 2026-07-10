// Regression tests for the CLI's all-or-nothing write contract.
// Run with: npm test  (node --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "cli.mjs");

function makeHost() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbk-test-"));
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "host", dependencies: { next: "^15.0.0", typescript: "^5" } })
  );
  fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } })
  );
  return dir;
}

function runCli(cwd, ...cliArgs) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...cliArgs], { cwd, encoding: "utf8" });
    return { code: 0, output: stdout };
  } catch (err) {
    return { code: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(path.join(dir, entry.name)) : 1;
  }
  return n;
}

test("init installs cleanly into a fresh host", () => {
  const host = makeHost();
  const r = runCli(host, "init");
  assert.equal(r.code, 0, r.output);
  assert.ok(fs.existsSync(path.join(host, "src/lib/blog/config.ts")));
  assert.ok(fs.existsSync(path.join(host, "src/app/blog/[slug]/page.tsx")));
  assert.ok(fs.existsSync(path.join(host, "content/blog/hello-world.mdx")));
});

test("init aborts on collision without writing ANY file", () => {
  const host = makeHost();
  // Pre-existing file that collides with one template target.
  const collide = path.join(host, "src", "components", "blog", "post-grid.tsx");
  fs.mkdirSync(path.dirname(collide), { recursive: true });
  fs.writeFileSync(collide, "// user's own version\n");

  const before = countFiles(host);
  const r = runCli(host, "init");

  assert.notEqual(r.code, 0, "expected non-zero exit on collision");
  assert.match(r.output, /already exist/i);
  assert.match(r.output, /post-grid\.tsx/);
  assert.equal(countFiles(host), before, "no files may be written on an aborted init");
  assert.ok(!fs.existsSync(path.join(host, "src/lib/blog/config.ts")), "unrelated targets must not be written");
  assert.equal(fs.readFileSync(collide, "utf8"), "// user's own version\n", "colliding file must be untouched");
});

test("init --force overwrites but backs up collided files first", () => {
  const host = makeHost();
  const collide = path.join(host, "src", "components", "blog", "post-grid.tsx");
  fs.mkdirSync(path.dirname(collide), { recursive: true });
  fs.writeFileSync(collide, "// user's own version\n");

  const r = runCli(host, "init", "--force");
  assert.equal(r.code, 0, r.output);
  assert.notEqual(fs.readFileSync(collide, "utf8"), "// user's own version\n", "file should be overwritten");

  const backupRoot = path.join(host, ".nextjs-blog-kit-backup");
  assert.ok(fs.existsSync(backupRoot), "backup dir should exist");
  const stamped = fs.readdirSync(backupRoot)[0];
  const backedUp = path.join(backupRoot, stamped, "src", "components", "blog", "post-grid.tsx");
  assert.equal(fs.readFileSync(backedUp, "utf8"), "// user's own version\n", "backup must hold the original");
});

test("skill aborts on collision without writing", () => {
  const host = makeHost();
  const collide = path.join(host, ".claude", "skills", "blog-article", "SKILL.md");
  fs.mkdirSync(path.dirname(collide), { recursive: true });
  fs.writeFileSync(collide, "# customized\n");

  const r = runCli(host, "skill");
  assert.notEqual(r.code, 0);
  assert.equal(fs.readFileSync(collide, "utf8"), "# customized\n");
  assert.ok(
    !fs.existsSync(path.join(host, ".claude", "skills", "blog-article", "references")),
    "references must not be written on abort"
  );
});
