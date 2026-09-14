from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
WORK = ROOT / "work.html"
STYLE = ROOT / "style.css"

index = INDEX.read_text(encoding="utf-8")
work = WORK.read_text(encoding="utf-8")
style = STYLE.read_text(encoding="utf-8")

if 'id="latest"' in index:
    raise SystemExit("latest section already exists; refusing a duplicate refresh")

latest_section = r'''
    <!-- ===== Latest wins & systems ===== -->
    <section class="section wrap latest-section" id="latest" aria-labelledby="latest-heading">
      <div class="section-head latest-head">
        <span class="section-index"><b>NEW</b> / 2026 build ledger</span>
        <h2 class="section-title" id="latest-heading">Built to ship. <span class="em">Built to win.</span></h2>
        <p class="section-lede">The newest systems in the portfolio: agent markets, model workforces, local creator infrastructure, settlement safety and voice-first learning. Every link below goes to something you can inspect.</p>
      </div>

      <div class="latest-grid">
        <article class="latest-hero reveal">
          <div class="latest-hero-copy">
            <div class="latest-meta">
              <span class="win-chip">🏆 SharedOS Hackathon · Judges’ Pick</span>
              <span class="latest-year">2026</span>
            </div>
            <p class="latest-overline">Newest flagship · Agent commerce</p>
            <h3>Yuzu</h3>
            <p class="latest-display">The market where <span>agents hire agents.</span></p>
            <p class="latest-desc">Give Yuzu a goal and a budget. Agents discover sellers, bid, prove capability, negotiate, contract, execute, verify and settle, with signed receipts recording exactly what happened and which permissions were used.</p>
            <div class="latest-flow" aria-label="Yuzu transaction flow">
              <span>discover</span><i>→</i><span>bid</span><i>→</i><span>prove</span><i>→</i><span>negotiate</span><i>→</i><span>contract</span><i>→</i><span>execute</span><i>→</i><span>verify</span><i>→</i><span>settle</span>
            </div>
            <p class="latest-actions">
              <a class="btn btn-primary" href="https://yuzu-market.vercel.app/" target="_blank" rel="noopener">Open Yuzu <span aria-hidden="true">↗</span></a>
              <a class="btn" href="https://github.com/vaibhav4046/yuzu" target="_blank" rel="noopener">Source <span aria-hidden="true">↗</span></a>
            </p>
          </div>
          <div class="latest-orbit" aria-hidden="true">
            <div class="orbit-ring orbit-ring-a"></div>
            <div class="orbit-ring orbit-ring-b"></div>
            <div class="orbit-core">Y</div>
            <span class="orbit-node node-a">BUY</span>
            <span class="orbit-node node-b">PROVE</span>
            <span class="orbit-node node-c">SETTLE</span>
          </div>
        </article>

        <article class="latest-card reveal">
          <div class="latest-card-top"><span class="latest-card-index">02</span><span class="latest-card-state">LOCAL-FIRST</span></div>
          <h3>VYREALM</h3>
          <p>A Windows creator studio that turns footage and ideas into editable video projects. Timeline edits, captions, narration, local media and real exports stay on the machine, with optional MCP and model workflows layered on top.</p>
          <div class="latest-proof"><span>Verified</span><strong>Installed desktop editing and export workflow</strong></div>
          <p class="latest-links"><a href="https://github.com/vaibhav4046/VYREALM" target="_blank" rel="noopener">Source ↗</a></p>
        </article>

        <article class="latest-card reveal">
          <div class="latest-card-top"><span class="latest-card-index">03</span><span class="latest-card-state">PAYMENT SAFETY</span></div>
          <h3>ReqKeeper</h3>
          <p>Exactly-once settlement for Request Network obligations through KeeperHub. Retries are allowed; duplicate money movement is not. The proof includes independent processes racing the same obligation and live Sepolia settlement evidence.</p>
          <div class="latest-proof"><span>Invariant</span><strong>1 invoice · many workers · 1 payment</strong></div>
          <p class="latest-links"><a href="https://reqkeeper.vercel.app" target="_blank" rel="noopener">Live ↗</a><a href="https://github.com/vaibhav4046/reqkeeper" target="_blank" rel="noopener">Source ↗</a></p>
        </article>

        <article class="latest-card latest-card-wide reveal">
          <div class="latest-card-top"><span class="latest-card-index">04</span><span class="latest-card-state">VOICE AI</span></div>
          <h3>VIVA</h3>
          <p>Study out loud. VIVA transcribes what a learner says, identifies the gap, grounds the correction in source material and brings the weak concept back for active recall. Built for AssemblyAI Voice Hackathon Week.</p>
          <div class="latest-proof"><span>Voice loop</span><strong>Dictation + live streaming + source-grounded recall</strong></div>
          <p class="latest-links"><a href="https://viva-five-murex.vercel.app" target="_blank" rel="noopener">Live ↗</a><a href="https://github.com/vaibhav4046/viva" target="_blank" rel="noopener">Source ↗</a></p>
        </article>
      </div>
    </section>

'''

