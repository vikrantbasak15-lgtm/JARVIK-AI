/* ═══════════════════════════════════════════════════════════════════
   JARVIK AGENT DIVISION (agents.js) · Phase 3
   16-agent swarm · Pipelines · Scheduler · Task Queue · Web Agent
   Loads AFTER power.js (needs window.JV). Power3 can load first.
   Exposes window.JVM (shared helpers used by studio.js / engage.js)
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  window.JVM = window.JVM || {};
  const JV = window.JV;
  if (!JV) return;

  /* ── shared helpers (also mirrored onto window.JVM for later modules) ── */
  const $  = id => document.getElementById(id);
  const $$ = (s, r = document) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sget = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch (e) { return fb; } };
  const sset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const chop = (s, n) => (s || "").slice(0, n || 2000);

  /* provider-agnostic direct model call (matches script.js PROVIDERS) */
  const PROVS = { openrouter: ["https://openrouter.ai/api/v1", "openai"], nvidia: ["https://integrate.api.nvidia.com/v1", "openai"], openai: ["https://api.openai.com/v1", "openai"], anthropic: ["https://api.anthropic.com/v1", "anthropic"], gemini: ["https://generativelanguage.googleapis.com/v1beta/openai", "openai"], groq: ["https://api.groq.com/openai/v1", "openai"], together: ["https://api.together.xyz/v1", "openai"], mistral: ["https://api.mistral.ai/v1", "openai"], deepseek: ["https://api.deepseek.com/v1", "openai"], ollama: ["http://localhost:11434/v1", "openai"], custom: ["", "openai"] };
  const pcfg = () => Object.assign({ active: "openrouter" }, sget("jarvik_providers", {}));
  function activePEndpoint() {
    const c = pcfg(); const base = (c.endpoints && c.endpoints[c.active]) || PROVS[c.active]?.[0] || "";
    return { url: base.replace(/\/+$/, ""), fmt: (c.fmts && c.fmts[c.active]) || (c.active === "anthropic" ? "anthropic" : "openai"), id: c.active };
  }
  function activeKey() {
    const keys = sget("jarvik_provider_keys", {}) || {};
    const c = pcfg();
    let k = (keys[c.active] || "").trim();
    if (!k && c.active === "openrouter") k = (localStorage.getItem("jarvik_openrouter_key") || "").trim();
    return k;
  }
  const activeModel = () => (sget("jarvik_providers", {}).selected || {})[pcfg().active] || localStorage.getItem("jarvik_model") || "meta-llama/llama-3.3-70b-instruct";

  /* ask(): one-shot agent call */
  async function ask(prompt, opt) {
    opt = opt || {};
    const ep = activePEndpoint(), key = activeKey();
    const keyless = ["ollama", "custom"].includes(ep.id);
    if (!key && !keyless) throw new Error("No " + ep.id + " API key set — open 🔑 API Key in the sidebar.");
    const model = opt.model || activeModel();
    let url, body, headers = { "Content-Type": "application/json" };
    if (ep.fmt === "anthropic") {
      url = ep.url + "/messages";
      if (key) headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
      headers["anthropic-dangerous-direct-browser-access"] = "true";
      body = { model, max_tokens: opt.maxTokens || 900, system: opt.system || "", messages: [{ role: "user", content: prompt }] };
    } else {
      url = ep.url + "/chat/completions";
      if (key) headers["Authorization"] = "Bearer " + key;
      if (ep.id === "openrouter") headers["HTTP-Referer"] = "https://jarvik.local", headers["X-Title"] = "JARVIK Agent Division";
      body = { model, max_tokens: opt.maxTokens || 900, temperature: opt.temp == null ? 0.7 : opt.temp, messages: (opt.system ? [{ role: "system", content: opt.system }, { role: "user", content: prompt }] : [{ role: "user", content: prompt }]) };
    }
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.error) throw new Error((j.error && (j.error.message || j.error)) || "HTTP " + res.status);
    if (ep.fmt === "anthropic") return (j.content && j.content[0] && j.content[0].text) || "";
    const c = j.choices && j.choices[0] && j.choices[0].message;
    return (c && (c.content || c.reasoning || "")) || "";
  }

  /* send a prompt through the main chat pipeline */
  function sendVia(text) {
    const u = $("user-input"); if (!u) return;
    u.value = text; u.dispatchEvent(new Event("input", { bubbles: true }));
    const b = $("send-btn"); if (b) b.click();
  }
  function streamIdle(timeout) {
    timeout = timeout || 240000;
    return new Promise(res => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        const live = document.querySelector(".mr.bot .mb .stream-cursor");
        if (!live || Date.now() - t0 > timeout) { clearInterval(iv); setTimeout(res, 900); }
      }, 350);
    });
  }

  /* helpers exported for studio.js / engage.js */
  const JVM = window.JVM;
  Object.assign(JVM, { workspace: window.jarvikWorkspace, $, $$, esc, sget, sset, uid, ask, sendVia, streamIdle, activePEndpoint, activeKey, activeModel, chop, toast: m => JV.toast(m) });

  /* ═══════════════ THE AGENT ROSTER (16) ═══════════════ */
  const BOTS = [
    { k: "planner",   i: "🧭", n: "Atlas · Planner",       sys: "You are Atlas, an elite planning agent. Decompose the mission into ordered steps with owners, effort, and risks. No fluff. Under 180 words." },
    { k: "architect", i: "🏛", n: "Naos · Architect",      sys: "You are Naos, a software architect. Produce module boundaries, data flow, tech choices and one Mermaid diagram. Under 200 words." },
    { k: "researcher",i: "🔭", n: "Lens · Researcher",     sys: "You are Lens, a research agent. Surface facts, numbers, prior art and unknowns with confidence markers (✓ sure / ~ likely / ? unknown). Under 180 words." },
    { k: "coder",     i: "💻", n: "Forge · Coder",         sys: "You are Forge, a coding agent. Write complete runnable code for the core module. Include one fenced code block. Under 260 words." },
    { k: "refactor",  i: "🧹", n: "Tidy · Refactorer",     sys: "You are Tidy, a refactoring agent. Point out dead weight, name things better, simplify APIs. Show before/after snippets. Under 160 words." },
    { k: "tester",    i: "🧪", n: "Probe · QA",            sys: "You are Probe, a QA agent. List crashing edge cases, a top-5 test checklist, and acceptance criteria. Under 150 words." },
    { k: "security",  i: "🛡", n: "Aegis · Security",      sys: "You are Aegis, a security agent. Flag XSS, injection, authz and secrets-handling issues with fixes. Under 140 words." },
    { k: "critic",    i: "😈", n: "Nemesis · Critic",      sys: "You are Nemesis, a ruthless critic. Attack the weakest assumptions, then give a viability score /10 and the fix that matters most. Under 140 words." },
    { k: "docwriter", i: "📖", n: "Codex · Doc Writer",    sys: "You are Codex, a documentation agent. Write a README-grade summary: what it does, quickstart, API notes. Under 180 words." },
    { k: "analyst",   i: "📊", n: "Prism · Data Analyst",  sys: "You are Prism, a data analyst. Convert the context into concrete numeric takeaways, a table, and 3 recommendations. Under 180 words." },
    { k: "growth",    i: "🚀", n: "Surge · Growth",        sys: "You are Surge, a growth agent. Give distribution channels, first 10 users plan, and one unfair advantage to hunt. Under 150 words." },
    { k: "copywriter",i: "✍️", n: "Quill · Copywriter",    sys: "You are Quill, a copywriter. Write punchy copy: one headline, one sub, one CTA, and 3 taglines. Under 120 words." },
    { k: "interview", i: "🎙", n: "Prober · Interviewer",  sys: "You are Prober, an interviewer. Ask the 5 questions that expose the biggest gaps, hardest first. Under 130 words." },
    { k: "optimizer", i: "⚡", n: "Flux · Optimizer",      sys: "You are Flux, a performance optimizer. Find the top cost centers (time, money, tokens) and give the 20% fix that yields 80%. Under 140 words." },
    { k: "translator",i: "🌐", n: "Babel · Localizer",     sys: "You are Babel, a localization agent. Translate and culturally adapt the content; keep technical terms in English. Under 160 words." },
    { k: "release",   i: "📦", n: "Cargo · Release Mgr",   sys: "You are Cargo, a release manager. Draft the checklist, rollback plan, and changelog blurb. Under 150 words." }
  ];
  const byKey = k => BOTS.find(b => b.k === k);
  JVM.bots = BOTS;

  /* ═══════════════ swarm runner + agent TOOLS ═══════════════ */
  const TOOLS_H = "\nTOOLS: end your reply, if wanted, with one tool line:\n>>DOC Name | one-paragraph doc to save\n>>MEMORY a fact about the user\n>>CANVAS a short HTML snippet to place in the canvas\nThen keep working. Use at most one tool per reply.";
  function parseTools(reply) {
    const out = { doc: null, mem: null, canvas: null, text: reply };
    const grab = tag => { const m = reply.match(new RegExp(">>" + tag + "[^\\n]*\\n([\\s\\S]*?)(?=>>|$)", "i")); if (m) { const name = (m[0].split("\n")[0] || "").split("|")[1]; return { name: (name || "").trim() || "Agent doc", body: m[1].trim() }; } };
    const d = grab("DOC");   if (d) { out.doc = d; out.text = out.text.split(">>DOC").slice(0, 1).join("").trim(); }
    const c = grab("CANVAS");if (c) { out.canvas = c; out.text = out.text.split(">>CANVAS").slice(0, 1).join("").trim(); }
    const m2 = grab("MEMORY");if (m2) { out.mem = m2.body.slice(0, 200); out.text = out.text.split(">>MEMORY").slice(0, 1).join("").trim(); }
    return out;
  }
  function runTool(t, parsed) {
    const log = [];
    if (parsed.doc) { const d = sget("jv_docs", []); d.push({ name: "Agent · " + parsed.doc.name.slice(0, 40), content: parsed.doc.body.slice(0, 10000), ts: Date.now() }); sset("jv_docs", d.slice(-12)); log.push("📚 doc saved"); }
    if (parsed.mem) { const m = sget("jv_mem2", []); m.push({ id: uid(), text: parsed.mem, tags: ["agent"], ts: Date.now() }); sset("jv_mem2", m.slice(-60)); log.push("🧠 memory saved"); }
    if (parsed.canvas) {
      const ed = $("art-code-editor");
      if (ed && ed.isConnected) { ed.value = parsed.canvas.body.slice(0, 6000); const run = $("art-run-btn"); run && run.click(); log.push("🎨 canvas updated"); }
      else log.push("🎨 canvas not open — snippet dropped");
    }
    return log;
  }
  async function runSwarm(bots, goal, opt) {
    /* generic runner: sequential agents with workspace transcript + tools */
    let transcript = "", wall = null;
    const onStep = (opt && opt.onStep) || (() => {});
    for (let i = 0; i < bots.length; i++) {
      const b = bots[i];
      onStep(b, i, false);
      try {
        let sys = b.sys + TOOLS_H;
        let prompt = `MISSION: ${goal}\n\nWORKSPACE LOG (earlier agents):\n${chop(transcript, 4200) || "(you are first — set the stage)"}`;
        if (opt && opt.revision && b.k === "coder" && (opt.revision.trim())) prompt += "\n\nUSER REVISION REQUEST: " + opt.revision;
        const reply = await ask(prompt, { system: sys, maxTokens: opt ? (opt.maxTokens || 420) : 420 });
        const parsed = parseTools(reply);
        transcript += `\n[${b.n}] ${chop(parsed.text, 1400)}`;
        const toolLog = runTool(b, parsed);
        onStep(b, i, true, parsed.text, toolLog);
        JVM.bus("agentDone", b.k);
      } catch (e) {
        onStep(b, i, true, "⚠ " + e.message, []);
      }
    }
    return transcript;
  }

  /* ═══════════════ 1 · AGENT STUDIO v2 ═══════════════ */
  function agentStudio(prefill) {
    const gear = sget("jv_pro", {});
    const ov = JVM.modal("jv-agents2", `🤖 Agent Studio v2`, `
      <div class="jv-field"><label>Mission</label><textarea id="jv-ag2-goal" rows="2" placeholder="e.g. Build + launch a study-quiz app for my class of 40">${esc(prefill || "")}</textarea></div>
      <div class="jv-ag-grid" id="jv-ag2-grid">${BOTS.map(b => `<label class="jv-ag-chip"><input type="checkbox" value="${b.k}" ${["planner", "coder", "tester", "critic"].includes(b.k) ? "checked" : ""}><span>${b.i} ${esc(b.n.split(" · ")[0])}</span></label>`).join("")}</div>
      <div class="jv-row2">
        <label class="jv-ag-chip"><input type="checkbox" id="jv-ag2-loop"> 🔁 Autonomy loop (Nemesis reviews, Forge revises)</label>
      </div>
      <button class="jv-btn" id="jv-ag2-go">Deploy agents</button>
      <div id="jv-ag2-out" class="jv-ag-out"></div>`);
    ov.classList.remove("hidden");
    $("jv-ag2-go").onclick = async () => {
      const goal = $("jv-ag2-goal").value.trim();
      if (!goal) return JVM.toast("Enter a mission first");
      const keys = $$("#jv-ag2-grid input:checked", ov).map(i => i.value);
      const bots = keys.map(byKey).filter(Boolean);
      if (!bots.length) return JVM.toast("Pick at least one agent");
      const loop = $("jv-ag2-loop").checked;
      const out = $("jv-ag2-out"); out.innerHTML = "";
      let transcript = await runSwarm(bots, goal, { onStep: (b, i, done, text, tools) => {
        const id = "jv-ag2-step-" + i;
        let card = $(id);
        if (!card) { card = document.createElement("div"); card.className = "jv-ag-card"; card.id = id; out.appendChild(card); card.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
        card.innerHTML = done
          ? `<div class="jv-ag-head"><b>${b.i} ${esc(b.n)}</b>${(tools || []).map(t => `<em>${esc(t)}</em>`).join(" ")}</div><div class="jv-ag-body">${esc(text).replace(/\n/g, "<br>")}</div>`
          : `<div class="jv-ag-head"><span class="jv-spin"><i></i></span><b>${b.i} ${esc(b.n)}</b> <em>working…</em></div>`;
      } });
      if (loop) {
        const card = document.createElement("div"); card.className = "jv-ag-card";
        card.innerHTML = `<div class="jv-ag-head"><span class="jv-spin"><i></i></span><b>🔁 Autonomy loop</b> <em>Nemesis → Forge…</em></div>`;
        out.appendChild(card);
        try {
          const critique = await ask(`MISSION: ${goal}\nFull report:\n${chop(transcript, 5000)}\n\nYou are Nemesis. Name the single biggest gap in this report. Under 90 words`, { system: "You are Nemesis, a ruthless critic agent.", maxTokens: 220 });
          const fix = await ask(`MISSION: ${goal}\nCritic said: "${critique}"\nPrior report:\n${chop(transcript, 4500)}\n\nFix exactly that gap. Be concrete and complete. Under 300 words.`, { system: "You are Forge, the coder agent. No preamble.", maxTokens: 500 });
          card.innerHTML = `<div class="jv-ag-head"><b>🔁 Autonomy loop complete</b></div><div class="jv-ag-body"><b>Nemesis:</b> ${esc(critique).replace(/\n/g, "<br>")}<br><br><b>Forge patch:</b> ${esc(fix).replace(/\n/g, "<br>")}</div>`;
          transcript += `\n[Nemesis] ${critique}\n[Forge patch] ${fix}`;
        } catch (e) { card.innerHTML = `⚠ ${esc(e.message)}`; }
      }
      JVM.bus("agentsRun");
      out.insertAdjacentHTML("beforeend", `<div class="jv-ag-acts"><button class="jv-btn ghost" id="jv-ag2-chat">💬 Send report to chat</button><button class="jv-btn ghost" id="jv-ag2-doc">📚 Save report</button></div>`);
      $("jv-ag2-chat").onclick = () => sendVia("Agent Division report on: " + goal + "\n\n" + chop(transcript, 4500));
      $("jv-ag2-doc").onclick = () => { const d = sget("jv_docs", []); d.push({ name: "Agents · " + goal.slice(0, 40), content: chop(transcript, 12000), ts: Date.now() }); sset("jv_docs", d.slice(-12)); JVM.toast("📚 Report saved"); };
    };
  }

  /* ═══════════════ 2 · PIPELINE BUILDER ═══════════════ */
  const PIPE_DEFAULTS = [
    { id: "shipit", name: "🚀 Ship It", bots: ["planner", "architect", "coder", "tester", "release"] },
    { id: "deepdive", name: "🔭 Deep Dive", bots: ["researcher", "analyst", "critic"] },
    { id: "content", name: "✍️ Content Machine", bots: ["researcher", "copywriter", "growth"] },
    { id: "harden", name: "🛡 Harden It", bots: ["coder", "security", "tester", "refactor"] }
  ];
  function pipelines() {
    const load = () => sget("jv_pipes", PIPE_DEFAULTS);
    const ov = JVM.modal("jv-pipes", `⛓️ Pipeline Builder`, `
      <p class="jv-hint">A pipeline chains agents in order — each reads the previous agent's output. Build your own production lines.</p>
      <div class="jv-row2"><button class="jv-btn" id="jv-pi-new">＋ New pipeline</button><button class="jv-btn ghost" id="jv-pi-reset">Restore presets</button></div>
      <div id="jv-pi-list"></div>`);
    ov.classList.remove("hidden");
    const render = () => {
      const host = $("jv-pi-list");
      host.innerHTML = load().map((p, i) => `
        <div class="jv-pi-card" data-i="${i}">
          <div class="jv-pi-head"><b>${esc(p.name)}</b>
            <span class="jv-pi-actions"><button data-act="run">▶ Run</button><button data-act="edit">✎</button><button data-act="del">🗑</button></span></div>
          <div class="jv-pi-bots">${p.bots.map(k => { const b = byKey(k); return b ? `<span>${b.i} ${esc(b.n.split(" · ")[0])}</span>` : ""; }).join("<i>→</i>") || "<em>empty</em>"}</div>
        </div>`).join("") || `<div class="jv-hint">No pipelines yet.</div>`;
      $$("button[data-act]", host).forEach(btn => btn.onclick = e => {
        const i = +e.target.closest(".jv-pi-card").dataset.i, arr = load(), p = arr[i];
        if (btn.dataset.act === "run") { if (!p.bots.length) return JVM.toast("Pipeline is empty"); scheduleExecPipeline(p); }
        if (btn.dataset.act === "del") { arr.splice(i, 1); sset("jv_pipes", arr); render(); }
        if (btn.dataset.act === "edit") editPipeline(p, arr, render, false);
      });
    };
    $("jv-pi-new").onclick = () => editPipeline({}, load(), render, true);
    $("jv-pi-reset").onclick = () => { sset("jv_pipes", PIPE_DEFAULTS); render(); };
    render();
  }
  function editPipeline(p, arr, done, isNew) {
    let bots = [...(p.bots || [])];
    const ov = JVM.modal("jv-pi-edit", (isNew ? "＋ New" : "✎ Edit") + ` pipeline`, `
      <div class="jv-field"><label>Name</label><input id="jv-pie-name" value="${esc(p.name || "")}" placeholder="e.g. Launch Factory"></div>
      <label class="jv-field"><label>Chain (click to add, in order)</label></label>
      <div class="jv-ag-grid">${BOTS.map(b => `<button class="jv-ag-chip" data-k="${b.k}">${b.i} ${esc(b.n.split(" · ")[0])}</button>`).join("")}</div>
      <div class="jv-field"><label>Current chain</label><div id="jv-pie-chain" class="jv-pi-bots"></div></div>
      <button class="jv-btn" id="jv-pie-save">Save pipeline</button>`);
    ov.classList.remove("hidden");
    const render = () => { $("jv-pie-chain").innerHTML = bots.map(k => { const b = byKey(k); return `<span>${b.i} ${esc(b.n.split(" · ")[0])}</span>`; }).join("<i>→</i>") || "<em>click agents above</em>"; };
    $$("button.jv-ag-chip[data-k]", ov).forEach(bkn => bkn.onclick = () => { bots.push(bkn.dataset.k); render(); });
    render();
    $("jv-pie-save").onclick = () => {
      const name = ($("jv-pie-name").value.trim()) || "Untitled pipeline";
      if (!bots.length) return JVM.toast("Add at least one agent");
      const arr2 = sget("jv_pipes", PIPE_DEFAULTS);
      if (isNew) arr2.push({ id: uid(), name, bots }); else { p.name = name; p.bots = bots; }
      sset("jv_pipes", arr2); JVM.toast("⛓️ Pipeline saved"); JVM.bus("pipeBuilt");
      ov.classList.add("hidden"); done();
    };
  }
  /* run a pipeline as a floating mini-console in chat column */
  function scheduleExecPipeline(p) {
    const goalHolder = JVM.prompt("Pipeline: " + p.name, "Mission for the pipeline…");
    goalHolder.then(goal => {
      if (!goal || !goal.trim()) return;
      const bots = p.bots.map(byKey).filter(Boolean);
      const cons = document.createElement("div"); cons.className = "jv-pi-console";
      cons.innerHTML = `<div class="jv-pi-c-head"><b>⛓️ ${esc(p.name)}</b><button title="close">✕</button></div><div class="jv-pi-c-body"></div>`;
      document.body.appendChild(cons);
      cons.querySelector("button").onclick = () => cons.remove();
      const body = cons.querySelector(".jv-pi-c-body");
      runSwarm(bots, goal.trim(), { onStep: (b, i, done, text, tools) => {
        const d = document.createElement("div"); d.className = "jv-pi-step" + (done ? " done" : "");
        d.innerHTML = done ? `<b>${b.i} ${esc(b.n.split(" · ")[0])}</b>${(tools || []).map(t => `<em>${esc(t)}</em>`).join(" ")}<br>${esc(text).replace(/\n/g, "<br>")}` : `<span class="jv-spin"><i></i></span> <b>${b.i} ${esc(b.n.split(" · ")[0])}</b>`;
        body.appendChild(d); body.scrollTop = 1e6;
      } }).then(t => { body.insertAdjacentHTML("beforeend", `<button class="jv-btn ghost" style="width:100%">💬 Send report to chat</button>`); body.lastChild.onclick = () => { cons.remove(); sendVia("Pipeline “" + p.name + "” on: " + goal + "\n\n" + chop(t, 4500)); }; JVM.bus("agentDone", "pipeline"); });
    });
  }

  /* ═══════════════ 3 · SCHEDULED AGENTS ═══════════════ */
  function scheduler() {
    const load = () => sget("jv_sched", []);
    const ov = JVM.modal("jv-sched", `⏰ Agent Scheduler`, `
      <p class="jv-hint">Agents run headless in this tab on a timer, save their reports, and never touch your chat window (they are offline tasks). Keep this tab open.</p>
      <div class="jv-field"><label>Task</label><input id="jv-sc-goal" placeholder="e.g. Scan today's docs and write a 5-bullet digest"></div>
      <div class="jv-row2">
        <div class="jv-field"><label>Agent</label><select id="jv-sc-bot">${BOTS.map(b => `<option value="${b.k}">${b.i} ${esc(b.n)}</option>`).join("")}</select></div>
        <div class="jv-field"><label>Every (minutes)</label><input id="jv-sc-min" type="number" min="2" value="30" style="width:90px"></div>
      </div>
      <div class="jv-row2"><button class="jv-btn" id="jv-sc-add">Add schedule</button><button class="jv-btn ghost" id="jv-sc-now">📰 Run morning briefing now</button></div>
      <div id="jv-sc-list"></div>`);
    ov.classList.remove("hidden");
    const render = () => {
      $("jv-sc-list").innerHTML = load().map((s, i) => `
        <div class="jv-sc-item" data-i="${i}">
          <span>${byKey(s.bot).i}</span><div><b>${esc(s.goal.slice(0, 60))}</b><i>every ${s.min}m · last ${s.last ? new Date(s.last).toLocaleTimeString() : "—"}</i><u>${(s.log || []).slice(-1).map(l => esc(l)).join("")}</u></div>
          <button data-act="run">▶</button><button data-act="del">✕</button>
        </div>`).join("") || `<div class="jv-hint">No schedules yet.</div>`;
      $$("button[data-act]", $("jv-sc-list")).forEach(btn => btn.onclick = () => {
        const i = +btn.closest(".jv-sc-item").dataset.i, arr = load(), s = arr[i];
        if (btn.dataset.act === "del") { arr.splice(i, 1); sset("jv_sched", arr); render(); }
        else runAgentDocless(s).then(() => render());
      });
    };
    $("jv-sc-add").onclick = () => {
      const goal = $("jv-sc-goal").value.trim(); if (!goal) return JVM.toast("Describe the task");
      const min = Math.max(2, +$("jv-sc-min").value || 30), bot = $("jv-sc-bot").value;
      const arr = load(); arr.push({ id: uid(), goal, bot, min, last: 0, log: [] }); sset("jv_sched", arr); JVM.toast("⏰ Scheduled"); render();
    };
    $("jv-sc-now").onclick = () => morningBriefing(true);
    render();
  }
  async function runAgentDocless(s) {
    const b = byKey(s.bot || "analyst"); if (!b) return;
    try {
      const reply = await ask(`TASK: ${s.goal}\nAvailable user context (memory + docs digest):\n${contextDigest()}\n\nDo your job end-to-end. Under 200 words.`, { system: b.sys, maxTokens: 380 });
      const d = sget("jv_docs", []); d.push({ name: "Scheduled · " + b.n.split(" · ")[0] + " · " + new Date().toLocaleTimeString(), content: reply.slice(0, 8000), ts: Date.now() });
      sset("jv_docs", d.slice(-12));
      const sched = sget("jv_sched", []); const i = sched.findIndex(x => x.id === s.id); if (i > -1) { sched[i].last = Date.now(); sched[i].log = (sched[i].log || []).concat(["✅ " + new Date().toLocaleTimeString()]).slice(-6); sset("jv_sched", sched); }
      JVM.bus("agentDone", "scheduled");
      return reply;
    } catch (e) {
      const sched = sget("jv_sched", []); const i = sched.findIndex(x => x.id === s.id); if (i > -1) { sched[i].log = (sched[i].log || []).concat(["⚠ " + e.message]).slice(-6); sset("jv_sched", sched); }
    }
  }
  function contextDigest() {
    const mem = (sget("jv_mem2", []) || []).slice(-10).map(m => "- " + m.text).join("\n");
    const docs = sget("jv_docs", []).slice(-4).map(d => `[${d.name}] ${chop(d.content, 500)}`).join("\n");
    return (mem + "\n" + docs) || "(none)";
  }
  function schedTick() {
    const arr = sget("jv_sched", []);
    if (!arr.length) return;
    let changed = false;
    arr.forEach(s => { if (Date.now() - (s.last || 0) >= s.min * 60000) { s.last = Date.now(); changed = true; runAgentDocless(s); } });
    if (changed) sset("jv_sched", arr);
  }
  setInterval(schedTick, 30000);

  async function morningBriefing(viaModal) {
    const ses = sget("jv_pulse", {}); const days = ses.days || {};
    const today = new Date().toISOString().slice(0, 10);
    const stats = JSON.stringify(days[today] || {});
    const queue = sget("jv_queue", []).filter(t => t.status !== "done").length;
    try {
      const reply = await ask(`You are the Morning Briefing agent. Today's usage: ${stats}. ${queue ? queue + " queued tasks pending." : ""}\nUser's saved docs digest:\n${contextDigest()}\n\nWrite a crisp morning briefing: 1) headline one-liner, 2) top 3 attention items, 3) one action to take in the next hour. Under 120 words.`, { system: "You are Brevity, the briefing agent. Punchy, kind, zero filler.", maxTokens: 260 });
      if (viaModal) JVM.modal("jv-brief", `📰 Morning Briefing`, `<div class="jv-ag-body">${esc(reply).replace(/\n/g, "<br>")}</div>`).classList.remove("hidden");
      else sendVia("My briefing today:\n" + reply);
    } catch (e) { JVM.toast("Briefing failed: " + e.message); }
  }

  /* ═══════════════ 4 · TASK QUEUE / INBOX ═══════════════ */
  let workerOn = sget("jv_pro", {}).autoQueue !== false;
  function taskQueue() {
    const load = () => sget("jv_queue", []);
    const ov = JVM.modal("jv-queue", `📥 Agent Task Queue`, `
      <div class="jv-row2"><input id="jv-tq-in" placeholder="Add a prompt to the queue…"><button class="jv-btn" id="jv-tq-add">＋ Queue</button></div>
      <label class="jv-ag-chip"><input type="checkbox" id="jv-tq-auto" ${workerOn ? "checked" : ""}> ⚙️ Auto-worker (drains queue into chat when idle)</label>
      <div id="jv-tq-list"></div>
      <p class="jv-hint">Queued tasks are sent to the main chat one by one, waiting for each reply to finish.</p>`);
    ov.classList.remove("hidden");
    const render = () => {
      $("jv-tq-list").innerHTML = load().slice().reverse().map((t, ri) => {
        const i = load().length - 1 - ri;
        return `<div class="jv-tq-item st-${t.status}"><span class="jv-tq-dot"></span><div>${esc(t.prompt.slice(0, 90))}<i>${new Date(t.ts).toLocaleTimeString()}</i></div><button data-i="${i}" title="remove">✕</button></div>`;
      }).join("") || `<div class="jv-hint">Queue is empty — add tasks and the worker will grind through them.</div>`;
      $$("#jv-tq-list button[data-i]").forEach(b => b.onclick = () => { const a = load(); a.splice(+b.dataset.i, 1); sset("jv_queue", a); render(); });
    };
    render();
    $("jv-tq-add").onclick = () => { const p = $("jv-tq-in").value.trim(); if (!p) return; const a = load(); a.push({ id: uid(), prompt: p, ts: Date.now(), status: "wait" }); sset("jv_queue", a); $("jv-tq-in").value = ""; JVM.bus("queued"); render(); };
    $("jv-tq-auto").onchange = e => { workerOn = e.target.checked; const c = sget("jv_pro", {}); c.autoQueue = workerOn; sset("jv_pro", c); };
    workerLoop();
  }
  let working = false;
  async function workerLoop() {
    if (!workerOn || working) return;
    const q = sget("jv_queue", []);
    const next = q.find(t => t.status === "wait");
    if (!next) return;
    const app = $("app"); if (!app || app.classList.contains("hidden")) return;
    if (document.querySelector(".mr.bot .mb .stream-cursor")) return;
    working = true;
    next.status = "running"; sset("jv_queue", q);
    try { sendVia(next.prompt); await streamIdle(); next.status = "done"; }
    catch (e) { next.status = "wait"; }
    sset("jv_queue", sget("jv_queue", []).map(t => t.id === next.id ? next : t));
    working = false;
  }
  setInterval(workerLoop, 4000);

  /* ═══════════════ 5 · WEB AGENT (browsing research) ═══════════════ */
  async function readPage(url) {
    const res = await fetch("https://r.jina.ai/" + url, { headers: { Accept: "text/plain" } });
    if (!res.ok) throw new Error("reader failed (HTTP " + res.status + ")");
    return await res.text();
  }
  function webAgent() {
    const ov = JVM.modal("jv-webagent", `🌐 Web Agent`, `
      <div class="jv-field"><label>Page URL</label><input id="jv-wa-url" placeholder="https://…"></div>
      <div class="jv-field"><label>What should the agent hunt for?</label><input id="jv-wa-goal" placeholder="e.g. pricing tiers and free-plan limits"></div>
      <div class="jv-row2"><button class="jv-btn" id="jv-wa-go">▶ Scalp the page</button><button class="jv-btn ghost" id="jv-wa-act">02 · Then act on it → chat</button></div>
      <p class="jv-hint">The agent reads the page, extracts exactly what you asked, and saves a doc.</p>`);
    ov.classList.remove("hidden");
    $("jv-wa-go").onclick = () => go(false);
    $("jv-wa-act").onclick = () => go(true);
    async function go(toChat) {
      const url = $("jv-wa-url").value.trim(), goal = $("jv-wa-goal").value.trim() || "Summarize this page: key claims, numbers, and anything actionable."; 
      if (!url) return JVM.toast("Paste a URL first");
      JVM.toast("🌐 Agent is reading the page…");
      try {
        const txt = await readPage(url);
        const extract = await ask(`PAGE (${url}):\n${chop(txt, 12000)}\n\nAGENT GOAL: ${goal}\n\nExtract exactly what the goal needs — quote real numbers and quotes. Under 220 words.`, { system: "You are Lens, a web research agent. No preamble. Only what was asked.", maxTokens: 380 });
        const name = "Web agent · " + url.replace(/^https?:\/\//, "").slice(0, 46);
        const d = sget("jv_docs", []); d.push({ name, content: extract + "\n\n--- source ---\n" + chop(txt, 9000), ts: Date.now() }); sset("jv_docs", d.slice(-12));
        JVM.bus("agentDone", "web");
        if (toChat) sendVia(`Web agent extracted from ${url} (goal: ${goal}):\n\n${extract}\n\nNow act on this for me.`);
        else JVM.modal("jv-wa-out", `🌐 Extracted · ${esc(url.slice(0, 40))}`, `<div class="jv-ag-body">${esc(extract).replace(/\n/g, "<br>")}</div><button class="jv-btn ghost" onclick="document.getElementById('jv-wa-out').classList.add('hidden')">Close</button>`).classList.remove("hidden");
        JVM.toast("📚 Web agent saved a doc");
      } catch (e) { JVM.toast("web agent failed: " + e.message); }
    }
  }

  /* ═══════════════ UI WIRING (studio/engage share JVM.modal + bus + FSM) ═══════════════ */
  JVM.modal = (id, title, bodyHtml) => { return JV.openModal ? JV.openModal(id, title, bodyHtml) : fallbackModal(id, title, bodyHtml); };
  function fallbackModal(id, title, bodyHtml) {
    let ov = $(id); if (ov) ov.remove();
    ov = document.createElement("div"); ov.id = id; ov.className = "jv-modal hidden";
    ov.innerHTML = `<div class="jv-mcard"><div class="jv-mhead"><span class="jv-mtitle">${title}</span><button class="jv-mclose">✕</button></div><div class="jv-mbody">${bodyHtml}</div></div>`;
    document.body.appendChild(ov);
    ov.querySelector(".jv-mclose").onclick = () => ov.classList.add("hidden");
    ov.addEventListener("mousedown", e => { if (e.target === ov) ov.classList.add("hidden"); });
    return ov;
  }
  JVM.prompt = (title, ph) => new Promise(res => {
    const ov = JVM.modal("jvm-ask", title, `<input id="jvm-ask-in" placeholder="${esc(ph || "")}"><button class="jv-btn" id="jvm-ask-go">Go</button>`);
    ov.classList.remove("hidden");
    const inp = $("jvm-ask-in"); inp.focus();
    const done = v => { ov.classList.add("hidden"); res(v); };
    $("jvm-ask-go").onclick = () => done(inp.value.trim());
    inp.addEventListener("keydown", e => { if (e.key === "Enter") done(inp.value.trim()); if(e.key === "Escape") done(null); });
    ov.querySelector('.jv-mclose').addEventListener('click',()=>done(null));
    ov.addEventListener('mousedown',e=>{if(e.target===ov)done(null);});
  });
  const listeners = {};
  JVM.bus = (name, data) => { (listeners[name] || []).forEach(f => { try { f(data); } catch (e) {} }); };
  JVM.on = (name, f) => { (listeners[name] = listeners[name] || []).push(f); };

  /*uin sidebar + topbar injection */
  function injectSidebar() {
    const host = document.querySelector(".sbt");
    if (!host || $("jv-ag-side")) return;
    const d = document.createElement("details"); d.className = "sb-details"; d.id = "jv-ag-side";
    d.innerHTML = `<summary class="sb-summary">🤖 Agent Division <span class="pulse-tag">v2</span></summary>
      <div class="sbn-inner">
        <div class="trow" data-go="agents">🤖 <span>Agent Studio v2</span><span class="badge-count" style="background:var(--jv-a1,#35d6e8)">16</span></div>
        <div class="trow" data-go="pipes">⛓️ <span>Pipeline Builder</span></div>
        <div class="trow" data-go="sched">⏰ <span>Scheduler</span></div>
        <div class="trow" data-go="queue">📥 <span>Task Queue</span></div>
        <div class="trow" data-go="web">🌐 <span>Web Agent</span></div>
      </div>`;
    host.appendChild(d);
    $$("div.trow", d).forEach(t => t.onclick = () => ({ agents: () => agentStudio(""), pipes: pipelines, sched: scheduler, queue: taskQueue, web: webAgent })[t.dataset.go]());
  }
  function inject() {
    injectSidebar();
  }

  /* slash commands: /agents2, /pipelines, /schedule, /queue, /webagent */
  const is0 = JV.interceptSend.bind(JV);
  JV.interceptSend = async raw => {
    const t = (raw || "").trim();
    const m = t.match(/^\/(agents2|pipelines|schedule|queue|webagent|briefing)(\s+[\s\S]*)?$/i);
    if (m) {
      const arg = (m[2] || "").trim();
      ({ agents2: () => agentStudio(arg), pipelines: pipelines, schedule: scheduler, queue: taskQueue, webagent: webAgent, briefing: () => morningBriefing(false) })[m[1].toLowerCase()]();
      return true;
    }
    return is0(raw);
  };

  if (document.readyState === "loading") addEventListener("DOMContentLoaded", inject);
  else inject();
  /* extend JV API for other modules */
  JV.runScheduledTask = runAgentDocless; JV.agentStudio = agentStudio; JV.pipelines = pipelines; JV.scheduler = scheduler; JV.taskQueue = taskQueue; JV.webAgent = webAgent; JV.morningBriefing = morningBriefing;
})();
