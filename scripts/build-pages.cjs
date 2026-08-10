/* ============================================================
   Build the portfolio subpages from one data source:
     - /work.html          (full archive, newest first)
     - /work/<slug>.html   (6 per-project case studies)
   CSP-safe output: no inline styles, no inline scripts.
   Only self-hosted /style.css + /script.js + JSON-LD.
   Prose is truthful, pulled from the live committed portfolio.
   No em-dashes anywhere (user writing-style rule): use commas,
   colons, en-dash for ranges, and the middot separator.
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://vaibhavlalwani.vercel.app";
const YEAR = "2026";

/* ---------- shared fragments ---------- */
function head(opts) {
  // opts: title, desc, canonical (path), ogImage (path), extraLD (string|null)
  const canonical = SITE + opts.canonical;
  const ogImage = SITE + (opts.ogImage || "/og.png");
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.title}</title>
  <meta name="description" content="${opts.desc}" />
  <meta name="author" content="Vaibhav Lalwani" />
  <meta name="theme-color" content="#080808" />
  <link rel="canonical" href="${canonical}" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${opts.ogTitle || opts.title}" />
  <meta property="og:description" content="${opts.desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImage}" />
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="stylesheet" href="/style.css" />
${opts.extraLD ? "\n  " + opts.extraLD + "\n" : ""}</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>

  <header class="topbar">
    <a class="brand" href="/" aria-label="Vaibhav Lalwani · home">
      <img class="brand-mark" src="/img/profile.jpg" alt="" width="30" height="30" />
      <span class="brand-text">Vaibhav&nbsp;Lalwani</span>
      <span class="brand-index">/ SYSTEMS·26</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="/work">Work</a>
      <a href="/#about">About</a>
      <a href="/#experience">Experience</a>
      <a href="/#contact">Contact</a>
    </nav>
    <a class="topbar-cta" href="/Vaibhav_Lalwani_Resume.pdf?v=2026-08" target="_blank" rel="noopener">Résumé</a>
    <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav">
      <span>Menu</span><i aria-hidden="true"></i>
    </button>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile" hidden>
      <a href="/work"><span>01</span> Work</a>
      <a href="/#about"><span>02</span> About</a>
      <a href="/#experience"><span>03</span> Experience</a>
      <a href="/#contact"><span>04</span> Contact</a>
      <a href="/Vaibhav_Lalwani_Resume.pdf?v=2026-08" target="_blank" rel="noopener"><span>PDF</span> Résumé</a>
    </nav>
  </header>
`;
}

function foot() {
  return `
  <footer class="foot">
    <div class="foot-inner">
      <div class="foot-brand">Vaibhav <span class="mark">Lalwani.</span></div>
      <div class="foot-meta">
        <nav aria-label="Footer">
          <a href="/#work">Work</a>
          <a href="/work">Archive</a>
          <a href="/#about">About</a>
          <a href="/#experience">Experience</a>
          <a href="/#contact">Contact</a>
          <a href="https://github.com/vaibhav4046" target="_blank" rel="noopener">GitHub</a>
          <a href="https://www.linkedin.com/in/vaibhav-lalwani" target="_blank" rel="noopener">LinkedIn</a>
        </nav>
        <p class="foot-note">Open to work · Liverpool, UK · <span id="year">${YEAR}</span></p>
      </div>
    </div>
    <div class="foot-legal">
      <p>Hand-built with plain HTML, CSS and JavaScript. No framework, no tracker.</p>
      <p>© <span id="year-2">${YEAR}</span> Vaibhav Lalwani</p>
    </div>
  </footer>

  <button class="back-to-top" id="back-to-top" type="button" aria-label="Back to top">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
  </button>

  <script src="/script.js" defer></script>
