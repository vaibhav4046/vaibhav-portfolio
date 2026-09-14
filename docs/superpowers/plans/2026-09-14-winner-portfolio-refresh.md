# Winner Portfolio Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote Yuzu and the newest shipped systems across the portfolio and GitHub profile while presenting only verified winner/participation outcomes and no prize values.

**Architecture:** Preserve the static portfolio's existing HTML/CSS architecture. Inject one new homepage section, prepend four cards to the archive, update existing winner labels, and add a scoped CSS block. Replace the GitHub profile README with the same evidence-first hierarchy.

**Tech Stack:** Static HTML/CSS/JavaScript, Python 3 standard library verification, GitHub profile Markdown.

**Spec:** `docs/superpowers/specs/2026-09-14-winner-portfolio-refresh-design.md`

## Global Constraints

- Do not publish cash prizes, prize pools, SharedOS credit values, dollar values or a monetary winnings total.
- Yuzu must be presented as SharedOS Hackathon Judges' Pick.
- Leverage must be presented as RocketRide × SCU Buildathon winner.
- Preserve existing claims unless the refresh explicitly supersedes them.
- Keep the existing black/orange portfolio identity and responsive behavior.

---

### Task 1: Portfolio winner and newest-work surface

**Files:**
- Modify: `index.html`
- Modify: `work.html`
- Modify: `style.css`
- Test: `scripts/test-portfolio-refresh.py`

**Interfaces:**
- Consumes: existing `.section`, `.wrap`, `.catalog`, `.cat-card`, `.btn` and typography classes.
- Produces: `#latest` homepage section and `.latest-*` styling, plus four new leading archive cards.

- [ ] **Step 1: Write the failing test**

Create a standard-library Python check that requires `Yuzu`, `VYREALM`, `ReqKeeper`, `VIVA`, `Judges' Pick`, `RocketRide × SCU Buildathon · Winner`, all expected public links, archive count `37 builds`, and the `latest-grid` CSS selector; it must reject prize-dollar/value wording in the new section and GitHub-profile copy.

- [ ] **Step 2: Run test to verify it fails**

Run: `python scripts/test-portfolio-refresh.py`
Expected: non-zero exit because the four newest projects and latest section do not exist yet.

- [ ] **Step 3: Implement the minimal portfolio refresh**

Insert the latest-work section before Selected work, update hero win stats and Leverage winner labels, prepend four archive cards, increment existing archive card numbers by four, update archive total to 37 and append the scoped premium CSS.

- [ ] **Step 4: Run test to verify it passes**

Run: `python scripts/test-portfolio-refresh.py`
Expected: `portfolio refresh checks: PASS`.

- [ ] **Step 5: Verify HTML parseability**

Run: `python -m html.parser index.html >/dev/null && python -m html.parser work.html >/dev/null`
Expected: exit 0.

### Task 2: GitHub profile refresh

**Files:**
- Modify: `README.md` in `vaibhav4046/vaibhav4046`

**Interfaces:**
- Consumes: public project URLs and winner labels from the portfolio spec.
- Produces: Yuzu-first profile README with winner ledger and newest systems table.

- [ ] **Step 1: Replace the README on a feature branch** with Yuzu as newest flagship, a four-win ledger, and VYREALM/ReqKeeper/VIVA in selected systems.
- [ ] **Step 2: Search the resulting README** for `Yuzu`, `VYREALM`, `ReqKeeper`, `VIVA`, `Judges' Pick`, `RocketRide × SCU Buildathon` and verify prize-value language is absent.
- [ ] **Step 3: Review the branch diff** before merge.

### Task 3: Release

**Files:**
- No new production files.

- [ ] **Step 1:** Review portfolio branch diff and verification output.
- [ ] **Step 2:** Merge portfolio PR to `main`.
- [ ] **Step 3:** Merge profile PR to `main`.
- [ ] **Step 4:** Fetch both main branches and confirm the expected winner-only copy is present.