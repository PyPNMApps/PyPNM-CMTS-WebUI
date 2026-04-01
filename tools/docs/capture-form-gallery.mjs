#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..", "..");
const PREVIEW_PORT = Number(process.env.FORM_PREVIEW_PORT ?? "4175");
const PREVIEW_HOST = process.env.FORM_PREVIEW_HOST ?? "127.0.0.1";
const PREVIEW_BASE_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}`;
const OUTPUT_DIR = join(ROOT_DIR, "docs", "images", "forms");
const DOCS_DIR = join(ROOT_DIR, "docs", "user", "forms");
const OUTPUT_MD = join(DOCS_DIR, "gallery.md");

const FORM_ROUTES = [
  {
    section: "Serving Group",
    title: "Serving Group · RxMER",
    path: "/serving-group/rxmer",
    slug: "serving-group-rxmer-form",
  },
  {
    section: "Serving Group",
    title: "Serving Group · Channel Est Coeff",
    path: "/serving-group/channel-est-coeff",
    slug: "serving-group-channel-est-coeff-form",
  },
  {
    section: "Serving Group",
    title: "Serving Group · FEC Summary",
    path: "/serving-group/fec-summary",
    slug: "serving-group-fec-summary-form",
  },
  {
    section: "Serving Group",
    title: "Serving Group · Constellation Display",
    path: "/serving-group/constellation-display",
    slug: "serving-group-constellation-display-form",
  },
  {
    section: "Serving Group",
    title: "Serving Group · Modulation Profile",
    path: "/serving-group/modulation-profile",
    slug: "serving-group-modulation-profile-form",
  },
  {
    section: "Serving Group",
    title: "Serving Group · Histogram",
    path: "/serving-group/histogram",
    slug: "serving-group-histogram-form",
  },
  {
    section: "Spectrum Analyzer",
    title: "Spectrum Analyzer · Friendly",
    path: "/spectrum-analyzer/friendly",
    slug: "spectrum-friendly-form",
  },
  {
    section: "Spectrum Analyzer",
    title: "Spectrum Analyzer · Full Band",
    path: "/spectrum-analyzer/full-band",
    slug: "spectrum-full-band-form",
  },
  {
    section: "Spectrum Analyzer",
    title: "Spectrum Analyzer · OFDM",
    path: "/spectrum-analyzer/ofdm",
    slug: "spectrum-ofdm-form",
  },
  {
    section: "Spectrum Analyzer",
    title: "Spectrum Analyzer · SCQAM",
    path: "/spectrum-analyzer/scqam",
    slug: "spectrum-scqam-form",
  },
  {
    section: "Single Capture",
    title: "Single Capture · RxMER",
    path: "/single-capture/rxmer",
    slug: "single-capture-rxmer-form",
  },
  {
    section: "Single Capture",
    title: "Single Capture · Channel Est Coeff",
    path: "/single-capture/channel-est-coeff",
    slug: "single-capture-channel-est-coeff-form",
  },
  {
    section: "Single Capture",
    title: "Single Capture · Histogram",
    path: "/single-capture/histogram",
    slug: "single-capture-histogram-form",
  },
  {
    section: "Single Capture",
    title: "Single Capture · FEC Summary",
    path: "/single-capture/fec-summary",
    slug: "single-capture-fec-summary-form",
  },
  {
    section: "Single Capture",
    title: "Single Capture · Constellation Display",
    path: "/single-capture/constellation-display",
    slug: "single-capture-constellation-display-form",
  },
  {
    section: "Single Capture",
    title: "Single Capture · Modulation Profile",
    path: "/single-capture/modulation-profile",
    slug: "single-capture-modulation-profile-form",
  },
  {
    section: "Single Capture",
    title: "Single Capture · OFDMA PreEqualization",
    path: "/single-capture/us-ofdma-pre-equalization",
    slug: "single-capture-us-ofdma-pre-equalization-form",
  },
];

function log(message) {
  process.stdout.write(`[form-gallery] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[form-gallery][error] ${message}\n`);
  process.exit(1);
}

async function waitForServerReady(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // server still starting
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startPreviewServer() {
  const preview = spawn(
    "npm",
    ["run", "preview", "--", "--host", PREVIEW_HOST, "--port", String(PREVIEW_PORT), "--strictPort"],
    {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: "inherit",
    },
  );
  return preview;
}

async function canReachBaseUrl() {
  try {
    const response = await fetch(PREVIEW_BASE_URL, { method: "GET" });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

function renderFormGalleryMarkdown() {
  const lines = [
    "# Form Gallery",
    "",
    "Auto-captured form screenshots for navigation and quick reference.",
    "",
    `Base URL captured: \`${PREVIEW_BASE_URL}\``,
    "",
    "To regenerate:",
    "",
    "`npm run docs:capture-form-gallery`",
    "",
  ];

  const sectionMap = new Map();
  for (const route of FORM_ROUTES) {
    if (!sectionMap.has(route.section)) {
      sectionMap.set(route.section, []);
    }
    sectionMap.get(route.section).push(route);
  }

  for (const [section, routes] of sectionMap.entries()) {
    lines.push(`## ${section}`);
    lines.push("");
    for (const route of routes) {
      lines.push(`### ${route.title}`);
      lines.push("");
      lines.push(`Route: \`${route.path}\``);
      lines.push("");
      lines.push(
        `[![${route.title}](../../images/forms/${route.slug}.png)](../../images/forms/${route.slug}.png)`,
      );
      lines.push("");
    }
  }

  return lines.join("\n");
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(DOCS_DIR, { recursive: true });

  let preview = null;
  let browser;

  try {
    if (await canReachBaseUrl()) {
      log(`Using existing preview/dev server at ${PREVIEW_BASE_URL}`);
    } else {
      log(`Starting preview server at ${PREVIEW_BASE_URL}`);
      preview = startPreviewServer();
      log(`Waiting for preview server at ${PREVIEW_BASE_URL}`);
      await waitForServerReady(PREVIEW_BASE_URL);
    }

    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });

    for (const route of FORM_ROUTES) {
      const url = `${PREVIEW_BASE_URL}${route.path}`;
      const outputPath = join(OUTPUT_DIR, `${route.slug}.png`);
      log(`Capturing ${route.title} (${url})`);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: outputPath, fullPage: true });
    }

    writeFileSync(OUTPUT_MD, renderFormGalleryMarkdown(), "utf-8");
    log(`Wrote ${OUTPUT_MD}`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    if (browser) {
      await browser.close();
    }
    if (preview && !preview.killed) {
      preview.kill("SIGTERM");
    }
  }
}

main();