</body>
</html>
`;
}

function linkRow(links) {
  // links: array of {label, href}
  return links
    .map(function (l) {
      return `<a href="${l.href}"${l.href.charAt(0) === "/" ? "" : ' target="_blank" rel="noopener"'}>${l.label}</a>`;
    })
    .join("\n            ");
}

/* ============================================================
   DATA — one source of truth, ground-truthed against the live
   committed portfolio (origin/main). Newest first.
   ============================================================ */
const ARCHIVE = [
  {
    num: "01", name: "QueueProof", slug: "queueproof", tag: "Retrieval · 2026",
    desc: "Evidence-backed cross-source retrieval. Ask one question across your tools and every claim in the answer opens back to the record it came from.",
    live: "https://queueproof.vercel.app", source: "https://github.com/vaibhav4046/queueproof",
  },
  {
    num: "02", name: "HydraSentry", slug: "hydrasentry", tag: "Agent security · Winner",
    desc: "A memory-integrity firewall for AI agents. Catches a poisoned memory before the agent acts and seals a signed certificate. HydraDB Build Blitz winner.",
    live: "https://hydrasentry.vercel.app", source: "https://github.com/vaibhav4046/hydrasentry",
  },
  {
    num: "03", name: "Kodro", slug: "kodro", tag: "Simulation · MSc",
    desc: "An offline robot design and simulation studio. Build a robot, program it, and watch it work in a live 3D world, all local with no cloud.",
    source: "https://github.com/vaibhav4046/robolearn",
  },
  {
    num: "04", name: "Own Wiki", tag: "Local-first AI",
    desc: "A desktop second brain powered by a local LLM. RAG chat over your own files, a 3D knowledge galaxy, and a multi-agent research swarm, zero cloud.",
    live: "https://github.com/vaibhav4046/mnemosyne/releases/latest", liveLabel: "Download",
    source: "https://github.com/vaibhav4046/mnemosyne",
  },
  {
    num: "05", name: "DRIP", slug: "drip", tag: "Multi-agent · Commerce",
    desc: "An AI sneaker stylist. Multi-agent styling that reasons about fit and taste, with live StockX resale prices and buy links per shoe.",
    live: "https://drip-two-rho.vercel.app", source: "https://github.com/vaibhav4046/drip-ai-sneaker-stylist",
  },
  {
    num: "06", name: "Continuity", tag: "Memory agent",
    desc: "A self-evolving memory agent on HydraDB. Remembers across sessions, supersedes itself on contradiction, and warns you when recalled context changes the safe answer.",
    live: "https://continuity-six.vercel.app", source: "https://github.com/vaibhav4046/continuity",
  },
  {
    num: "07", name: "Recoup", tag: "Agents · Fintech",
    desc: "An AI money-recovery agent. Scans real Gmail receipts, grounds every claim in consumer-protection law, and stops at a human approval gate before it acts.",
    source: "https://github.com/vaibhav4046/recoup",
  },
  {
    num: "08", name: "RecallOps Cortex", tag: "Agents · SRE",
    desc: "A recall-containment command center. A live openFDA recall scoped across BigQuery into a blast radius, with drafted actions behind an audit chain.",
    live: "https://recall-ops.vercel.app", source: "https://github.com/vaibhav4046/RecallOps",
  },
  {
    num: "09", name: "Qyntra", slug: "qyntra", tag: "Retrieval · Finalist",
    desc: "A personal knowledge OS. Ingest your files, explore them as a 3D galaxy, and ask questions answered from your own material. Wikithon '26 finalist.",
    live: "https://qyntra-app.vercel.app", source: "https://github.com/vaibhav4046/qyntra-app",
  },
  {
    num: "10", name: "DelOS", slug: "delos", tag: "Multi-agent · OS",
    desc: "A browser-OS where agents flow under pressure. An xterm agent fleet on isolated HydraDB tenants, coordinated so agents don't collide under load.",
    live: "https://delrio.vercel.app", source: "https://github.com/vaibhav4046/delos",
  },
  {
    num: "11", name: "Cogniloop", tag: "AI · EdTech",
    desc: "A Socratic study system. Grades free-form answers against a rubric and tracks concept mastery, sub-second on Groq Llama 3.3 70B.",
    live: "https://cogniloop-vaibhav4046s-projects.vercel.app", source: "https://github.com/vaibhav4046/cogniloop",
  },
  {
    num: "12", name: "MedReviewAI", tag: "Medical AI · RAG",
    desc: "A grounded medical paper analyzer. Searches 13 academic sources, extracts PICO fields, and keeps generated claims tied to verbatim source evidence.",
    live: "https://medai-deploy.vercel.app", source: "https://github.com/vaibhav4046/MedReviewAI",
  },
  {
    num: "13", name: "ScholarAI", tag: "Research · Extension",
    desc: "A Chrome extension that turns research papers into interactive AI sessions with summaries, extracted claims, and Q&A over the paper.",
    source: "https://github.com/vaibhav4046/Scholar.AI-Chrome-Extension",
  },
  {
    num: "14", name: "MCP Marketplace", tag: "MCP · Registry",
    desc: "A searchable registry of Model Context Protocol servers with one-line install snippets for Claude Desktop, Cursor and Claude Code, synced daily.",
    live: "https://mcp-hub-registry.vercel.app", source: "https://github.com/vaibhav4046/mcp-marketplace",
  },
  {
    num: "15", name: "The Film Theory Vault", tag: "Web · Just for fun",
    desc: "Search any movie and the page regenerates in a cinematic style, auto-themed to the film's colours, with AI-written fan theories behind a spoiler gate.",
    live: "https://film-theory-vault.vercel.app", source: "https://github.com/vaibhav4046/film-theory-vault",
  },
];

/* ---------- detail-page content (the 6 case studies) ---------- */
const DETAILS = {
  queueproof: {
    name: "QueueProof",
    kicker: "HydraDB × Connectors Hackathon · Evidence-backed retrieval",
    title: "QueueProof",
    sub: "Ask one plain-language question across every source you own and get an answer where each claim opens back to the record it came from.",
    img: "/img/queueproof.png",
    imgAlt: "QueueProof workspace: a cross-source question answered with numbered claim citations back to their original source records.",
    cta: [
      { label: "Live demo →", href: "https://queueproof.vercel.app", primary: true },
      { label: "Source →", href: "https://github.com/vaibhav4046/queueproof" },
      { label: "Method →", href: "https://queueproof.vercel.app/method" },
    ],
    meta: [
      ["Role", "Solo build"],
      ["Year", "2026"],
      ["Context", "HydraDB × Connectors Hackathon"],
      ["Stack", "Next.js 16 · React 19 · HydraDB · MCP"],
      ["Status", "Live, no login"],
    ],
    prose: [
      { h: "The problem", em: "problem", p: [
        "Answers that cross tools lose their evidence. Ask a question that touches GitHub, Linear, Slack, Gmail and a folder of documents, and most tools hand you a confident paragraph with no way to check where any of it came from. When the sources disagree, the disagreement gets smoothed over instead of surfaced.",
      ]},
      { h: "How it works", em: "works", p: [
        "QueueProof retrieves through HydraDB's cross-source evidence layer and returns a concise answer whose every claim opens to the original source record behind it. Connectors are verified against attributable records rather than saved credentials, and evidence is merged without collapsing distinct entities into one.",
        "A degraded connector or a contradiction between sources stays visible instead of being hidden. The same read contract compiles into a deterministic priority queue and is exposed through MCP so AI clients can consume it directly. Writes stay behind an explicit approval boundary and only count as executed once a provider response ID has been stored.",
      ]},
    ],
    features: [
      ["Claim-level citations", "Every sentence in the answer links to the exact record it was drawn from."],
      ["Connector receipts", "Sources are verified against attributable records, not against stored credentials."],
      ["Deterministic queue", "The read contract compiles into a repeatable priority queue and an MCP surface."],
      ["Approval-gated writes", "Nothing is written until you approve it, and a write only counts once its response ID is stored."],
    ],
    prev: null,
    next: { slug: "hydrasentry", name: "HydraSentry" },
  },

  hydrasentry: {
    name: "HydraSentry",
    kicker: "HydraDB Build Blitz · Winner",
    title: "HydraSentry",
    sub: "A memory-integrity firewall for AI agents. When a poisoned memory tries to make an agent act, it catches it and seals a signed certificate.",
    img: "/img/hydrasentry.png",
    imgAlt: "HydraSentry live console: a poisoned memory makes an AI refund agent auto-approve a payment, then the firewall blocks it and a signed Memory Integrity Certificate is issued.",
    cta: [
      { label: "Live demo →", href: "https://hydrasentry.vercel.app", primary: true },
      { label: "Source →", href: "https://github.com/vaibhav4046/hydrasentry" },
    ],
    meta: [
      ["Role", "Solo build"],
      ["Year", "2026"],
      ["Recognition", "HydraDB Build Blitz, Winner"],
      ["Stack", "HydraDB · MCP firewall · FastAPI · Next.js 16 · Supabase"],
      ["Status", "Live, no login"],
    ],
    prose: [
      { h: "The problem", em: "problem", p: [
        "Agents that run on persistent memory can be poisoned. A single bad memory in a vector store or RAG index can silently override an agent's policy on every future run. Prompt firewalls never see it, because the poison lives in what the agent retrieves, not in the prompt it was given.",
      ]},
      { h: "How it works", em: "works", p: [
        "HydraSentry replays the agent on clean versus poisoned context and scores the difference in behaviour. It traces the exact taint path through the real HydraDB query_paths graph, blocks the unsafe action through an MCP firewall before the agent acts, and seals each incident into a signed, offline-verifiable Memory Integrity Certificate.",
        "It runs multi-tenant on Supabase Postgres, detects semantic paraphrase attacks through embeddings, and ships a self-verifying map against the OWASP Agentic Top 10. The demo is public with no login.",
      ]},
    ],
    features: [
      ["Behaviour replay", "The agent runs on clean and poisoned context, and the behaviour diff is scored."],
      ["Graph taint trace", "The exact poison path is traced through the real HydraDB query_paths graph."],
      ["MCP firewall", "The unsafe action is blocked before the agent acts, not flagged afterward."],
      ["Signed certificate", "Each incident seals into an offline-verifiable Memory Integrity Certificate."],
    ],
    prev: { slug: "queueproof", name: "QueueProof" },
    next: { slug: "kodro", name: "Kodro" },
  },

  kodro: {
    name: "Kodro",
    kicker: "Offline robot design and simulation · MSc COMP702",
    title: "Kodro",
    sub: "An offline studio for the whole loop: design a robot, program it, and watch it work in a live 3D world. No account, no cloud.",
    img: "/img/kodro.png",
    imgAlt: "Kodro studio: a code editor on the left, the City world with traffic and a pedestrian crossing and the robot in the middle, and live telemetry on the right.",
    cta: [
      { label: "Source →", href: "https://github.com/vaibhav4046/robolearn", primary: true },
    ],
    meta: [
      ["Role", "Solo build, MSc dissertation"],
      ["Year", "2026"],
      ["Stack", "React · Three.js · Python-subset interpreter · Ollama (optional)"],
      ["Verified", "21 / 21 interpreter QA · 851 engine tests · ~86% coverage"],
      ["Status", "Offline desktop, no cloud"],
    ],
    prose: [
      { h: "The idea", em: "idea", p: [
        "Kodro is a desktop studio for the loop of design a robot, program it, watch it work, running entirely offline with no account and no cloud. You assemble a custom robot in the Robot Lab from a board, sensors, actuators and a chassis, and Kodro derives its mass, speed and runtime from what you built.",
      ]},
      { h: "Program it three ways", em: "three ways", p: [
        "You program the robot with a Python subset interpreter, a blocks editor that compiles to the same Python, or an optional local AI assistant running on Ollama with a deterministic rule-based fallback. Then Kodro validates the behaviour in a 3D world chosen to fit the robot: a self-driving car gets the City with looping one-way traffic, pedestrians and a crossing; a home or arm robot gets a furnished Room; a rover gets planetary terrain.",
        "Movement reads correctly per type, with weight transfer, banking and suspension rather than props sliding across the floor. A localStorage memory layer reflects on each run and keeps saved skills, so the studio refines from your own verified work at the system level, with no model retraining. It is built with vendored React and Three.js, pre-compiled to a single offline bundle and packaged as a Windows executable.",
      ]},
    ],
    features: [
      ["Robot Lab", "Assemble the robot and its mass, speed and runtime are derived from the parts."],
      ["Three ways to code", "A Python subset, a blocks editor that compiles to it, or an optional local Ollama assistant."],
      ["Worlds that fit", "A City with traffic and a crossing, a furnished Room, or planetary terrain, chosen per robot."],
      ["Self-refining", "A localStorage memory reflects on each run and keeps skills, with no retraining."],
    ],
    prev: { slug: "hydrasentry", name: "HydraSentry" },
    next: { slug: "drip", name: "DRIP" },
  },

  drip: {
    name: "DRIP",
    kicker: "Multi-agent AI · Live StockX data",
    title: "DRIP",
    sub: "An AI sneaker stylist that reasons about fit and taste instead of just returning search results, with live resale prices per shoe.",
    img: "/img/drip.png",
    imgAlt: "DRIP AI sneaker stylist: a For You feed, a shoe detail with live StockX resale price and buy link, and the multi-agent AI stylist chat.",
    cta: [
      { label: "Live demo →", href: "https://drip-two-rho.vercel.app", primary: true },
      { label: "Source →", href: "https://github.com/vaibhav4046/drip-ai-sneaker-stylist" },
    ],
    meta: [
      ["Role", "Solo build"],
      ["Year", "2026"],
      ["Stack", "React 19 · Vite · Tailwind v4 · multi-agent LLM · KicksDB / StockX"],
      ["Status", "Live, installable PWA"],
    ],
    prose: [
      { h: "The idea", em: "idea", p: [
        "DRIP builds outfits around your sneaker collection, like Nike SNKRS meeting a personal stylist. A multi-agent LLM does the styling: a Stylist agent drafts a look and a Critic agent refines it, so the advice is honest and weather- and material-aware. It will tell you not to wear suede in the rain rather than hype every pick.",
      ]},
      { h: "Real data underneath", em: "Real data", p: [
        "Live StockX resale prices, buy links and product images stream in per shoe through KicksDB, and search hits the entire real catalog rather than a static list. A camera scanner extracts dominant colours with k-means and auto-captures when you hold a shoe steady, then an AI writes the fit verdict.",
        "Under the surface it runs a content-based recommendation engine with taste vectors and MMR diversity, a weather-aware outfit engine grounded in colour theory, a live community feed, a saved-fit lookbook, a voice stylist and a multi-currency shop. It is fully functional with zero API keys, and adding keys progressively lights up live AI and data. It installs as a mobile-first PWA.",
      ]},
    ],
    features: [
      ["Stylist and Critic", "One agent drafts the look, a second refines it into honest, wearable advice."],
      ["Live resale prices", "StockX prices, buy links and images stream per shoe through KicksDB."],
      ["Camera colour scan", "k-means extracts a shoe's colours and auto-captures, then the AI writes a verdict."],
      ["Runs key-free", "Everything works with zero API keys; keys light up the live AI and data."],
    ],
    prev: { slug: "kodro", name: "Kodro" },
    next: { slug: "qyntra", name: "Qyntra" },
  },

  qyntra: {
    name: "Qyntra",
    kicker: "Wikithon '26 Finalist · Personal Knowledge OS",
    title: "Qyntra",
    sub: "A private Wikipedia compiled from your own files. Ask a question and it answers straight from your material, every claim clickable.",
    img: "/img/qyntra.png",
    imgAlt: "Qyntra Personal Knowledge OS dashboard with a 3D galaxy view of ingested files.",
    cta: [
      { label: "Live demo →", href: "https://qyntra-app.vercel.app", primary: true },
      { label: "Source →", href: "https://github.com/vaibhav4046/qyntra-app" },
      { label: "Wikithon finalists →", href: "https://www.aivalley.io/hackathons/wikithon-build-your-own-wikipedia-with-hydradb/projects" },
    ],
    meta: [
      ["Role", "Solo build"],
      ["Year", "2026"],
      ["Recognition", "Wikithon '26 Finalist"],
      ["Stack", "Next.js 16 · Supabase · Groq Llama 3.3 70B · react-three-fiber"],
      ["Status", "Live"],
    ],
    prose: [
      { h: "The idea", em: "idea", p: [
        "Qyntra is a private Wikipedia compiled from your own files. Connect Notion, Google Drive, Gmail, GitHub or a desktop folder, and it ingests every supported file, from markdown and PDF to DOCX, code, email bodies, Notion blocks and READMEs, into one searchable corpus on Supabase.",
      ]},
      { h: "Ask, and see the source", em: "see the source", p: [
        "Ask a question and Groq Llama 3.3 70B answers with numbered citations back to the exact file it pulled from, so there is no hallucination and every claim is clickable. A react-three-fiber 3D galaxy lays out every file as a star, clustered by type, with bezier knowledge-graph edges between them.",
        "WEB mode falls back to live DuckDuckGo search, and DEEP mode reframes the query as a three-step research pass. It was built solo in about a day between exam revision sessions, and took a place in the Wikithon '26 finals.",
      ]},
    ],
    features: [
      ["Ingest anything", "Notion, Drive, Gmail, GitHub or a folder, all into one searchable corpus."],
      ["Cited answers", "Groq answers with numbered citations back to the exact source file."],
      ["3D galaxy", "Every file is a star clustered by type, with knowledge-graph edges."],
      ["Web and deep modes", "Fall back to live search, or run a multi-step research pass."],
    ],
    prev: { slug: "drip", name: "DRIP" },
    next: { slug: "delos", name: "DelOS" },
  },

  delos: {
    name: "DelOS",
    kicker: "Agents Under Pressure '26 · Browser-OS",
    title: "DelOS",
    sub: "A browser-OS where multi-agent orchestration is wired in by default, so agents keep flowing instead of colliding under load.",
    img: "/img/delos.png",
    imgAlt: "DelOS browser-OS with multi-agent orchestration, an xterm Agent Fleet, a force-directed memory graph and a HydraDB-backed knowledge layer.",
    cta: [
      { label: "Live demo →", href: "https://delrio.vercel.app", primary: true },
      { label: "Source →", href: "https://github.com/vaibhav4046/delos" },
      { label: "Hackathon projects →", href: "https://www.aivalley.io/hackathons/agents-under-pressure-build-your-own-os/projects" },
    ],
    meta: [
      ["Role", "Solo build, 48-hour sprint"],
      ["Year", "2026"],
      ["Context", "Agents Under Pressure '26"],
      ["Stack", "Next.js 16 · HydraDB graph+vector · xterm.js · SSE"],
      ["Verified", "79 endpoints · 14 / 14 regression · 0 console errors"],
    ],
    prose: [
      { h: "The idea", em: "idea", p: [
        "DelOS is a browser-OS where multi-agent orchestration is a default, not a feature bolted on later. Memory, Tools, Recovery and Adaptation are first-class primitives, and agents build the apps live in front of you.",
      ]},
      { h: "Agents that flow under load", em: "flow under load", p: [
        "Real xterm.js terminal panes drive an Agent Fleet of parallel agents, each on an isolated HydraDB tenant subnamespace, which is the serverless answer to git worktrees. A six-provider LLM cascade across Groq, Mistral, Gemini, NIM, Cerebras, Bytez and OpenRouter keeps the OS responsive when any single provider rate-limits.",
        "A Memory Browser renders a force-directed knowledge graph over HydraDB graph and vector storage with a three-tier write-guard, and SSE streams every phase, from plan to tool calls to recoveries to usage, into the terminal so you watch the agent think. It was built solo across a 48-hour sprint, with 79 endpoints and a clean regression pass.",
      ]},
    ],
    features: [
      ["Agent Fleet", "Parallel agents in real xterm.js panes, each on its own isolated HydraDB tenant."],
      ["Six-provider cascade", "The OS stays responsive by falling across seven providers when one rate-limits."],
      ["Memory Browser", "A force-directed graph over HydraDB graph and vector storage, write-guarded."],
      ["Watch it think", "SSE streams plan, tool calls, recoveries and usage straight into the terminal."],
    ],
    prev: { slug: "qyntra", name: "Qyntra" },
    next: null,
  },
};

/* ============================================================
   RENDERERS
   ============================================================ */
function renderArchiveRow(p) {
  var nameHref = p.slug ? "/work/" + p.slug : (p.live || p.source);
  var nameIsInternal = !!p.slug;
  var nameLink = `<a href="${nameHref}"${nameIsInternal ? "" : ' target="_blank" rel="noopener"'}>${p.name}</a>`;

  var links = [];
  if (p.slug) links.push({ label: "Case study", href: "/work/" + p.slug });
  if (p.live) links.push({ label: p.liveLabel || "Live", href: p.live });
  if (p.source) links.push({ label: "Source", href: p.source });

  return `      <div class="archive-row reveal">
        <span class="a-num">${p.num}</span>
        <span class="a-name">${nameLink}</span>
        <span class="a-desc">${p.desc}</span>
        <span class="a-tag">${p.tag}</span>
        <span class="a-links">
          ${linkRow(links)}
        </span>
      </div>`;
}

function buildArchive() {
  var rows = ARCHIVE.map(renderArchiveRow).join("\n");
  var ld = `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Work archive · Vaibhav Lalwani",
    "url": "${SITE}/work",
    "isPartOf": { "@type": "WebSite", "url": "${SITE}/" }
  }
  </script>`;

  var page = head({
    title: "Work archive · Vaibhav Lalwani",
    ogTitle: "Work archive · Vaibhav Lalwani",
    desc: "Everything Vaibhav Lalwani has shipped: production LLM systems, autonomous agents, retrieval and full-stack apps, with live demos or reproducible repositories.",
    canonical: "/work",
    ogImage: "/og.png",
    extraLD: ld,
  });

  page += `
  <main id="main">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="sep">/</span>
      <span class="here">Work</span>
    </nav>

    <section class="section wrap" aria-labelledby="archive-heading">
      <div class="section-head">
        <span class="section-index"><b>&#8734;</b> / Archive</span>
        <h1 class="section-title" id="archive-heading">Everything <span class="em">shipped</span>.</h1>
        <p class="section-lede">${ARCHIVE.length} builds, newest first: production systems, hackathon entries and open source. Six have a full case study; the rest link to the strongest available demo, release or repository.</p>
      </div>

      <div class="archive-index">