index = index.replace(
    '    <!-- ===== Selected work ===== -->',
    latest_section + '    <!-- ===== Selected work ===== -->',
    1,
)

index = re.sub(
    r'<dl class="hero-stats">.*?</dl>',
    '''<dl class="hero-stats">
        <div><dt>4×</dt><dd>Hackathon wins · 2026</dd></div>
        <div><dt>Judges’ Pick</dt><dd>SharedOS Hackathon · Yuzu</dd></div>
        <div><dt>Winner</dt><dd>RocketRide × SCU Buildathon · Leverage</dd></div>
        <div><dt>Finalist</dt><dd>Wikithon · 2026</dd></div>
      </dl>''',
    index,
    count=1,
    flags=re.S,
)
index = index.replace(
    '<span class="fig-tag">RocketRide × SCU Buildathon</span>',
    '<span class="fig-tag fig-win">Winner · RocketRide × SCU Buildathon</span>',
    1,
)
index = index.replace(
    '<span class="work-kicker">RocketRide × SCU Buildathon · 2026</span>',
    '<span class="work-kicker">RocketRide × SCU Buildathon · Winner · 2026</span>',
    1,
)

# Existing archive numbers move down by four; new cards occupy 01-04.
def bump_number(match):
    return f'<span class="cat-num">{int(match.group(1)) + 4:02d}</span>'

work = re.sub(r'<span class="cat-num">(\d+)</span>', bump_number, work)
work = work.replace('33 builds, newest first:', '37 builds, newest first:', 1)

new_archive_cards = r'''
        <article class="cat-card reveal cat-lead latest-archive-card">
          <div class="cat-media cat-media-signal yuzu-signal"><span class="signal-kicker">JUDGES’ PICK</span><span class="signal-word">YUZU</span><span class="cat-num">01</span></div>
          <div class="cat-body">
            <p class="cat-tag">Agent commerce · SharedOS · Judges’ Pick</p>
            <h2 class="cat-name"><a href="https://yuzu-market.vercel.app/" target="_blank" rel="noopener">Yuzu<span class="cat-go" aria-hidden="true">&#8599;</span></a></h2>
            <p class="cat-desc">The market where agents hire agents. A goal and budget become discovery, competing bids, capability proof, negotiation, a scoped contract, verified delivery and settlement with signed receipts.</p>
            <p class="cat-links"><a href="https://yuzu-market.vercel.app/" target="_blank" rel="noopener">Live</a><a href="https://github.com/vaibhav4046/yuzu" target="_blank" rel="noopener">Source</a></p>
          </div>
        </article>
        <article class="cat-card reveal latest-archive-card">
          <div class="cat-media cat-media-signal vyrealm-signal"><span class="signal-kicker">LOCAL CREATOR OS</span><span class="signal-word">VYREALM</span><span class="cat-num">02</span></div>
          <div class="cat-body">
            <p class="cat-tag">Creator tools · Local-first</p>
            <h2 class="cat-name"><a href="https://github.com/vaibhav4046/VYREALM" target="_blank" rel="noopener">VYREALM<span class="cat-go" aria-hidden="true">&#8599;</span></a></h2>
            <p class="cat-desc">A Windows creator studio for turning footage and ideas into editable projects with timeline editing, captions, narration, local storage, real video export and optional MCP/model workflows.</p>
            <p class="cat-links"><a href="https://github.com/vaibhav4046/VYREALM" target="_blank" rel="noopener">Source</a></p>
          </div>
        </article>
        <article class="cat-card reveal latest-archive-card">
          <div class="cat-media cat-media-signal reqkeeper-signal"><span class="signal-kicker">EXACTLY ONCE</span><span class="signal-word">REQKEEPER</span><span class="cat-num">03</span></div>
          <div class="cat-body">
            <p class="cat-tag">Payments · Agent safety</p>
            <h2 class="cat-name"><a href="https://reqkeeper.vercel.app" target="_blank" rel="noopener">ReqKeeper<span class="cat-go" aria-hidden="true">&#8599;</span></a></h2>
            <p class="cat-desc">Exactly-once settlement for Request Network obligations through KeeperHub. Concurrent workers can retry the plan without retrying the money.</p>
            <p class="cat-links"><a href="https://reqkeeper.vercel.app" target="_blank" rel="noopener">Live</a><a href="https://github.com/vaibhav4046/reqkeeper" target="_blank" rel="noopener">Source</a></p>
          </div>
        </article>
        <article class="cat-card reveal latest-archive-card">
          <div class="cat-media cat-media-signal viva-signal"><span class="signal-kicker">VOICE-FIRST STUDY</span><span class="signal-word">VIVA</span><span class="cat-num">04</span></div>
          <div class="cat-body">
            <p class="cat-tag">Voice AI · AssemblyAI Hackathon</p>
            <h2 class="cat-name"><a href="https://viva-five-murex.vercel.app" target="_blank" rel="noopener">VIVA<span class="cat-go" aria-hidden="true">&#8599;</span></a></h2>
            <p class="cat-desc">Study out loud. Dictation and live streaming turn spoken uncertainty into source-grounded feedback and an active-recall queue for what the learner actually missed.</p>
            <p class="cat-links"><a href="https://viva-five-murex.vercel.app" target="_blank" rel="noopener">Live</a><a href="https://github.com/vaibhav4046/viva" target="_blank" rel="noopener">Source</a></p>
          </div>
        </article>
'''

