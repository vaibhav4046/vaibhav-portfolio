// Pulls the public repositories and the contribution calendar for one GitHub
// account into data/github.json. scripts/build-pages.cjs turns that file into
// HTML, so the site itself never calls GitHub (the CSP allows no outside requests).
//
// Run by .github/workflows/sync.yml on a schedule. Locally:
//   GITHUB_TOKEN=$(gh auth token) node scripts/sync-github.mjs
//
// A failed or empty response exits non-zero and leaves the existing file alone,
// so a bad run can never blank the live section.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USER = "vaibhav4046";
// Never listed: the profile README, this site, a project taken off the portfolio on purpose, and shared coursework.
// To hide any other repository without touching this file, give it the topic "portfolio-hide" on GitHub.
const IGNORE = new Set(["vaibhav4046", "vaibhav-portfolio", "recoup", "ca-assignment-2-clustering"]);
const HIDE_TOPIC = "portfolio-hide";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "github.json");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "portfolio-sync",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function getJson(url, init) {
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init && init.headers) } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

function httpUrl(value) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

export function shapeRepos(raw) {
  return raw
    .filter((r) => !r.fork && !r.archived && !r.private && !IGNORE.has(r.name))
    .filter((r) => !(Array.isArray(r.topics) && r.topics.includes(HIDE_TOPIC)))
    .filter((r) => typeof r.description === "string" && r.description.trim().length > 12)
    .map((r) => {
      const url = httpUrl(r.html_url);
      const homepage = httpUrl(r.homepage);
      return {
        name: r.name,
        description: r.description.replace(/\s+/g, " ").trim().slice(0, 220),
        url,
        // A homepage that only points back at GitHub is not a live product.
        homepage: /^https?:\/\/(www\.)?github\.com\//i.test(homepage) ? "" : homepage,
        language: r.language || "",
        stars: r.stargazers_count || 0,
        pushedAt: String(r.pushed_at || "").slice(0, 10),
        createdAt: String(r.created_at || "").slice(0, 10),
      };
    })
    .filter((r) => r.url && /^\d{4}-\d{2}-\d{2}$/.test(r.pushedAt))
    .sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : a.pushedAt > b.pushedAt ? -1 : a.name.localeCompare(b.name)));
}

async function fetchRepos() {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await getJson(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=pushed&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("repository list was not an array");
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

async function fetchCalendar() {
  // The calendar is GraphQL-only, and GraphQL needs a token.
  if (!token) return null;
  const query = "query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}";
  const body = await getJson("https://api.github.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const cal = body && body.data && body.data.user && body.data.user.contributionsCollection.contributionCalendar;
  if (!cal || !Array.isArray(cal.weeks)) throw new Error("contribution calendar missing from GraphQL response");
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  if (!days.length) throw new Error("contribution calendar was empty");
  return {
    total: cal.totalContributions,
    from: days[0].date,
    to: days[days.length - 1].date,
    days: days.map((d) => d.contributionCount),
  };
}

async function main() {
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { /* first run */ }

  const raw = await fetchRepos();
  const repos = shapeRepos(raw);
  if (!repos.length) throw new Error("no repositories survived filtering; refusing to overwrite");

  const calendar = (await fetchCalendar()) || previous.calendar || null;
  const data = {
    user: USER,
    publicRepos: raw.filter((r) => !r.fork && !r.private).length,
    repos,
    calendar,
  };

  const next = JSON.stringify(data, null, 2) + "\n";
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === next) {
    console.log(`github.json unchanged (${repos.length} repositories).`);
    return;
  }
  fs.writeFileSync(OUT, next);
  console.log(`github.json written: ${repos.length} repositories, ${calendar ? calendar.total + " contributions" : "no calendar (no token)"}.`);
}

// Only hit the network when run directly, so the shaping can be checked offline.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`sync-github failed: ${error.message}`);
    process.exit(1);
  });
}