${rows}
      </div>

      <a class="btn" href="/#work"><span class="arrow" aria-hidden="true">←</span> <span>Back to selected work</span></a>
    </section>
  </main>
`;
  page += foot();
  return page;
}

function renderMeta(meta) {
  return meta
    .map(function (m) {
      return `        <dl class="meta-block"><dt>${m[0]}</dt><dd>${m[1]}</dd></dl>`;
    })
    .join("\n");
}

function renderProse(prose) {
  return prose
    .map(function (block) {
      var h = block.em
        ? block.h.replace(block.em, `<span class="em">${block.em}</span>`)
        : block.h;
      var ps = block.p.map(function (t) { return `        <p>${t}</p>`; }).join("\n");
      return `        <h2>${h}</h2>\n${ps}`;
    })
    .join("\n");
}

function renderFeatures(features) {
  var items = features
    .map(function (f) {
      return `          <li><b>${f[0]}</b><span>${f[1]}</span></li>`;
    })
    .join("\n");
  return `        <h2>Highlights</h2>\n        <ul class="feature-list">\n${items}\n        </ul>`;
}

function renderCta(cta) {
  return cta
    .map(function (c) {
      var cls = c.primary ? "btn btn-primary" : "btn";
      return `        <a class="${cls}" href="${c.href}" target="_blank" rel="noopener"><span>${c.label}</span></a>`;
    })
    .join("\n");
}

function renderPager(d) {
  var prev = d.prev
    ? `    <a href="/work/${d.prev.slug}">
      <span class="p-dir">Previous</span>
      <span class="p-name">${d.prev.name}</span>
    </a>`
    : `    <a href="/work">
      <span class="p-dir">Index</span>
      <span class="p-name">All work</span>
    </a>`;
  var next = d.next
    ? `    <a class="next" href="/work/${d.next.slug}">
      <span class="p-dir">Next</span>
      <span class="p-name">${d.next.name}</span>
    </a>`
    : `    <a class="next" href="/#contact">
      <span class="p-dir">Next</span>
      <span class="p-name">Get in touch</span>
    </a>`;
  return `  <nav class="pager wrap" aria-label="More work">\n${prev}\n${next}\n  </nav>`;
}

function buildDetail(slug, d) {
  var webp = d.img.replace(/\.png$/i, ".webp");
  var ld = `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
      { "@type": "ListItem", "position": 2, "name": "Work", "item": "${SITE}/work" },
      { "@type": "ListItem", "position": 3, "name": "${d.name}", "item": "${SITE}/work/${slug}" }
    ]
  }
  </script>`;

  var page = head({
    title: d.name + " · Vaibhav Lalwani",
    ogTitle: d.name + " · case study",
    desc: d.sub,
    canonical: "/work/" + slug,
    ogImage: d.img,
    extraLD: ld,
  });

  page += `
  <main id="main">
    <nav class="breadcrumb wrap" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="sep">/</span>
      <a href="/work">Work</a>
      <span class="sep">/</span>
      <span class="here">${d.name}</span>
    </nav>

    <header class="detail-hero wrap">
      <p class="detail-kicker">${d.kicker}</p>
      <h1 class="detail-title">${d.title}</h1>
      <p class="detail-sub">${d.sub}</p>
      <div class="detail-cta">
