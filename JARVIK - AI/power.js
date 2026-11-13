/* ═══════════════════════════════════════════════════════════════════
   JARVIK BOOST PACK (power.js)
   Cinematic FX · Intelligence systems · Agent Studio · Power tools
   Hooks into core via  window.JV  (patched into script.js send pipeline)
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  if (window.JV) return;
  const $  = id => document.getElementById(id);
  const $$ = (s, r = document) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const today = () => new Date().toISOString().slice(0, 10);
  const REACTOR = `<svg class="reactor" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="38" stroke="currentColor" stroke-width="5" stroke-dasharray="24.5 5.3" stroke-dashoffset="2.65"/><path d="M18 26H82L50 80Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M30.8 33.2H69.2L50 65.6Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M40.4 38.6H59.6L50 54.8Z" fill="currentColor"/></svg>`;

  /* ── settings store ── */
  const S_KEY = "jv_boost";
  const DEF = { boot: true, crt: false, accent: "cyan", sfx: 0.6, wake: null, voiceOnly: false, autoRoute: false, routeCode: "deepseek/deepseek-chat-v3.1:free", trace: true, pod: true, notify: false, trail: true, ghosts: true, empty: true, demo: true, themeAuto: false, dial: 2 };
  let S = (() => { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(S_KEY) || "{}")); } catch (e) { return Object.assign({}, DEF); } })();
  const jvSave = () => { try { localStorage.setItem(S_KEY, JSON.stringify(S)); } catch (e) {} };

  /* ── memory / docs stores ── */
  const jvMemAll = () => { try { return JSON.parse(localStorage.getItem("jv_memory") || "[]"); } catch (e) { return []; } };
  const jvMemSet = a => { try { localStorage.setItem("jv_memory", JSON.stringify(a.slice(-50))); } catch (e) {} };
  const jvDocsAll = () => { try { return JSON.parse(localStorage.getItem("jv_docs") || "[]"); } catch (e) { return []; } };
  const jvDocsSet = a => { try { localStorage.setItem("jv_docs", JSON.stringify(a.slice(-8))); } catch (e) {} };

  const ACCENTS = { cyan: ["#35d6e8", "#7c8cff"], violet: ["#a78bfa", "#f472b6"], amber: ["#fbbf24", "#f97316"], emerald: ["#34d399", "#22d3ee"], rose: ["#fb7185", "#f59e0b"], ice: ["#93c5fd", "#38bdf8"] };
  function applyAccent() {
    const a = ACCENTS[S.accent] || ACCENTS.cyan;
    document.documentElement.style.setProperty("--jv-a1", a[0]);
    document.documentElement.style.setProperty("--jv-a2", a[1]);
  }

  /* ── toast / modal frames ── */
  function jvToast(msg, ms) {
    const t = document.createElement("div"); t.className = "jv-toast"; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 500); }, ms || 2600);
  }
  function jvModal(id, title, bodyHtml) {
    let old = $(id); if (old) old.remove();
    const ov = document.createElement("div"); ov.id = id; ov.className = "jv-modal hidden";
    ov.innerHTML = `<div class="jv-mcard"><div class="jv-mhead"><span class="jv-mtitle">${title}</span><button class="jv-mclose" aria-label="Close">✕</button></div><div class="jv-mbody">${bodyHtml}</div></div>`;
    document.body.appendChild(ov);
    ov.querySelector(".jv-mclose").onclick = () => ov.classList.add("hidden");
    ov.addEventListener("mousedown", e => { if (e.target === ov) ov.classList.add("hidden"); });
    return ov;
  }

  /* ── provider bridge (direct model calls for agents / debate / compare) ── */
  function pcfgRead() { try { return JSON.parse(localStorage.getItem("jarvik_providers") || "{}"); } catch (e) { return {}; } }
  function orKey() { return (localStorage.getItem("jarvik_openrouter_key") || "").trim(); }
  const JV_MODELS = [
    ["meta-llama/llama-3.3-70b-instruct", "Llama 3.3 70B"],
    ["deepseek/deepseek-chat-v3.1:free", "DeepSeek V3.1 (free)"],
    ["google/gemini-2.0-flash-exp:free", "Gemini 2.0 Flash (free)"],
    ["qwen/qwen-2.5-72b-instruct", "Qwen 2.5 72B"],
    ["mistralai/mistral-small-3.2-24b-instruct:free", "Mistral Small 3.2 (free)"]
  ];
  function modelOptions(sel) { return JV_MODELS.map(m => `<option value="${m[0]}"${m[0] === sel ? " selected" : ""}>${m[1]}</option>`).join(""); }
  async function jvChat(messages, opt) {
    opt = opt || {};
    const key = orKey();
    if (!key) throw new Error("No OpenRouter key set yet — click 🔑 API Key in the sidebar.");
    const model = opt.model || localStorage.getItem("jarvik_model") || "meta-llama/llama-3.3-70b-instruct";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key, "HTTP-Referer": location.origin || "https://jarvik.local", "X-Title": "JARVIK AI Boost Pack" },
      body: JSON.stringify({ model, messages, max_tokens: opt.maxTokens || 1000, temperature: opt.temp == null ? 0.7 : opt.temp })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) throw new Error((j.error && j.error.message) || "HTTP " + res.status);
    const c = j.choices && j.choices[0] && j.choices[0].message;
    return (c && (c.content || c.reasoning || "")) || "";
  }

  /* ── tiny sound engine (WebAudio chirps) ── */
  const AU = { ctx: null };
  function chirp(kind) {
    if (!S.sfx || S.sfx <= 0) return;
    try {
      AU.ctx = AU.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = AU.ctx; if (c.state === "suspended") c.resume();
      const t = c.currentTime, G = c.createGain(); G.gain.value = 1; G.connect(c.destination);
      const seq = { send: [[660, 0, .07], [990, .08, .09]], done: [[520, 0, .05], [780, .06, .05], [1040, .12, .09]], err: [[170, 0, .2]], boot: [[523, 0, .09], [659, .1, .09], [880, .2, .09], [1318, .3, .14]], blip: [[1200, 0, .05]], open: [[440, 0, .05], [880, .05, .07]] }[kind] || [[880, 0, .05]];
      seq.forEach(([f, at, d]) => {
        const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = c.createGain(); o.connect(g); g.connect(G);
        o.start(t + at); o.stop(t + at + d + .03);
        g.gain.setValueAtTime(0, t + at);
        g.gain.linearRampToValueAtTime(S.sfx * .22, t + at + .012);
        g.gain.linearRampToValueAtTime(0, t + at + d);
      });
    } catch (e) {}
  }

  /* ── particle FX engine (cursor trail + fusion bursts) ── */
  const FX = { cv: null, ctx: null, P: [], on: false };
  function fxInit() {
    if (FX.cv) return;
    FX.cv = document.createElement("canvas"); FX.cv.id = "jv-fx"; FX.cv.className = "jv-fx-canvas";
    document.body.appendChild(FX.cv);
    FX.ctx = FX.cv.getContext("2d");
    const rs = () => { FX.cv.width = innerWidth; FX.cv.height = innerHeight; };
    rs(); addEventListener("resize", rs);
    if (!FX.on) { FX.on = true; fxLoop(); }
  }
  function fxSpawn(x, y, n, opt) {
    opt = opt || {};
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (opt.speed || 2.2) * (0.4 + Math.random());
      FX.P.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.up || .4), life: 1, dec: (opt.dec || .028), col: opt.col || getComputedStyle(document.documentElement).getPropertyValue("--jv-a1") || "#35d6e8", r: (opt.r || 2.4) * (0.5 + Math.random()) });
    }
    if (FX.P.length > 600) FX.P.splice(0, FX.P.length - 600);
  }
  function fxLoop() {
    FX.ctx.clearRect(0, 0, FX.cv.width, FX.cv.height);
    for (let i = FX.P.length - 1; i >= 0; i--) {
      const p = FX.P[i];
      p.x += p.vx; p.y += p.vy; p.vy += .05; p.life -= p.dec;
      if (p.life <= 0) { FX.P.splice(i, 1); continue; }
      FX.ctx.globalAlpha = Math.max(0, p.life);
      FX.ctx.fillStyle = p.col;
      FX.ctx.beginPath(); FX.ctx.arc(p.x, p.y, p.r * p.life, 0, 7); FX.ctx.fill();
    }
    FX.ctx.globalAlpha = 1;
    requestAnimationFrame(fxLoop);
  }
  /* #14 cursor trail */
  let lastTrail = 0;
  addEventListener("pointermove", e => {
    if (!S.trail || e.pointerType === "touch") return;
    fxInit();
    if (performance.now() - lastTrail < 24) return;
    lastTrail = performance.now();
    fxSpawn(e.clientX, e.clientY, 1, { speed: .6, up: -.6, r: 1.6, dec: .05, col: getComputedStyle(document.documentElement).getPropertyValue("--jv-a1") || "#35d6e8" });
  }, { passive: true });
  /* #15 fusion burst */
  function fusionBurst(el) {
    if (!FX.cv) fxInit();
    const r = el.getBoundingClientRect();
    fxSpawn(r.left + r.width / 2, r.top + r.height / 2, 42, { speed: 3.4, up: .8, r: 2.6, dec: .022 });
  }

  /* ════════════ CORE HOOKS (wired to script.js patches) ════════════ */
  function sysTune(promptText) {
    let s = "";
    const mem = jvMemAll().filter(m => m.text);
    if (mem.length) s += "\n\nUSER MEMORY (persistent facts — use them naturally, never recite):\n" + mem.map(m => "- " + m.text).join("\n");
    const docs = jvDocsAll();
    if (docs.length) {
      s += "\n\nBOOST PACK KNOWLEDGE DOCS:\n";
      docs.slice(-4).forEach(d => { s += `[Doc: "${d.name}"]\n${String(d.content).slice(0, 2600)}\n`; });
    }
    const dial = clamp(parseInt(S.dial, 10) || 2, 0, 4);
    s += "\n\nREPLY STYLE (do not mention): " + ["EXTREME brevity — under 3 sentences, no preamble.", "Concise — short, bullets when helpful.", "Balanced — clear and complete, no filler.", "Thorough — detail, examples, and reasoning.", "Detailed mentor — teach step-by-step with examples and next steps."][dial];
    if (S.voiceOnly) s += "\n\nVOICE-ONLY PROTOCOL: your reply is read aloud via TTS. Write flowing natural speech — no markdown, no emoji, no lists, no code fences.";
    return s;
  }
  function routeModel(prompt, mdl) {
    try {
      if (!S.autoRoute) return "";
      if ((pcfgRead().active || "openrouter") !== "openrouter") return "";
      const looksCode = /```|\b(function|const |let |import |export |class |def |SELECT )\b|bug|traceback|stack trace|regex|typescript|javascript|\bpython\b|\breact\b|\bcss\b|\bhtml\b|\bnode\b|fix my|debug|refactor/i.test(prompt || "");
      if (looksCode && S.routeCode) return S.routeCode;
      return "";
    } catch (e) { return ""; }
  }

  /* ── send your own text through the normal pipeline ── */
  function sendVia(text) {
    const u = $("user-input"); if (!u) return;
    u.value = text; u.dispatchEvent(new Event("input", { bubbles: true }));
    const b = $("send-btn"); if (b) { chirp("send"); b.click(); }
  }

  /* ── boot overlay watcher + stream watcher + eye avatar ── */
  const QUOTES = ["Calibrating sarcasm levels…", "Warming up the reactor…", "Negotiating with electrons…", "Compiling courage…", "Polishing the holograms…", "Brewing fresh context…", "Sharpening wit modules…", "Consulting the arc flux…", "Feeding the knowledge shelf…", "Aligning star charts…", "Untangling neural nets…", "Charging neural capacitors…"];
  let jvEyeRow = null, jvEyeRaf = 0;
  function makeEye() {
    if ($("jv-eye-live")) return $("jv-eye-live");
    const c = document.createElement("canvas"); c.id = "jv-eye-live"; c.className = "jv-eye"; c.width = 64; c.height = 64;
    document.body.appendChild(c);
    const ctx = c.getContext("2d"); let t0 = performance.now(), blink = 0;
    function draw(now) {
      const row = jvEyeRow;
      if (!row || !row.isConnected) { jvEyeRaf = requestAnimationFrame(draw); return; }
      const r = row.getBoundingClientRect();
      if (r.width > 0) { c.style.left = (r.left + 4) + "px"; c.style.top = (r.top + 4) + "px"; c.style.opacity = "1"; }
      const host = document.body.getBoundingClientRect();
      const px = lastPointer.x - (r.left + host.left), py = lastPointer.y - (r.top + host.top);
      const ang = Math.atan2(py, Math.max(1, px)), dist = Math.min(6, Math.hypot(px, py) / 60);
      if (now - blink > 2400 + Math.random() * 2400) blink = now;
      const bl = blink % 1000 < 120 ? 0.12 : 1;
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = "rgba(53,214,232,.15)"; ctx.beginPath(); ctx.arc(32, 32, 26, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(53,214,232,.55)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(32, 32, 26, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(32, 32, 20, 20 * bl, 0, 0, 7);
      ctx.fillStyle = "rgba(10,18,26,.9)"; ctx.fill();
      const ir = ctx.createRadialGradient(32 + Math.cos(ang) * dist, 32 + Math.sin(ang) * dist, 1, 32, 32, 10);
      ir.addColorStop(0, "#bff5ff"); ir.addColorStop(1, "#0e7f94");
      ctx.fillStyle = ir; ctx.beginPath(); ctx.arc(32 + Math.cos(ang) * dist, 32 + Math.sin(ang) * dist, 7 * bl, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(30 + Math.cos(ang) * dist, 30 + Math.sin(ang) * dist, 2, 0, 7); ctx.fill();
      jvEyeRaf = requestAnimationFrame(draw);
    }
    jvEyeRaf = requestAnimationFrame(draw);
    return c;
  }
  const lastPointer = { x: innerWidth / 2, y: 60 };
  addEventListener("pointermove", e => { lastPointer.x = e.clientX; lastPointer.y = e.clientY; }, { passive: true });

  /* stream state watcher: body class, quotes strip, eye avatar, rpm */
  let lastStreamOn = false;
  function streamTick() {
    const live = document.querySelector(".mr.bot .mb .stream-cursor");
    const on = !!live && document.getElementById("app") && !document.getElementById("app").classList.contains("hidden");
    if (on !== lastStreamOn) {
      lastStreamOn = on;
      document.body.classList.toggle("jv-stream", on);
      let strip = $("jv-quotes");
      if (on) {
        if (!strip) {
          strip = document.createElement("div"); strip.id = "jv-quotes"; strip.className = "jv-quotes";
          strip.innerHTML = `<span class="jv-q-dot"></span><span id="jv-q-txt">…</span>`;
          const cm = document.querySelector(".cmain"); if (cm) cm.appendChild(strip);
        }
        let qi = Math.floor(Math.random() * QUOTES.length);
        $("jv-q-txt").textContent = QUOTES[qi];
        strip.classList.add("on");
        jvEyeRow = live && live.closest(".mr.bot");
        if (jvEyeRow) makeEye();
        /* #50 rotating quote */
        strip.dataset.iv = strip.dataset.iv || String(setInterval(() => { const el = $("jv-q-txt"); if (el) el.textContent = QUOTES[(++qi) % QUOTES.length]; }, 2800));
      } else {
        if (strip) strip.classList.remove("on");
        const eye = $("jv-eye-live"); if (eye) eye.style.opacity = "0";
        jvEyeRow = null;
      }
    }
    /* keep eye pinned to streaming row */
  }
  setInterval(streamTick, 250);

  /* body class mirror for extras HUD / voice-only / CRT / accent */
  function applyBodyState() {
    document.body.classList.toggle("jv-crt", !!S.crt);
    document.body.classList.toggle("jv-vonly", !!S.voiceOnly);
    document.body.dataset.jvAccent = S.accent || "cyan";
    applyAccent();
  }
  applyBodyState();

  /* ── boot sequence (#1) ── */
  const BOOT_LINES = ["ARC REACTOR · IGNITION", "NEURAL LATTICE … ONLINE", "MEMORY VAULT … SYNCED", "KNOWLEDGE SHELF … INDEXED", "HOLLONOLOGY MODULES … 12 ACTIVE", "JARVIK ONLINE — GOOD TO SEE YOU."];
  function playBoot() {
    if ($("jv-boot")) return;
    const ov = document.createElement("div"); ov.id = "jv-boot";
    ov.innerHTML = `
      <div class="jv-boot-core">
        <div class="jv-boot-reactor">${REACTOR}</div>
        <div class="jv-boot-lines">${BOOT_LINES.map((l, i) => `<div class="jv-boot-line" data-d="${i * 380}">${esc(l)}</div>`).join("")}</div>
        <div class="jv-boot-bar"><i></i></div>
        <div class="jv-boot-skip">click anywhere to skip</div>
      </div>`;
    document.body.appendChild(ov);
    chirp("boot");
    const kill = () => { ov.classList.add("out"); setTimeout(() => ov.remove(), 650); clearInterval(iv); ov.removeEventListener("click", kill); };
    ov.addEventListener("click", kill);
    const iv = setTimeout(kill, 400 + BOOT_LINES.length * 380 + 1200);
    return ov;
  }
  function watchApp() {
    const app = $("app"); if (!app) return;
    let booted = false;
    const tryBoot = () => {
      if (booted || app.classList.contains("hidden") || !S.boot) return;
      booted = true;
      playBoot();
      if (orKey().length < 10 && !localStorage.getItem("jv_onboarded")) setTimeout(showOnboarding, 4200);
    };
    new MutationObserver(tryBoot).observe(app, { attributes: true, attributeFilter: ["class"] });
    tryBoot();
  }

  /* ── onboarding wizard (#38) ── */
  function showOnboarding() {
    const ov = jvModal("jv-wiz-main", ``, "");
    ov.classList.remove("hidden");
    const card = ov.querySelector(".jv-mcard");
    card.classList.add("jv-wizard");
    let step = 0;
    const STEPS = [
      { dot: "🔑", t: "Connect a brain", h: `<p>JARVIK runs on any provider. OpenRouter gives free models — no card needed.</p><button class="jv-btn" id="jv-w-key">Set my API key</button><button class="jv-btn ghost jv-w-next" data-skip="1">Skip — try Demo Mode</button>` },
      { dot: "⚡", t: "Your co-work superpowers", h: `<ul class="jv-feat-lst"><li><b>Agent Studio</b> — planner, coder, critic agents that work a goal together</li><li><b>Debate Arena</b> — two models argue, a third judges</li><li><b>JARVIK Shell</b> — in-app terminal</li><li><b>Boost Hub</b> — CRT skin, accents, sounds, auto-router</li></ul><button class="jv-btn jv-w-next">Next →</button>` },
      { dot: "🚀", t: "Fire the first shot", h: `<p>Pick a starter — or type anything:</p><div class="jv-starter-grid">${["Plan my week ⚡", "Build me a pomodoro app 💻", "Roast my last idea 🔥", "Explain quantum tunneling simply 🔭"].map(c => `<button class="jv-btn ghost jv-starter" data-p="${esc(c)}">${c}</button>`).join("")}</div><button class="jv-btn ghost jv-w-done">{Esc} Enter the studio</button>` }
    ];
    const render = () => {
      const s = STEPS[step];
      card.innerHTML = `<div class="jv-mhead"><span class="jv-mtitle">${STEPS.map((_, i) => `<i class="jv-dot${i === step ? " on" : ""}"></i>`).join("")}<b>${s.dot} ${esc(s.t)}</b></span><button class="jv-mclose">✕</button></div><div class="jv-mbody">${s.h}</div>`;
      card.querySelector(".jv-mclose").onclick = () => { ov.classList.add("hidden"); localStorage.setItem("jv_onboarded", "1"); };
      const nx = card.querySelector(".jv-w-next");
      if (nx) nx.onclick = () => { if (nx.dataset.skip) { localStorage.setItem("jv_onboarded", "1"); ov.classList.add("hidden"); return; } step++; render(); };
      const kb = card.querySelector("#jv-w-key");
      if (kb) kb.onclick = () => { const b = $("key-btn"); if (b) b.click(); ov.classList.add("hidden"); localStorage.setItem("jv_onboarded", "1"); };
      $$("button.jv-w-done", card).forEach(b => b.onclick = () => { ov.classList.add("hidden"); localStorage.setItem("jv_onboarded", "1"); });
      $$(".jv-starter", card).forEach(b => b.onclick = () => { ov.classList.add("hidden"); localStorage.setItem("jv_onboarded", "1"); sendVia(b.dataset.p); });
    };
    render();
  }

  /* ═══════════════ 19 · DEBATE ARENA (2 models + judge) ═══════════════ */
  function debateArena(prefill) {
    const ov = jvModal("jv-debate", `<span class="jv-mico">⚔️</span> Debate Arena`, `
      <div class="jv-field"><label>Topic / your stance</label><textarea id="jv-db-topic" rows="2">${esc(prefill || "")}</textarea></div>
      <div class="jv-row2">
        <div class="jv-field"><label>Model A</label><select id="jv-db-a">${modelOptions("deepseek/deepseek-chat-v3.1:free")}</select></div>
        <div class="jv-field"><label>Model B</label><select id="jv-db-b">${modelOptions("meta-llama/llama-3.3-70b-instruct")}</select></div>
        <div class="jv-field"><label>Judge</label><select id="jv-db-j">${modelOptions("google/gemini-2.0-flash-exp:free")}</select></div>
      </div>
      <button class="jv-btn" id="jv-db-go">Start debate</button>
      <div id="jv-db-out" class="jv-db-out"><div class="jv-hint">A and B will argue three rounds, then the judge rules.</div></div>`);
    ov.classList.remove("hidden"); chirp("open");
    $("jv-db-go").onclick = async () => {
      const topic = $("jv-db-topic").value.trim(); if (!topic) return jvToast("Give the debate a topic");
      const A = $("jv-db-a").value, B = $("jv-db-b").value, J = $("jv-db-j").value;
      const out = $("jv-db-out"); out.innerHTML = "";
      const nameOf = id => (JV_MODELS.find(m => m[0] === id) || [id, id])[1];
      const line = (who, txt) => out.insertAdjacentHTML("beforeend", `<div class="jv-db-line ${who}"><b>${esc(who)}</b>${esc(txt)}</div>`);
      let aArg = null, bArg = null;
      try {
        for (let r = 1; r <= 3; r++) {
          const pa = await jvChat([{ role: "user", content: `Topic: "${topic}". Argue FOR it persuasively. Round ${r}. Rebut: ${bArg || "opening — strike first, under 90 words"}` }], { model: A, maxTokens: 220 });
          aArg = pa; line("A · " + nameOf(A), pa);
          const pb = await jvChat([{ role: "user", content: `Topic: "${topic}". Argue AGAINST it persuasively. Round ${r}. Rebut: ${aArg}` }], { model: B, maxTokens: 220 });
          bArg = pb; line("B · " + nameOf(B), pb);
        }
        const verdict = await jvChat([{ role: "user", content: `Debate topic: "${topic}".\nArgument FOR:\n${aArg}\n\nArgument AGAINST:\n${bArg}\n\nRule as a judge: name the winner and give a 3-line reason.` }], { model: J, maxTokens: 260 });
        line("⚖ Judge", verdict); fusionBurst(out);
      } catch (e) { jvToast("Debate error: " + e.message); }
    };
  }

  /* ═══════════════ AGENT STUDIO (multi-agent runner) ═══════════════ */
  const AGENTS = [
    { key: "planner", icon: "🧭", name: "Planner", sys: "You are the Planner agent. Decompose the goal into a crisp ordered plan with owners and risks. Under 180 words." },
    { key: "researcher", icon: "🔭", name: "Researcher", sys: "You are the Researcher agent. Surface prior art, facts, numbers, and unknowns with confidence markers. Under 180 words." },
    { key: "coder", icon: "💻", name: "Coder", sys: "You are the Coder agent. Produce a concrete implementation sketch (code) for the goal. Focus on the core module only. Under 200 words." },
    { key: "tester", icon: "🧪", name: "QA", sys: "You are the QA agent. List edge cases and test scenarios that would break the plan/code. Under 140 words." },
    { key: "critic", icon: "😈", name: "Critic", sys: "You are the Devil's Advocate agent. Ruthlessly attack the plan's weakest assumptions and give a viability score /10. Under 140 words." },
    { key: "mentor", icon: "🧠", name: "Strategist", sys: "You are the Strategist agent. Give the go/no-go call, sequencing advice, and the single highest-leverage next step. Under 140 words." }
  ];
  function agentStudio() {
    const ov = jvModal("jv-agents", `<span class="jv-mico">🤖</span> Agent Studio`, `
      <div class="jv-field"><label>Mission</label><textarea id="jv-ag-goal" rows="2" placeholder="e.g. Ship a habit tracker to my college group in 2 weeks"></textarea></div>
      <div class="jv-ag-grid">${AGENTS.map(a => `<label class="jv-ag-chip"><input type="checkbox" value="${a.key}" ${["planner", "coder", "critic"].includes(a.key) ? "checked" : ""}><span>${a.icon} ${a.name}</span></label>`).join("")}</div>
      <button class="jv-btn" id="jv-ag-go">Run agents</button>
      <div id="jv-ag-out" class="jv-ag-out"></div>`);
    ov.classList.remove("hidden"); chirp("open");
    $("jv-ag-go").onclick = async () => {
      const goal = $("jv-ag-goal").value.trim(); if (!goal) return jvToast("Enter a mission first");
      const picked = $$("input:checked", ov).map(i => AGENTS.find(a => a.key === i.value)).filter(Boolean);
      if (!picked.length) return jvToast("Pick at least one agent");
      const out = $("jv-ag-out"); out.innerHTML = "";
      let transcript = "";
      for (const a of AGENTS.filter(x => picked.includes(x))) {
        const card = document.createElement("div"); card.className = "jv-ag-card";
        card.innerHTML = `<div class="jv-ag-head"><span class="jv-spin"><i></i></span><b>${a.icon} ${a.name}</b> <em>working…</em></div>`;
        out.appendChild(card); card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        try {
          const reply = await jvChat([{ role: "user", content: `${a.sys}\n\nMISSION: ${goal}\n\nWORKSPACE LOG (previous agents):\n${transcript.slice(-3500) || "(you are first)"}` }], { maxTokens: 380 });
          card.innerHTML = `<div class="jv-ag-head"><b>${a.icon} ${a.name}</b></div><div class="jv-ag-body">${esc(reply).replace(/\n/g, "<br>")}</div>`;
          transcript += `\n[${a.name}] ${reply}`;
          chirp("blip");
        } catch (e) { card.innerHTML = `<div class="jv-ag-head"><b>${a.icon} ${a.name}</b> ⚠ ${esc(e.message)}</div>`; }
      }
      fusionBurst(out);
      out.insertAdjacentHTML("beforeend", `<div class="jv-ag-acts"><button class="jv-btn ghost" id="jv-ag-send">💬 Send report to chat</button><button class="jv-btn ghost" id="jv-ag-doc">📚 Save as knowledge doc</button></div>`);
      $("jv-ag-send").onclick = () => sendVia("Agent Studio report on: " + goal + "\n\n" + transcript.slice(-3500));
      $("jv-ag-doc").onclick = () => { const d = jvDocsAll(); d.push({ name: "Agents · " + goal.slice(0, 40), content: transcript.slice(-4000), ts: Date.now() }); jvDocsSet(d); jvToast("Saved to Boost knowledge"); };
    };
  }

  /* ═══════════════ 18 · MEMORY PANEL ═══════════════ */
  function memoryPanel() {
    const ov = jvModal("jv-mem", `<span class="jv-mico">🧠</span> Memory Panel`, `
      <p class="jv-hint">Facts JARVIK always knows — injected into every conversation as persistent context.</p>
      <div class="jv-mem-add"><input id="jv-mem-txt" placeholder="e.g. I ship every Friday · my stack is React+FastAPI"><button class="jv-btn" id="jv-mem-add">Remember</button></div>
      <div id="jv-mem-list" class="jv-mem-list"></div>`);
    ov.classList.remove("hidden"); chirp("open");
    const render = () => {
      $("jv-mem-list").innerHTML = jvMemAll().map((m, i) => `<div class="jv-mem-item"><span>${esc(m.text)}</span><button data-i="${i}" title="Forget">✕</button></div>`).join("") || `<div class="jv-hint">Memory is empty. Add what JARVIK should always remember.</div>`;
      $$("button[data-i]", $("jv-mem-list")).forEach(b => b.onclick = () => { const a = jvMemAll(); a.splice(+b.dataset.i, 1); jvMemSet(a); render(); });
    };
    render();
    $("jv-mem-add").onclick = () => { const t = $("jv-mem-txt").value.trim(); if (!t) return; const a = jvMemAll(); a.push({ text: t }); jvMemSet(a); $("jv-mem-txt").value = ""; render(); chirp("blip"); };
  }

  /* ═══════════════ 21 · MISSION TRACE + 25 · INLINE ACTIONS (via afterStream) ═══════════════ */
  function inlineChips(row, prompt) {
    const bar = row.querySelector(".msg-actions"); if (!bar || bar.dataset.jvChips === "1") return;
    bar.dataset.jvChips = "1";
    const mk = (label, fmt, title) => {
      const b = document.createElement("button"); b.className = "msg-act-btn jv-chip"; b.textContent = label; b.title = title;
      b.onclick = () => { if (document.body.classList.contains("jv-stream")) return jvToast("Wait for the current reply to finish"); const answer = typeof getBranches === "function" ? (getBranches(row)[+row.dataset.bi || 0] || row.querySelector(".stream-content")?.innerText || "") : row.innerText; sendVia(fmt(prompt || row.dataset.prompt || "") + "\n\nSource answer:\n" + answer); };
      return b;
    };
    const rp = row.dataset.prompt || "";
    bar.appendChild(mk("＋ Elaborate", p => "Elaborate deeply on the previous answer: " + p.slice(0, 200), "Ask JARVIK to expand"));
    bar.appendChild(mk("－ Shorten", () => "Rewrite your previous answer at one-third length — keep the punch", "Ask a compact rewrite"));
    bar.appendChild(mk("TED Simplify", () => "Explain your previous answer like I'm 12, with an analogy", "Ask a simpler explanation"));
    /* #32 ICS generator */
    const times = extractTimes(row.innerText || "").length;
    const ics = document.createElement("button"); ics.className = "msg-act-btn jv-chip"; ics.textContent = "📅 .ics"; ics.title = "Turn this reply into a calendar file";
    ics.onclick = () => buildICS(row); bar.appendChild(ics);
    if (S.trace) {
      const d = document.createElement("details"); d.className = "jv-trace";
      const meta = row.dataset.jvMeta ? JSON.parse(row.dataset.jvMeta) : null;
      d.innerHTML = `<summary>🧭 Mission Trace</summary><div class="jv-trace-body">${meta ? `<span>⏱ ${meta.elapsed}ms</span><span>🪙 ~${Math.max(1, Math.round(meta.words / 1.3))} tokens out</span>${meta.model ? `<span>⚙ ${esc(meta.model)}</span>` : ""}${(meta.kb || []).length ? `<span>📚 ${esc(meta.kb.map(k => k.name).join(", "))}</span>` : ""}` : ""}</div>`;
      bar.after(d);
    }
  }
  function extractTimes(t) {
    const out = [];
    (t.match(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi) || []).forEach(x => out.push(x));
    return out;
  }
  function buildICS(row) {
    const t = row.innerText || "";
    const times = extractTimes(t);
    if (!times.length) return jvToast("No times found in this reply");
    const title = (t.split("\n").filter(Boolean)[0] || "JARVIK event").slice(0, 60);
    let stamp = new Date(); stamp.setMinutes(0, 0, 0);
    const fmt = x => { const m = x.trim().match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i); let h = +m[1]; if ((m[3] || "").toLowerCase() === "pm" && h < 12) h += 12; if ((m[3] || "").toLowerCase() === "am" && h === 12) h = 0; stamp.setHours(h, +m[2]); const d = stamp, p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`; };
    const evs = times.map((x, i) => {
      const s = fmt(x), d = new Date(stamp.getTime() + 60 * 60000);
      return `BEGIN:VEVENT\r\nDTSTART:${s}\r\nDTEND:${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00\r\nSUMMARY:${title} · ${x}\r\nDESCRIPTION:Generated by JARVIK AI\r\nEND:VEVENT`;
    }).join("\r\n");
    const icsFile = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//JARVIK AI//EN\r\n${evs}\r\nEND:VCALENDAR`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([icsFile], { type: "text/calendar" })); a.download = "jarvik-plan.ics"; a.click();
    jvToast("📅 Calendar file downloaded"); chirp("blip");
  }

  /* ═══════════════ afterStream — unified post-reply pipeline ═══════════════ */
  function afterStream(info) {
    try {
      /* trace metadata on row (#21) */
      if (info.row && info.row.dataset) {
        const words = String(info.text || "").trim().split(/\s+/).length;
        info.row.dataset.jvMeta = JSON.stringify({ elapsed: info.elapsed, words, model: info.model || routeModel(info.prompt, localStorage.getItem("jarvik_model") || "") || localStorage.getItem("jarvik_model"), kb: info.kbUsed || [] });
        if (!info.row.dataset.jvChips) inlineChips(info.row, info.prompt);
      }
      fusionBurstIfArtifact(info.row);                             /* #15 */
      jvAnalyticsTick(info);                                       /* #42 */
      autoTitle(info.prompt);                                      /* #24 */
      notifyIfHidden(info);                                        /* #40 */
      subtitleMirror(info.text);                                   /* #48 */
      chirp("done");
    } catch (e) {}
  }
  function fusionBurstIfArtifact(row) {
    if (!row || !row.querySelector) return;
    if (row.querySelector("pre code")) setTimeout(() => fusionBurst(row.querySelector(".mb") || row), 60);
  }
  function jvAnalyticsTick(info) {
    try { window.uaJvEvent && window.uaJvEvent(info); } catch (e) {}
    const words = String(info.text || "").trim().split(/\s+/).length;
    try {
      const k = "jv_pulse", d = today();
      const st = JSON.parse(localStorage.getItem(k) || "{}"); st.days = st.days || {};
      const cur = st.days[d] || { n: 0, w: 0 }; cur.n++; cur.w += words; st.days[d] = cur;
      st.last = new Date().toISOString(); localStorage.setItem(k, JSON.stringify(st));
    } catch (e) {}
  }
  function notifyIfHidden(info) {
    if (!S.notify || !document.hidden || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try { new Notification("JARVIK replied", { body: String(info.text || "").slice(0, 120), icon: undefined }); } catch (e) {}
  }
  function subtitleMirror(text) { const s = $("jv-sub"); if (s) s.textContent = String(text || "").slice(-400); }

  /* ═══════════════ 24 · AUTO-TITLE ═══════════════ */
  const TITLE_EMOJI = [["code,function,build,app,script,scripted,css,html,api", "💻"], ["plan,roadmap,week,schedule,sprint", "🗺️"], ["analy,review,compare,audit", "🔍"], ["write,draft,blog,copy", "✍️"], ["design,theme,ui,logo", "🎨"], ["test,bug,fix,debug", "🧪"], ["learn,explain,teach,study", "🎓"], ["idea,brainstorm,pitch", "💡"]];
  function autoTitle(prompt) {
    try {
      const projKey = "jarvik_proj", curKey = "jarvik_cur";
      const cur = localStorage.getItem(curKey); if (!cur) return;
      const arr = JSON.parse(localStorage.getItem(projKey) || "[]");
      const i = arr.findIndex(p => p.id === cur);
      if (i === -1) return;
      if (!/^(New conversation|Untitled|Draft)/i.test(arr[i].title || "")) return;
      const stop = new Set("the a an and or to of in for with is are be my me i you it on at this that".split(" "));
      const words = String(prompt || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3 && !stop.has(w));
      if (!words.length) return;
      const uniq = [...new Set(words)].slice(0, 3).join(" ");
      const emoji = (TITLE_EMOJI.find(([k]) => new RegExp(k).test(String(prompt).toLowerCase())) || [, "🛰"])[1];
      const t = `${emoji} ${uniq.slice(0, 38).replace(/^\w/, c => c.toUpperCase())}`;
      arr[i].title = t; localStorage.setItem(projKey, JSON.stringify(arr));
      const ct = $("chat-title"); if (ct) ct.textContent = t;
      const si = $("conv-search-input"); if (si) si.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (e) {}
  }

  /* ═══════════════ 31 · MERMAID AUTORENDER + 34 · JSON TREE ═══════════════ */
  function hookMermaid(row) {
    if (typeof mermaid === "undefined" || !row) return;
    $$("pre code.language-mermaid", row).forEach(code => {
      if (code.dataset.jvMmd === "1") return;
      code.dataset.jvMmd = "1";
      const pre = code.closest("pre");
      try {
        mermaid.initialize({ startOnLoad: false, theme: document.body.classList.contains("light-mode") ? "default" : "dark" });
        mermaid.render("jvmm" + Math.random().toString(36).slice(2), code.textContent).then(({ svg }) => {
          const div = document.createElement("div"); div.className = "jv-mermaid"; div.innerHTML = svg;
          pre.replaceWith(div); fusionBurst(div);
        }).catch(() => {});
      } catch (e) {}
    });
  }
  function jsonTree(obj, keyName) {
    const t = typeof obj;
    if (obj === null) return `<li><span class="jv-jtv jv-jnull">${esc(keyName)}: null</span></li>`;
    if (t !== "object") return `<li><span class="jv-jtv jv-j${t}">${esc(keyName)}: <b>${esc(String(obj))}</b></span></li>`;
    const isA = Array.isArray(obj); const entries = isA ? obj.map((v, i) => [i, v]) : Object.entries(obj);
    return `<li class="${isA ? "jv-jarr jv-tog" : "jv-tog on"}"><span class="jv-jtk">${esc(isA ? `${keyName} [] (${obj.length})` : `${keyName} {} (${entries.length})`)}</span><ul>${entries.slice(0, 80).map(([k, v]) => jsonTree(v, String(k))).join("")}${entries.length > 80 ? `<li class="jv-hint">… ${entries.length - 80} more</li>` : ""}</ul></li>`;
  }
  function showJsonTree() {
    let jtxt = "";
    const blocks = $$(".mr.bot pre code");
    for (let i = blocks.length - 1; i >= 0; i--) {
      const t = blocks[i].textContent.trim();
      if (/^[[{]/.test(t)) { jtxt = t; break; }
    }
    if (!jtxt) return jvToast("No JSON block found in this chat yet");
    let data; try { data = JSON.parse(jtxt); } catch (e) { return jvToast("Last JSON block is malformed: " + e.message); }
    const ov = jvModal("jv-json", `<span class="jv-mico">🌳</span> JSON Tree`, `<ul class="jv-jtree" id="jv-json-tree">${jsonTree(data, "root")}</ul>`);
    ov.classList.remove("hidden"); chirp("open");
    $$(".jv-tog > .jv-jtk", $("jv-json-tree")).forEach(k => k.onclick = () => k.parentElement.classList.toggle("on"));
  }

  /* ═══════════════ 33 · REGEX LAB ═══════════════ */
  function regexLab() {
    const ov = jvModal("jv-regex", `<span class="jv-mico">🧪</span> Regex Lab`, `
      <div class="jv-row2"><div class="jv-field"><label>Pattern</label><input id="jv-rx-p" placeholder="\\b(?:GET|POST)\\s+/(\\w+)"></div><div class="jv-field"><label>Flags</label><input id="jv-rx-f" value="g" style="width:70px"></div></div>
      <div class="jv-field"><label>Test string</label><textarea id="jv-rx-t" rows="3">POST /login HTTP/1.1\nGET /dashboard\nDELETE /users/42</textarea></div>
      <div id="jv-rx-out" class="jv-rx-out"></div>
      <button class="jv-btn ghost" id="jv-rx-ai">🔍 Ask JARVIK to explain this regex</button>`);
    ov.classList.remove("hidden"); chirp("open");
    const run = () => {
      const p = $("jv-rx-p").value, f = $("jv-rx-f").value, t = $("jv-rx-t").value, out = $("jv-rx-out");
      if (!p) { out.innerHTML = `<div class="jv-hint">Type a pattern above.</div>`; return; }
      let re; try { re = new RegExp(p, f.includes("g") ? f : f + "g"); } catch (e) { out.innerHTML = `<div class="jv-rx-err">⚠ ${esc(e.message)}</div>`; return; }
      const ms = [...t.matchAll(re)];
      out.innerHTML = `<div class="jv-rx-count">${ms.length} match${ms.length === 1 ? "" : "es"}</div>` + (ms.slice(0, 12).map((m, i) => `<div class="jv-rx-mi">i${i}: <b>${esc(m[0])}</b>${m.slice(1).length ? ` — groups: ${m.slice(1).map((g, j) => `$${j + 1} = ${esc(g == null ? "∅" : g)}`).join(" · ")}` : ""} @${m.index}</div>`).join("") || `<div class="jv-hint">No matches.</div>`);
    };
    ["jv-rx-p", "jv-rx-f", "jv-rx-t"].forEach(id => $(id).addEventListener("input", run));
    run();
    $("jv-rx-ai").onclick = () => sendVia("Explain this regular expression in plain English, with examples: /" + $("jv-rx-p").value + "/" + $("jv-rx-f").value);
  }

  /* ═══════════════ 26 · JARVIK SHELL ═══════════════ */
  function shell() {
    const ov = jvModal("jv-shell", `<span class="jv-mico">⌨️</span> JARVIK Shell`, `<div id="jv-sh-out" class="jv-sh-out"><div>` +
      `<span class="jv-sh-c">type <b>help</b> for commands</span></div></div><div class="jv-sh-in"><span class="jv-sh-prompt">chevron&gt;</span><input id="jv-sh-in" autocomplete="off" spellcheck="false"></div>`);
    ov.classList.remove("hidden"); chirp("open");
    const out = $("jv-sh-out");
    const echo = h => { const d = document.createElement("div"); d.innerHTML = h; out.appendChild(d); out.scrollTop = 1e6; };
    const vsFiles = () => {
      const a = [];
      try { const w = JSON.parse(localStorage.getItem("jarvik_workspace") || "null"); if (w && typeof w === "object") a.push(...Object.keys(w)); } catch (e) {}
      try { const v = JSON.parse(localStorage.getItem("jarvik_vscode") || "null"); if (v && v.files) a.push(...Object.keys(v.files)); } catch (e) {}
      jvDocsAll().forEach(d => a.push(d.name));
      return a;
    };
    const sysdoc = name => jvDocsAll().find(d => d.name === name);
    $("jv-sh-in").addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const raw = e.target.value.trim(); e.target.value = "";
      echo(`<span class="jv-sh-prompt">chevron&gt;</span> ${esc(raw)}`);
      const [c, ...rest] = raw.split(/\s+/); const arg = rest.join(" ");
      switch ((c || "").toLowerCase()) {
        case "": break;
        case "help": echo(`<span class="jv-sh-c">commands: help · clear · ls · cat &lt;f&gt; · run &lt;js&gt; · echo · whoami · date · key · model · theme · accent &lt;name&gt; · crt · memory · shell-artifact · send &lt;text&gt;</span>`); break;
        case "clear": out.innerHTML = ""; break;
        case "ls": echo(`<span class="jv-sh-c">${esc(vsFiles().join("\n") || "(workspace empty — open VS Code Studio to create files, or use memory docs)")}</span>`); break;
        case "cat": { const f = sysdoc(arg) || null; if (f) echo(`<pre>${esc(f.content.slice(0, 3000))}</pre>`); else if (vsFiles().includes(arg)) { try { const w = JSON.parse(localStorage.getItem("jarvik_workspace") || "{}"); echo(`<pre>${esc((w[arg] || "").slice(0, 3000))}</pre>`); } catch (err) { echo(`cat: cannot read`); } } else echo(`cat: no such file: <b>${esc(arg)}</b>`); break; }
        case "run": try { const r = eval(`(async()=>{${arg}})()`); echo(`<pre>${esc(typeof r === "string" ? r : JSON.stringify(r, null, 1))}</pre>`); } catch (err) { echo(`<span class="jv-sh-err">⚠ ${esc(err.message)}</span>`); } break;
        case "echo": echo(esc(arg)); break;
        case "whoami": echo(`<span class="jv-sh-c">Vikrant · sovereign operator · ${jqBranding()}</span>`); break;
        case "date": echo(String(new Date())); break;
        case "key": echo(orKey() ? `🔑 OpenRouter key: <span class="jv-sh-ok">configured</span> (ends …${esc(orKey().slice(-4))})` : `<span class="jv-sh-err">⚠ no key — set one via 🔑 API Key</span>`); break;
        case "model": echo(`⚙ ${esc(localStorage.getItem("jarvik_model") || "default")}`); break;
        case "theme": { const t = $("theme-toggle"); if (t) t.click(); echo("theme toggled"); break; }
        case "accent": if (ACCENTS[arg.toLowerCase()]) { S.accent = arg.toLowerCase(); jvSave(); applyBodyState(); echo(`accent → ${esc(arg.toLowerCase())}`); } else echo("accents: " + Object.keys(ACCENTS).join(", ")); break;
        case "crt": S.crt = !S.crt; jvSave(); applyBodyState(); echo(`crt ${S.crt ? "on" : "off"}`); break;
        case "memory": { const m = jvMemAll(); echo(m.length ? esc(m.map(x => "- " + x.text).join("\n")) : "(memory empty)"); break; }
        case "send": if (arg) { sendVia(arg); ov.classList.add("hidden"); } break;
        default: echo(`<span class="jv-sh-err">unknown command: ${esc(c)} — try <b>help</b></span>`);
      }
    });
    setTimeout(() => $("jv-sh-in") && $("jv-sh-in").focus(), 60);
  }
  function jqBranding() { return "Client-side AI Studio"; }

  /* ═══════════════ 27 · SCREENSHOT → CONTEXT ═══════════════ */
  async function screenshotCtx() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false });
      const v = document.createElement("video"); v.srcObject = stream; v.muted = true;
      await v.play(); await new Promise(r => setTimeout(r, 350));
      const c = document.createElement("canvas"); c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
      c.getContext("2d").drawImage(v, 0, 0);
      stream.getTracks().forEach(t => t.stop());
      const dataUrl = c.toDataURL("image/png");
      const ov = jvModal("jv-shot", `<span class="jv-mico">📸</span> Screenshot captured`, `
        <img class="jv-shot-img" src="${dataUrl}" alt="screenshot">
        <div class="jv-row3"><button class="jv-btn" id="jv-shot-copy">📋 Copy (then Ctrl+V in chat)</button><button class="jv-btn ghost" id="jv-shot-dl">⬇ Download</button></div>
        <p class="jv-hint">Paste the screenshot into the chat with a question — JARVIK sees images.</p>`);
      ov.classList.remove("hidden"); chirp("blip");
      $("jv-shot-copy").onclick = async () => { try { const blob = await (await fetch(dataUrl)).blob(); await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); jvToast("Copied — now Ctrl+V in the chat box"); } catch (e) { jvToast("Clipboard blocked — use Download instead"); } };
      $("jv-shot-dl").onclick = () => { const a = document.createElement("a"); a.href = dataUrl; a.download = "jarvik-screenshot.png"; a.click(); };
    } catch (e) { jvToast("Screen capture cancelled/blocked: " + e.message); }
  }

  /* ═══════════════ 28/29 · URL FETCHER + YOUTUBE ═══════════════ */
  async function jinaText(url) {
    const res = await fetch("https://r.jina.ai/" + url, { headers: { Accept: "text/plain" } });
    if (!res.ok) throw new Error("Reader failed (HTTP " + res.status + ")");
    return await res.text();
  }
  async function urlFetch(url) {
    try {
      jvToast("⏳ Reading that page…");
      const txt = await jinaText(url);
      const doc = { name: "Web · " + url.replace(/^https?:\/\//, "").slice(0, 60), content: txt.slice(0, 12000), ts: Date.now() };
      const d = jvDocsAll(); d.push(doc); jvDocsSet(d);
      sendVia(`I added a knowledge doc "${doc.name}" (full web page). Give me a structured summary: key claims, useful resources, and 3 questions I should ask next.`);
    } catch (e) { jvToast("Couldn't read that URL: " + e.message); }
  }
  async function ytToNotes(url) {
    try {
      jvToast("⏳ Fetching transcript…");
      let txt = "";
      try { txt = await jinaText(url); } catch (e) {}
      const m = (url || "").match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{6,})/);
      if (txt.length < 500 && m) { try { txt = await jinaText("https://www.youtube.com/watch?v=" + m[1]); } catch (e) {} }
      if (txt.length < 500) throw new Error(" couldn't extract a transcript — paste it manually into a doc if needed");
      const doc = { name: "YouTube transcript " + (m ? m[1] : url).slice(0, 30), content: txt.slice(0, 14000), ts: Date.now() };
      const d = jvDocsAll(); d.push(doc); jvDocsSet(d);
      sendVia(`A knowledge doc "${doc.name}" has the transcript. Write tidy study notes: TL;DR, key ideas numbered, memorable quotes, and action items.`);
    } catch (e) { jvToast("Transcript error" + e.message); }
  }

  /* ═══════════════ 30 · XLSX PARSER ═══════════════ */
  function hookXlsx() {
    const inp = $("file-input"); if (!inp || inp.dataset.jvXlsx === "1") return;
    inp.dataset.jvXlsx = "1";
    inp.addEventListener("change", () => {
      Array.from(inp.files || []).forEach(f => {
        if (!/\.(xlsx|xls)$/i.test(f.name)) return;
        jvToast("⏳ Parsing spreadsheet with SheetJS…");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", () => {
          const rdr = new FileReader();
          rdr.onload = ev => {
            try {
              const wb = window.XLSX.read(ev.target.result, { type: "array" });
              const csv = wb.SheetNames.map(n => `## Sheet: ${n}\n` + window.XLSX.utils.sheet_to_csv(wb.Sheets[n])).join("\n\n").slice(0, 20000);
              const d = jvDocsAll(); d.push({ name: "Sheet · " + f.name, content: csv, ts: Date.now() }); jvDocsSet(d);
              jvToast("📊 " + wb.SheetNames.length + " sheet(s) parsed into Boost knowledge — ask JARVIK to analyze it!"); chirp("blip");
            } catch (e) { jvToast("xlsx parse failed: " + e.message); }
          };
          rdr.readAsArrayBuffer(f);
        });
      });
    });
  }
  function loadScript(src, cb) {
    if ($("script[src='" + src + "']")) { cb(); return; }
    const s = document.createElement("script"); s.id = "jv-cdn-" + Math.random().toString(36).slice(2); s.src = src; s.onload = () => cb(); s.onerror = () => jvToast("CDN load failed — you're offline?"); document.head.appendChild(s);
  }

  /* ═══════════════ 35 · IMAGE GEN via pollinations ═══════════════ */
  function genImage(prompt) {
    const cc = $("chat-container");
    const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?width=1024&height=640&nologo=true&seed=" + Math.floor(Math.random() * 1e6);
    const loadingMsg = imageBubble(null, "generating…");
    const img = loadingMsg && loadingMsg.querySelector("img");
    if (img) { img.style.opacity = ".25"; img.onload = () => { img.style.opacity = "1"; fusionBurst(img); }; img.onerror = () => { loadingMsg.querySelector(".jv-img-cap").textContent = "⚠ image generation failed (offline?)"; }; img.src = url; }
    if (loadingMsg) { loadingMsg.querySelector(".jv-img-cap").innerHTML = "🎨 “" + esc(prompt.slice(0, 60)) + "”"; }
  }
  function imageBubble(url, caption) {
    const cc = $("chat-container"); if (!cc) return null;
    const row = document.createElement("div"); row.className = "mr bot jv-row";
    row.innerHTML = `<div class="bav">${REACTOR}</div><div class="mb"><div class="jv-img-card">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener"><img src="${esc(url)}" alt="${esc(caption || "")}"></a>` : `<img class="jv-img-ph" alt="">`}<div class="jv-img-cap">${esc(caption || "")}</div><div class="jv-img-acts"></div></div></div>`;
    cc.appendChild(row); row.scrollIntoView({ behavior: "smooth", block: "end" });
    return row;
  }

  /* ═══════════════ 36 · KONAMI ═══════════════ */
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kBuf = [];
  addEventListener("keydown", e => {
    kBuf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key); if (kBuf.length > 10) kBuf.shift();
    if (KONAMI.every((k, i) => kBuf[i] === k)) { kBuf = []; konamiProtocol(); }
  });
  function konamiProtocol() {
    if ($("jv-konami")) return;
    const ov = jvModal("jv-konami", `<span class="jv-mico">🕶️</span> PROTOCOL MATCHED`, `
      <div class="jv-konami-body"><div class="jv-k-eye">👁️</div>
      <p><b>“You found me, Vikrant.”</b> The hidden diagnostic layer is now unlocked.</p>
      <ul class="jv-feat-lst">
        <li>🎮 Reactor RGB roulette unlocked</li>
        <li>💼 JARVIK has left… j/k — he stays.</li>
        <li>🏆 Achievement: <b>Operator-class</b></li>
      </ul></div>
      <button class="jv-btn" id="jv-k-go">Engage disco reactor</button>`);
    ov.classList.remove("hidden"); chirp("boot");
    let prevAccent = S.accent; let disc = null;
    $("jv-k-go").onclick = () => {
      if (disc) { clearInterval(disc); disc = null; S.accent = prevAccent; applyBodyState(); jvToast("Reactor stabilized"); return; }
      const keys = Object.keys(ACCENTS);
      disc = setInterval(() => { S.accent = keys[Math.floor(Math.random() * keys.length)]; applyAccent(); }, 700);
      jvToast("Groovy. Type /accent to stop after closing.");
    };
  }

  /* ═══════════════ 37 · XP RING ═══════════════ */
  function xpRing() {
    const av = $("sb-avatar"); if (!av) return;
    if (av.parentElement !== (av.closest(".jv-xpwrap") || null)) { /* wrap once */ }
    let wrap = av.closest(".jv-xpwrap");
    if (!wrap) {
      wrap = document.createElement("span"); wrap.className = "jv-xpwrap";
      av.parentNode.insertBefore(wrap, av); wrap.appendChild(av);
    }
    let st = { xp: 0, streak: 0 }; try { st = JSON.parse(localStorage.getItem("jx_stats") || "{}") || st; } catch (e) {}
    const pct = Math.min(99, (st.xp || 0) % 100);
    wrap.style.setProperty("--p", pct);
    wrap.title = `XP ${(st.xp || 0)} · Level ${1 + Math.floor((st.xp || 0) / 100)}${st.streak > 1 ? " · 🔥 " + st.streak + "-day streak" : ""}`;
    let flame = wrap.querySelector(".jv-flame");
    if (st.streak > 1) {
      if (!flame) { flame = document.createElement("span"); flame.className = "jv-flame"; wrap.appendChild(flame); }
      flame.textContent = "🔥" + Math.min(9, st.streak);
    } else if (flame) flame.remove();
  }
  setInterval(xpRing, 3000);

  /* ═══════════════ 39 · PWA INSTALL BANNER ═══════════════ */
  let jvInstallEvt = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); jvInstallEvt = e; showPwaBanner(); });
  addEventListener("appinstalled", () => { const b = $("jv-pwa"); if (b) b.remove(); });
  function showPwaBanner() {
    if ($("jv-pwa") || localStorage.getItem("jv_pwa_dismiss") === "1") return;
    const b = document.createElement("button"); b.id = "jv-pwa"; b.className = "jv-pwa"; b.innerHTML = `⬇ Install JARVIK <i>offline-ready</i>`;
    b.onclick = () => { if (jvInstallEvt) jvInstallEvt.prompt(); else toastNoPwa(); b.remove(); };
    const cm = document.querySelector(".cmain"); if (cm) cm.prepend(b);
  }
  function toastNoPwa() { jvToast("Install prompt unavailable in this environment"); }

  /* ═══════════════ 41 · EMPTY STATE + 22 · PROMPT OF THE DAY ═══════════════ */
  const STARTERS = [["Plan my week around deep work 🗺️", "Map my week: deep-work mornings 9–12, gym at 18:00, review Friday."], ["Build a mini web app 💻", "Build me a beautiful single-file pomodoro web app with sound alerts."], ["Roast my idea 🔥", "Roast this business idea like a YC partner on a bad day: "], ["Break down quantum physics 🔭", "Explain quantum tunneling like I'm 12 — with a killer analogy."]];
  function jvEmptyCheck() {
    const app = $("app"), cc = $("chat-container");
    if (!app || !cc || app.classList.contains("hidden")) return;
    const empty = !cc.querySelector(".mr") && !cc.querySelector(".jv-empty");
    if (empty) {
      const div = document.createElement("div"); div.className = "jv-empty"; div.id = "jv-empty";
      div.innerHTML = `<div class="jv-empty-r"><span>${REACTOR}</span><span>${REACTOR}</span><span>${REACTOR}</span><span>${REACTOR}</span><b>${REACTOR}</b></div>
        <h3>Welcome to the Lab</h3><p>Ask anything. Canvas, agents, voice and 12+ brains standing by.</p>
        <div class="jv-starter-grid">${STARTERS.map((s, i) => `<button class="jv-btn ghost" data-i="${i}">${esc(s[0])}</button>`).join("")}</div>`;
      cc.appendChild(div);
      $$("button", div).forEach(b => b.onclick = () => { div.remove(); sendVia(STARTERS[+b.dataset.i][1]); });
    } else if (cc.querySelector(".mr") && cc.querySelector(".jv-empty")) cc.querySelectorAll(".jv-empty").forEach(e => e.remove());
  }
  new MutationObserver(() => jvEmptyCheck()).observe($("chat-container") || document.body, { childList: true, subtree: false });
  const POD = ["Turn my chaotic week into a calendar with 2h focus blocks.", "Design a landing page headline for a habit tracker.", "Refactor my thinking: what am I optimizing that doesn't matter?", "Explain my last failure like a retrospective in 5 bullets.", "Give me 3 tiny experiments to validate my side-project.", "Roast my daily routine, then write a better one."];
  /* prompt-of-the-day removed by user request — POD array kept only for shell/demo references */
  function injectPod() { /* noop */ }

  /* ═══════════════ 43/44 · EXPORT HUB ═══════════════ */
  function exportHub() {
    const ov = jvModal("jv-export", `<span class="jv-mico">⬇</span> Export Hub`, `
      <button class="jv-btn" id="jv-ex-pdf">📄 Export conversation as PDF</button>
      <button class="jv-btn" id="jv-ex-img">🖼 Share as a branded image card</button>
      <button class="jv-btn ghost" id="jv-ex-md">📝 Plain markdown (uses main Export)</button>
      <p class="jv-hint">PDF opens the print dialog — choose “Save as PDF”.</p>`);
    ov.classList.remove("hidden"); chirp("open");
    $("jv-ex-pdf").onclick = () => exportPDF(); $("jv-ex-img").onclick = () => shareCard(); $("jv-ex-md").onclick = () => { const b = $("export-btn"); if (b) { ov.classList.add("hidden"); b.click(); } else jvToast("Use sidebar Export"); };
  }
  function exportPDF() {
    const cc = $("chat-container"); if (!cc) return;
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) { jvToast("Popup blocked — allow popups to export"); return; }
    const dark = !document.body.classList.contains("light-mode");
    const msgs = $$(".mr", cc).map(r => {
      const role = r.classList.contains("user") ? "YOU" : "JARVIK";
      return `<div class="mmsg ${r.classList.contains("user") ? "u" : "b"}"><div class="mrole">${role}</div><p>${(r.innerText || "").replace(/[<>]/g, s => s === "<" ? "&lt;" : "&gt;").replace(/\n/g, "</p><p>")}</p></div>`;
    }).join("");
    w.document.write(`<!DOCTYPE html><html><head><title>JARVIK Conversation</title><style>
      body{font-family:'DM Sans',sans-serif;margin:0;padding:34px;color:#18222e;background:${dark ? "#0d1219" : "#fbfbfd"};line-height:1.55}
      h1{font-family:'Playfair Display',serif;font-weight:800;margin:0 0 4px}
      .mhead{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #35d6e8;padding-bottom:14px;margin-bottom:22px}
      .msub{opacity:.65;font-size:12px}
      .mmsg{max-width:640px;margin:14px 0;padding:12px 16px;border-radius:12px;font-size:13px}
      .mmsg.u{margin-left:auto;background:${dark ? "#1b2734" : "#eef4ff"}}
      .mmsg.b{background:${dark ? "#10161f" : "#fff"};border:1px solid rgba(53,214,232,.28)}
      .mrole{font-size:10px;letter-spacing:2px;opacity:.6;margin-bottom:4px}
      @media print{body{padding:12px}}</style></head><body>
      <div class="mhead"><h1>⚡ JARVIK AI Studio</h1><span class="msub">${new Date().toLocaleString()} · stored locally by Vikrant</span></div>${msgs}
      <script>setTimeout(()=>window.print(),350);<\/script></body></html>`);
    w.document.close();
  }
  async function shareCard() {
    const cc = $("chat-container"); if (!cc) return;
    jvToast("⏳ Rendering card…");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", async () => {
      try {
        const cv = await html2canvas(cc, { backgroundColor: getComputedStyle(document.body).backgroundColor || "#0d1219", scale: 2, ignoreElements: el => el.tagName === "IFRAME" || (el.classList && el.classList.contains("jv-fx-canvas")) });
        const card = document.createElement("canvas"); const PAD = 56, HEAD = 128, W = 1080;
        const rr = cc.getBoundingClientRect(); const H = Math.min(1800, Math.round(rr.height * 2 * (W / (rr.width * 2))) + HEAD + PAD * 2);
        card.width = W; card.height = H;
        const c2 = card.getContext("2d");
        c2.fillStyle = "#0b1017"; c2.fillRect(0, 0, W, H);
        const grad = c2.createLinearGradient(0, 0, W, H); grad.addColorStop(0, "rgba(53,214,232,.16)"); grad.addColorStop(1, "rgba(124,140,255,.16)");
        c2.fillStyle = grad; c2.fillRect(0, 0, W, H);
        c2.fillStyle = "#35d6e8"; c2.font = "800 40px 'DM Sans',sans-serif"; c2.fillText("⚡ JARVIK AI", PAD, 70);
        c2.fillStyle = "rgba(255,255,255,.55)"; c2.font = "15px 'DM Sans'"; c2.fillText("Co-Work Studio · by Vikrant", PAD, 100);
        const cw = W - PAD * 2, ch = H - HEAD - PAD - 60;
        const inner = document.createElement("canvas"); inner.width = cv.width; inner.height = cv.height;
        c2.fillStyle = "#0e1520"; c2.fillRect(PAD, HEAD, cw, ch);
        c2.save(); c2.beginPath(); c2.rect(PAD, HEAD, cw, ch); c2.clip();
        const sc = Math.min(cw / cv.width, ch / cv.height);
        c2.drawImage(cv, PAD + (cw - cv.width * sc) / 2, HEAD + (ch - cv.height * sc) / 2, cv.width * sc, cv.height * sc);
        c2.restore();
        c2.fillStyle = "rgba(255,255,255,.35)"; c2.font = "13px 'JetBrains Mono',monospace"; c2.fillText("⌁ jarvik-ai.pwa · private · 100% on-device", PAD, H - 22);
        const a = document.createElement("a"); a.href = card.toDataURL("image/png"); a.download = "jarvik-share.png"; a.click();
        jvToast("🖼 Share card downloaded"); fusionBurst(cc);
      } catch (e) { jvToast("Render failed: " + e.message); }
    });
  }

  /* ═══════════════ 42 · PULSE ANALYTICS ═══════════════ */
  function pulseDashboard() {
    let st = {}; try { st = JSON.parse(localStorage.getItem("jv_pulse") || "{}"); } catch (e) {}
    const days = st.days || {};
    const arr = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); arr.push([d, days[d] || { n: 0, w: 0 }]); }
    const max = Math.max(1, ...arr.map(a => a[1].n));
    const ov = jvModal("jv-pulse", `<span class="jv-mico">📊</span> Usage Pulse`, `
      <div class="jv-pulse-grid">
        <div class="jv-pc"><b>${arr.reduce((s, a) => s + a[1].n, 0)}</b><span>replies (14d)</span></div>
        <div class="jv-pc"><b>${arr.reduce((s, a) => s + a[1].w, 0)}</b><span>words received</span></div>
        <div class="jv-pc"><b>${jvMemAll().length}</b><span>memories</span></div>
        <div class="jv-pc"><b>${jvDocsAll().length}</b><span>docs</span></div>
      </div>
      <canvas id="jv-pulse-cv" width="560" height="160"></canvas>
      <p class="jv-hint">Daily replies — insights feed from your actual usage.</p>
      <button class="jv-btn ghost" id="jv-pulse-clear">Reset pulse data</button>`);
    ov.classList.remove("hidden"); chirp("open");
    const cv = $("jv-pulse-cv"), c = cv.getContext("2d");
    arr.forEach(([d, v], i) => {
      const bw = 30, gap = 10, x = 14 + i * (bw + gap), h = 120 * (v.n / max), y = 150 - h;
      c.fillStyle = v.n ? "#35d6e8" : "rgba(255,255,255,.07)";
      c.beginPath(); c.roundRect(x, y, bw, h, 6); c.fill();
      c.fillStyle = "rgba(255,255,255,.5)"; c.font = "10px 'JetBrains Mono'";
      c.fillText(d.slice(5), x - 2, 159);
      if (v.n) { c.fillStyle = "#fff"; c.font = "600 10px 'JetBrains Mono'"; c.fillText(v.n, x + 4, y - 4); }
    });
    $("jv-pulse-clear").onclick = () => { localStorage.removeItem("jv_pulse"); jvToast("Pulse reset"); ov.classList.add("hidden"); };
  }

  /* ═══════════════ 45 · CHEAT SHEET ═══════════════ */
  function cheatSheet() {
    const rows = [
      ["Ctrl+K", "Command palette & chat search"], ["Ctrl+B", "Toggle sidebar"], ["Ctrl+.", "Focus mode"], ["Ctrl+Shift+E", "VS Code Studio"], ["Ctrl+Shift+B", "In-app browser"], ["/", "Slash commands"], ["Enter", "Send · Shift+Enter newline"], ["Esc", "Stop generating / close"], ["?", "This cheat sheet"], ["⌥ drag art-resize", "Resize Co-Work canvas"],
      ["/agents", "Agent Studio"], ["/debate", "Debate Arena"], ["/memory", "Memory Panel"], ["/shell", "JARVIK Shell"], ["/regex", "Regex Lab"], ["/json", "JSON tree of last block"], ["/img &lt;intro&gt;", "Generate an image"], ["/fetch &lt;url&gt;", "Read a web page"], ["/yt &lt;url&gt;", "YouTube transcript notes"], ["/hub", "Boost Hub ⚡"], ["/crt, /accent &lt;name&gt;", "Skin toggles"], ["/pulse · /export-pdf · /share", "Analytics & exports"], ["↑↑↓↓←→←→BA", "…try it."]
    ];
    const ov = jvModal("jv-cheat", `<span class="jv-mico">⭐</span> Keyboard & Command Cheat Sheet`, `<div class="jv-cheat-grid">${rows.map(r => `<div class="jv-cheat-row"><kbd>${r[0]}</kbd><span>${r[1]}</span></div>`).join("")}</div>`);
    ov.classList.remove("hidden"); chirp("open");
  }
  addEventListener("keydown", e => {
    if (e.key !== "?" || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if ($("jv-cheat") && !$("jv-cheat").classList.contains("hidden")) return;
    e.preventDefault(); cheatSheet();
  });

  /* ═══════════════ 46 · HUD WALLPAPER · 47 · GHOST CURSORS · 48 · VOICE-ONLY ═══════════════ */
  function hookHud() {
    const ov = $("jx-ov"); if (!ov) return setTimeout(hookHud, 800);
    new MutationObserver(() => {
      const on = ov.style.display !== "none";
      document.body.classList.toggle("jv-hud", on);
    }).observe(ov, { attributes: true, attributeFilter: ["style"] });
  }
  const GHOSTS = [];
  function syncGhosts() {
    const tt = $("tm-top");
    const on = !!S.ghosts && !!tt && !tt.hidden && tt.style.display !== "none";
    const n = on ? $$("#tm-avs .tm-av").length : 0;
    while (GHOSTS.length < n) {
      const c = document.createElement("div"); c.className = "jv-ghost"; c.textContent = "👤";
      c.style.color = ["#35d6e8", "#a78bfa", "#fbbf24", "#34d399", "#fb7185"][GHOSTS.length % 5];
      const cm = document.querySelector(".cmain"); if (cm) cm.appendChild(c);
      GHOSTS.push({ el: c, x: 100 + Math.random() * 400, y: 200 + Math.random() * 200, dx: Math.random() * 1.4 + .4, dy: Math.random() * 1.4 + .2, t: 0 });
    }
    while (GHOSTS.length > n) { const g = GHOSTS.pop(); g && g.el && g.el.remove(); }
    if (on && !GHOSTS._iv) GHOSTS._iv = setInterval(ghostLoop, 40);
    if (!on && GHOSTS._iv) { clearInterval(GHOSTS._iv); GHOSTS._iv = null; }
  }
  function ghostLoop() {
    GHOSTS.forEach((g, i) => {
      const cm = document.querySelector(".cmain"); if (!cm) return;
      const r = cm.getBoundingClientRect();
      g.x += g.dx * 8; g.y += g.dy * 6; g.t += .05;
      if (g.x < 10 || g.x > r.width - 30) g.dx *= -1;
      if (g.y < 10 || g.y > r.height - 30) g.dy *= -1;
      g.el.style.transform = `translate(${g.x + (i * 13)}px, ${g.y}px) rotate(${Math.sin(g.t) * 14}deg)`;
    });
  }
  setInterval(() => { const t = $("tm-top"); if (t) syncGhosts(); }, 2500);
  function subtitleToggle() {
    if (S.voiceOnly && !$("jv-sub")) {
      const s = document.createElement("div"); s.id = "jv-sub"; s.className = "jv-sub";
      document.body.appendChild(s);
    } else if (!S.voiceOnly) { const s = $("jv-sub"); if (s) s.remove(); }
  }
  subtitleToggle();

  /* ═══════════════ 49 · DEMO REPLAY THEATER (landing) ═══════════════ */
  function demoTheater() {
    const body = document.querySelector(".lp-chat-body"); if (!body || !$("home-screen") || $("home-screen").classList.contains("hidden")) return;
    if (!$("jv-demo-scr")) { const s = document.createElement("style"); s.id = "jv-demo-scr"; s.textContent = ".lp-chat-body .lp-msg{opacity:0;transform:translateY(8px);transition:.5s}.lp-chat-body .lp-msg.jv-demo-in{opacity:1;transform:none}"; document.head.appendChild(s); }
    $$(".lp-msg", body).forEach(n => n.remove());
    $$(".lp-modes", body).forEach(n => n.remove());
    const SCRIPT_ = [
      ["user", "JARVIK, stress-test my launch plan — we ship in 11 days."],
      ["bot", "On it. I mapped the critical path: auth flow is the long pole. I prepped a risk register and assigned your three reviewers. Want me to draft the rollback plan?"],
      ["user", "Yes — and generate a burndown dashboard."],
      ["bot", "Burndown is live in your Co-Work Canvas ▶ — drag the slider to test scenarios. I flagged Day 8 as your risk peak."]
    ];
    let i = 0;
    const next = () => {
      if (!$("home-screen") || $("home-screen").classList.contains("hidden")) return;
      if ($("app") && !$("app").classList.contains("hidden")) return;
      const [role, text] = SCRIPT_[i++ % SCRIPT_.length];
      const el = document.createElement("div"); el.className = "lp-msg " + role;
      el.innerHTML = role === "bot" ? `<span class="lp-avatar">${REACTOR}</span><span class="lp-msg-text"></span>` : `<span class="lp-msg-text"></span>`;
      body.appendChild(el);
      requestAnimationFrame(() => el.classList.add("jv-demo-in"));
      const msg = el.querySelector(".lp-msg-text");
      if (role === "bot") { let k = 0; const tiv = setInterval(() => { msg.textContent = text.slice(0, k += 3); if (k >= text.length) { clearInterval(tiv); setTimeout(next, 2600); } }, 28); }
      else setTimeout(next, 1800);
      while (body.children.length > 4) body.firstElementChild.remove();
    };
    setTimeout(next, 1400);
  }

  /* ═══════════════ BOOST HUB (settings panel) ═══════════════ */
  function boostHub() {
    const sw = (k, lbl, desc) => `<label class="jv-srow"><span>${lbl}${desc ? `<i>${desc}</i>` : ""}</span><span class="jv-sw"><input type="checkbox" data-k="${k}" ${S[k] ? "checked" : ""}><i></i></span></label>`;
    const ov = jvModal("jv-hub", `<span class="jv-mico">⚡</span> Boost Hub`, `
      <div class="jv-hub-group"><b>🎬 Cinematics</b>
        ${sw("boot", "Boot sequence", "Iron-Man style reactor ignition on launch")}
        ${sw("trail", "Cursor trail", "Reactor-tinted particle trail")}
        ${sw("crt", "CRT / Hologram skin", "Scanlines + flicker overlay")}
        <label class="jv-srow"><span>Accent color<i>Reactor, buttons, glows</i></span><select class="jv-sel" data-k="accent">${Object.keys(ACCENTS).map(a => `<option value="${a}"${a === S.accent ? " selected" : ""}>${a}</option>`).join("")}</select></label>
        <label class="jv-srow"><span>Follow system theme<i>Light mode when your OS is light</i></span><span class="jv-sw"><input type="checkbox" data-k="themeAuto" ${S.themeAuto ? "checked" : ""}><i></i></span></label>
      </div>
      <div class="jv-hub-group"><b>🔊 Sound</b>
        <label class="jv-srow"><span>UI volume<i>Chirps on send, receive, boot</i></span><input type="range" class="jv-rng" data-k="sfx" min="0" max="1" step="0.05" value="${S.sfx}"></label>
      </div>
      <div class="jv-hub-group"><b>🧠 Intelligence</b>
        ${sw("autoRoute", "Smart model auto-router", "Code prompts route to a coder model")} 
        <label class="jv-srow"><span>Coder model for routing</span><input class="jv-in" data-k="routeCode" value="${esc(S.routeCode)}"></label>
        <label class="jv-srow"><span>Reply style dial<i>0 = telepathic brevity · 4 = detailed mentor</i></span><input type="range" class="jv-rng" data-k="dial" min="0" max="4" step="1" value="${S.dial}"></label>
        ${sw("trace", "Mission Trace drawer", "Latency + tokens under each reply")}
        <button class="jv-btn ghost jv-mini-act" data-open="memory">🧠 Edit Memory Panel</button>
      </div>
      <div class="jv-hub-group"><b>🤖 Agents & Tools</b>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-open="agents">🤖 Agent Studio</button><button class="jv-btn ghost jv-mini-act" data-open="debate">⚔️ Debate Arena</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-open="shell">⌨️ JARVIK Shell</button><button class="jv-btn ghost jv-mini-act" data-open="regex">🧪 Regex Lab</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-open="shot">📸 Screenshot to context</button><button class="jv-btn ghost jv-mini-act" data-open="pulse">📊 Usage Pulse</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-open="export">⬇ Export Hub</button><button class="jv-btn ghost jv-mini-act" data-open="cheat">⭐ Cheat Sheet</button></div>
      </div>
      <div class="jv-hub-group"><b>📱 Presence</b>
        ${sw("notify", "Desktop notifications", "Notify when JARVIK replies while tab is hidden")}
        ${sw("empty", "Branded empty state", "Orbiting reactor + starter chips")}
        ${sw("ghosts", "Team-room cursor ghosts", "Decorative teammate cursors")}
        ${sw("voiceOnly", "Voice-only Agent mode", "TTS subtitles instead of big bubbles")}
        ${sw("wake", "Wake word on next launch", "\"Hey JARVIK\" — ambient mic (extras HUD)")}
      </div>
      <div class="jv-hub-group"><b>🧨 Maintenance</b>
        <div class="jv-row2"><button class="jv-btn ghost" id="jv-hub-reboot">▶ Replay boot</button><button class="jv-btn ghost" id="jv-hub-purge">🧹 Purge Boost data</button></div>
      </div>`);
    ov.classList.remove("hidden"); chirp("open");
    $$("input[type=checkbox][data-k]", ov).forEach(i => i.onchange = () => {
      const k = i.dataset.k; S[k] = i.checked; jvSave(); applyBodyState(); subtitleToggle();
      if (k === "wake") extrasWakeToggle(i.checked);
      if (k === "notify" && i.checked) requestNotify();
      if (k === "themeAuto" && i.checked) themeAuto();
      if (k === "empty") jvEmptyCheck();
      if (k === "notify" || k === "trace" || k === "pod" || k === "ghosts") { /* apply later */ }
    });
    $$("input[type=range][data-k]", ov).forEach(i => i.oninput = () => { S[i.dataset.k] = parseFloat(i.value); jvSave(); });
    $$("input.jv-in[data-k],select[data-k]", ov).forEach(i => i.onchange = () => { S[i.dataset.k] = i.value; jvSave(); applyBodyState(); });
    $$("button.jv-mini-act", ov).forEach(b => b.onclick = () => { const k = b.dataset.open; ov.classList.add("hidden"); ({ memory: memoryPanel, agents: agentStudio, debate: () => debateArena(""), shell: shell, regex: regexLab, shot: screenshotCtx, pulse: pulseDashboard, export: exportHub, cheat: cheatSheet }[k] || (() => {}))(); });
    $("jv-hub-reboot").onclick = () => { ov.classList.add("hidden"); playBoot(); };
    $("jv-hub-purge").onclick = () => { ["jv_boost", "jv_memory", "jv_docs", "jv_pulse", "jv_onboarded", "jv_pwa_dismiss"].forEach(k => localStorage.removeItem(k)); S = Object.assign({}, DEF); applyBodyState(); ov.classList.add("hidden"); jvToast("Boost data purged — reload to reset defaults"); };
  }
  function requestNotify() { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); }
  function extrasWakeToggle(on) {
    localStorage.setItem("jx_wake", on ? "1" : "0");
    jvToast(on ? "Wake word set — takes effect on next launch (or open Voice HUD)" : "Wake word off after reload");
  }
  function themeAuto() {
    const prefersLight = matchMedia("(prefers-color-scheme: light)").matches;
    const isLight = document.body.classList.contains("light-mode");
    if (prefersLight && !isLight || !prefersLight && isLight) { const t = $("theme-toggle"); if (t) t.click(); }
  }
  if (S.themeAuto) setTimeout(() => themeAuto(), 400);

  /* ═══════════════ SLASH INTERCEPT ═══════════════ */
  const CMDS = {
    "img": u => { const p = u.trim(); if (!p) return jvToast("usage: /img a neon samurai robot"); genImage(p); return true; },
    "fetch": u => { const m = (u || "").trim().match(/^\S+$/); if (!m) return jvToast("usage: /fetch https://example.com"); urlFetch(m[0]); return true; },
    "yt": u => { if (!u.trim()) return jvToast("usage: /yt https://youtube.com/watch?v=…"); ytToNotes(u.trim()); return true; },
    "json": () => { showJsonTree(); return true; },
    "agents": () => { agentStudio(); return true; },
    "debate": u => { debateArena(u.trim()); return true; },
    "memory": () => { memoryPanel(); return true; },
    "shell": () => { shell(); return true; },
    "regex": () => { regexLab(); return true; },
    "pulse": () => { pulseDashboard(); return true; },
    "hub": () => { boostHub(); return true; },
    "cheatsheet": () => { cheatSheet(); return true; },
    "exportpdf": () => { exportPDF(); return true; },
    "share": () => { shareCard(); return true; },
    "shot": () => { screenshotCtx(); return true; },
    "crt": u => { const a = (u || "").trim().toLowerCase(); S.crt = a === "on" ? true : a === "off" ? false : !S.crt; jvSave(); applyBodyState(); jvToast("CRT " + (S.crt ? "ON" : "OFF")); return true; },
    "accent": u => { const a = (u || "").trim().toLowerCase(); if (ACCENTS[a]) { S.accent = a; jvSave(); applyBodyState(); jvToast("Accent → " + a); } else jvToast("accents: " + Object.keys(ACCENTS).join(", ")); return true; },
    "trace": () => { S.trace = !S.trace; jvSave(); jvToast("Mission Trace " + (S.trace ? "on" : "off") + " — next replies"); return true; },
    "boot": () => { playBoot(); return true; }
  };
  async function interceptSend(raw) {
    const t = (raw || "").trim();
    if (!t.startsWith("/")) return false;
    const sp = t.indexOf(" ");
    const cmd = (sp === -1 ? t : t.slice(0, sp)).slice(1).toLowerCase();
    const arg = sp === -1 ? "" : t.slice(sp + 1);
    const h = CMDS[cmd];
    if (!h) return false;
    try { chirp("send"); } catch (e) {}
    return h(arg) !== false;
  }

  /* ═══════════════ DOM INJECTIONS: topbar, sidebar, pod ═══════════════ */
  function injectTopbar() {
    const tb = document.querySelector(".tb-hero-tools"); if (!tb || $("jv-boost-top")) return;
    const b = document.createElement("button"); b.id = "jv-boost-top"; b.className = "jv-boost-btn"; b.title = "Open Boost Hub (all 50 enhancements)";
    b.innerHTML = `<span>⚡</span><span class="jv-btn-lbl">Boost</span>`;
    b.onclick = boostHub;
    tb.insertBefore(b, tb.firstChild);
  }
  function injectSidebar() {
    const host = document.querySelector(".sbt");
    if (!host || $("jv-side-group")) return;
    const d = document.createElement("details"); d.className = "sb-details"; d.id = "jv-side-group";
    d.innerHTML = `<summary class="sb-summary">⚡ Boost Pack <span class="pulse-tag">ON</span></summary>
      <div class="sbn-inner">
        <div class="trow" data-go="agents">🚀 <span>Agent Studio</span><span class="badge-count" style="background:var(--jv-a1)">AI</span></div>
        <div class="trow" data-go="debate">⚔️ <span>Debate Arena</span></div>
        <div class="trow" data-go="memory">🧠 <span>Memory Panel</span></div>
        <div class="trow" data-go="shell">⌨️ <span>JARVIK Shell</span></div>
        <div class="trow" data-go="regex">🧪 <span>Regex Lab</span></div>
        <div class="trow" data-go="pulse">📊 <span>Usage Pulse</span></div>
        <div class="trow" data-go="export">⬇ <span>Export Hub</span></div>
        <div class="trow" data-go="cheat">⭐ <span>Cheat Sheet (?)</span></div>
        <div class="trow" data-go="hub">⚙️ <span>Boost Hub</span></div>
      </div>`;
    host.appendChild(d);
    $$(".trow", d).forEach(t => t.onclick = () => { ({ agents: agentStudio, debate: () => debateArena(""), memory: memoryPanel, shell: shell, regex: regexLab, pulse: pulseDashboard, export: exportHub, cheat: cheatSheet, hub: boostHub })[t.dataset.go](); });
  }
  function injectOnboardingOnce() { /* handled in watchApp */ }

  /* ═══════════════ observe rendered messages (chips, mermaid, widen) ═══════════════ */
  function hookChatObs() {
    const cc = $("chat-container"); if (!cc) return setTimeout(hookChatObs, 500);
    new MutationObserver(muts => {
      muts.forEach(m => (m.addedNodes || []).forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.classList && n.classList.contains("bot")) hookMermaid(n);
        else hookMermaid(n.closest ? n.closest(".mr.bot") : null);
      }));
    }).observe(cc, { childList: true, subtree: true });
    /* wire existing msg-action bars lazily */
    setInterval(() => {
       $$(".mr.bot").forEach(r => { if (r.querySelector(".msg-actions") && (r.innerText || "").length && !r.dataset.jvChips) inlineChips(r, r.dataset.prompt || r.innerText.slice(0, 200)); });
    }, 1200);
  }


  /* ═══════════════ init ═══════════════ */
  function init() {
    applyAccent(); applyBodyState();
    injectTopbar(); injectSidebar(); injectPod();
    hookChatObs(); hookXlsx();
    watchApp();
    jvEmptyCheck();
    demoTheater();
    hookHud();
    xpRing(); setTimeout(xpRing, 2500);
    streamTick();
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", init);
  else setTimeout(init, 0);

  /* exposed API — script.js patches call into here */
  window.JV = {
    version: "1.0.0 · Boost Pack",
    systemTune: sysTune,
    routeModel: routeModel,
    interceptSend: interceptSend,
    afterStream: afterStream,
    openHub: boostHub,
    toast: jvToast
  };
})();
