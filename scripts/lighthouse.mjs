#!/usr/bin/env node
/**
 * Lighthouse budget check.
 *
 * Boots `next start` on a free port, runs Lighthouse against each route in
 * `lighthouse-budget.json`, and writes JSON + markdown reports under
 * `docs/lighthouse/`. Exits non-zero if any threshold fails so CI fails
 * the build.
 *
 * Requirements:
 *   - Node 18+
 *   - `npm install -g lighthouse` (or local devDep) with Chrome/Edge on PATH
 *   - `next build` already run so `.next/` is up-to-date
 *
 * Usage:
 *   node scripts/lighthouse.mjs
 *   PORT=4321 LH_BIN=lighthouse node scripts/lighthouse.mjs
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUDGET_FILE = path.join(__dirname, "lighthouse-budget.json");
const OUT_DIR = path.join(ROOT, "docs", "lighthouse");

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "127.0.0.1";
const LH_BIN = process.env.LH_BIN ?? "lighthouse";

// Optional dependency — Lighthouse is the heavy lift and may be installed
// globally. We resolve it lazily so this script is still useful for
// reviewing `lighthouse-budget.json` even if Lighthouse is missing.
async function resolveLighthouse() {
  if (LH_BIN !== "lighthouse") return LH_BIN;
  try {
    // Try local node_modules first.
    return require.resolve("lighthouse/cli");
  } catch {
    // Fall back to a globally-installed binary.
    return "lighthouse";
  }
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      /* server not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not become ready in ${timeoutMs}ms`);
}

async function startNext() {
  const proc = spawn("npx", ["next", "start", "-p", String(PORT), "-H", HOST], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  });
  proc.stdout.on("data", (d) => process.stdout.write(`[next] ${d}`));
  proc.stderr.on("data", (d) => process.stderr.write(`[next] ${d}`));
  return proc;
}

async function runLighthouseOnce(lhBin, url) {
  // We shell out rather than import lighthouse — keeps this script
  // importable on machines that don't have lighthouse installed yet.
  const args = [
    url,
    "--output=json",
    "--output-path=stdout",
    "--quiet",
    "--chrome-flags=--headless --no-sandbox --disable-gpu",
    "--only-categories=performance,accessibility,best-practices,seo",
    "--preset=desktop",
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(lhBin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`lighthouse exited ${code}: ${stderr.slice(0, 400)}`)
        );
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`lighthouse JSON parse failed: ${e.message}`));
      }
    });
  });
}

function evaluate(lhr, thresholds) {
  const cats = lhr.categories ?? {};
  const audits = lhr.audits ?? {};
  const scores = {
    performance: cats.performance?.score ?? 0,
    accessibility: cats.accessibility?.score ?? 0,
    "best-practices": cats["best-practices"]?.score ?? 0,
    seo: cats.seo?.score ?? 0,
  };
  const metrics = {
    "lcp-ms": audits["largest-contentful-paint"]?.numericValue ?? Infinity,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? Infinity,
    "tbt-ms": audits["total-blocking-time"]?.numericValue ?? Infinity,
    "fcp-ms": audits["first-contentful-paint"]?.numericValue ?? Infinity,
    "speed-index-ms": audits["speed-index"]?.numericValue ?? Infinity,
    "transfer-size-kb":
      (audits["total-byte-weight"]?.numericValue ?? 0) / 1024,
  };
  const failures = [];
  for (const [k, v] of Object.entries(scores)) {
    if (v < thresholds[k]) failures.push(`${k} ${(v * 100).toFixed(0)} < ${thresholds[k] * 100}`);
  }
  for (const [k, v] of Object.entries(metrics)) {
    if (v > thresholds[k]) failures.push(`${k} ${v.toFixed(0)} > ${thresholds[k]}`);
  }
  return { scores, metrics, failures };
}

function toMarkdownRow(route, ev) {
  const s = (n) => `${(n * 100).toFixed(0)}`;
  const m = (n, suffix = "") => `${n.toFixed(0)}${suffix}`;
  return `| ${route} | ${s(ev.scores.performance)} | ${s(ev.scores.accessibility)} | ${s(ev.scores["best-practices"])} | ${s(ev.scores.seo)} | ${m(ev.metrics["lcp-ms"])} | ${ev.metrics.cls.toFixed(3)} | ${m(ev.metrics["tbt-ms"])} | ${m(ev.metrics["transfer-size-kb"])} |`;
}

async function main() {
  if (!existsSync(path.join(ROOT, ".next"))) {
    console.error("✘ .next/ not found — run `npm run build` first.");
    process.exit(2);
  }
  const budget = JSON.parse(
    await import("node:fs/promises").then((m) => m.readFile(BUDGET_FILE, "utf8"))
  );
  await mkdir(OUT_DIR, { recursive: true });

  const next = await startNext();
  let exitCode = 0;
  try {
    const baseUrl = `http://${HOST}:${PORT}`;
    await waitForServer(baseUrl);
    const lhBin = await resolveLighthouse();

    const rows = [];
    const failures = [];
    for (const route of budget.routes) {
      const url = `${baseUrl}${route}`;
      console.log(`\n→ lighthouse ${url}`);
      const lhr = await runLighthouseOnce(lhBin, url);
      const ev = evaluate(lhr, budget.thresholds);
      await writeFile(
        path.join(OUT_DIR, `${route.replace(/\W+/g, "_") || "root"}.json`),
        JSON.stringify(lhr, null, 2)
      );
      rows.push({ route, ev });
      if (ev.failures.length) failures.push({ route, failures: ev.failures });
      console.log(
        `  perf=${(ev.scores.performance * 100).toFixed(0)} a11y=${(ev.scores.accessibility * 100).toFixed(0)} lcp=${ev.metrics["lcp-ms"].toFixed(0)}ms cls=${ev.metrics.cls.toFixed(3)}`
      );
    }

    const md = [
      `# Lighthouse report — ${new Date().toISOString().slice(0, 10)}`,
      "",
      `Thresholds: ${JSON.stringify(budget.thresholds)}`,
      "",
      "| Route | Perf | A11y | BP | SEO | LCP (ms) | CLS | TBT (ms) | Bytes (KB) |",
      "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
      ...rows.map((r) => toMarkdownRow(r.route, r.ev)),
      "",
      failures.length
        ? `## Failures\n\n${failures
            .map(
              (f) =>
                `- **${f.route}**\n${f.failures.map((x) => `  - ${x}`).join("\n")}`
            )
            .join("\n")}`
        : "## All routes within budget ✓",
      "",
    ].join("\n");
    await writeFile(path.join(OUT_DIR, "summary.md"), md);
    console.log(`\nWrote summary → docs/lighthouse/summary.md`);

    if (failures.length) {
      exitCode = 1;
    }
  } finally {
    next.kill("SIGTERM");
  }
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