${renderCta(d.cta)}
      </div>
      <figure class="detail-figure">
        <picture>
          <source srcset="${webp}" type="image/webp" />
          <img src="${d.img}" alt="${d.imgAlt}" width="1440" height="810" loading="eager" decoding="async" />
        </picture>
      </figure>
    </header>

    <section class="section wrap">
      <div class="detail-grid">
        <aside class="detail-aside">
${renderMeta(d.meta)}
        </aside>
        <div class="prose">
${renderProse(d.prose)}
${renderFeatures(d.features)}
        </div>
      </div>
    </section>

${renderPager(d)}
  </main>
`;
  page += foot();
  return page;
}

/* ============================================================
   WRITE
   ============================================================ */
function write(rel, content) {
  var full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  var dashes = (content.match(/—/g) || []).length;
  console.log(
    (dashes ? "  [!] " + dashes + " em-dash  " : "  ok       ") + rel + "  (" + content.length + " bytes)"
  );
  return dashes;
}

function main() {
  console.log("Building portfolio subpages...");
  var bad = 0;
  bad += write("work.html", buildArchive());
  Object.keys(DETAILS).forEach(function (slug) {
    bad += write(path.join("work", slug + ".html"), buildDetail(slug, DETAILS[slug]));
  });
  console.log(bad ? "DONE with " + bad + " em-dashes (FIX)" : "DONE, 0 em-dashes.");
}

main();
