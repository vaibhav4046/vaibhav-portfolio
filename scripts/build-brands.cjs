/*
 * Brand marks for the stack chips and project tags: the real, official marks
 * (Simple Icons, CC0) plus RocketRide's own SVG, written to one external sprite
 * at img/brands.svg and referenced with <use href="/img/brands.svg#b-slug">.
 * A chip without a real mark stays text; nothing is drawn by hand.
 *
 *   node scripts/build-brands.cjs [path-to-simple-icons/icons]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ICONS = process.argv[2] || path.join(process.env.LOCALAPPDATA || "", "Temp", "claude", "D--", "ae525689-a486-447f-b36a-c568c4eb1ef1", "scratchpad", "icons", "node_modules", "simple-icons", "icons");

// Chip or tag label -> Simple Icons slug. Labels not listed keep no mark.
const MARKS = {
  "Claude API": "anthropic",
  "React 19": "react", "React": "react",
  "Next.js 15": "nextdotjs", "Next.js": "nextdotjs", "Next.js 16": "nextdotjs",
  "TypeScript": "typescript",
  "Tailwind": "tailwindcss",
  "Vite": "vite",
  "HTML / CSS": "html5",
  "Python": "python",
  "FastAPI": "fastapi",
  "Node.js": "nodedotjs", "Node": "nodedotjs",
  "BullMQ + Redis": "redis", "Redis": "redis",
  "Postgres": "postgresql", "pgvector": "postgresql", "PostgreSQL": "postgresql",
  "Supabase": "supabase",
  "MongoDB": "mongodb",
  "Vercel": "vercel",
  "Cloud Run": "googlecloud", "Google Cloud": "googlecloud",
  "Docker": "docker",
  "Git / GitHub": "github", "GitHub": "github",
  "Ollama": "ollama",
  "Hugging Face": "huggingface",
  "Three.js": "threedotjs",
  "PyTorch": "pytorch",
  "RocketRide": "rocketride",
};

function symbolFromSimpleIcon(slug) {
  const file = path.join(ICONS, slug + ".svg");
  if (!fs.existsSync(file)) return null;
  const svg = fs.readFileSync(file, "utf8");
  const d = (svg.match(/<path d="([^"]+)"/) || [])[1];
  if (!d) return null;
  return `<symbol id="b-${slug}" viewBox="0 0 24 24"><path fill="currentColor" d="${d}"/></symbol>`;
}

function symbolFromFile(slug, file) {
  const svg = fs.readFileSync(file, "utf8");
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 24 24";
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<symbol id="b-${slug}" viewBox="${viewBox}">${inner.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')}</symbol>`;
}

const symbols = new Map();
for (const slug of new Set(Object.values(MARKS))) {
  const sym = slug === "rocketride"
    ? symbolFromFile(slug, path.join(ROOT, "img", "brand-rocketride.svg"))
    : symbolFromSimpleIcon(slug);
  if (sym) symbols.set(slug, sym);
}
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\n${[...symbols.values()].join("\n")}\n</svg>\n`;
fs.writeFileSync(path.join(ROOT, "img", "brands.svg"), sprite);

// Rewrite the chips and tags on the home page. Idempotent: a chip that already
// carries a mark is left alone.
const idx = path.join(ROOT, "index.html");
let html = fs.readFileSync(idx, "utf8");
let marked = 0;
html = html.replace(/<li>([^<]+)<\/li>/g, (m, label) => {
  const slug = MARKS[label.replace(/&amp;/g, "&").trim()];
  if (!slug || !symbols.has(slug)) return m;
  marked += 1;
  return `<li class="has-mark"><svg class="chip-ico" aria-hidden="true"><use href="/img/brands.svg#b-${slug}"/></svg>${label}</li>`;
});
fs.writeFileSync(idx, html);
console.log(`brands.svg: ${symbols.size} marks (${[...symbols.keys()].join(", ")}); chips marked on index.html: ${marked}`);
