/* ═══════════════════════════════════════════════════════════════════
   JARVIK INTELLIGENCE STUDIO (studio.js) · Phase 3
   Memory Graph · BM25 Recall · Global Search · Context Meter
   Summary Branches · Licensing · Cost Dashboard · Packs
   CSV Insights · SQL Sandbox · PDF→Data · Doc Editor · Flashcards
   Git-Lite · Codebase Q&A · Diff Review
   Loads after agents.js (uses window.JV + window.JVM)
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const JV = window.JV, JVM = window.JVM;
  if (!JV || !JVM) return;
  const { $, $$, esc, sget, sset, uid, ask, chop, sendVia } = JVM;

  /* pro config */
  const cfg = () => sget("jv_pro", { recall: true, memgraph: true });
  const setCfg = c => sset("jv_pro", Object.assign(cfg(), c));

  /* ═══════════════ 1 · MEMORY GRAPH ═══════════════ */
  function mem2All() { return sget("jv_mem2", []); }
  function mem2Set(a) { sset("jv_mem2", a.slice(-60)); }
  function memoryGraph() {
    const ov = JVM.modal("jv-mem2", `🧠 Memory Graph`, `
      <p class="jv-hint">Tagged memories with links — injected via systemTune as structured context, not a flat list.</p>
      <div class="jv-row2"><input id="jv-m2-txt" placeholder="New fact… e.g. shipping Friday"> <input id="jv-m2-tag" placeholder="tag (optional)" style="max-width:130px"><button class="jv-btn" id="jv-m2-add">＋</button></div>
      <div class="jv-row2"><button class="jv-btn ghost" id="jv-m2-extract">✨ Auto-extract from latest chat</button><span class="jv-hint" style="margin-left:auto">${mem2All().length} memories</span></div>
      <div id="jv-m2-list" class="jv-mem2-list"></div>`);
    ov.classList.remove("hidden");
    const render = () => {
      const a = mem2All();
      const tags = [...new Set(a.flatMap(m => m.tags || []))];
      $("jv-m2-list").innerHTML = a.map(m => `
        <div class="jv-mem2-item" data-i="${a.indexOf(m)}">
          <span>${esc(m.text)}</span>
          <em>${(m.tags || []).map(t => "#" + esc(t)).join(" ")}${(m.links || []).length ? " · ⛓ " + (m.links || []).length : ""}</em>
          <button data-act="edit" data-i="${a.indexOf(m)}">✎</button><button data-act="del" data-i="${a.indexOf(m)}">✕</button>
        </div>`).join("") || `<div class="jv-hint">Empty. Add facts — or let JARVIK auto-extract from your chats.</div>`;
      $$("button[data-act]", $("jv-m2-list")).forEach(b => b.onclick = () => {
        const a = mem2All(), m = a[+b.dataset.i];
        if (b.dataset.act === "del") { a.splice(+b.dataset.i, 1); mem2Set(a); render(); return; }
        const tags = prompt("Tags (space separated):", (m.tags || []).join(" "));
        if (tags === null) return;
        m.tags = tags.split(/\s+/).filter(Boolean); mem2Set(a); render();
      });
      $$(".jv-mem2-item span", $("jv-m2-list")).forEach(el => el.ondblclick = () => { const a = mem2All(); const m = a[+el.closest(".jv-mem2-item").dataset.i]; const t = prompt("Edit memory:", m.text); if (t) { m.text = t; mem2Set(a); render(); } });
    };
    render();
    $("jv-m2-add").onclick = () => { const t = $("jv-m2-txt").value.trim(); if (!t) return; const tags = $("jv-m2-tag").value.trim().split(/\s+/).filter(Boolean); const a = mem2All(); a.push({ id: uid(), text: t, tags, ts: Date.now() }); mem2Set(a); $("jv-m2-txt").value = ""; JVM.bus("memAdded"); render(); };
    $("jv-m2-extract").onclick = async () => {
      const rows = $$(".mr", $("chat-container"));
      const convo = rows.slice(-6).map(r => (r.classList.contains("user") ? "USER: " : "AI: ") + chop(r.innerText, 700)).join("\n");
      if (!convo.trim()) return JVM.toast("No recent messages to mine");
      JVM.toast("✨ Mining for memories…");
      try {
        const reply = await ask(`Extract 0-5 durable facts about the USER (not the AI) worth remembering long-term. Reply as a JSON array of strings. No other text.\n\n${convo}`, { maxTokens: 300, temp: 0.3 });
        const match = reply.match(/\[[\s\S]*\]/); if (!match) return JVM.toast("Nothing worth memorizing");
        const facts = JSON.parse(match[0]).filter(Boolean).slice(0, 5);
        const a = mem2All(); facts.forEach(f => a.push({ id: uid(), text: String(f).slice(0, 200), tags: ["auto"], ts: Date.now() }));
        mem2Set(a); JVM.toast("🧠 +" + facts.length + " memories"); render();
      } catch (e) { JVM.toast("Extract failed: " + e.message); }
    };
  }

  /* ═══════════════ 2 · BM25 SMART RECALL ═══════════════ */
  function sourceDocs() {
    const kb = (sget("jarvik_knowledge", []) || []).map(d => ({ name: d.name, content: d.content || "" }));
    const docs = sget("jv_docs", []).map(d => ({ name: d.name, content: d.content || "" }));
    return kb.concat(docs);
  }
  const STOP = new Set("the a an and or to of in for with is are be my me i you it on at this that as by from of".split(" "));
  function chunks(corpus) {
    return (corpus || sourceDocs()).flatMap(d => {
      const words = String(d.content).split(/\s+/);
      const out = [];
      for (let i = 0; i < words.length; i += 130) out.push({ name: d.name, body: words.slice(i, i + 130).join(" ") });
      return out;
    });
  }
  function bm25(query, k, corpus) {
    const cs = chunks(corpus); if (!cs.length) return [];
    const qs = query.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
    const N = cs.length, avgdl = cs.reduce((s, c) => s + c.body.split(/\s+/).length, 0) / N;
    const df = {}; qs.forEach(w => { df[w] = cs.filter(c => c.body.toLowerCase().includes(w)).length; });
    return cs.map((c, i) => {
      const dl = c.body.split(/\s+/).length;
      let score = 0;
      qs.forEach(w => {
        const f = (c.body.toLowerCase().split(w).length - 1);
        if (!f) return;
        score += Math.log(1 + (N - df[w] + .5) / (df[w] + .5)) * (f * 2.2 / (f + 1.2 * (.75 + .25 * dl / avgdl)));
      });
      return { score, i, c };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k || 3);
  }
  /* inject recall into every system prompt */
  const st0 = JV.systemTune.bind(JV);
  JV.systemTune = p => {
    let extra = "";
    try {
      if (cfg().memgraph) {
        const mem = mem2All().filter(m => m.text);
        if (mem.length) extra += "\n\nMEMORY GRAPH:\n" + mem.slice(-12).map(m => `- (${(m.tags || []).join(",") || "fact"}) ${m.text}`).join("\n");
      }
      if (cfg().recall) {
        const hits = bm25(p || "", 2).filter(h => h.c.body.length > 60);
        if (hits.length) extra += "\n\nRELEVANT KNOWLEDGE (auto-recalled, cite only if useful):\n" + hits.map(h => `[${h.c.name}] ${chop(h.c.body, 700)}`).join("\n---\n");
      }
    } catch (e) {}
    return st0(p) + extra;
  };
  function recallTester() {
    const q = JVM.prompt("Smart Recall test", "Type a query to test retrieval…");
    q.then(query => {
      if (!query) return;
      const hits = bm25(query, 5);
      JVM.modal("jv-recall", `🔎 Smart Recall`, hits.length ? hits.map(h => `<div class="jv-recall-hit"><b>${esc(h.c.name)}</b> <em>score ${h.score.toFixed(1)}</em><br>${esc(chop(h.c.body, 400))}</div>`).join("") : `<div class="jv-hint">No matching knowledge chunks. Upload files to the Knowledge Shelf or Boost docs first.</div>`).classList.remove("hidden");
    });
  }

  /* ═══════════════ 3 · GLOBAL SEARCH ═══════════════ */
  function globalSearch() {
    const ov = JVM.modal("jv-gsearch", `🌐 Global Chat Search`, `
      <input class="jv-gs-in" id="jv-gs-in" placeholder="Search every conversation's title and text…">
      <div id="jv-gs-out"></div>`);
    ov.classList.remove("hidden");
    const inp = $("jv-gs-in"); inp.focus();
    const run = () => {
      const q = inp.value.trim().toLowerCase();
      const out = $("jv-gs-out");
      if (q.length < 2) { out.innerHTML = `<div class="jv-hint">Type at least 2 characters.</div>`; return; }
      const hits = [];
      sget("jarvik_proj", []).forEach(p => {
        const hayTitle = (p.title || "").toLowerCase();
        const hayBody = String(p.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
        let idx = hayBody.indexOf(q), count = 0, snips = [];
        if (hayTitle.includes(q)) count++;
        while (idx > -1 && snips.length < 3) { count++; snips.push(hayBody.slice(Math.max(0, idx - 60), idx + 110)); idx = hayBody.indexOf(q, idx + q.length); }
        if (count) hits.push({ p, count, snips });
      });
      hits.sort((a, b) => b.count - a.count);
      out.innerHTML = hits.slice(0, 12).map(h => `
        <div class="jv-gs-hit" data-id="${esc(h.p.id)}"><b>${esc(h.p.title)}</b> <em>${h.count} hit${h.count > 1 ? "s" : ""}</em>
        ${h.snips.map(s => `<div class="jv-gs-snip">…${esc(s)}…</div>`).join("")}</div>`).join("")
        || `<div class="jv-hint">No matches in any conversation.</div>`;
      $$(".jv-gs-hit", out).forEach(el => el.onclick = () => {
        localStorage.setItem("jarvik_cur", el.dataset.id);
        try { window.loadChat && window.loadChat(); window.renderProjs && window.renderProjs(); } catch (e) {}
        ov.classList.add("hidden");
      });
    };
    inp.addEventListener("input", run); run();
  }

  /* ═══════════════ 4 · CONTEXT METER ═══════════════ */
  let meter = null;
  function contextCalc() {
    const mem = mem2All().reduce((s, m) => s + m.text.length, 0);
    const docs = sourceDocs().reduce((s, d) => s + String(d.content).length, 0);
    const tokens = Math.round((mem + Math.round(docs * 1)) / 4); // rough chars→tokens; recall only injects top chunks
    return { tokens, docs: sourceDocs().length, mem: mem2All().length, recall: cfg().recall };
  }
  function injectMeter() {
    const iw = document.querySelector(".iw");
    if (!iw || $("jv-ctxmeter")) return;
    meter = document.createElement("button"); meter.id = "jv-ctxmeter"; meter.className = "jv-ctxmeter";
    iw.appendChild(meter);
    meter.onclick = () => {
      const c = contextCalc();
      JVM.modal("jv-ctxdetail", `📐 Context Budget`, `
        <div class="jv-ctx-grid">
          <div class="jv-pc"><b>${c.mem}</b><span>memories</span></div>
          <div class="jv-pc"><b>${c.docs}</b><span>knowledge docs</span></div>
          <div class="jv-pc"><b>~${Math.round(c.tokens / 15)}</b><span>typical recall / prompt</span></div>
          <div class="jv-pc"><b>${c.recall ? "2 chunks" : "off"}</b><span>BM25 recall</span></div>
        </div>
        <p class="jv-hint">Smart Recall keeps context lean: only the 2 most relevant chunks (≤ 1,600 chars) plus your last 12 memories travel with each prompt.</p>`).classList.remove("hidden");
    };
  }
  setInterval(() => {
    injectMeter(); if (!meter) return;
    const c = contextCalc();
    meter.textContent = `📐 ~${Math.round(c.tokens / 15)} ctx`;
    meter.title = "Context budget — click for breakdown";
  }, 4000);

  /* ═══════════════ 5 · SUMMARY BRANCHES ═══════════════ */
  function summaryBranches() {
    const projects = sget("jarvik_proj", []);
    const ov = JVM.modal("jv-branch", `🌿 Summary Branches`, `
      <p class="jv-hint">Condense an old chat into a context capsule, then continue fresh without dragging the whole history (and its tokens) along.</p>
      <div id="jv-br-list" class="jv-br-list">${projects.slice(0, 14).map((p, i) => `<div class="jv-br-item" data-i="${i}"><span>${esc(p.title || "Untitled")}</span><button>🌿 Branch it</button></div>`).join("")}</div>
      <div id="jv-br-running">${sget("jv_capsules", []).map(c => `<div class="jv-gs-hit">📦 ${esc(c.name)} <button class="jv-br-go" data-i="${c.id}">resume → fresh chat</button></div>`).join("")}</div>`);
    ov.classList.remove("hidden");
    $$(".jv-br-item", $("jv-br-list")).forEach(el => el.querySelector("button").onclick = async () => {
      const p = projects[+el.dataset.i];
      const text = String(p.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 14000);
      el.querySelector("button").textContent = "⏳ condensing…";
      try {
        const capsule = await ask(`Condense this chat transcript into a dense context capsule: goal, decisions made, open threads, key facts. Max 150 words. Reply with the capsule only.\n\n${text}`, { maxTokens: 330 });
        const caps = sget("jv_capsules", []);
        const id = uid();
        caps.unshift({ id, name: p.title || "branch", capsule, ts: Date.now() });
        sset("jv_capsules", caps.slice(-10));
        el.querySelector("button").textContent = "✅ capsule ready";
        document.querySelector("#jv-br-running").insertAdjacentHTML("afterbegin", `<div class="jv-gs-hit">📦 ${esc(p.title)} <button class="jv-br-go" data-i="${id}">resume → fresh chat</button></div>`);
        $$("button.jv-br-go", $("jv-br-running")).forEach(b => b.onclick = () => {
          const c = caps.find(x => x.id === b.dataset.i); if (!c) return;
          try { window.newConv && window.newConv("Continued · " + c.name); } catch (e) { localStorage.setItem("jarvik_cur", uid()); }
          sendVia(`CONTEXT CAPSULE (from “${c.name}”):\n${c.capsule}\n\nAcknowledge silently, then continue naturally.`);
          ov.classList.add("hidden");
        });
      } catch (e) { el.querySelector("button").textContent = "⚠ failed"; JVM.toast(e.message); }
    });
    $$("button.jv-br-go", $("jv-br-running")).forEach(b => b.onclick = () => {
      const caps = sget("jv_capsules", []); const c = caps.find(x => x.id === b.dataset.i); if (!c) return;
      try { window.newConv && window.newConv("Continued · " + c.name); } catch (e) {}
      sendVia(`CONTEXT CAPSULE (from “${c.name}”):\n${c.capsule}\n\nAcknowledge silently, then continue naturally.`);
      ov.classList.add("hidden");
    });
  }

  /* ═══════════════ 6 · LICENSING + GATES ═══════════════ */
  const LICENSE_SALT = "JARVIK-PRO-2026-VGR";
  function licValid(key) {
    try {
      var m = String(key || "").toUpperCase().match(/^PRO-([A-Z2-7]{4})-([A-Z2-7]{4})$/);
      if (!m) return false;
      const payload = m[1], sum = m[2];
      let h = 7;
      for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i) + i * 13) % 1777;
      h ^= LICENSE_SALT.split("").reduce((a, c) => (a * 33 + c.charCodeAt(0)) % 1777, 3);
      const Al = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const want = Al[h % 32] + Al[(h >> 3) % 32] + Al[(h >> 6) % 32] + Al[(h >> 9) % 32];
      return want === sum;
    } catch (e) { return false; }
  }
  function forgeKey() {
    const Al = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const chars = () => Array.from({ length: 4 }, () => Al[Math.floor(Math.random() * 32)]).join("");
    const payload = chars();
    let h = 7;
    for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i) + i * 13) % 1777;
    h ^= LICENSE_SALT.split("").reduce((a, c) => (a * 33 + c.charCodeAt(0)) % 1777, 3);
    const sum = [Al[h % 32], Al[(h >> 3) % 32], Al[(h >> 6) % 32], Al[(h >> 9) % 32]].join("");
    return "PRO-" + payload + "-" + sum;
  }
  function licenseState() {
    const s = sget("jv_license", {});
    if (s.key && licValid(s.key)) return "pro";
    const since = s.trialSince || (s.trialSince = Date.now(), sset("jv_license", s), s.trialSince);
    const days = Math.floor((Date.now() - since) / 864e5);
    return days < 7 ? "trial:" + (7 - days) + "d" : "expired";
  }
  JVM.licenseState = licenseState; JVM.licValid = licValid; JVM.forgeKey = forgeKey;
  function licenseHub() {
    const st = licenseState();
    const c = JVM.modal("jv-lic", `💼 JARVIK Pro`, `
      <div class="jv-lic-state st-${st.split(":")[0]}">${st === "pro" ? "🏅 PRO unlocked — everything is yours" : st.startsWith("trial") ? "⏳ Pro trial: " + st.split(":")[1] + " left" : "🔒 Trial ended — Pro features paused"}</div>
      <div class="jv-field"><label>License key (offline-verified)</label><input id="jv-lic-key" placeholder="PRO-XXXX-XXXX"></div>
      <button class="jv-btn" id="jv-lic-redeem">Redeem key</button>
      <button class="jv-btn ghost" id="jv-lic-dev">Developer forge (passphrase)</button>
      <p class="jv-hint">Keys verify locally — no server, no accounts, matches the privacy story.</p>`);
    c.classList.remove("hidden");
    $("jv-lic-redeem").onclick = () => {
      const k = $("jv-lic-key").value.trim().toUpperCase();
      if (!licValid(k)) { JVM.toast("⚠ Invalid key"); return; }
      const s = sget("jv_license", {}); s.key = k; sset("jv_license", s);
      JVM.toast("🏅 Pro unlocked!"); JVM.bus("licensed"); c.classList.add("hidden");
    };
    $("jv-lic-dev").onclick = () => { const p = JVM.askSync ? JVM.askSync() : prompt("Vikrant passphrase:"); if (p === "VGR") { const key = forgeKey(); JVM.modal("jv-lic-forged", `🔥 Forged key (offline rules)`, `<code class="jv-lic-key">${key}</code><p class="jv-hint">Give this key to a customer — or redeem below for testing.</p><button class="jv-btn" id="jv-lic-self">Redeem on this device</button>`).classList.remove("hidden"); $("jv-lic-self").onclick = () => { const s = sget("jv_license", {}); s.key = key; sset("jv_license", s); JVM.toast("🏅 Pro unlocked (self)"); JVM.bus("licensed"); }; } };
  }

  /* ═══════════════ 7 · COST DASHBOARD ═══════════════ */
  function costDashboard() {
    const u = sget("jarvik_usage", { events: [] });
    const byDay = {}, byModel = {};
    let total = 0, toks = 0;
    u.events.forEach(e => {
      total += e.estCost || 0; toks += e.estTokens || 0;
      const d = new Date(e.t).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] || 0) + (e.estCost || 0);
      byModel[e.model || "?"] = (byModel[e.model || "?"] || 0) + (e.estCost || 0);
    });
    const days = Object.keys(byDay).sort().slice(-14);
    const max = Math.max(1e-6, ...days.map(d => byDay[d]));
    const models = Object.entries(byModel).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const ov = JVM.modal("jv-cost", `💰 Cost Dashboard`, `
      <div class="jv-ctx-grid">
        <div class="jv-pc"><b>$${total.toFixed(2)}</b><span>lifetime estimate</span></div>
        <div class="jv-pc"><b>${Math.round(toks / 1000)}k</b><span>tokens</span></div>
        <div class="jv-pc"><b>$${(last7()).toFixed(2)}</b><span>last 7 days</span></div>
        <div class="jv-pc"><b>$${(total / Math.max(1, u.events.length)).toFixed(3)}</b><span>avg / reply</span></div>
      </div>
      <canvas id="jv-cost-cv" width="560" height="150"></canvas>
      <div class="jv-cost-models">${models.map(m => `<span>⚙ ${esc(String(m[0]).split("/").pop())} <b>$${m[1].toFixed(2)}</b></span>`).join("") || "<em>no usage yet</em>"}</div>
      <p class="jv-hint">Estimated from your usage log — per-model rates configurable since prices vary by provider.</p>`);
    ov.classList.remove("hidden");
    const cv = $("jv-cost-cv"), c2 = cv.getContext("2d");
    days.forEach((d, i) => {
      const bw = 30, gap = 10, x = 14 + i * (bw + gap), h = 110 * (byDay[d] / max), y = 140 - h;
      c2.fillStyle = "#35d6e8";
      c2.beginPath(); c2.roundRect(x, y, bw, Math.max(2, h), 5); c2.fill();
      c2.fillStyle = "rgba(255,255,255,.55)"; c2.font = "10px 'JetBrains Mono'";
      c2.fillText(d.slice(5), x - 2, 149);
    });
    function last7() { const cut = Date.now() - 7 * 864e5; return u.events.filter(e => e.t > cut).reduce((s, e) => s + (e.estCost || 0), 0); }
  }

  /* ═══════════════ 8 · PACKS EXPORT/IMPORT ═══════════════ */
  function packsHub() {
    const ov = JVM.modal("jv-packs", `📦 Packs & Share-Codes`, `
      <p class="jv-hint">Export your memories, pipelines, capsules and boost knowledge as one file — or a #jvpack= link you can share.</p>
      <div class="jv-row2"><button class="jv-btn" id="jv-pk-ex">⬇ Export .jvpack file</button><button class="jv-btn ghost" id="jv-pk-url">🔗 Make share-code link</button></div>
      <div class="jv-row2"><input type="file" id="jv-pk-in" accept=".jvpack,application/json" style="flex:1"><button class="jv-btn ghost" id="jv-pk-sniff">Check clipboard link</button></div>
      <div id="jv-pk-out"></div>`);
    ov.classList.remove("hidden");
    const bundle = () => ({ v: 3, made: Date.now(), mem: mem2All(), memory: sget("jv_memory", []), pipes: sget("jv_pipes", []), docs: sget("jv_docs", []), capsules: sget("jv_capsules", []), sched: sget("jv_sched", []) });
    const apply = b => {
      if (!b || b.v !== 3) return JVM.toast("Not a JARVIK pack");
      mem2Set((mem2All()).concat(b.mem || []).slice(-60));
      const memory = sget("jv_memory", []).concat(b.memory || []).slice(-50); sset("jv_memory", memory);
      sset("jv_pipes", sget("jv_pipes", []).concat(b.pipes || []).slice(-30));
      sset("jv_docs", sget("jv_docs", []).concat(b.docs || []).slice(-24));
      sset("jv_capsules", b.capsules ? sget("jv_capsules", []).concat(b.capsules).slice(-10) : sget("jv_capsules", []));
      sset("jv_sched", sget("jv_sched", []).concat(b.sched || []).slice(-10));
      JVM.toast("📦 Pack installed"); JVM.bus("packImported");
    };
    const bdown = (obj, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj)], { type: "application/json" })); a.download = name; a.click(); };
    $("jv-pk-ex").onclick = () => bdown(bundle(), "jarvik-" + new Date().toISOString().slice(0, 10) + ".jvpack");
    $("jv-pk-url").onclick = () => {
      const txt = btoa(unescape(encodeURIComponent(JSON.stringify(bundle())))).replace(/=+$/, "");
      $("jv-pk-out").innerHTML = `<div class="jv-hint">Copy this link — anyone opening it gets the pack (≤ browser URL limits ≈ 2000 chars):</div><code class="jv-lic-key" id="jv-pk-code">${location.href.split("#")[0]}#jvpack=${txt}</code><button class="jv-btn ghost" id="jv-pk-copy">📋 Copy</button>`;
      $("jv-pk-copy").onclick = () => { copyText($("jv-pk-code").textContent, "Copied"); };
    };
    $("jv-pk-in").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => { try { apply(JSON.parse(r.result)); } catch (err) { JVM.toast("Bad pack file"); } };
      r.readAsText(f);
    };
    $("jv-pk-sniff").onclick = () => { navigator.clipboard.readText().then(t => { const m = t.match(/#jvpack=([A-Za-z0-9+/]+)/); if (!m) return JVM.toast("No pack in clipboard"); try { apply(JSON.parse(decodeURIComponent(escape(atob(m[1]))))); } catch (e) { JVM.toast("Bad share-code"); } }).catch(() => JVM.toast("Clipboard unreadable")); };
  }
  function sniffPackLinkOnBoot() {
    const m = location.hash.match(/#jvpack=([A-Za-z0-9+/]+)/);
    if (!m) return;
    try {
      const b = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
      if (b.v !== 3) return;
      const ov = JVM.modal("jv-pack-offer", `📦 Pack detected in link`, `<p>Install this pack — ${((b.mem || []).length)} memories, ${((b.pipes || []).length)} pipelines, ${((b.docs || []).length)} docs?</p><button class="jv-btn" id="jv-pk-yes">Install pack</button>`);
      ov.classList.remove("hidden");
      $("jv-pk-yes").onclick = () => {
        mem2Set((mem2All()).concat(b.mem || []).slice(-60));
        sset("jv_memory", sget("jv_memory", []).concat(b.memory || []).slice(-50));
        sset("jv_pipes", sget("jv_pipes", []).concat(b.pipes || []).slice(-30));
        sset("jv_docs", sget("jv_docs", []).concat(b.docs || []).slice(-24));
        ov.classList.add("hidden"); JVM.toast("📦 Pack installed"); history.replaceState(null, "", "#");
      };
    } catch (e) {}
  }

  /* ═══════════════ 9 · CSV INSIGHTS ═══════════════ */
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some(c => c !== "")) rows.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell); if (row.some(c => c !== "")) rows.push(row);
    return rows;
  }
  function csvInsights() {
    const ov = JVM.modal("jv-csv", `📊 CSV Insights`, `
      <div class="jv-row2"><input type="file" id="jv-csv-file" accept=".csv,text/csv"><button class="jv-btn ghost" id="jv-csv-doc">Use latest knowledge doc</button></div>
      <div id="jv-csv-out" class="jv-csv-out"><div class="jv-hint">Drop a CSV — get column stats, charts, and an AI narrative.</div></div>`);
    ov.classList.remove("hidden");
    let latest = null;
    const render = rows => {
      if (!rows || rows.length < 2) return JVM.toast("Need a header row + data");
      const [head, ...body] = rows.slice(0, 800);
      const cols = head.map((h, ci) => {
        const vals = body.map(r => r[ci]).filter(v => v != null && v !== "");
        const nums = vals.map(Number).filter(v => !isNaN(v));
        const isNum = nums.length >= vals.length * .7 && nums.length > 0;
        return { h, isNum, min: isNum ? Math.min(...nums) : 0, max: isNum ? Math.max(...nums) : 0, mean: isNum ? nums.reduce((a, b) => a + b, 0) / nums.length : 0 };
      });
      const numCols = cols.map((c, i) => c.isNum ? i : -1).filter(i => i > -1);
      latest = { head, body, numCols, cols };
      $("jv-csv-out").innerHTML = `
        <div class="jv-csv-stats">${cols.slice(0, 8).map(c => `<span>${esc(c.h)}: ${c.isNum ? `min ${c.min.toFixed(1)} · max ${c.max.toFixed(1)} · mean ${c.mean.toFixed(1)}` : esc(String(c.h).slice(0, 20)) + ` (${body.length} rows)`}</span>`).join("")}</div>
        <div class="jv-row2"><select id="jv-csv-col">${numCols.map(i => `<option value="${i}">${esc(head[i])}</option>`).join("") || "<option>no numeric columns</option>"}</select><button class="jv-btn ghost" id="jv-csv-chart">📈 Plot</button><button class="jv-btn ghost" id="jv-csv-ai">🧠 AI narrative</button></div>
        <canvas id="jv-csv-cv" width="560" height="180"></canvas>`;
      $("jv-csv-chart").onclick = () => {
        const ci = +$("jv-csv-col").value; if (isNaN(ci)) return;
        const cv = $("jv-csv-cv"), c2 = cv.getContext("2d");
        c2.clearRect(0, 0, cv.width, cv.height);
        const vals = body.slice(0, 40).map(r => +r[ci]).filter(v => !isNaN(v));
        if (!vals.length) return;
        const min = Math.min(...vals), max = Math.max(...vals), span = Math.max(1e-9, max - min);
        const bw = cv.width / vals.length;
        vals.forEach((v, i) => {
          const h = 10 + 150 * ((v - min) / span);
          c2.fillStyle = i % 2 ? "#35d6e8" : "#7c8cff";
          c2.fillRect(i * bw + 2, 170 - h, bw - 4, h);
        });
        c2.fillStyle = "rgba(255,255,255,.6)"; c2.font = "11px 'DM Sans'";
        c2.fillText(head[ci] + " · first " + vals.length + " rows", 8, 14);
      };
      $("jv-csv-ai").onclick = async () => {
        JVM.toast("🧠 Analyzing…");
        const sample = rows.slice(0, 60).map(r => r.join(" | ")).join("\n");
        try {
          const narrative = await ask(`CSV columns: ${head.join(", ")}\nData sample:\n${sample}\n\nYou are Prism, senior data analyst. Give: 1 headline insight, 3 numbered observations, 1 recommendation. Under 170 words.`, { maxTokens: 340 });
          $("jv-csv-out").insertAdjacentHTML("beforeend", `<div class="jv-ag-body">${esc(narrative).replace(/\n/g, "<br>")}</div>`);
        } catch (e) { JVM.toast("AI napped: " + e.message); }
      };
    };
    $("jv-csv-file").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => render(parseCSV(r.result)); r.readAsText(f); };
    $("jv-csv-doc").onclick = () => {
      const d = sget("jv_docs", []).slice().reverse().find(x => /csv|sheet|table/i.test(x.name)) || sget("jv_docs", []).slice(-1)[0];
      if (!d) return JVM.toast("No knowledge docs yet");
      render(parseCSV(d.content));
    };
  }

  /* ═══════════════ 10 · SQL SANDBOX (sql.js, CDN, local execution) ═══════════════ */
  function sqlSandbox() {
    const ov = JVM.modal("jv-sql", `🗃 SQL Sandbox`, `
      <p class="jv-hint">Real SQLite via sql.js — runs 100% in your browser on top of a CSV you upload. No data leaves the page.</p>
      <div class="jv-row2"><input type="file" id="jv-sql-file" accept=".csv"><span class="jv-hint">CSV → table csv_data</span></div>
      <textarea id="jv-sql-q" rows="4" placeholder="SELECT * FROM csv_data LIMIT 10">SELECT * FROM csv_data LIMIT 10</textarea>
      <div class="jv-row2"><button class="jv-btn" id="jv-sql-run">▶ Run query</button><button class="jv-btn ghost" id="jv-sql-ai">🧠 Write query for me</button></div>
      <div id="jv-sql-out" class="jv-csv-out"><div class="jv-hint">Upload a CSV to create the csv_data table.</div></div>`);
    ov.classList.remove("hidden");
    let SQL = null, db = null;
    let ready = null;
    const boot = cb => {
      if (!ready) ready = new Promise((resolve, reject) => {
        if (window.initSqlJs) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
        script.onload = resolve; script.onerror = () => reject(new Error('sql.js CDN unreachable'));
        document.head.appendChild(script);
      }).then(() => window.initSqlJs({locateFile:f=>'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/'+f}))
        .then(module => { SQL = module; db = new SQL.Database(); });
      return ready.then(cb).catch(e=>{ready=null;JVM.toast('SQL: '+e.message);});
    };
    $("jv-sql-file").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      boot(() => {
        const r = new FileReader(); r.onload = () => {
          const rows = parseCSV(r.result);
          if (!rows.length) return JVM.toast('CSV is empty');
          const used = new Set();
          const head = rows[0].map((h,i) => { const base = h.replace(/[^a-zA-Z0-9_]/g,'_') || 'column_'+i; let name=base, n=1; while(used.has(name.toLowerCase()))name=base+'_'+n++;used.add(name.toLowerCase());return name; });
          db.run(`DROP TABLE IF EXISTS csv_data`);
          db.run(`CREATE TABLE csv_data (${head.map(h => '"' + h + '" TEXT').join(",")})`);
          rows.slice(1, 5000).forEach(row => db.run(`INSERT INTO csv_data VALUES (${head.map(() => "?").join(",")})`, head.map((h, i) => row[i] == null ? "" : String(row[i]))));
          JVM.toast("🗃 csv_data created (" + (rows.length - 1) + " rows)");
        };
        r.readAsText(f);
      });
    };
    const grid = res => {
      const cols = res[0].columns, vals = res[0].values;
      return `<table class="jv-sql-grid"><tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr>${vals.slice(0, 40).map(r => `<tr>${r.map(v => `<td>${esc(v == null ? "" : String(v))}</td>`).join("")}</tr>`).join("")}</table><div class="jv-hint">${vals.length} rows</div>`;
    };
    $("jv-sql-run").onclick = () => boot(() => {
      if (!db) return JVM.toast("Load a CSV first");
      try { const res = db.exec($("jv-sql-q").value); $("jv-sql-out").innerHTML = res.length ? grid(res) : `<div class="jv-hint">No rows returned.</div>`; }
      catch (e) { $("jv-sql-out").innerHTML = `<div class="jv-rx-err">⚠ ${esc(e.message)}</div>`; }
    });
    $("jv-sql-ai").onclick = async () => {
      JVM.prompt("AI query writer", "Describe the rows you want in plain English…").then(req => {
        if (!req) return;
        ask(`Write a single SQLite query against table csv_data (all TEXT columns). Requirement: ${req}\nReply with ONLY the SQL, no markdown.`, { maxTokens: 120 }).then(sql => { $("jv-sql-q").value = sql.replace(/```[a-z]*|```/g, "").trim(); JVM.toast("Query written — Run it"); }).catch(e => JVM.toast(e.message));
      });
    };
  }

  /* ═══════════════ 11 · PDF → STRUCTURED DATA ═══════════════ */
  function pdfData() {
    const ov = JVM.modal("jv-pdf", `📑 PDF → Structured Data`, `
      <div class="jv-row2"><input type="file" id="jv-pdf-file" accept=".pdf"><select id="jv-pdf-tpl" style="max-width:170px"><option value="invoice">Invoice → JSON</option><option value="resume">Resume → JSON</option><option value="custom">Freeform</option></select></div>
      <input id="jv-pdf-custom" placeholder="Custom template: fields you want…" class="jv-field" style="display:none">
      <div class="jv-row2"><button class="jv-btn" id="jv-pdf-go">▶ Extract</button></div>
      <div id="jv-pdf-out" class="jv-csv-out"></div>`);
    ov.classList.remove("hidden");
    $("jv-pdf-tpl").onchange = e => $("jv-pdf-custom").style.display = e.target.value === "custom" ? "block" : "none";
    $("jv-pdf-go").onclick = () => {
      const f = $("jv-pdf-file").files[0]; if (!f) return JVM.toast("Choose a PDF");
      const fileReader = new FileReader();
      fileReader.onload = async ev => {
        JVM.toast("⏳ reading PDF…");
        try {
          const pdfjs = window["pdfjs-dist/build/pdf"] || window.pdfjsLib;
          pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const doc = await pdfjs.getDocument({ data: new Uint8Array(ev.target.result) }).promise;
          let text = "";
          for (let i = 1; i <= Math.min(20, doc.numPages); i++) { const pg = await doc.getPage(i); text += "\n" + (await pg.getTextContent()).items.map(t => t.str).join(" "); }
          const tpl = $("jv-pdf-tpl").value === "custom" ? "Extract these fields: " + $("jv-pdf-custom").value : $("jv-pdf-tpl").value === "invoice" ? "Extract invoice fields: seller, buyer, invoice_no, date, currency, line_items (array of {desc, qty, price}), tax, total" : "Extract resume fields: name, email, phone, locations, employers [ {company, role, start, end} ], education, skills (array)";
          JVM.toast("🧠 structuring…");
          const reply = await ask(`PDF text:\n${chop(text, 12000)}\n\n${tpl}\nReply with ONLY clean JSON. Missing fields = null.`, { maxTokens: 700, temp: 0.2 });
          const m = reply.match(/\{[\s\S]*\}/) || reply.match(/\[[\s\S]*\]/);
          const pretty = m ? JSON.stringify(JSON.parse(m[0]), null, 2) : reply;
          $("jv-pdf-out").innerHTML = `<pre class="jv-pdf-json">${esc(pretty)}</pre><div class="jv-row2"><button class="jv-btn ghost" id="jv-pdf-save">📚 Save as doc</button><button class="jv-btn ghost" id="jv-pdf-dl">⬇ .json</button></div>`;
          $("jv-pdf-save").onclick = () => { const d = sget("jv_docs", []); d.push({ name: "PDF extract · " + f.name.slice(0, 30), content: pretty.slice(0, 9000), ts: Date.now() }); sset("jv_docs", d.slice(-12)); JVM.toast("saved"); };
          $("jv-pdf-dl").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([pretty], { type: "application/json" })); a.download = f.name.replace(/\.pdf$/i, "") + ".json"; a.click(); };
        } catch (e) { JVM.toast("PDF failed: " + e.message); }
      };
      fileReader.readAsArrayBuffer(f);
    };
  }

  /* ═══════════════ 12 · DOC EDITOR ═══════════════ */
  function docEditor() {
    const ov = JVM.modal("jv-doced", `📝 Doc Editor`, `
      <textarea id="jv-de-txt" rows="10" placeholder="Paste or write a draft here…"></textarea>
      <div class="jv-row2 jv-de-acts">
        <button class="jv-btn ghost" data-act="tighten">⚡ Tighten</button>
        <button class="jv-btn ghost" data-act="expand">🔍 Expand</button>
        <button class="jv-btn ghost" data-act="proofread">✅ Proofread</button>
        <button class="jv-btn ghost" data-act="title">🏷 5 titles</button>
      </div>
      <div id="jv-de-out" class="jv-ag-body"></div>`);
    ov.classList.remove("hidden");
    $$("button[data-act]", ov).forEach(b => b.onclick = async () => {
      const t = $("jv-de-txt").value.trim(); if (!t) return JVM.toast("Write something first");
      b.textContent = "⏳"; b.disabled = true;
      const acts = { tighten: "Rewrite tighter, cut 40% of words, keep voice. Return only the rewrite.", expand: "Expand with concrete detail and examples (+60%), keep voice. Return only the rewrite.", proofread: "Fix grammar/punctuation/typos. Return only the corrected text.", title: "Give 5 title options, one per line, no numbering." };
      try {
        const out = await ask(`${acts[b.dataset.act]}\n\n---\n${chop(t, 8000)}`, { maxTokens: 700 });
        $("jv-de-out").innerHTML = `<div class="jv-de-outbox">${esc(out).replace(/\n/g, "<br>")}</div><div class="jv-row2"><button class="jv-btn ghost" id="jv-de-copy">📋 Copy</button>${b.dataset.act !== "title" ? `<button class="jv-btn ghost" id="jv-de-keep">↩ Use as draft</button>` : ""}</div>`;
        $("jv-de-copy").onclick = () => { copyText(out, "Copied"); };
        const keep = $("jv-de-keep"); if (keep) keep.onclick = () => { $("jv-de-txt").value = out; $("jv-de-out").innerHTML = ""; };
      } catch (e) { JVM.toast("suggest failed: " + e.message); }
      b.disabled = false; b.textContent = b.dataset.act[0].toUpperCase() + b.dataset.act.slice(1);
    });
  }

  /* ═══════════════ 13 · FLASHCARDS ═══════════════ */
  function flashcards() {
    const ov = JVM.modal("jv-flash", `🃏 Flashcards`, `
      <div class="jv-row2"><button class="jv-btn" id="jv-fl-src">📚 From latest knowledge doc</button><button class="jv-btn ghost" id="jv-fl-chat">💬 From this chat</button></div>
      <div id="jv-fl-out"><div class="jv-hint">Generate a deck, then quiz yourself. Scoring is spaced-rep-lite.</div></div>`);
    ov.classList.remove("hidden");
    let quiz = [], i = 0, score = 0;
    const genFrom = async txt => {
      JVM.toast("🧠 generating deck…");
      try {
        const reply = await ask(`Create 10 flashcards from this content. Reply ONLY with a JSON array of {q, a}. Questions short, answers ≤ 25 words.\n\n${chop(txt, 9000)}`, { maxTokens: 800, temp: 0.4 });
        const m = reply.match(/\[[\s\S]*\]/); if (!m) throw new Error("bad deck");
        quiz = JSON.parse(m[0]); i = 0; score = 0; showCard();
      } catch (e) { JVM.toast("deck failed: " + e.message); }
    };
    const showCard = () => {
      const host = $("jv-fl-out");
      if (i >= quiz.length) { host.innerHTML = `<div class="jv-flash-score">🏁 Done — ${score}/${quiz.length} recalled</div><button class="jv-btn ghost" id="jv-fl-again">↻ Practice again</button>`; $("jv-fl-again").onclick = () => { i = 0; score = 0; showCard(); }; return; }
      const c = quiz[i];
      host.innerHTML = `
        <div class="jv-flash-card"><em>${i + 1}/${quiz.length}</em><b>${esc(c.q)}</b><div id="jv-fl-ans" style="display:none">${esc(c.a)}</div></div>
        <div class="jv-row2"><button class="jv-btn ghost" id="jv-fl-show">Reveal</button></div>
        <div class="jv-row2 hidden" id="jv-fl-grade"><button class="jv-btn ghost" data-g="0">😅 Again</button><button class="jv-btn ghost" data-g="1">🙂 OK</button><button class="jv-btn ghost" data-g="2">😎 Easy</button></div>`;
      $("jv-fl-show").onclick = () => { $("jv-fl-ans").style.display = "block"; $("jv-fl-grade").classList.remove("hidden"); $("jv-fl-show").classList.add("hidden"); };
      $$("#jv-fl-grade button").forEach(b => b.onclick = () => {
        const g = +b.dataset.g;
        if (g > 0) score++;
        i++; showCard();
      });
    };
    $("jv-fl-src").onclick = () => { const d = sget("jv_docs", []).slice(-1)[0]; if (!d) return JVM.toast("No knowledge docs yet"); genFrom(d.content); };
    $("jv-fl-chat").onclick = () => { const rows = $$(".mr", $("chat-container")); const t = rows.slice(-8).map(r => r.innerText).join("\n"); if (!t.trim()) return JVM.toast("Chat is empty"); genFrom(t); };
  }

  /* ═══════════════ 14 · GIT-LITE ═══════════════ */
  const wsFiles = () => JVM.workspace.read();
  function gitHub() {
    const ov = JVM.modal("jv-git", `🌿 Workspace Git-Lite`, `
      <div class="jv-row2"><input id="jv-gt-msg" placeholder="commit message (blank = AI write it)"><button class="jv-btn" id="jv-gt-commit">⎘ Commit</button></div>
      <div id="jv-gt-log"></div>`);
    ov.classList.remove("hidden");
    const g = sget("jarvik_git", { commits: [] });
    const render = () => {
      $("jv-gt-log").innerHTML = g.commits.map((c, i) => `
        <div class="jv-git-item"><span class="jv-git-dot"></span><div><b>${esc(c.msg)}</b><i>${new Date(c.ts).toLocaleString()} · ${Object.keys(c.files).length} files</i></div>
        <button data-act="diff" data-i="${i}">◐ diff</button><button data-act="revert" data-i="${i}">↩ restore</button></div>`).join("") || `<div class="jv-hint">No commits yet. VS Code Studio files get snapshotted here.</div>`;
      $$("button[data-act]", $("jv-gt-log")).forEach(b => b.onclick = () => {
        const c = g.commits[+b.dataset.i];
        if (b.dataset.act === "diff") {
          const prev = g.commits[+b.dataset.i + 1];
          let html = "";
          Object.keys(c.files).forEach(f => {
            const now = c.files[f], was = (prev && prev.files[f]) || "";
            if (now === was) return;
            html += `<b>◐ ${esc(f)}</b><pre class="jv-git-diff">${esc(now.slice(0, 1500))}</pre>`;
          });
          JVM.modal("jv-git-diff", `Diff · ${esc(c.msg)}`, html || `<div class="jv-hint">First commit — nothing to diff against.</div>`).classList.remove("hidden");
        } else {
          JVM.workspace.write(c.files, true);
          JVM.toast("↩ Restored " + new Date(c.ts).toLocaleString());
        }
      });
    };
    render();
    $("jv-gt-commit").onclick = async () => {
      const files = wsFiles();
      if (!Object.keys(files).length) return JVM.toast("Workspace is empty — open VS Code Studio and create files");
      let msg = $("jv-gt-msg").value.trim();
      if (!msg) {
        try {
          const summary = Object.entries(files).map(([n, c]) => `[${n}] ${chop(c, 400)}`).join("\n").slice(0, 6000);
          msg = (await ask(`Write a one-line commit message (lowercase, imperative) for this workspace state:\n${summary}\nReply with the message only.`, { maxTokens: 60 })) || "update workspace";
        } catch (e) { msg = "workspace update " + new Date().toLocaleTimeString(); }
      }
      g.commits.unshift({ ts: Date.now(), msg, files }); g.commits = g.commits.slice(0, 25);
      sset("jarvik_git", g); JVM.toast("⎘ committed: " + msg); render(); JVM.bus("gitCommitted");
    };
  }
  /* hook the real VS Code terminal with git-lite commands */
  if (window.executeVscTerminal) {
    const xt0 = window.executeVscTerminal.bind(window);
    window.executeVscTerminal = rawCmd => {
      const m = String(rawCmd).trim().match(/^(gitcommit(?:\s+"([^"]*)")?|gitlog|gitdiff|gitrestore(?:\s+\d+)?)\s*$/);
      if (!m) return xt0(rawCmd);
      const g = sget("jarvik_git", { commits: [] });
      const line = (t, ty) => window.logToTerminal && window.logToTerminal(t, ty);
      if (rawCmd.trim().startsWith("gitlog")) g.commits.slice(0, 12).forEach(c => line(`⎘ ${new Date(c.ts).toLocaleString()}  ${c.msg}`, "success"));
      else if (rawCmd.trim().startsWith("gitcommit")) {
        const files = wsFiles(); if (!Object.keys(files).length) return line("gitcommit: workspace empty", "error");
        const msg = m[2] || "workspace update";
        g.commits.unshift({ ts: Date.now(), msg, files }); sset("jarvik_git", Object.assign(g, { commits: g.commits.slice(0, 25) }));
        line(`⎘ committed: ${msg}`, "success");
      }
      else if (rawCmd.trim().startsWith("gitdiff")) { const c = g.commits[0], p = g.commits[1]; if (!c) return line("gitdiff: no commits", "error"); Object.keys(c.files).forEach(f => { if (!p || c.files[f] !== p.files[f]) { line(`◐ ${f}`, "info"); line(chop(c.files[f], 700), "info"); } }); }
      else { const i = +(String(rawCmd).match(/\d+/) || [])[0] || 0; const c = g.commits[i]; if (!c) return line("gitrestore: no such commit", "error"); JVM.workspace.write(c.files, true); line(`↩ restored ${c.msg}`, "success"); }
      JVM.bus("gitCommitted");
    };
  }

  /* ═══════════════ 15 · CODEBASE Q&A ═══════════════ */
  function codebaseQA() {
    const ov = JVM.modal("jv-cqa", `🧭 Codebase Q&A`, `
      <p class="jv-hint">Retrieval over your VS Code Studio workspace files — answers cite every file used.</p>
      <input id="jv-cqa-q" class="jv-gs-in" placeholder="e.g. where is auth handled?">
      <button class="jv-btn" id="jv-cqa-go">🔍 Ask the codebase</button>
      <div id="jv-cqa-out"></div>`);
    ov.classList.remove("hidden");
    $("jv-cqa-go").onclick = async () => {
      const q = $("jv-cqa-q").value.trim(); if (!q) return;
      const files = wsFiles(); const names = Object.keys(files);
      if (!names.length) return JVM.toast("Workspace empty — add files in VS Code Studio");
      $("jv-cqa-out").innerHTML = `<div class="jv-hint">🔍 searching ${names.length} files…</div>`;
      const ranked = names.map(n => ({ n, sc: bm25(q, 900, [{ name: n, content: files[n] }])[0] ? bm25(q, 900, [{ name: n, content: files[n] }])[0].score : 0 })).sort((a, b) => b.sc - a.sc).slice(0, 5);
      const ctx = ranked.map(r => `[FILE ${r.n}]\n${chop(files[r.n], 2200)}`).join("\n=====\n");
      try {
        const ans = await ask(`Files:\n${ctx}\n\nQUESTION: ${q}\n\nAnswer briefly and cite files as [file.js]. Quote key lines.`, { system: "You are a codebase-explaining agent. Ground every claim in the given files.", maxTokens: 500 });
        $("jv-cqa-out").innerHTML = `<div class="jv-ag-body">${esc(ans).replace(/\n/g, "<br>")}</div>`;
      } catch (e) { $("jv-cqa-out").innerHTML = `⚠ ${esc(e.message)}`; }
    };
  }

  /* ═══════════════ 16 · DIFF / PR REVIEW ═══════════════ */
  function diffReview() {
    const ov = JVM.modal("jv-drev", `🧿 Code Review`, `
      <p class="jv-hint">Paste a diff, patch, or code change — get a line-flagged review with severity levels.</p>
      <textarea id="jv-dr-in" rows="9" placeholder="diff --git a/app.js b/app.js&#10;…" spellcheck="false"></textarea>
      <button class="jv-btn" id="jv-dr-go">▶ Review it</button>
      <div id="jv-dr-out"></div>`);
    ov.classList.remove("hidden");
    $("jv-dr-go").onclick = async () => {
      const t = $("jv-dr-in").value.trim(); if (!t) return JVM.toast("Paste a diff first");
      const out = $("jv-dr-out"); out.innerHTML = `<div class="jv-hint">🧿 reviewing…</div>`;
      try {
        const reply = await ask(`Review this change like a senior engineer at a top company. Format each finding as: [SEVERITY: blocker|major|nit] file/line if known — issue — suggested fix. End with LGTM-or-not verdict. Diff:\n${chop(t, 9000)}`, { system: "You are Aegis + Probe fused: security and QA review agent.", maxTokens: 650 });
        const sev = s => s.startsWith("[blocker") || s.startsWith("[major") ? "jv-rev-major" : "";
        out.innerHTML = reply.split("\n").filter(Boolean).map(l => `<div class="jv-rev-line ${sev(l.trim().toLowerCase())}">${esc(l)}</div>`).join("");
      } catch (e) { out.innerHTML = `⚠ ${esc(e.message)}`; }
    };
  }

  /* sidebar injection */
  function injectSidebar() {
    const host = document.querySelector(".sbt");
    if (!host || $("jv-studio-side")) return;
    const d = document.createElement("details"); d.className = "sb-details"; d.id = "jv-studio-side";
    d.innerHTML = `<summary class="sb-summary">🧬 Intelligence Studio</summary>
      <div class="sbn-inner">
        <div class="trow" data-go="mem">🧠 <span>Memory Graph</span></div>
        <div class="trow" data-go="recall">🔎 <span>Smart Recall…</span></div>
        <div class="trow" data-go="gsearch">🌐 <span>Global Search</span><span class="badge-count">CSS</span></div>
        <div class="trow" data-go="branch">🌿 <span>Summary Branches</span></div>
        <div class="trow" data-go="csv">📊 <span>CSV Insights</span></div>
        <div class="trow" data-go="sql">🗃 <span>SQL Sandbox</span></div>
        <div class="trow" data-go="pdf">📑 <span>PDF → Data</span></div>
        <div class="trow" data-go="doc">📝 <span>Doc Editor</span></div>
        <div class="trow" data-go="flash">🃏 <span>Flashcards</span></div>
        <div class="trow" data-go="git">🌿 <span>Git-Lite</span></div>
        <div class="trow" data-go="cqa">🧭 <span>Codebase Q&A</span></div>
        <div class="trow" data-go="drev">🧿 <span>Code Review</span></div>
        <div class="trow" data-go="cost">💰 <span>Cost Dashboard</span></div>
        <div class="trow" data-go="lic">💼 <span>JARVIK Pro</span></div>
        <div class="trow" data-go="packs">📦 <span>Packs</span></div>
      </div>`;
    host.appendChild(d);
    $$("div.trow", d).forEach(t => t.onclick = () => ({
      mem: memoryGraph, recall: recallTester, gsearch: globalSearch, branch: summaryBranches,
      csv: csvInsights, sql: sqlSandbox, pdf: pdfData, doc: docEditor, flash: flashcards,
      git: gitHub, cqa: codebaseQA, drev: diffReview, cost: costDashboard, lic: licenseHub, packs: packsHub
    })[t.dataset.go]());
  }
  function inject() { injectSidebar(); sniffPackLinkOnBoot(); }

  /* slash commands */
  const is0 = JV.interceptSend.bind(JV);
  JV.interceptSend = async raw => {
    const t = (raw || "").trim();
    const m = t.match(/^\/(memgraph|recall|gsearch|global|branch|capsule|csv|sql|pdf|doced|flash|gitlite|cqa|codeqa|review|cost|license|packs)$/i);
    if (m) {
      ({ memgraph: memoryGraph, recall: recallTester, gsearch: globalSearch, global: globalSearch, branch: summaryBranches, capsule: summaryBranches, csv: csvInsights, sql: sqlSandbox, pdf: pdfData, doced: docEditor, flash: flashcards, gitlite: gitHub, cqa: codebaseQA, codeqa: codebaseQA, review: diffReview, cost: costDashboard, license: licenseHub, packs: packsHub })[m[1].toLowerCase()]();
      return true;
    }
    return is0(raw);
  };

  JV.studio = { memoryGraph, globalSearch, costDashboard, licenseHub, packsHub, bm25, csvInsights, sqlSandbox, pdfData, docEditor, flashcards, gitHub, codebaseQA, diffReview, summaryBranches };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", inject);
  else inject();
})();
