// Render Vaibhav Lalwani resume — UK A4, one page, ATS-safe.
// Top 4 selected projects: apex, Praxon, Cogniloop, MCP Marketplace.
import puppeteer from "puppeteer";
import fs from "node:fs/promises";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: white; }
  body {
    font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
    font-size: 9.1pt;
    line-height: 1.27;
    color: #111827;
    padding: 11mm 13mm 10mm;
    letter-spacing: -0.005em;
    -webkit-font-smoothing: antialiased;
  }
  h1 { font-size: 18pt; font-weight: 700; text-align: center; letter-spacing: -0.02em; margin-bottom: 2px; }
  .contact { text-align: center; font-size: 8.5pt; color: #4b5563; margin-bottom: 7px; }
  .contact a { color: #2563eb; text-decoration: none; }
  h2 {
    font-size: 8pt; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
    color: #374151; border-bottom: 1px solid #d1d5db; padding-bottom: 1px;
    margin: 7px 0 4px;
  }
  p { margin: 0 0 3px; }
  ul { list-style: none; margin: 0 0 3px; padding: 0; }
  li { position: relative; padding-left: 11px; margin-bottom: 1.5px; }
  li::before { content: "◦"; position: absolute; left: 0; top: 0; color: #6b7280; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .row strong { font-weight: 600; }
  .row .right { color: #6b7280; font-size: 8.7pt; white-space: nowrap; }
  .role { font-style: italic; color: #4b5563; font-size: 8.9pt; margin-bottom: 2px; }
  .role .right { font-style: normal; }
  .summary, .pub { margin-bottom: 2px; }
  .skill-line { margin-bottom: 2px; }
  .skill-line strong { color: #111827; font-weight: 600; }
  .project { margin-bottom: 4px; }
  .project b { font-weight: 700; color: #111827; }
  .project a { color: #2563eb; text-decoration: none; }
  .edu-row { margin-bottom: 2px; }
</style>
</head>
<body>

<h1>Vaibhav Lalwani</h1>
<div class="contact">
  Liverpool, UK · +44 7544 537 860 ·
  <a href="mailto:vaibhavlalwani26969@gmail.com">vaibhavlalwani26969@gmail.com</a> ·
  <a href="https://vaibhavlalwani.vercel.app">vaibhavlalwani.vercel.app</a> ·
  <a href="https://github.com/vaibhav4046">github.com/vaibhav4046</a> ·
  <a href="https://linkedin.com/in/vaibhav-lalwani">linkedin.com/in/vaibhav-lalwani</a>
</div>

<h2>Summary</h2>
<p class="summary">AI engineer building production language-model systems end-to-end &mdash; inference, retrieval, evaluation harnesses and the front ends that ship them. MSc Advanced Data Science &amp; AI at the University of Liverpool. Author of an open-access preprint on on-controller transformer inference (NEXUS, 2026). Comfortable across the model&ndash;system boundary.</p>

<h2>Publications</h2>
<p class="pub"><b>Lalwani, V.</b> (2026). <i>NEXUS: On-Controller Transformer Inference and Speculative Edge Execution for Console-Wired Latency Parity in Cloud Gaming</i>. Zenodo. DOI: <a href="https://doi.org/10.5281/zenodo.20059414">10.5281/zenodo.20059414</a> · <a href="https://www.researchgate.net/publication/404525159">ResearchGate</a>. Extends the Outatime line (MobiSys 2015) with on-controller transformer inference and speculative edge execution.</p>

<h2>Technical Skills</h2>
<p class="skill-line"><strong>Languages:</strong> Python, TypeScript, JavaScript (ES6+), SQL, HTML, CSS</p>
<p class="skill-line"><strong>AI / ML:</strong> OpenAI, Anthropic / Claude, Gemini, Groq, LangChain, LangSmith, RAG pipelines, prompt engineering, structured outputs, MCP servers, Whisper STT, PyTorch (familiar), transformer inference (NEXUS paper)</p>
<p class="skill-line"><strong>Backend &amp; Data:</strong> FastAPI, Node.js / Express, Postgres, pgvector, Redis, BullMQ, Supabase (RLS), vector search</p>
<p class="skill-line"><strong>Frontend:</strong> React 19, Next.js 15 / 16, Tailwind CSS, Vite, REST + GraphQL, accessibility basics</p>
<p class="skill-line"><strong>DevOps:</strong> Docker, Git, GitHub Actions, Vercel, GCP Cloud Run, AWS, Sentry, PostHog, Jest / Vitest, Playwright, Puppeteer</p>

<h2>Experience</h2>

<div class="row"><strong>Full-Stack / AI Engineer Intern</strong><span class="right">Apr 2026 &ndash; Present</span></div>
<div class="row role"><span>Meta Solution Technologies</span><span class="right">Remote, UK</span></div>
<ul>
  <li>Building an AI-guided admissions platform on Next.js 15 + React 19 + TypeScript. Chat-style guidance flow runs on OpenAI with structured outputs against a Postgres + pgvector knowledge store, served from a Python FastAPI service.</li>
  <li>Wrote auth end-to-end (Google OAuth, magic-link, PKCE) on Supabase, plus a BullMQ + Redis async queue driving document checks, generation jobs and email triggers.</li>
  <li>Shipped a 10-language i18n layer and a dual-theme CSS system so non-engineering teammates roll out copy and translation updates without involving me.</li>
</ul>

<div class="row"><strong>AI Engineer (Freelance)</strong><span class="right">May 2024 &ndash; Jan 2026</span></div>
<div class="row role"><span>Self-Employed</span><span class="right">Remote</span></div>
<ul>
  <li>Designed and shipped 20+ LLM-powered applications for paying clients across SaaS, e-commerce and consulting &mdash; most pairing a React or Next.js front end with a Python service running Claude or OpenAI APIs, structured outputs and a RAG retrieval layer.</li>
  <li>Built longer-running AI agents for lead generation, customer support and data processing. Each project shipped with a README, a walkthrough video and a written hand-off doc.</li>
</ul>

<div class="row"><strong>Software Engineer Intern</strong><span class="right">Jan 2026 &ndash; Apr 2026</span></div>
<div class="row role"><span>Recruit Pilot &mdash; Recruitment Technology</span><span class="right">Remote</span></div>
<ul>
  <li>Built React + TypeScript UI features against a REST API for a recruitment-tech product. Code review and weekly sprint cadence alongside more senior engineers.</li>
</ul>

<h2>Selected Projects</h2>
<p class="project"><b>apex</b> &mdash; autonomous job application engine. CLI that drives real Chrome via Playwright, generates a tailored 1-page resume per job (Puppeteer markdown &rarr; ATS-safe PDF), fills custom LinkedIn Easy Apply questions with an LLM (profile mapping &rarr; Q+A cache &rarr; free-LLM fallback) and submits autonomously until LinkedIn's daily cap. Free LLMs only; pause-on-stuck UX hands off when a required field can't be answered confidently. <a href="https://github.com/vaibhav4046/apex">github.com/vaibhav4046/apex</a></p>

<p class="project"><b>Praxon</b> &mdash; open-source AI agent platform. A Claude Cowork alternative built end-to-end on Next.js 16 + React 19 + TypeScript. Multi-LLM router across free providers (Groq, Cerebras, Gemini, Ollama) with auto-fallback; MCP-native tool layer; 3-schema Postgres design with RLS for tenant isolation; cloud-deployable on Vercel + Supabase. <a href="https://praxon-hazel.vercel.app">Live</a> · <a href="https://github.com/vaibhav4046/praxon">Code</a></p>

<p class="project"><b>Cogniloop</b> &mdash; Socratic study tool. Locked-prompt evaluator that grades free-form student answers against a rubric, scores 0&ndash;3 with explanation, tracks concept mastery (weak &rarr; mastered) across sessions. Single-prompt design &mdash; no agent loop, no retrieval &mdash; keeps median latency under one second on Groq Llama 3.3 70B with a Pollinations fallback. Edge runtime, Next.js 16, KaTeX. <a href="https://cogniloop-vaibhav4046s-projects.vercel.app">Live</a> · <a href="https://github.com/vaibhav4046/cogniloop">Code</a></p>

<p class="project"><b>MCP Marketplace</b> &mdash; registry of 800+ Model Context Protocol servers. Daily auto-sync from Glama and the official MCP repo, normalised tool schemas, one-line install snippets for Claude Desktop, Cursor and Claude Code. Next.js 15 RSC, Cmd-K palette, dynamic OG cards, full keyboard navigation. <a href="https://mcp-hub-registry.vercel.app">Live</a> · <a href="https://github.com/vaibhav4046/mcp-marketplace">Code</a></p>

<h2>Education</h2>
<div class="row edu-row"><strong>University of Liverpool</strong> &middot; <i>MSc Advanced Data Science &amp; Artificial Intelligence</i><span class="right">Jan 2026 &ndash; Jan 2027</span></div>
<div class="row edu-row"><strong>Christ University, Bengaluru</strong> &middot; <i>Bachelor of Computer Applications · CGPA 7.86 / 10</i><span class="right">2022 &ndash; 2025</span></div>

</body>
</html>`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "domcontentloaded" });
const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
await fs.writeFile("Vaibhav_Lalwani_Resume.pdf", pdf);
await browser.close();
console.log("✓ Vaibhav_Lalwani_Resume.pdf (A4, one page)");
