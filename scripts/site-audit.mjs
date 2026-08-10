import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = [
  "index.html",
  "work.html",
  ...fs.readdirSync(path.join(root, "work"))
    .filter((name) => name.endsWith(".html"))
    .map((name) => path.join("work", name)),
];

const errors = [];
const checkedInternal = new Set();

function fail(file, message) {
  errors.push(`${file}: ${message}`);
}

function internalTarget(reference) {
  const clean = reference.split(/[?#]/)[0];
  if (!clean || clean === "/") return "index.html";
  const relative = clean.replace(/^\//, "");
  if (/\.[a-z0-9]+$/i.test(relative)) return relative;
  return `${relative}.html`;
}

for (const relativeFile of htmlFiles) {
  const source = fs.readFileSync(path.join(root, relativeFile), "utf8");

  if (!/<html\b[^>]*\blang="en"/i.test(source)) fail(relativeFile, "missing lang=en");
  if (!/<title>[^<]+<\/title>/i.test(source)) fail(relativeFile, "missing title");
  if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(source)) fail(relativeFile, "missing meta description");
  if (!/<link\s+rel="canonical"\s+href="https:\/\/vaibhavlalwani\.vercel\.app/i.test(source)) fail(relativeFile, "missing canonical URL");
  if ((source.match(/<h1\b/gi) || []).length !== 1) fail(relativeFile, "must contain exactly one h1");
  if (/data-theme="light"/i.test(source)) fail(relativeFile, "light theme leaked into generated output");
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(source)) fail(relativeFile, "external font dependency found");

  for (const match of source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    if (!/rel="[^"]*noopener[^"]*"/i.test(match[0])) fail(relativeFile, `target=_blank without noopener: ${match[0]}`);
  }
  for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt="[^"]*"/i.test(match[0])) fail(relativeFile, `image without alt: ${match[0]}`);
  }
  for (const match of source.matchAll(/\b(?:href|src|srcset)="(\/[^"]*)"/gi)) {
    const reference = match[1].trim().split(/\s+/)[0];
    if (reference.startsWith("/#") || reference.startsWith("//")) continue;
    const target = internalTarget(reference);
    if (checkedInternal.has(target)) continue;
    checkedInternal.add(target);
    if (!fs.existsSync(path.join(root, target))) fail(relativeFile, `missing internal target ${reference} -> ${target}`);
  }
}

for (const required of [
  "favicon.svg",
  "og.png",
  "img/queueproof.webp",
  "img/hydrasentry.webp",
  "img/qyntra.webp",
  "img/kodro.webp",
  "img/drip.webp",
  "img/delos.webp",
]) {
  if (!fs.existsSync(path.join(root, required))) fail("assets", `missing ${required}`);
}

if (errors.length) {
  console.error(`Site audit failed with ${errors.length} issue(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`Site audit passed: ${htmlFiles.length} pages and ${checkedInternal.size} internal targets checked.`);
