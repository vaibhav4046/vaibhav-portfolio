// Vaibhav Lalwani — Resume. UK A4, one page. Minimal, neat, professional.
import puppeteer from "puppeteer";
import fs from "node:fs/promises";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #ffffff; }
  body {
    font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
    font-size: 8.7pt;
    line-height: 1.28;
    color: #111111;
    padding: 11mm 14mm 9mm;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "ss01", "cv11", "kern";
  }
  a { color: #0b66c2; text-decoration: none; }

  /* Header */
  .name {
    font-size: 19pt;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #0a0a0a;
  }
  .role-line {
    font-size: 9.5pt;
    color: #444;
    margin-top: 1px;
    letter-spacing: -0.005em;
  }
  .contact {
    font-size: 8.6pt;
    color: #6b7280;
    margin-top: 6px;
    letter-spacing: 0.005em;
  }
  .contact a { color: #0b66c2; }
  .contact .sep { color: #d1d5db; margin: 0 6px; }
  .availability {
    font-size: 8.5pt;
    color: #111;
    margin-top: 5px;
    padding: 4px 0 0;
    letter-spacing: 0.01em;
  }
  .availability b { font-weight: 600; }
  .availability .pill {
    display: inline-block;
    padding: 1px 8px;
    border: 1px solid #d1d5db;
    border-radius: 999px;
    margin-right: 4px;
    font-size: 8.1pt;
    color: #374151;
  }

  /* Section labels */
  h2 {
    font-size: 7.3pt;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #6b7280;
    margin: 7px 0 3px;
  }

  /* Generic */
  p { margin: 0 0 4px; }
  ul { list-style: none; margin: 0 0 3px; padding: 0; }
  li {
    position: relative;
    padding-left: 10px;
    margin-bottom: 1.5px;
    color: #1f2937;
  }
  li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 7.5px;
    width: 3px;
    height: 3px;
    background: #9ca3af;
    border-radius: 50%;
  }

  /* Headline summary */
  .summary {
    color: #1f2937;
    margin-bottom: 2px;
  }

  /* Two-column rows */
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .row .right {
    color: #6b7280;
    font-size: 8.7pt;
    white-space: nowrap;
  }
  .role-meta {
    font-size: 8.9pt;
    color: #4b5563;
    margin-bottom: 2px;
  }
  .role-meta i { font-style: italic; }

  /* Skills */
  .skill {
    display: grid;
    grid-template-columns: 70px 1fr;
    gap: 8px;
    margin-bottom: 1px;
  }
  .skill .label {
    color: #6b7280;
    font-size: 7.6pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-top: 1px;
  }
  .skill .val { color: #1f2937; }

  /* Publication / project block */
  .pub, .project {
    margin-bottom: 3px;
    color: #1f2937;
  }
  .pub b, .project b {
    color: #0a0a0a;
    font-weight: 700;
  }
  .pub .links a, .project .links a {
    margin-right: 1px;
  }

  /* Tight column for experience block */
  .exp { margin-bottom: 4px; }
  .exp .row strong { font-weight: 700; color: #0a0a0a; }
</style>
</head>
<body>

<div class="name">Vaibhav Lalwani</div>
<div class="role-line">AI &amp; Full-Stack Engineer · MSc Advanced Data Science &amp; AI, University of Liverpool</div>
<div class="contact">
  Liverpool, UK
  <span class="sep">·</span> +44 7544 537 860
  <span class="sep">·</span> <a href="mailto:vaibhavlalwani26969@gmail.com">vaibhavlalwani26969@gmail.com</a>
  <span class="sep">·</span> <a href="https://vaibhavlalwani.vercel.app">vaibhavlalwani.vercel.app</a>
  <span class="sep">·</span> <a href="https://github.com/vaibhav4046">github.com/vaibhav4046</a>
  <span class="sep">·</span> <a href="https://linkedin.com/in/vaibhav-lalwani">linkedin.com/in/vaibhav-lalwani</a>
</div>
<div class="availability">
  <b>Open to:</b>
  <span class="pill">Full-time</span><span class="pill">Part-time</span><span class="pill">Contract</span><span class="pill">Remote</span><span class="pill">Hybrid</span><span class="pill">On-site</span>
</div>

<h2>Profile</h2>
<p class="summary">AI engineer building production language-model systems end-to-end — inference, retrieval, evaluation harnesses and the front ends that ship them. Comfortable across the model–system boundary. Author of an open-access preprint on on-controller transformer inference (NEXUS, 2026). Two years freelancing 20+ LLM-powered apps for paying clients on Claude, OpenAI and LangChain.</p>

<h2>Publication</h2>
<p class="pub"><b>Lalwani, V.</b> (2026). <i>NEXUS: On-Controller Transformer Inference and Speculative Edge Execution for Console-Wired Latency Parity in Cloud Gaming.</i> Zenodo. DOI <a href="https://doi.org/10.5281/zenodo.20059414">10.5281/zenodo.20059414</a> · <a href="https://www.researchgate.net/publication/404525159">ResearchGate</a>. Extends the Outatime line (MobiSys 2015) with on-controller transformer inference and speculative edge execution.</p>

<h2>Skills</h2>
<div class="skill"><div class="label">Languages</div><div class="val">Python · TypeScript · JavaScript (ES6+) · SQL · HTML · CSS</div></div>
<div class="skill"><div class="label">AI / ML</div><div class="val">OpenAI · Anthropic / Claude · Gemini · Groq · LangChain · LangSmith · RAG · structured outputs · MCP servers · Whisper STT · PyTorch · transformer inference</div></div>
<div class="skill"><div class="label">Backend</div><div class="val">FastAPI · Node.js / Express · Postgres · pgvector · Redis · BullMQ · Supabase (RLS) · vector search</div></div>
<div class="skill"><div class="label">Frontend</div><div class="val">React 19 · Next.js 15 / 16 · Tailwind CSS · Vite · REST + GraphQL · accessibility</div></div>
<div class="skill"><div class="label">DevOps</div><div class="val">Docker · GitHub Actions · Vercel · GCP Cloud Run · AWS · Sentry · PostHog · Jest / Vitest · Playwright · Puppeteer</div></div>

<h2>Experience</h2>

<div class="exp">
  <div class="row"><strong>Full-Stack / AI Engineer Intern · Meta Solution Technologies</strong><span class="right">Apr 2026 – Present</span></div>
  <div class="role-meta"><i>Remote, UK</i></div>
  <ul>
    <li>Building an AI-guided admissions platform on Next.js 15 + React 19 + TypeScript. Chat-style guidance flow on OpenAI with structured outputs, served from a Python FastAPI service against Postgres + pgvector.</li>
    <li>Wrote auth end-to-end (Google OAuth, magic-link, PKCE) on Supabase, plus a BullMQ + Redis async queue driving document checks, generation jobs and email triggers.</li>
    <li>Shipped a 10-language i18n layer and a dual-theme CSS system so non-engineering teammates roll out copy and translation updates without engineering involvement.</li>
  </ul>
</div>

<div class="exp">
  <div class="row"><strong>AI Engineer · Freelance / Self-employed</strong><span class="right">May 2024 – Jan 2026</span></div>
  <div class="role-meta"><i>Remote</i></div>
  <ul>
    <li>Designed and shipped 20+ LLM-powered applications for paying clients across SaaS, e-commerce and consulting. Most pair a React or Next.js front end with a Python service running Claude or OpenAI APIs, structured outputs and a RAG retrieval layer.</li>
    <li>Built longer-running AI agents for lead generation, customer support and data processing. Each project shipped with a README, a walkthrough video and a written hand-off doc.</li>
  </ul>
</div>

<div class="exp">
  <div class="row"><strong>Software Engineer Intern · Recruit Pilot</strong><span class="right">Jan 2026 – Apr 2026</span></div>
  <div class="role-meta"><i>Recruitment Technology · Remote</i></div>
  <ul>
    <li>Built React + TypeScript UI features against a REST API. Code review and weekly sprint cadence alongside more senior engineers.</li>
  </ul>
</div>

<h2>Selected Projects</h2>

<p class="project"><b>apex</b> — autonomous job application engine. CLI driving real Chrome via Playwright, generates a tailored 1-page resume per job (Puppeteer markdown → ATS-safe PDF), fills custom LinkedIn Easy Apply questions with an LLM (profile mapping → Q+A cache → free-LLM fallback), submits autonomously until LinkedIn's daily cap. Free LLMs only. <span class="links"><a href="https://github.com/vaibhav4046/apex">github.com/vaibhav4046/apex</a></span></p>

<p class="project"><b>Praxon</b> — open-source AI agent platform. A Claude Cowork alternative on Next.js 16 + React 19 + TypeScript. Multi-LLM router across free providers (Groq, Cerebras, Gemini, Ollama) with auto-fallback; MCP-native tool layer; 3-schema Postgres + RLS for tenant isolation; cloud-deployable on Vercel + Supabase. <span class="links"><a href="https://praxon-hazel.vercel.app">Live</a> · <a href="https://github.com/vaibhav4046/praxon">Code</a></span></p>

<p class="project"><b>Cogniloop</b> — Socratic study tool. Locked-prompt evaluator grading free-form student answers 0–3 with explanation; tracks concept mastery (weak → mastered) across sessions. Single-prompt design — no agent loop, no retrieval — keeps median latency under one second on Groq Llama 3.3 70B. Edge runtime, Next.js 16, KaTeX. <span class="links"><a href="https://cogniloop-vaibhav4046s-projects.vercel.app">Live</a> · <a href="https://github.com/vaibhav4046/cogniloop">Code</a></span></p>

<p class="project"><b>MCP Marketplace</b> — registry of 800+ Model Context Protocol servers. Daily auto-sync from Glama and the official MCP repo, normalised tool schemas, one-line install snippets for Claude Desktop, Cursor and Claude Code. Next.js 15 RSC, Cmd-K palette, dynamic OG cards. <span class="links"><a href="https://mcp-hub-registry.vercel.app">Live</a> · <a href="https://github.com/vaibhav4046/mcp-marketplace">Code</a></span></p>

<h2>Education</h2>
<div class="row"><strong>University of Liverpool</strong><span class="right">Jan 2026 – Jan 2027</span></div>
<div class="role-meta"><i>MSc Advanced Data Science &amp; Artificial Intelligence</i></div>
<div class="row" style="margin-top:2px"><strong>Christ University, Bengaluru</strong><span class="right">2022 – 2025</span></div>
<div class="role-meta"><i>Bachelor of Computer Applications · CGPA 8.7 / 10</i></div>

</body>
</html>`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "domcontentloaded" });
const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
await fs.writeFile("Vaibhav_Lalwani_Resume.pdf", pdf);
await browser.close();
console.log("✓ Vaibhav_Lalwani_Resume.pdf (A4, one page, minimal)");