catalog_anchor = '      <div class="catalog" aria-label="Project catalogue">\n'
if catalog_anchor not in work:
    raise SystemExit("project catalogue anchor not found")
work = work.replace(catalog_anchor, catalog_anchor + new_archive_cards, 1)

css = r'''

/* ===== 2026 latest wins / newest systems ===== */
.latest-section { position: relative; overflow: clip; }
.latest-section::before { content: ""; position: absolute; width: 38rem; height: 38rem; right: -18rem; top: 4rem; border-radius: 50%; background: radial-gradient(circle, rgba(255,106,26,.13), rgba(255,106,26,0) 68%); pointer-events: none; }
.latest-head { position: relative; z-index: 1; }
.latest-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; position: relative; z-index: 1; }
.latest-hero { grid-column: 1 / -1; min-height: 31rem; display: grid; grid-template-columns: minmax(0,1.45fr) minmax(18rem,.7fr); gap: 2rem; padding: clamp(1.5rem,4vw,3.2rem); border: 1px solid rgba(255,106,26,.38); border-radius: 1.2rem; background: radial-gradient(circle at 82% 28%, rgba(255,106,26,.16), transparent 30%), linear-gradient(135deg, rgba(255,255,255,.045), rgba(255,255,255,.012)); box-shadow: inset 0 1px rgba(255,255,255,.05), 0 30px 90px rgba(0,0,0,.28); }
.latest-meta, .latest-card-top, .latest-actions, .latest-links { display: flex; align-items: center; gap: .7rem; flex-wrap: wrap; }
.win-chip { display: inline-flex; align-items: center; border: 1px solid rgba(255,106,26,.55); border-radius: 999px; padding: .48rem .72rem; color: #ffd7bf; background: rgba(255,106,26,.09); font: 650 .72rem/1.2 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing: .06em; text-transform: uppercase; }
.latest-year, .latest-card-state, .latest-card-index, .latest-overline { color: #8f8f8f; font: 600 .72rem/1.2 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing: .08em; text-transform: uppercase; }
.latest-overline { margin: 3.5rem 0 .8rem; color: #ff8b4d; }
.latest-hero h3 { margin: 0; font-size: clamp(4rem,10vw,8.5rem); line-height: .82; letter-spacing: -.075em; }
.latest-display { margin: 1.4rem 0 .75rem; max-width: 19ch; font-size: clamp(1.45rem,3vw,2.3rem); line-height: 1.04; letter-spacing: -.04em; }
.latest-display span { color: #ff6a1a; }
.latest-desc { max-width: 62ch; color: #b9b9b7; line-height: 1.65; }
.latest-flow { display: flex; gap: .45rem; align-items: center; flex-wrap: wrap; margin: 1.5rem 0 1.7rem; font: 600 .68rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing: .055em; text-transform: uppercase; color: #a8a8a6; }
.latest-flow span { border: 1px solid rgba(255,255,255,.1); padding: .48rem .58rem; border-radius: .35rem; background: rgba(255,255,255,.025); }
.latest-flow i { color: #ff6a1a; font-style: normal; }
.latest-orbit { min-height: 24rem; position: relative; display: grid; place-items: center; }
.orbit-core { position: relative; z-index: 3; width: 6.5rem; height: 6.5rem; border-radius: 50%; display: grid; place-items: center; background: #ff6a1a; color: #080808; font-size: 3.4rem; font-weight: 850; box-shadow: 0 0 65px rgba(255,106,26,.36); }
.orbit-ring { position: absolute; border: 1px solid rgba(255,106,26,.27); border-radius: 50%; }
.orbit-ring-a { width: 15rem; height: 15rem; }
.orbit-ring-b { width: 23rem; height: 23rem; border-color: rgba(255,255,255,.1); }
.orbit-node { position: absolute; z-index: 2; padding: .4rem .52rem; border: 1px solid rgba(255,255,255,.13); border-radius: .35rem; background: #0b0b0b; color: #c9c9c7; font: 650 .62rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing: .09em; }
.node-a { transform: translate(-7.2rem,-6.5rem); } .node-b { transform: translate(8.1rem,-2.2rem); } .node-c { transform: translate(-1rem,9.6rem); }
.latest-card { padding: clamp(1.4rem,3vw,2rem); border: 1px solid rgba(255,255,255,.09); border-radius: 1rem; background: linear-gradient(145deg, rgba(255,255,255,.036), rgba(255,255,255,.012)); min-height: 21rem; display: flex; flex-direction: column; }
.latest-card-wide { grid-column: 1 / -1; min-height: auto; }
.latest-card-top { justify-content: space-between; }
.latest-card h3 { margin: 2.6rem 0 .8rem; font-size: clamp(2rem,4vw,3.5rem); letter-spacing: -.055em; }
.latest-card > p:not(.latest-links) { color: #adadab; line-height: 1.6; max-width: 64ch; }
.latest-proof { margin-top: auto; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,.07); display: grid; gap: .35rem; }
.latest-proof span { color: #ff8b4d; font: 650 .68rem/1.2 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing: .08em; text-transform: uppercase; }
.latest-proof strong { font-size: .92rem; font-weight: 600; }
.latest-links { margin: 1.1rem 0 0; }
.latest-links a { color: #f4f4f2; text-decoration: none; border-bottom: 1px solid rgba(255,106,26,.45); padding-bottom: .16rem; }
.cat-media-signal { position: relative; min-height: 16rem; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; padding: 1.35rem; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,.07); }
.cat-media-signal::before { content: ""; position: absolute; inset: -30%; background: radial-gradient(circle at 65% 35%, rgba(255,106,26,.28), transparent 36%); }
.signal-kicker, .signal-word { position: relative; z-index: 1; }
.signal-kicker { color: #ff9b64; font: 650 .65rem/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing: .12em; }
.signal-word { margin-top: .35rem; color: #f4f4f2; font-weight: 850; font-size: clamp(2.8rem,6vw,5.2rem); line-height: .9; letter-spacing: -.07em; }
.vyrealm-signal::before { background: radial-gradient(circle at 65% 35%, rgba(122,94,255,.25), transparent 36%); }
.reqkeeper-signal::before { background: radial-gradient(circle at 65% 35%, rgba(58,205,163,.22), transparent 36%); }
.viva-signal::before { background: radial-gradient(circle at 65% 35%, rgba(79,142,255,.24), transparent 36%); }
@media (max-width: 820px) { .latest-grid { grid-template-columns: 1fr; } .latest-hero { grid-template-columns: 1fr; } .latest-orbit { min-height: 18rem; } .orbit-ring-b { width: 18rem; height: 18rem; } .latest-card-wide { grid-column: auto; } }
@media (max-width: 520px) { .latest-hero { padding: 1.25rem; } .latest-overline { margin-top: 2.2rem; } .latest-hero h3 { font-size: 4.2rem; } .latest-flow i { display: none; } .latest-orbit { min-height: 14rem; } .orbit-ring-a { width: 11rem; height: 11rem; } .orbit-ring-b { width: 15rem; height: 15rem; } .node-a { transform: translate(-5.4rem,-4.7rem); } .node-b { transform: translate(5.7rem,-1.4rem); } .node-c { transform: translate(-.6rem,6.2rem); } }
'''

if '.latest-grid' in style:
    raise SystemExit("latest CSS already exists; refusing duplicate styles")
style = style.rstrip() + css + "\n"

INDEX.write_text(index, encoding="utf-8")
WORK.write_text(work, encoding="utf-8")
STYLE.write_text(style, encoding="utf-8")
print("portfolio refresh applied")
