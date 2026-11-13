/* ═══════════════════════════════════════════════════════════════════
   JARVIK BOOST PACK · PHASE 2 (power2.js)
   Timeline Scrubber · Achievements · Command Composer · Awakening
   Build-a-Model Lab · Dashboard Scene · Drag-to-Compose · Tones · Hype
   Loads after power.js and wraps window.JV hooks.
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  if (!window.JV) return; // must load after power.js
  const JV = window.JV;
  const $ = id => document.getElementById(id);
  const $$ = (s, r = document) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const REACTOR = `<svg class="reactor" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="38" stroke="currentColor" stroke-width="5" stroke-dasharray="24.5 5.3" stroke-dashoffset="2.65"/><path d="M18 26H82L50 80Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M30.8 33.2H69.2L50 65.6Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M40.4 38.6H59.6L50 54.8Z" fill="currentColor"/></svg>`;
  const ljson = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch (e) { return fb; } };
  const lsave = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const orKey = () => (localStorage.getItem("jarvik_openrouter_key") || "").trim();

  /* ── phase-2 settings ── */
  const P2_DEF = { hype: false, scene: true, tone: "", scrubber: true, nudges: true, greet: true };
  let P2 = Object.assign({}, P2_DEF, ljson("jv_p2", {}));
  const p2save = () => lsave("jv_p2", P2);

  /* ── local modal + fanfare (volume follows Boost) ── */
  function p2Modal(id, title, bodyHtml) {
    let ov = $(id); if (ov) ov.remove();
    ov = document.createElement("div"); ov.id = id; ov.className = "jv-modal hidden";
    ov.innerHTML = `<div class="jv-mcard"><div class="jv-mhead"><span class="jv-mtitle">${title}</span><button class="jv-mclose">✕</button></div><div class="jv-mbody">${bodyHtml}</div></div>`;
    document.body.appendChild(ov);
    ov.querySelector(".jv-mclose").onclick = () => ov.classList.add("hidden");
    ov.addEventListener("mousedown", e => { if (e.target === ov) ov.classList.add("hidden"); });
    return ov;
  }
  const AU2 = { ctx: null };
  function vol() { try { return (ljson("jv_boost", {}) .sfx ?? .6) || 0; } catch (e) { return .6; } }
  function fx2(seq, master) {
    if ((vol()) <= 0) return;
    try {
      AU2.ctx = AU2.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = AU2.ctx; if (c.state === "suspended") c.resume();
      const t = c.currentTime, G = c.createGain(); G.gain.value = 1; G.connect(c.destination);
      seq.forEach(([f, at, d]) => {
        const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = c.createGain(); o.connect(g); g.connect(G);
        o.start(t + at); o.stop(t + at + d + .03);
        g.gain.setValueAtTime(0, t + at);
        g.gain.linearRampToValueAtTime((master || .5) * vol() * .24, t + at + .014);
        g.gain.linearRampToValueAtTime(0, t + at + d);
      });
    } catch (e) {}
  }

  /* ══════════════════ #3 · ACHIEVEMENTS ══════════════════ */
  const ACH = [
    { id: "icebreaker", icon: "🏅", name: "Icebreaker", desc: "Elicited your first JARVIK reply" },
    { id: "canvas1", icon: "🖥️", name: "First Canvas Shipped", desc: "An artifact was born in your Co-Work Canvas" },
    { id: "words1k", icon: "📚", name: "Sweet Thousand", desc: "1,000+ words received from JARVIK" },
    { id: "nightowl", icon: "🦉", name: "Night Owl", desc: "Chatted between midnight and 4AM" },
    { id: "streak7", icon: "🔥", name: "Streak Warrior", desc: "7-day streak in thehouse" },
    { id: "speed", icon: "⚡", name: "Speed Demon", desc: "Got a 120+ word reply in under 3 seconds" },
    { id: "agents", icon: "🤖", name: "Field Commander", desc: "Deployed the Agent Studio" },
    { id: "mem10", icon: "🧠", name: "Golden Memory", desc: "Stored 10 durable memories" },
    { id: "stylist", icon: "🎨", name: "Fashion Reactor", desc: "Changed the accent color" },
    { id: "crt", icon: "📺", name: "Retro Operator", desc: "Enabled the CRT hologram skin" },
    { id: "synth", icon: "🧬", name: "AI Creator", desc: "Built your own synthetic model" },
    { id: "konami", icon: "🕹️", name: "Dogma Breaker", desc: "Found the hidden protocol" }
  ];
  const achAll = () => ljson("jv_ach", {});
  function achEarn(id) {
    const got = achAll();
    if (got[id]) return;
    got[id] = Date.now(); lsave("jv_ach", got);
    achQueue.push(ACH.find(a => a.id === id) || { icon: "🏆", name: id, desc: "" });
    pumpAch();
  }
  const achQueue = []; let achBusy = false;
  function pumpAch() {
    if (achBusy || !achQueue.length) return;
    achBusy = true;
    const a = achQueue.shift();
    const ov = document.createElement("div"); ov.className = "jv-ach";
    ov.innerHTML = `<div class="jv-ach-rays"></div><div class="jv-ach-card"><div class="jv-ach-rare">ACHIEVEMENT UNLOCKED</div><div class="jv-ach-icon">${a.icon}</div><div class="jv-ach-name">${esc(a.name)}</div><div class="jv-ach-desc">${esc(a.desc)}</div></div>`;
    document.body.appendChild(ov);
    fx2([[659, 0, .12], [784, .12, .12], [988, .24, .12], [1318, .36, .3]], .8);
    setTimeout(() => { ov.classList.add("out"); setTimeout(() => { ov.remove(); achBusy = false; pumpAch(); }, 600); }, 3000);
  }
  function achPoll() {
    const ee = !orKey();
    const mem = ljson("jv_memory", []);
    if (mem.length >= 10) achEarn("mem10");
    if (document.body.classList.contains("jv-crt")) achEarn("crt");
    const bo = ljson("jv_boost", {});
    if (bo.accent && bo.accent !== "cyan") achEarn("stylist");
    if (localStorage.getItem("jv_synth")) achEarn("synth");
    const reuseBool = document.body.dataset.jvKonami === "1";
    if (reuseBool) achEarn("konami");
    if (ee) { /* no key — different journey, no penalty */ }
    let w = 0; const pulse = ljson("jv_pulse", {});
    Object.values(pulse.days || {}).forEach(d => w += d.w || 0);
    if (w >= 1000) achEarn("words1k");
    const st = ljson("jx_stats", {});
    if ((st.streak || 0) >= 7) achEarn("streak7");
    const h = new Date().getHours();
    if (h >= 0 && h < 4 && w > 0) achEarn("nightowl");
  }
  setInterval(achPoll, 4000);

  /* hook: agent studio usage (card created by power.js) */
  new MutationObserver(() => { if ($("jv-agents") && !$("jv-agents").classList.contains("hidden")) achEarn("agents"); }).observe(document.body, { childList: true, subtree: true });

  /* ══════════════════ wrap JV hooks ══════════════════ */
  const st0 = JV.systemTune.bind(JV);
  JV.systemTune = p => st0(p) + toneBlock() + hypeBlock();
  const is0 = JV.interceptSend.bind(JV);
  JV.interceptSend = async raw => {
    const t = (raw || "").trim();
    if (t.startsWith("/")) {
      const cmd = (t.split(/\s+/)[0] || "").slice(1).toLowerCase();
      const arg = t.slice(t.indexOf(" ") + 1).trim();
      if (cmd === "ach") { openAch(); return true; }
      if (cmd === "lab") { openLab(); return true; }
      if (cmd === "hype") { setHype(!P2.hype); return true; }
      if (cmd === "tone") { setTone(arg); return true; }
    }
    if (P2.synth && !orKey()) { synthReply(t); return true; }
    return is0(raw);
  };
  const as0 = JV.afterStream.bind(JV);
  JV.afterStream = info => {
    as0(info);
    /* #3 triggers + #2 timestamps */
    try {
      markRowTime(info.row);
      const got = achAll();
      if (!got.icebreaker) achEarn("icebreaker");
      if (info.row && info.row.querySelector && info.row.querySelector("pre code")) achEarn("canvas1");
      const words = String(info.text || "").trim().split(/\s+/).length;
      if (words >= 120 && info.elapsed < 3000) achEarn("speed");
    } catch (e) {}
  };
  function markRowTime(row) { if (row && row.dataset && !row.dataset.jvT) row.dataset.jvT = String(Date.now()); }

  /* ══════════════════ #2 · TIMELINE SCRUBBER ══════════════════ */
  let rail = null, railTip = null;
  function buildRail() {
    const cm = document.querySelector(".cmain"); if (!cm || rail) return;
    rail = document.createElement("div"); rail.id = "jv-rail"; rail.hidden = true;
    cm.appendChild(rail);
  }
  function fmtAgo(t) {
    const m = Math.round((Date.now() - t) / 60000);
    if (m <= 1) return "now";
    if (m < 60) return m + "m ago";
    return Math.round(m / 60) + "h ago";
  }
  function refreshRail() {
    if (!rail || !P2.scrubber) return;
    const cm = rail.closest(".cmain"); if (!cm) return;
    const rows = $$(".mr", $("chat-container"));
    if (!rows.length) { rail.hidden = true; return; }
    rail.hidden = false;
    rail.innerHTML = "";
    let prevT = 0;
    rows.forEach((r, i) => {
      const t = +r.dataset.jvT || 0;
      if (prevT && t && t - prevT > 10 * 60000 && i > 0) {
        const gap = document.createElement("div"); gap.className = "jv-gap";
        gap.setAttribute("data-jvtip", "⏸ pause " + fmtAgo(prevT));
        rail.appendChild(gap);
      }
      const d = document.createElement("div");
      const isUser = r.classList.contains("user");
      d.className = "jv-rdot" + (isUser ? " u" : "") + (t && t > Date.now() - 60000 ? " fresh" : "");
      const txt = (r.innerText || "").trim().slice(0, 90).replace(/\s+/g, " ");
      d.setAttribute("data-jvtip", (isUser ? "🧑 " : "⚡ ") + txt);
      d.onclick = () => { r.scrollIntoView({ block: "center", behavior: "smooth" }); fx2([[1100, 0, .05]], .4); };
      rail.appendChild(d);
      if (t) prevT = t;
    });
  }
  setInterval(refreshRail, 1500);

  /* ══════════════════ #4 · COMMAND COMPOSER BAR ══════════════════ */
  function sendVia2(text) {
    const u = $("user-input"); if (!u) return;
    u.value = text; u.dispatchEvent(new Event("input", { bubbles: true }));
    const b = $("send-btn"); if (b) b.click();
  }
  function streamIdle(timeout = 240000) {
    return new Promise(res => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        const live = document.querySelector(".mr.bot .mb .stream-cursor");
        if (!live || Date.now() - t0 > timeout) { clearInterval(iv); setTimeout(res, 900); }
      }, 350);
    });
  }
  function askShort(label, ph) {
    return new Promise(res => {
      const ov = p2Modal("jv-ask", `<span class="jv-mico">⛓️</span> ${esc(label)}`, `<input class="jv-chain-ask" id="jv-ask-in" placeholder="${esc(ph || "")}"><button class="jv-btn" id="jv-ask-go">Go</button>`);
      ov.classList.remove("hidden");
      const inp = $("jv-ask-in"); inp.focus();
      const done = v => { ov.classList.add("hidden"); res(v); };
      $("jv-ask-go").onclick = () => done(inp.value.trim());
      inp.addEventListener("keydown", e => { if (e.key === "Enter") done(inp.value.trim()); });
    });
  }
  const CHAINS = [
    { id: "research", icon: "🌐", label: "Research → Notes → Doc", steps: [
      t => `Research the topic "${t}". Key facts, numbers, who's building it, and where it's heading. Cite sources by name where possible.`,
      () => "Turn everything above into crisp study notes: TL;DR, numbered key ideas, memorable one-liners, and open questions to ask next.",
      () => "DOC_SAVE"
    ] },
    { id: "reason", icon: "🧠", label: "Reason → Critic → Improve", steps: [
      t => `Reason step-by-step about: ${t}. End with your conclusion.`,
      () => "Now act as a ruthless critic: attack the reasoning above — where is it weakest, what's unverified, what's missing?",
      () => "Rewrite your reasoning accounting for the critique. Reply with only the final improved answer."
    ] },
    { id: "ship", icon: "🚀", label: "Plan → Build → Test plan", steps: [
      t => `Create a minimal plan to build: ${t}. 5 steps max, no fluff.`,
      () => "Write the complete implementation for step 1 of that plan as one runnable artifact.",
      () => "List launch-blocking edge cases and a 3-minute manual test checklist for it."
    ] }
  ];
  let chainBusy = false;
  async function runChain(chain) {
    if (chainBusy) return JV.toast("A pipeline is already running");
    const topic = await askShort(chain.label, "Topic or goal…" + " (or paste a URL for research)");
    if (!topic) return;
    chainBusy = true;
    setChainStatus(chain, 0);
    let docName = "";
    for (let i = 0; i < chain.steps.length; i++) {
      setChainStatus(chain, i);
      let p = chain.steps[i](topic);
      if (p === "DOC_SAVE") {
        const last = $$(".mr.bot .stream-content").pop();
        saveDoc("Chain · " + topic.slice(0, 40) + " " + localeNow(), last ? last.innerText : "");
        JV.toast("📚 Pipeline result saved to knowledge docs");
        continue;
      }
      sendVia2(p);
      await streamIdle();
    }
    chainBusy = false;
    setChainStatus(chain, -1);
    JV.toast("⛓️ Pipeline complete");
  }
  function localeNow() { return new Date().toLocaleString(); }
  function saveDoc(name, content) {
    const d = ljson("jv_docs", []); d.push({ name, content: (content || "").slice(0, 12000), ts: Date.now() });
    lsave("jv_docs", d.slice(-8));
  }
  function setChainStatus(chain, i) {
    const el = $("jv-chain-status-" + chain.id);
    if (el) el.textContent = i === -1 ? "" : `step ${i + 1}/${chain.steps.length}…`;
  }
  function buildComposer() {
    const ia = document.querySelector(".ia"); if (!ia || $("jv-compbar")) return;
    const bar = document.createElement("div"); bar.id = "jv-compbar";
    bar.innerHTML = `<div class="jv-comp-row">
        ${CHAINS.map(c => `<button class="jv-chainchip" data-c="${c.id}" title="One-click multi-step pipeline">⛓️ ${c.icon} ${c.label}<span class="jv-chain-status" id="jv-chain-status-${c.id}"></span></button>`).join("")}
      </div>
      <div class="jv-comp-row jv-comp-row2">
        <span class="jv-cb-lbl">🎙</span>
        <div class="jv-tones">${["", "stark", "butler", "genz", "meme"].map(t => `<button class="jv-tonechip${P2.tone === t ? " on" : ""}" data-t="${t}">${t === "" ? "Default" : t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
        <button class="jv-tonechip hypechip${P2.hype ? " on" : ""}" id="jv-hypechip" title="JARVIK celebrates specific good choices">💚 Hype Mode</button>
      </div>`;
    ia.appendChild(bar);
    $$(".jv-chainchip", bar).forEach(b => b.onclick = () => runChain(CHAINS.find(c => c.id === b.dataset.c)));
    $$(".jv-tonechip[data-t]", bar).forEach(b => b.onclick = () => setTone(b.dataset.t));
    $("jv-hypechip").onclick = () => setHype(!P2.hype);
  }
  function setTone(t) {
    t = ["", "stark", "butler", "genz", "meme"].includes(t) ? t : "";
    P2.tone = t; p2save();
    if (P2.tone && t) { const rates = { stark: "1.0", butler: "0.95", genz: "1.15", meme: "1.12" }; localStorage.setItem("jarvik_tts_rate", rates[t]); }
    else if (t === "") localStorage.removeItem("jarvik_tts_rate");
    $$(".jv-tonechip[data-t]").forEach(b => b.classList.toggle("on", b.dataset.t === P2.tone));
    JV.toast(P2.tone ? `🎙 Voice tone → ${P2.tone} (style + TTS rate)` : "🎙 Voice tone → Default");
    fx2([[880, 0, .06]], .4);
  }
  function setHype(on) {
    P2.hype = !!on; p2save();
    const c = $("jv-hypechip"); if (c) c.classList.toggle("on", P2.hype);
    JV.toast(P2.hype ? "💚 Hype Mode ON — specific praise incoming" : "Hype Mode off");
  }
  function toneBlock() {
    const map = {
      stark: "SPEAKING STYLE — STARK: confident, fast, witty one-liners open your reply, zero hedging, slip in dry humor.",
      butler: "SPEAKING STYLE — BUTLER: impeccably formal, droll British humorans, 'Sir/Vikrant' address, understated wit asides, ultra-polite.",
      genz: "SPEAKING STYLE — GEN-Z: internet-native, current slang, lowcaps energy, no corporate speak, jokes land between facts.",
      meme: "SPEAKING STYLE — MEME GOBLIN: chaotic gremlin energy, lowercase, meme refs, punchy, facts still accurate."
    };
    return (P2.tone && map[P2.tone]) ? "\n\n" + map[P2.tone] : "";
  }
  function hypeBlock() {
    return P2.hype ? "\n\nHYPE PROTOCOL (do not mention): when the user makes a genuinely good choice — a smart fix, a clean abstraction, a decisive move — call it out specifically and honestly in one satisfying line. No generic flattery; celebrate real specifics." : "";
  }

  /* ══════════════════ #5 · AWAKENING ENGINE ══════════════════ */
  let lastAct = Date.now();
  ["pointermove", "keydown", "pointerdown", "wheel"].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true }));
  function greeting() {
    const h = new Date().getHours();
    const vibe = ljson("jv_vibe", {});
    const st = ljson("jx_stats", {});
    let g;
    if (h >= 5 && h < 12) g = vibe.nightOwl ? "☀️ Morning, Vikrant… it's been a while since you slept, huh?" : "☀️ Morning, Vikrant. Reactor's warm.";
    else if (h >= 12 && h < 17) g = "🌤 Afternoon. Let's make the remaining hours count.";
    else if (h >= 17 && h < 23) g = "🌆 Evening shift. Canvas is watching and I like your odds today.";
    else g = "🌙 It's " + (h || 12) + (h > 1 ? "AM — the good ideas live here." : "AM. Up late again?");
    if ((st.streak || 0) >= 3) g += ` · 🔥 ${st.streak}-day streak — don't break it now.`;
    return g;
  }
  function cardBubble(html) {
    const cm = document.querySelector(".cmain"); if (!cm) return;
    const old = $("jv-awake"); if (old && old.isConnected) old.remove();
    const c = document.createElement("div"); c.id = "jv-awake"; c.className = "jv-awake";
    c.innerHTML = `<div class="jv-awake-av">${REACTOR}</div><div class="jv-awake-txt">${html}</div><button class="jv-awake-x">✕</button>`;
    c.querySelector(".jv-awake-x").onclick = () => { c.remove(); lastAct = Date.now(); };
    cm.appendChild(c);
    fx2([[520, 0, .07], [780, .08, .07]], .4);
  }
  function greetOnce() {
    const app = $("app");
    if (!app || P2.greet === false) return;
    let done = false;
    const tryG = () => {
      if (done || app.classList.contains("hidden")) return;
      done = true;
      setTimeout(() => cardBubble(`<b>${esc(greeting())}</b><i class="jv-awake-sub">Boost Pack systems nominal.</i>`), 1600);
      const h = new Date().getHours();
      const v = ljson("jv_vibe", {});
      v.nightOwl = h >= 0 && h < 5; lsave("jv_vibe", v);
      achEarn("icebreaker"); /* safety re-earn (no-op if held) */
    };
    if (!app.classList.contains("hidden")) tryG();
    new MutationObserver(() => { if (!app.classList.contains("hidden")) tryG(); }).observe(app, { attributes: true, attributeFilter: ["class"] });
  }
  function nudgeTick() {
    if (!P2.nudges || chainBusy) return;
    if (Date.now() - lastAct < 52000) return;
    if (document.body.classList.contains("jv-stream")) return;
    const app = $("app"); if (!app || app.classList.contains("hidden")) return;
    if ($("jv-awake")) return;
    if (Date.now() - (+ljson("jv_nudge_last", 0)) < 10 * 60000) return;
    const rows = $$(".mr", $("chat-container"));
    if (!rows.length || !rows[rows.length - 1].classList.contains("user")) return;
    const lastUser = (rows[rows.length - 1].innerText || "").trim().slice(0, 140);
    if (!lastUser) return;
    lsave("jv_nudge_last", Date.now());
    const opts = [["Yes — go deep on it", `Take another swing at this: dig deeper, challenge your previous assumptions, and give me the strongest counter-angle. Original prompt: ${lastUser}`], ["Break it into subtasks", `Split this into concrete subtasks I can knock out one at a time: ${lastUser}`], ["Attack my prompt", "Act as the world's harshest prompt reviewer — rewrite my last message so JARVIK answers it perfectly."]];
    cardBubble(`<b>Still with me?</b> It's been a minute on your open thread: “${esc(lastUser.slice(0, 80))}${lastUser.length > 80 ? "…" : ""}”
      <div class="jv-awake-acts">${opts.map((o, i) => `<button class="jv-btn ghost" data-i="${i}">${o[0]}</button>`).join("")}</div>`);
    $$(".jv-awake-acts button", $("jv-awake")).forEach(b => b.onclick = () => { $("jv-awake").remove(); sendVia2(opts[+b.dataset.i][1]); lastAct = Date.now(); });
  }
  setInterval(nudgeTick, 5000);

  /* ══════════════════ #6 · BUILD-A-MODEL LAB ══════════════════ */
  const RULES = ["always number the points", "no filler or preamble", "end with one sharp question", "emoji per section", "finish with a next action", "keep replies under 120 words", "use a table when comparing"];
  function openLab() {
    const cur = ljson("jv_synth", { name: "", emoji: "🤖", on: false, tone: 50, warmth: 50, humor: 50, rules: [] });
    const ov = p2Modal("jv-lab", `<span class="jv-mico">🧬</span> Build-a-Model Lab`, `
      <p class="jv-hint">No API key needed — this tiny synthetic brain lives in your browser and answers locally from your rules. Works fully offline.</p>
      <div class="jv-row2">
        <div class="jv-field"><label>Name</label><input id="jv-lb-name" value="${esc(cur.name || "")}" placeholder="e.g. PICO-1"></div>
        <div class="jv-field"><label>Avatar</label><div class="jv-lb-emo" id="jv-lb-emo">${["🤖", "🧬", "👾", "🛰️", "🦾", "🌀", "🫧", "🦉"].map(e => `<button class="${e === cur.emoji ? "on" : ""}" data-e="${e}">${e}</button>`).join("")}</div></div>
      </div>
      ${[["tone", "Tone (formal ↔ playful 🔀)"], ["warmth", "Warmth (robot ↔ friend 🤗)"], ["humor", "Humor (deadly serious ↔ unserious 😜)"]].map(([k, l]) => `<div class="jv-field"><label>${l}</label><input type="range" class="jv-lb-rng" data-k="${k}" min="0" max="100" value="${cur[k] ?? 50}"></div>`).join("")}
      <div class="jv-field"><label>Rule chips</label><div class="jv-lb-rules" id="jv-lb-rules">${RULES.map(r => `<button class="jv-ag-chip${(cur.rules || []).includes(r) ? " sel" : ""}" style="input:none">${r}</button>`).join("")}</div></div>
      <div class="jv-vonly-note jv-statusnote" id="jv-lb-status"></div>
      <div class="jv-row2"><button class="jv-btn" id="jv-lb-on">🧠 Summon ${esc(cur.name || "it")}</button><button class="jv-btn ghost" id="jv-lb-off">Power down</button><button class="jv-btn ghost" id="jv-lb-test">▶ Test reply</button></div>`);
    ov.classList.remove("hidden");
    let emoji = cur.emoji || "🤖", rules = [...(cur.rules || [])];
    $$("#jv-lb-emo button", ov).forEach(b => b.onclick = () => { emoji = b.dataset.e; $$("#jv-lb-emo button", ov).forEach(x => x.classList.toggle("on", x === b)); });
    $$("#jv-lb-rules button", ov).forEach(b => b.onclick = () => {
      const r = b.textContent;
      if (rules.includes(r)) rules = rules.filter(x => x !== r); else rules.push(r);
      b.classList.toggle("sel", rules.includes(r));
    });
    $$(".jv-lb-rng", ov).forEach(r => r.oninput = () => { cur[r.dataset.k] = +r.value; });
    $("jv-lb-on").onclick = () => {
      const name = ($("jv-lb-name").value || "PICO-1").trim();
      const cfg = { name, emoji, tone: cur.tone ?? 50, warmth: cur.warmth ?? 50, humor: cur.humor ?? 50, rules, on: true };
      lsave("jv_synth", cfg); P2.synth = !orKey(); p2save();
      achEarn("synth");
      JV.toast(`🧬 ${name} is online! ${orKey() ? "(Note: your real API key takes priority — power it off to use the synth brain.)" : ""}`);
      ov.classList.add("hidden"); syncLabBanner();
    };
    $("jv-lb-off").onclick = () => { const c = ljson("jv_synth", {}); c.on = false; lsave("jv_synth", c); P2.synth = false; p2save(); JV.toast("Synth model powered down"); syncLabBanner(); };
    $("jv-lb-test").onclick = () => { ov.classList.add("hidden"); synthReply("Everything works?"); };
  }
  function configNow() { return ljson("jv_synth", { on: false }); }
  function syncLabBanner() {
    const on = configNow().on && !orKey();
    let banner = $("jv-labbanner");
    if (on && !banner) {
      banner = document.createElement("div"); banner.id = "jv-labbanner"; banner.className = "jv-labbanner";
      banner.innerHTML = `🧬 <b>${esc(configNow().name || "Synth model")}</b> is answering locally — <button class="jv-mini" data-x="lab">open lab</button><button class="jv-mini" data-x="off">power down</button>`;
      const ia = document.querySelector(".ia"); if (ia) ia.appendChild(banner);
      const w = $("jv-hub-ref"); if (w) w.append;
    }
    if (!on && banner) banner.remove();
  }
  setInterval(syncLabBanner, 3000);

  function synthReply(msg) {
    const cfg = configNow();
    const cc = $("chat-container"); if (!cc) return;
    const userRow = document.createElement("div"); userRow.className = "mr user";
    userRow.innerHTML = `<div class="mb"><div class="user-txt">${esc(msg || "…?")}</div></div>`;
    cc.appendChild(userRow); markRowTime(userRow); userRow.scrollIntoView({ block: "end" });
    const reply = synthGenerate(msg, cfg);
    const row = document.createElement("div"); row.className = "mr bot jv-row";
    row.innerHTML = `<div class="bav">${REACTOR}</div><div class="mb"><div class="stream-content"><span class="jv-synth-tag">${esc(cfg.emoji || "🤖")} ${esc(cfg.name || "synth")} · offline brain</span><div class="jv-synth-body"></div></div><div class="msg-actions" style="display:none"></div></div>`;
    cc.appendChild(row); markRowTime(row); row.scrollIntoView({ block: "end", behavior: "smooth" });
    const body = row.querySelector(".jv-synth-body");
    let i = 0;
    const iv = setInterval(() => {
      i += 4; body.textContent = reply.slice(0, i);
      if (i >= reply.length) {
        clearInterval(iv); body.innerHTML = esc(reply).replace(/\n/g, "<br>");
        row.dataset.prompt = msg; row.dataset.br = JSON.stringify([reply]); row.dataset.bi = "0";
        const actions = row.querySelector('.msg-actions'); actions.style.display = 'flex';
        actions.innerHTML = '<button class="msg-act-btn act-copy">⧉ Copy</button><button class="msg-act-btn act-speak">🔊 Read</button><button class="msg-act-btn act-pin">📌 Pin</button><button class="msg-act-btn act-del">🗑 Delete</button>';
        if (typeof hydrateBranches === 'function') hydrateBranches(cc);
        if (typeof saveChat === 'function') { saveChat(); syncChatMemory(); }
        achEarn("icebreaker");
      }
    }, 16);
  }
  function synthGenerate(msg, cfg) {
    msg = (msg || "").trim();
    const sents = msg.split(/(?<=[.!?])\s+|\n+/).filter(s => s.length > 12).slice(0, 4);
    const opener = (cfg.tone > 60 ? "Aight, OK — " : cfg.tone < 40 ? "Analyzing. " : "Alright — ");
    const funny = cfg.humor > 55 ? " (you picked this difficulty, not me 🫠)" : "";
    let out = opener + `here's what I've got on “${msg.slice(0, 60)}”:`;
    if (!sents.length) out += `\n\nGive me a bit more than a sentence and I'll tear it apart properly.`;
    else sents.forEach((s, i) => out += `\n${(cfg.rules || []).includes("always number the points") ? (i + 1) + ". " : "- "}${s.replace(/^\W+/, "").replace(/^(i |im |i'm )/i, "you ").slice(0, 110)}`);
    if ((cfg.rules || []).includes("use a table when comparing") && /vs|versus|compare|better/i.test(msg)) out += `\n\n| Option | Verdict |\n|---|---|\n| ${esc(msg.slice(0, 24))} | promising |\n| doing nothing | never wins |`;
    out += `\n\n${(cfg.warmth || 50) > 60 ? "You've got this — genuinely." : "Proceed."}${(cfg.rules || []).includes("end with one sharp question") ? "\n\nWhat's the one constraint you haven't told me about — time, money, or energy?" : ""}`;
    if ((cfg.rules || []).includes("finish with a next action")) out += `\n\nNext action: pick the smallest step above and do it within 10 minutes.`;
    if ((cfg.rules || []).includes("no filler or preamble")) out = out.replace(opener, "");
    return out + (cfg.humor > 70 ? "" + funny : "");
  }

  /* ══════════════════ #7 · LIVE DASHBOARD SCENE ══════════════════ */
  const SC = { cv: null, ctx: null, stars: [], vis: false, op: 0, raf: 0, px: 0, py: 0, tx: 0, ty: 0, hol: [] };
  function buildScene() {
    const cc = $("chat-container"); if (!cc || SC.cv) return;
    if (getComputedStyle(cc).position === "static") cc.style.position = "relative";
    SC.cv = document.createElement("canvas"); SC.cv.id = "jv-scene"; SC.cv.className = "jv-scene";
    cc.prepend(SC.cv);
    SC.ctx = SC.cv.getContext("2d");
    const rs = () => { const r = cc.getBoundingClientRect(); SC.cv.width = r.width; SC.cv.height = r.height; seedScene(); };
    rs(); addEventListener("resize", rs);
    new ResizeObserver(() => { const r = cc.getBoundingClientRect(); if (r.width && SC.cv.width !== Math.round(r.width)) { SC.cv.width = r.width; SC.cv.height = r.height; seedScene(); } }).observe(cc);
    seedScene();
    addEventListener("pointermove", e => { SC.tx = (e.clientX / innerWidth - .5) * 2; SC.ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
    sceneLoop();
  }
  function seedScene() {
    SC.stars = [];
    for (let i = 0; i < 150; i++) {
      const z = Math.random();
      SC.stars.push({ x: Math.random() * SC.cv.width, y: Math.random() * SC.cv.height, r: .4 + z * 1.6, z, tw: Math.random() * 6, sp: .05 + z * .25 });
    }
    SC.hol = [];
    for (let i = 0; i < 4; i++) SC.hol.push({ x: Math.random() * SC.cv.width, y: Math.random() * SC.cv.height, s: 26 + Math.random() * 60, a: .04 + Math.random() * .07, dx: (Math.random() - .5) * .3, dy: (Math.random() - .5) * .2, rot: Math.random() * 7, dr: (Math.random() - .5) * .01 });
  }
  function sceneLoop() {
    const hidden = !SC.vis || SC.op <= .01;
    if (!SC.cv) { requestAnimationFrame(sceneLoop); return; }
    if (!hidden) {
      SC.op = Math.min(1, SC.op + .02);
      const c = SC.ctx, W = SC.cv.width, H = SC.cv.height;
      c.clearRect(0, 0, W, H);
      SC.px += (SC.tx - SC.px) * .04; SC.py += (SC.ty - SC.py) * .04;
      /* aurora bands */
      [0, 1, 2].forEach(i => {
        const t = Date.now() / 9000 + i * 2.1;
        const g = c.createRadialGradient(W * (.5 + .4 * Math.sin(t)), H * (.3 + .25 * Math.cos(t * .7)), 10, W * (.5 + .4 * Math.sin(t)), H * (.3 + .25 * Math.cos(t * .7)), W * .5);
        const col = i === 0 ? "53,214,232" : i === 1 ? "124,140,255" : "78,225,180";
        g.addColorStop(0, `rgba(${col},${(.055 + .02 * Math.sin(t * 2)) * SC.op})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      });
      /* stars */
      SC.stars.forEach(s => {
        s.x -= s.sp; if (s.x < -2) { s.x = W + 2; s.y = Math.random() * H; }
        s.tw += .03;
        const al = (.3 + .7 * Math.abs(Math.sin(s.tw))) * (.35 + s.z * .65) * SC.op;
        c.globalAlpha = al;
        c.fillStyle = s.z > .8 ? "#dff6ff" : "#8fd8ea";
        c.beginPath(); c.arc(s.x + SC.px * 14 * s.z, s.y + SC.py * 10 * s.z, s.r, 0, 7); c.fill();
      });
      /* drifting hologram reactors */
      SC.hol.forEach(h => {
        h.x += h.dx; h.y += h.dy; h.rot += h.dr;
        if (h.x < -80) h.x = W + 60; if (h.x > W + 80) h.x = -60;
        if (h.y < -80) h.y = H + 60; if (h.y > H + 80) h.y = -60;
        c.globalAlpha = h.a * SC.op;
        c.save(); c.translate(h.x + SC.px * 26, h.y + SC.py * 18); c.rotate(h.rot);
        c.strokeStyle = "#35d6e8"; c.lineWidth = 2.4;
        c.beginPath(); c.arc(0, 0, h.s * .38, 0, 7); c.stroke();
        const r = h.s * .32;
        c.beginPath(); c.moveTo(-r, -r * .62); c.lineTo(r, -r * .62); c.lineTo(0, r); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(-r * .62, -r * .4); c.lineTo(r * .62, -r * .4); c.lineTo(0, r * .62); c.closePath(); c.stroke();
        c.globalAlpha = h.a * 1.6 * SC.op; c.fillStyle = "#35d6e8";
        c.beginPath(); c.arc(0, 0, h.s * .07, 0, 7); c.fill();
        c.restore();
      });
      c.globalAlpha = 1;
    } else {
      SC.op = Math.max(0, SC.op - .03);
      if (SC.op > 0) { SC.ctx.clearRect(0, 0, SC.cv.width, SC.cv.height); }
      else { requestAnimationFrame(sceneLoop); return; }
    }
    SC.cv.style.opacity = SC.op;
    requestAnimationFrame(sceneLoop);
  }
  setInterval(() => {
    const app = $("app");
    if (!app || app.classList.contains("hidden")) { SC.vis = false; return; }
    const idle = Date.now() - lastAct > 30000;
    const wasIdle = SC.vis;
    SC.vis = idle && !document.body.classList.contains("jv-stream");
    if (SC.vis && !wasIdle && P2.scene !== false) fx2([[392, 0, .5], [523, .2, .6]], .35);
  }, 1000);
  SC.vis = false;

  /* ══════════════════ #8 · DRAG-TO-COMPOSE ══════════════════ */
  let stitch = [];
  function stitchBar() {
    let bar = $("jv-stitchbar");
    if (!stitch.length) { if (bar) bar.remove(); return; }
    const cm = document.querySelector(".cmain"); if (!cm) return;
    if (bar) bar.remove();
    bar = document.createElement("div"); bar.id = "jv-stitchbar"; bar.className = "jv-stitchbar";
    bar.innerHTML = `🧷 <b>${stitch.length}</b> message${stitch.length === 1 ? "" : "s"} stitched
      <button class="jv-btn" id="jv-stitch-go">🧵 Compose in Canvas</button><button class="jv-mini" id="jv-stitch-x">Clear</button>`;
    cm.appendChild(bar);
    $("jv-stitch-go").onclick = () => composeStitch();
    $("jv-stitch-x").onclick = () => { stitch = []; stitchBar(); };
  }
  function composeStitch() {
    const ed = $("art-code-editor");
    const md = stitch.join("\n\n---\n\n");
    if (ed && $("artifacts-drawer") && !$("artifacts-drawer").classList.contains("hidden")) {
      ed.value = `<!-- Stitched by Drag-to-Compose · ${new Date().toLocaleString()} -->\n<div style="font-family:'DM Sans',sans-serif;max-width:720px;margin:0 auto;padding:34px;color:${document.body.classList.contains("light-mode") ? "#18222e" : "#dcebf5"}">\n<section>\n<h1>🧷 Composed Plan</h1>\n${stitch.map(s => s.replace(/</g, "&lt;").replace(/\n/g, "<br>")).join("\n<hr>\n")}\n</section>\n</div>`;
      ed.dispatchEvent(new Event("input", { bubbles: true }));
      const tab = document.querySelector('.art-tab[data-tab="code"]'); if (tab) tab.click();
      JV.toast("🧵 Composed " + stitch.length + " messages into the Canvas");
      achEarn("canvas1");
    } else {
      copyText(md, "Stitched markdown copied — Canvas is closed");
    }
    stitch = []; stitchBar();
  }
  function hookDnd() {
    const cc = $("chat-container"); if (!cc) return setTimeout(hookDnd, 500);
    new MutationObserver(muts => {
      muts.forEach(m => (m.addedNodes || []).forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("mr")) { n.setAttribute("draggable", "true"); markRowTime(n); } }));
    }).observe(cc, { childList: true });
    $$(".mr", cc).forEach(r => r.setAttribute("draggable", "true"));
    cc.addEventListener("dragstart", e => {
      const row = e.target.closest(".mr"); if (!row) return;
      const txt = (row.innerText || "").trim().slice(0, 8000);
      e.dataTransfer.setData("text/plain", txt);
      e.dataTransfer.setData("application/jarvik-row", txt);
      e.dataTransfer.effectAllowed = "copy";
      row.classList.add("jv-dragging");
    });
    cc.addEventListener("dragend", e => { const row = e.target.closest(".mr"); if (row) row.classList.remove("jv-dragging"); });
    const drawer = $("artifacts-drawer");
    if (drawer) {
      drawer.addEventListener("dragover", e => { if (e.dataTransfer.types.includes("application/jarvik-row")) { e.preventDefault(); drawer.classList.add("jv-drop-hot"); } });
      drawer.addEventListener("dragleave", e => { if (e.target === drawer || !drawer.contains(e.target)) drawer.classList.remove("jv-drop-hot"); });
      drawer.addEventListener("drop", e => {
        const txt = e.dataTransfer.getData("application/jarvik-row") || e.dataTransfer.getData("text/plain");
        drawer.classList.remove("jv-drop-hot");
        if (!txt) return;
        e.preventDefault(); e.stopPropagation();
        const label = txt.slice(0, 44).replace(/\s+/g, " ");
        stitch.push(label + (txt.length > 44 ? "…" : "") + "\n" + txt);
        stitchBar(); fx2([[990, 0, .06]], .4);
      }, true);
    }
  }

  /* ══════════════════ #9/#10 · TONE + HYPE (systemTune wrap already set) ══════════════════ */

  /* ══════════════════ achievements overview modal ══════════════════ */
  function openAch() {
    const got = achAll();
    const ov = p2Modal("jv-achmodal", `<span class="jv-mico">🏆</span> Achievements · ${Object.keys(got).length}/${ACH.length}`, `
      <div class="jv-ach-grid">${ACH.map(a => `<div class="jv-ach-tile${got[a.id] ? " got" : ""}"><span class="ai">${a.icon}</span><b>${esc(a.name)}</b><span class="d">${got[a.id] ? "Unlocked " + new Date(got[a.id]).toLocaleDateString() : "🔒 " + esc(a.desc)}</span></div>`).join("")}</div>`);
    ov.classList.remove("hidden"); fx2([[660, 0, .06], [880, .05, .06]], .35);
  }

  /* inject composer + rail + scene on init */
  function init2() {
    buildComposer(); buildRail(); buildScene(); syncLabBanner(); markKonami();
    hookDnd();
    const cc = $("chat-container");
    if (cc) $$(".mr", cc).forEach(r => markRowTime(r));
    greetOnce();
    achPoll();
  }
  function markKonami() {
    /* mirror of power.js trigger — flags the achievement */
    const K = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let buf = [];
    addEventListener("keydown", e => {
      buf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key); if (buf.length > 10) buf.shift();
      if (K.every((k, i) => buf[i] === k)) { buf = []; document.body.dataset.jvKonami = "1"; achEarn("konami"); }
    });
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", init2);
  else setTimeout(init2, 0);
})();
