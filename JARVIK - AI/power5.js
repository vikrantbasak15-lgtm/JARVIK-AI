/* ═══════════════════════════════════════════════════════════════════
   JARVIK POWER PACK 5 (power5.js)
   Wave 1 — kernel, reusable widgets, and the high-visibility studio tools.

   Loads LAST (after ui.js). Depends on:
     · window.JV  (power.js)   — hook chain: systemTune / interceptSend / afterStream
     · window.JVM (agents.js)  — modal, toast, ask(), sendVia(), event bus
     · script.js globals       — cc, ui, artCodeEditor, currentArtifact, vscFiles, …

   Owns nothing the core already owns: every feature here is additive and
   degrades to a toast when the DOM or an API key is missing.
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  if (window.__jvPower5) return;
  window.__jvPower5 = 1;

  /* ───────────────────────── 0 · KERNEL ───────────────────────── */

  const $  = id => document.getElementById(id);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => "p5" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const SKEY = "jv_p5";
  const p5get = (k, fb) => {
    try { const o = JSON.parse(localStorage.getItem(SKEY) || "{}"); return o[k] === undefined ? fb : o[k]; }
    catch (e) { return fb; }
  };
  const p5set = (k, v) => {
    try { const o = JSON.parse(localStorage.getItem(SKEY) || "{}"); o[k] = v; localStorage.setItem(SKEY, JSON.stringify(o)); }
    catch (e) {}
  };

  /* Feature registry — one entry per power-up. The hub, the sidebar, the
     Spotlight and the command palette are all generated from this table. */
  const FEATURES = {};
  const FEATURE_GROUPS = [
    { id: "studio",  label: "Studio & Canvas" },
    { id: "intel",   label: "Intelligence" },
    { id: "research",label: "Research & Writing" },
    { id: "platform",label: "Platform & Data" },
    { id: "local",   label: "On-Device Models" }
  ];
  const feature = (id, def) => { FEATURES[id] = Object.assign({ id }, def); };

  /* ── shared helpers ── */
  const chatRows = () => $$(".mr", $("chat-container"));
  const botRows = () => chatRows().filter(r => r.classList.contains("bot"));
  const rowText = r => (r.querySelector(".stream-content")?.innerText || r.innerText || "");
  const p5toast = m => { try { if (window.JVM?.toast) window.JVM.toast(m); else if (window.toast) window.toast(m); } catch (e) {} };
  const p5send = t => { try { if (window.JVM?.sendVia) window.JVM.sendVia(t); } catch (e) { p5toast("Send failed: " + e.message); } };
  /* One-shot model call that honours the active provider. Returns "" on failure. */
  const p5ask = async (prompt, opt) => {
    try {
      if (window.JVM?.ask) return await window.JVM.ask(prompt, opt || {});
    } catch (e) { p5toast(e.message); return ""; }
    return "";
  };
  const p5modal = (id, title, bodyHtml) => {
    let ov = $(id); if (ov) ov.remove();
    ov = document.createElement("div");
    ov.id = id; ov.className = "jv-modal hidden";
    ov.innerHTML = `<div class="jv-mcard"><div class="jv-mhead"><span class="jv-mtitle">${title}</span><button class="jv-mclose" aria-label="Close">✕</button></div><div class="jv-mbody">${bodyHtml}</div></div>`;
    document.body.appendChild(ov);
    ov.querySelector(".jv-mclose").onclick = () => ov.classList.add("hidden");
    ov.addEventListener("mousedown", e => { if (e.target === ov) ov.classList.add("hidden"); });
    return ov;
  };
  const p5open = ov => { ov.classList.remove("hidden"); return ov; };
  const p5close = ov => ov && ov.classList.add("hidden");
  const p5download = (name, text, mime) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/plain;charset=utf-8" }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const p5copy = async t => {
    try { await navigator.clipboard.writeText(t); p5toast("Copied"); return true; }
    catch (e) { p5toast("Clipboard blocked"); return false; }
  };
  /* Rough token estimate — 3.6 chars/token is close enough for a budget meter. */
  const p5tokens = s => Math.ceil(String(s || "").length / 3.6);

  /* Expose the core command list on window so later modules can push to it.
     script.js declares `const COMMANDS`, which is a global lexical binding and
     NOT a window property — power.js's attempt to append to window.COMMANDS
     silently created a throwaway array. Mirroring it fixes that for everyone. */
  try { if (!window.COMMANDS && typeof COMMANDS !== "undefined") window.COMMANDS = COMMANDS; } catch (e) {}

  /* ═══════════════════════════════════════════════════════════════
     1 · MYERS DIFF ENGINE
     Replaces the line-index diff the Canvas ◐ Diff button used to use.
     Proper hunks, aligned side-by-side columns, word-level highlights.
     ═══════════════════════════════════════════════════════════════ */
  function diffLines(a, b) {
    const N = a.length, M = b.length;
    if (!N) return b.map((l, i) => ({ t: "ins", b: i, line: l }));
    if (!M) return a.map((l, i) => ({ t: "del", a: i, line: l }));

    /* Trim the common prefix / suffix first — the big win on real files. */
    let start = 0;
    while (start < N && start < M && a[start] === b[start]) start++;
    let endA = N, endB = M;
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }

    const ops = [];
    for (let i = 0; i < start; i++) ops.push({ t: "eq", a: i, b: i, line: a[i] });

    const mid = myersCore(a.slice(start, endA), b.slice(start, endB), start, endB);
    ops.push(...mid);

    for (let i = 0; i < N - endA; i++) ops.push({ t: "eq", a: endA + i, b: endB + i, line: a[endA + i] });
    return ops;
  }
  function myersCore(A, B, offA, offB) {
    const N = A.length, M = B.length;
    if (!N && !M) return [];
    const max = N + M;
    const size = 2 * max + 1;
    const v = new Int32Array(size);
    const trace = [];
    let d = 0, found = false;
    /* ponytail: O(D·(N+M)) memory — bail out past 4000 differing lines and
       fall back to a block replace; upgrade to a linear-space variant if
       giant files ever need it. */
    for (d = 0; d <= max && d <= 4000; d++) {
      trace.push(v.slice(0));
      for (let k = -d; k <= d; k += 2) {
        let x;
        if (k === -d || (k !== d && v[k - 1 + max] < v[k + 1 + max])) x = v[k + 1 + max];
        else x = v[k - 1 + max] + 1;
        let y = x - k;
        while (x < N && y < M && A[x] === B[y]) { x++; y++; }
        v[k + max] = x;
        if (x >= N && y >= M) { found = true; break; }
      }
      if (found) break;
    }
    if (!found) {
      const out = [];
      A.forEach((l, i) => out.push({ t: "del", a: offA + i, line: l }));
      B.forEach((l, i) => out.push({ t: "ins", b: offB + i, line: l }));
      return out;
    }
    const ops = [];
    let x = N, y = M;
    for (let dd = d; dd > 0; dd--) {
      const vPrev = trace[dd];
      const k = x - y;
      let prevK;
      if (k === -dd || (k !== dd && vPrev[k - 1 + max] < vPrev[k + 1 + max])) prevK = k + 1;
      else prevK = k - 1;
      const prevX = vPrev[prevK + max];
      const prevY = prevX - prevK;
      while (x > prevX && y > prevY) { x--; y--; ops.push({ t: "eq", a: offA + x, b: offB + y, line: A[x] }); }
      if (x === prevX) { y--; ops.push({ t: "ins", b: offB + y, line: B[y] }); }
      else { x--; ops.push({ t: "del", a: offA + x, line: A[x] }); }
    }
    while (x > 0 && y > 0) { x--; y--; ops.push({ t: "eq", a: offA + x, b: offB + y, line: A[x] }); }
    while (x > 0) { x--; ops.push({ t: "del", a: offA + x, line: A[x] }); }
    while (y > 0) { y--; ops.push({ t: "ins", b: offB + y, line: B[y] }); }
    ops.reverse();
    return ops;
  }
  /* Word-level diff inside a changed line pair. */
  function diffWords(oldLine, newLine) {
    const tok = s => String(s).split(/(\s+)/).filter(Boolean);
    const A = tok(oldLine), B = tok(newLine);
    const ops = diffLines(A, B);
    const oldParts = [], newParts = [];
    ops.forEach(o => {
      if (o.t === "eq") { oldParts.push({ t: "eq", s: A[o.a] }); newParts.push({ t: "eq", s: B[o.b] }); }
      else if (o.t === "del") oldParts.push({ t: "del", s: A[o.a] });
      else newParts.push({ t: "ins", s: B[o.b] });
    });
    return { oldParts, newParts };
  }
  /* Group the op list into aligned side-by-side rows. */
  function alignDiff(ops) {
    const rows = [];
    let i = 0;
    while (i < ops.length) {
      const o = ops[i];
      if (o.t === "eq") { rows.push({ type: "eq", left: o.line, right: o.line, l: o.a + 1, r: o.b + 1 }); i++; continue; }
      const dels = [], inss = [];
      while (i < ops.length && ops[i].t === "del") dels.push(ops[i++]);
      while (i < ops.length && ops[i].t === "ins") inss.push(ops[i++]);
      const n = Math.max(dels.length, inss.length);
      for (let j = 0; j < n; j++) {
        const d = dels[j], nI = inss[j];
        let leftHtml = "", rightHtml = "";
        if (d && nI) {
          const w = diffWords(d.line, nI.line);
          leftHtml = w.oldParts.map(p => p.t === "del" ? `<span class="p5-wdel">${esc(p.s)}</span>` : esc(p.s)).join("");
          rightHtml = w.newParts.map(p => p.t === "ins" ? `<span class="p5-wins">${esc(p.s)}</span>` : esc(p.s)).join("");
        } else if (d) leftHtml = esc(d.line);
        else if (nI) rightHtml = esc(nI.line);
        rows.push({
          type: d && nI ? "chg" : d ? "del" : "ins",
          leftHtml, rightHtml,
          left: d ? d.line : "", right: nI ? nI.line : "",
          l: d ? d.a + 1 : "", r: nI ? nI.b + 1 : ""
        });
      }
    }
    return rows;
  }

  /* Wire the Canvas ◐ Diff button to the real engine. */
  function installDiffButton() {
    const btn = $("cd-toggle");
    if (!btn) return;
    btn.onclick = () => {
      const view = $("cd-view");
      if (!view) return;
      if (!view.hidden) { view.hidden = true; return; }
      showRealDiff();
    };
  }
  function currentArtifactPair() {
    const title = (typeof currentArtifact !== "undefined" && currentArtifact?.title) || "";
    const art = (typeof sessionArtifacts !== "undefined" ? sessionArtifacts : []).find(x => x.title === title);
    const versions = (art && art.versions) || [];
    const oldText = versions.length > 1 ? versions[versions.length - 2] : "";
    const newText = $("art-code-editor") ? $("art-code-editor").value : (currentArtifact?.code || "");
    return { oldText, newText, versions: versions.length };
  }
  function showRealDiff() {
    const view = $("cd-view");
    if (!view) return;
    const { oldText, newText, versions } = currentArtifactPair();
    const oldLbl = $("cd-old-lbl"), newLbl = $("cd-new-lbl");
    const oldEl = $("cd-old"), newEl = $("cd-new");
    if (oldLbl) oldLbl.textContent = "v" + Math.max(1, versions - 1);
    if (newLbl) newLbl.textContent = "current";
    const rows = alignDiff(diffLines(String(oldText).split("\n"), String(newText).split("\n")));
    const changed = rows.filter(r => r.type !== "eq").length;
    const body = rows.map(r => {
      if (r.type === "eq") {
        return `<div class="p5-drow p5-eq"><span class="p5-dln">${r.l}</span><span class="p5-dln">${r.r}</span><code>${esc(r.left)}</code><code>${esc(r.right)}</code></div>`;
      }
      const cls = r.type === "chg" ? "p5-chg" : r.type === "del" ? "p5-del" : "p5-ins";
      return `<div class="p5-drow ${cls}"><span class="p5-dln">${r.l}</span><span class="p5-dln">${r.r}</span><code>${r.leftHtml}</code><code>${r.rightHtml}</code></div>`;
    }).join("");
    const html = changed
      ? `<div class="p5-dstat">${changed} changed line${changed === 1 ? "" : "s"} · Myers diff</div>` + body
      : `<div class="p5-dstat p5-dstat-ok">✓ No differences</div>`;
    if (oldEl) oldEl.innerHTML = html;
    if (newEl) newEl.innerHTML = html;
    view.hidden = false;
  }

  /* ═══════════════════════════════════════════════════════════════
     2 · INLINE ARTIFACT PREVIEW
     HTML artifacts render live inside the chat stream, not only in the
     side Canvas. Each becomes an expandable sandboxed card.
     ═══════════════════════════════════════════════════════════════ */
  const HTMLISH = /^\s*(<!doctype\s+html|<html[\s>])/i;
  function looksLikeHtml(code) {
    if (HTMLISH.test(code)) return true;
    return /<body[\s>]/i.test(code) && /<\/(body|html)>/i.test(code) && code.length > 120;
  }
  const RESIZE_SNIPPET = `<script>(function(){function r(){parent.postMessage({__p5h:document.documentElement.scrollHeight},"*")}addEventListener("load",r);try{new ResizeObserver(r).observe(document.body)}catch(e){}r()})();<\/script>`;
  function buildArtifactCard(code, lang) {
    const card = document.createElement("div");
    card.className = "p5-artifact";
    const srcdoc = code.replace(/<\/script/gi, "<\\/script");
    card.innerHTML = `
      <div class="p5-art-head">
        <span class="p5-art-tag">⚡ LIVE ARTIFACT</span>
        <span class="p5-art-name"></span>
        <span class="p5-art-acts">
          <button class="p5-art-btn" data-a="toggle">▾ Hide</button>
          <button class="p5-art-btn" data-a="canvas">⧉ Open in Canvas</button>
          <button class="p5-art-btn" data-a="tab">↗ New tab</button>
        </span>
      </div>
      <div class="p5-art-frame"><iframe sandbox="allow-scripts allow-modals" title="Artifact preview"></iframe></div>`;
    const frame = card.querySelector("iframe");
    frame.srcdoc = srcdoc.replace(/<\/body>/i, RESIZE_SNIPPET + "</body>");
    const nameEl = card.querySelector(".p5-art-name");
    card.querySelector("[data-a='canvas']").onclick = () => {
      try {
        if (typeof registerArtifact === "function") registerArtifact(nameEl.textContent || "artifact.html", code, "html");
        p5toast("Opened in Co-Work Canvas");
      } catch (e) { p5toast("Canvas unavailable"); }
    };
    card.querySelector("[data-a='tab']").onclick = () => {
      const w = window.open("", "_blank");
      if (!w) { p5toast("Popup blocked"); return; }
      w.document.write(srcdoc); w.document.close();
    };
    const toggle = card.querySelector("[data-a='toggle']");
    toggle.onclick = () => {
      const wrap = card.querySelector(".p5-art-frame");
      const hidden = wrap.style.display === "none";
      wrap.style.display = hidden ? "" : "none";
      toggle.textContent = hidden ? "▾ Hide" : "▸ Show";
    };
    return card;
  }
  let artifactScanTimer = 0;
  function scanArtifacts(scope) {
    $$("pre", scope).forEach(pre => {
      if (pre.dataset.p5Art === "1") return;
      const codeEl = pre.querySelector("code");
      if (!codeEl) return;
      const code = codeEl.textContent || "";
      const lang = (codeEl.className.match(/language-(\w+)/) || [])[1] || "";
      if (!(lang === "html" || lang === "htm" || looksLikeHtml(code))) return;
      pre.dataset.p5Art = "1";
      const card = buildArtifactCard(code, lang);
      pre.insertAdjacentElement("afterend", card);
      const fname = pre.dataset.fname || "artifact.html";
      card.querySelector(".p5-art-name").textContent = fname;
    });
  }
  function installArtifactObserver() {
    const cc = $("chat-container");
    if (!cc) return;
    const run = () => {
      clearTimeout(artifactScanTimer);
      artifactScanTimer = setTimeout(() => {
        botRows().forEach(r => scanArtifacts(r));
      }, 60);
    };
    new MutationObserver(run).observe(cc, { childList: true, subtree: true });
    setTimeout(run, 900);
  }
  feature("inline-artifact", {
    label: "Inline Artifact Preview", icon: "🧩", group: "studio",
    hint: "HTML answers render live inside the chat, not only in the Canvas.",
    run() {
      if (!$("chat-container")) return p5toast("Chat not ready");
      installArtifactObserver();
      botRows().forEach(r => scanArtifacts(r));
      p5toast("🧩 Artifact preview active");
    }
  });

  /* ═══════════════════════════════════════════════════════════════
     3 · SPOTLIGHT — one fuzzy box over everything
     ═══════════════════════════════════════════════════════════════ */
  function fuzzyScore(needle, hay) {
    const n = needle.toLowerCase(), h = String(hay || "").toLowerCase();
    if (!n) return 0.001;
    const direct = h.indexOf(n);
    if (direct === 0) return 1000 - h.length;
    if (direct > 0) return 700 - direct - h.length * 0.1;
    /* subsequence fallback */
    let hi = 0, score = 0, streak = 0;
    for (let i = 0; i < n.length; i++) {
      const c = n[i];
      if (c === " ") continue;
      const found = h.indexOf(c, hi);
      if (found === -1) return -1;
      streak = found === hi ? streak + 1 : 0;
      score += 10 + streak * 4 - (found - hi) * 0.4;
      hi = found + 1;
    }
    return score - h.length * 0.05;
  }
  function spotlightSources() {
    const out = [];
    try {
      (getP() || []).forEach(p => out.push({
        kind: "Chat", title: p.title || "Untitled", sub: "Conversation", body: String(p.content || "").replace(/<[^>]+>/g, " "),
        go: () => { try { setCur(p.id); loadChat(); renderProjs(); } catch (e) {} }
      }));
    } catch (e) {}
    try {
      (JSON.parse(localStorage.getItem("jv_docs") || "[]") || []).forEach(d => out.push({
        kind: "Doc", title: d.name, sub: "Knowledge doc", body: d.content || "",
        go: () => p5send(`Summarise the knowledge doc "${d.name}" and list the three facts I most need to remember.`)
      }));
    } catch (e) {}
    try {
      (JSON.parse(localStorage.getItem("jv_memory") || "[]") || []).forEach(m => out.push({
        kind: "Memory", title: m.text, sub: "Persistent memory", body: m.text || "",
        go: () => p5send(`What do my saved memories say about "${(m.text || "").slice(0, 40)}"?`)
      }));
    } catch (e) {}
    try {
      (JSON.parse(localStorage.getItem("jv_mem2") || "[]") || []).forEach(m => out.push({
        kind: "Graph", title: m.text, sub: "Memory graph · " + (m.tags || []).join(", "), body: m.text || "",
        go: () => p5send(`Use this memory: ${m.text}`)
      }));
    } catch (e) {}
    try {
      (getKnowledge() || []).forEach(d => out.push({
        kind: "KB", title: d.name, sub: "Project knowledge", body: d.content || "",
        go: () => { try { updateKnowledgeUI(); $("knowledge-modal").classList.remove("hidden"); } catch (e) {} }
      }));
    } catch (e) {}
    try {
      Object.keys(vscFiles || {}).forEach(f => out.push({
        kind: "File", title: f, sub: "Workspace file", body: (vscFiles[f]?.content || "").slice(0, 4000),
        go: () => { try { switchVscFile(f); openVSCodeModal(); } catch (e) { p5toast("Open VS Code Studio to view " + f); } }
      }));
    } catch (e) {}
    Object.entries(FEATURES).forEach(([id, f]) => out.push({
      kind: "Tool", title: f.label, sub: "Power Pack 5 · " + f.group, body: f.hint || "",
      go: () => f.run()
    }));
    try {
      (typeof COMMANDS !== "undefined" ? COMMANDS : []).forEach(c => out.push({
        kind: "Cmd", title: c.title, sub: "Command · " + c.tag, body: c.title, go: () => { try { c.action(); } catch (e) {} }
      }));
    } catch (e) {}
    return out;
  }
  function spotlight() {
    const ov = p5open(p5modal("p5-spotlight", "🔦 <b>Spotlight</b> <span class='p5-muted'>search everything</span>", `
      <div class="p5-sl">
        <input id="p5-sl-in" class="p5-sl-in" placeholder="Chats, docs, memories, files, commands, tools…" autocomplete="off" spellcheck="false">
        <div class="p5-sl-cols">
          <div id="p5-sl-list" class="p5-sl-list"></div>
          <div id="p5-sl-preview" class="p5-sl-preview"><div class="p5-sl-empty">Type to search across every local source.</div></div>
        </div>
      </div>`));
    const input = $("p5-sl-in"), list = $("p5-sl-list"), prev = $("p5-sl-preview");
    let results = [], idx = 0;
    const render = () => {
      const q = input.value.trim();
      const all = spotlightSources();
      results = (q ? all.map(s => ({ s, sc: Math.max(fuzzyScore(q, s.title), fuzzyScore(q, s.title) * 0.9 + fuzzyScore(q, s.body) * 0.1) }))
                    .filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 60)
                       .map(x => x.s)
                  : all.slice(0, 60));
      idx = 0;
      list.innerHTML = results.map((s, i) =>
        `<div class="p5-sl-item${i === 0 ? " on" : ""}" data-i="${i}"><span class="p5-sl-kind">${esc(s.kind)}</span><span class="p5-sl-title">${esc(s.title)}</span><span class="p5-sl-sub">${esc(s.sub || "")}</span></div>`
      ).join("") || `<div class="p5-sl-empty">No match.</div>`;
      $$(".p5-sl-item", list).forEach(el => {
        el.onclick = () => { const s = results[+el.dataset.i]; if (s) { p5close(ov); s.go(); } };
        el.onmouseenter = () => { idx = +el.dataset.i; mark(); };
      });
      show();
    };
    const mark = () => {
      $$(".p5-sl-item", list).forEach((el, i) => el.classList.toggle("on", i === idx));
      const s = results[idx];
      if (!s) return;
      prev.innerHTML = `<div class="p5-sl-phead"><span class="p5-sl-kind">${esc(s.kind)}</span><b>${esc(s.title)}</b><i>${esc(s.sub || "")}</i></div><pre class="p5-sl-pre">${esc(String(s.body || "").slice(0, 4000))}</pre>`;
    };
    const show = () => mark();
    input.addEventListener("input", render);
    input.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(idx + 1, results.length - 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(idx - 1, 0); mark(); }
      else if (e.key === "Enter") { const s = results[idx]; if (s) { p5close(ov); s.go(); } }
      else if (e.key === "Escape") { p5close(ov); }
    });
    render();
    setTimeout(() => input.focus(), 40);
  }
  feature("spotlight", {
    label: "Spotlight Universal Search", icon: "🔦", group: "intel",
    hint: "One fuzzy box over chats, docs, memories, files, commands and tools. Ctrl+Shift+K.",
    run: spotlight
  });

  /* ═══════════════════════════════════════════════════════════════
     4 · PRIVACY RADAR — every outbound request, visible and blockable
     ═══════════════════════════════════════════════════════════════ */
  const KNOWN_HOSTS = [
    { host: "openrouter.ai",     note: "AI provider — your prompts" },
    { host: "api.openai.com",    note: "AI provider" },
    { host: "api.anthropic.com", note: "AI provider" },
    { host: "generativelanguage.googleapis.com", note: "AI provider" },
    { host: "api.groq.com",      note: "AI provider" },
    { host: "api.together.xyz",  note: "AI provider" },
    { host: "api.mistral.ai",    note: "AI provider" },
    { host: "api.deepseek.com",  note: "AI provider" },
    { host: "integrate.api.nvidia.com", note: "AI provider" },
    { host: "localhost:11434",   note: "Ollama — local model" },
    { host: "r.jina.ai",         note: "URL reader — fetches pages you name" },
    { host: "image.pollinations.ai", note: "Image generation" },
    { host: "cdnjs.cloudflare.com", note: "UI libraries (highlight.js, KaTeX, Mermaid, pdf.js, sql.js)" },
    { host: "unpkg.com",         note: "PeerJS — Team Room" },
    { host: "fonts.googleapis.com", note: "Web fonts" },
    { host: "huggingface.co",    note: "On-device model weights (Power Pack 5)" }
  ];
  const radar = { log: [], blocked: {}, offline: false, origFetch: null };
  function hostOf(url) {
    try { return new URL(url, location.href).host; } catch (e) { return String(url).slice(0, 60); }
  }
  function installRadar() {
    if (radar.origFetch) return;
    radar.origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      const host = hostOf(url);
      const same = host === location.host || url.startsWith(location.origin) || url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("file:");
      if (!same) {
        const entry = { host, url: String(url).slice(0, 220), t: Date.now(), blocked: false };
        if (radar.offline) {
          entry.blocked = true;
          radar.log.unshift(entry); radar.log = radar.log.slice(0, 300);
          return Promise.reject(new Error("Privacy Radar: offline mode blocked " + host));
        }
        if (radar.blocked[host]) {
          entry.blocked = true;
          radar.log.unshift(entry); radar.log = radar.log.slice(0, 300);
          return Promise.reject(new Error("Privacy Radar: " + host + " is blocked by you."));
        }
        radar.log.unshift(entry); radar.log = radar.log.slice(0, 300);
        try { window.dispatchEvent(new CustomEvent("p5-radar", { detail: entry })); } catch (e) {}
      }
      return radar.origFetch(input, init);
    };
  }
  function privacyRadar() {
    const blocked = p5get("p5_blocked", {});
    radar.blocked = blocked || {};
    radar.offline = !!p5get("p5_offline", false);
    const seen = {};
    radar.log.forEach(e => { seen[e.host] = (seen[e.host] || 0) + 1; });
    const hosts = Array.from(new Set([...Object.keys(seen), ...KNOWN_HOSTS.map(k => k.host)])).sort();
    const rows = hosts.map(h => {
      const known = KNOWN_HOSTS.find(k => k.host === h);
      return `<div class="p5-pr-row" data-h="${esc(h)}">
        <div class="p5-pr-h"><b>${esc(h)}</b><i>${esc(known ? known.note : "unknown host")}</i></div>
        <div class="p5-pr-n">${seen[h] || 0} call${seen[h] === 1 ? "" : "s"}</div>
        <label class="jv-sw"><input type="checkbox" data-block="${esc(h)}" ${radar.blocked[h] ? "checked" : ""}><i></i></label>
      </div>`;
    }).join("");
    const ov = p5open(p5modal("p5-radar", "🛰️ <b>Privacy Radar</b> <span class='p5-muted'>every outbound request</span>", `
      <p class="jv-hint">JARVIK calls several external services. This panel logs every one, live. Block a host to hard-stop it, or flip offline mode to cut all outbound traffic.</p>
      <label class="jv-srow"><span>Offline mode — block every outbound request</span><span class="jv-sw"><input type="checkbox" id="p5-offline" ${radar.offline ? "checked" : ""}><i></i></span></label>
      <div class="p5-pr-list">${rows || `<div class="p5-sl-empty">No outbound traffic yet.</div>`}</div>
      <div class="p5-pr-log"><b>Recent calls</b><div id="p5-pr-live"></div></div>`));
    $$("[data-block]", ov).forEach(cb => cb.onchange = () => {
      const h = cb.dataset.block;
      if (cb.checked) radar.blocked[h] = 1; else delete radar.blocked[h];
      p5set("p5_blocked", radar.blocked);
      p5toast(radar.blocked[h] ? "Blocked " + h : "Allowed " + h);
    });
    $("p5-offline").onchange = e => {
      radar.offline = e.target.checked;
      p5set("p5_offline", radar.offline);
      p5toast(radar.offline ? "🛰️ Offline mode ON — no outbound traffic" : "🛰️ Offline mode off");
    };
    const live = $("p5-pr-live");
    const paint = () => {
      if (!live || !live.isConnected) return;
      live.innerHTML = radar.log.slice(0, 25).map(e =>
        `<div class="p5-pr-call${e.blocked ? " blocked" : ""}"><span>${e.blocked ? "⛔" : "→"}</span><b>${esc(e.host)}</b><i>${new Date(e.t).toLocaleTimeString()}</i></div>`
      ).join("") || `<div class="p5-sl-empty">Nothing yet.</div>`;
    };
    paint();
    window.addEventListener("p5-radar", paint);
  }
  feature("privacy-radar", {
    label: "Privacy Radar", icon: "🛰️", group: "platform",
    hint: "Live log of every outbound request, with per-host blocking and offline mode.",
    run() { installRadar(); privacyRadar(); }
  });

  /* ═══════════════════════════════════════════════════════════════
     5 · INTERACTIVE CHARTS — turn any table in a reply into a chart
     ═══════════════════════════════════════════════════════════════ */
  function parseMarkdownTable(md) {
    const lines = String(md || "").split("\n").map(l => l.trim()).filter(l => l.startsWith("|"));
    if (lines.length < 2) return null;
    const cells = l => l.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    const head = cells(lines[0]);
    if (!/^[\s|:-]+$/.test(lines[1])) return null;
    const rows = lines.slice(2).map(cells);
    return { head, rows };
  }
  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", q = false;
    const s = String(text || "");
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); cell = ""; if (row.some(c => c !== "")) rows.push(row); row = []; }
      else if (ch !== "\r") cell += ch;
    }
    row.push(cell); if (row.some(c => c !== "")) rows.push(row);
    if (rows.length < 2) return null;
    return { head: rows[0], rows: rows.slice(1) };
  }
  function chartModal(head, rows, title) {
    const cols = head.map((h, i) => {
      const vals = rows.map(r => r[i]);
      const nums = vals.map(Number).filter(v => !isNaN(v));
      const isNum = nums.length >= vals.filter(v => v !== "").length * 0.6 && nums.length > 0;
      return { name: h, isNum, idx: i };
    });
    const numCols = cols.filter(c => c.isNum);
    const ov = p5open(p5modal("p5-chart", "📈 <b>" + esc(title || "Chart") + "</b>", `
      <div class="p5-ch-toolbar">
        <select id="p5-ch-x" class="jv-sel"></select>
        <select id="p5-ch-y" class="jv-sel"></select>
        <select id="p5-ch-type" class="jv-sel"><option value="bar">Bar</option><option value="line">Line</option><option value="area">Area</option><option value="dot">Scatter</option></select>
        <button class="jv-btn ghost" id="p5-ch-svg">⬇ SVG</button>
        <button class="jv-btn ghost" id="p5-ch-png">⬇ PNG</button>
      </div>
      <div id="p5-ch-host" class="p5-ch-host"></div>
      <div class="p5-ch-tip" id="p5-ch-tip" hidden></div>`));
    const xSel = $("p5-ch-x"), ySel = $("p5-ch-y"), typeSel = $("p5-ch-type");
    xSel.innerHTML = cols.map(c => `<option value="${c.idx}">${esc(c.name)}</option>`).join("");
    ySel.innerHTML = numCols.map(c => `<option value="${c.idx}">${esc(c.name)}</option>`).join("");
    if (!numCols.length) {
      $("p5-ch-host").innerHTML = `<div class="p5-sl-empty">No numeric column to plot. ${esc(title || "")}</div>`;
      return ov;
    }
    const host = $("p5-ch-host"), tip = $("p5-ch-tip");
    const draw = () => {
      const xi = +xSel.value, yi = +ySel.value, type = typeSel.value;
      const pts = rows.map(r => ({ label: String(r[xi] ?? ""), value: Number(r[yi]), raw: r }))
                      .filter(p => !isNaN(p.value));
      if (!pts.length) { host.innerHTML = `<div class="p5-sl-empty">No rows.</div>`; return; }
      const W = 720, H = 320, PL = 54, PR = 16, PT = 18, PB = 46;
      const max = Math.max(...pts.map(p => p.value)), min = Math.min(...pts.map(p => p.value));
      const span = (max - min) || 1;
      const yOf = v => PT + (H - PB - PT) * (1 - (v - min) / span);
      const xOf = i => PL + (W - PL - PR) * (pts.length === 1 ? 0.5 : i / (pts.length - 1));
      const ticks = Array.from({ length: 5 }, (_, i) => min + (span * i) / 4);
      let g = "";
      ticks.forEach(t => {
        const y = yOf(t);
        g += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" class="p5-ch-grid"/>`;
        g += `<text x="${PL - 8}" y="${y + 4}" class="p5-ch-tick" text-anchor="end">${(+t.toFixed(2))}</text>`;
      });
      const bw = Math.max(4, Math.min(48, (W - PL - PR) / pts.length * 0.62));
      if (type === "bar") {
        pts.forEach((p, i) => {
          const x = xOf(i) - bw / 2;
          const y = yOf(p.value);
          const h = Math.max(1, (H - PB) - y);
          g += `<rect class="p5-ch-bar" data-i="${i}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="3"/>`;
        });
      } else {
        const ptsStr = pts.map((p, i) => `${xOf(i)},${yOf(p.value)}`).join(" ");
        if (type === "area") g += `<polygon class="p5-ch-area" points="${PL},${H - PB} ${ptsStr} ${W - PR},${H - PB}"/>`;
        g += `<polyline class="p5-ch-line" points="${ptsStr}" fill="none"/>`;
        pts.forEach((p, i) => g += `<circle class="p5-ch-dot" data-i="${i}" cx="${xOf(i)}" cy="${yOf(p.value)}" r="4"/>`);
      }
      const every = Math.ceil(pts.length / 14);
      pts.forEach((p, i) => {
        if (i % every) return;
        g += `<text class="p5-ch-tick" x="${xOf(i)}" y="${H - 20}" text-anchor="middle">${esc(p.label.slice(0, 14))}</text>`;
      });
      const svg = `<svg viewBox="0 0 ${W} ${H}" class="p5-ch-svg" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
      host.innerHTML = svg;
      const svgEl = host.querySelector("svg");
      svgEl.querySelectorAll("[data-i]").forEach(el => {
        el.addEventListener("mouseenter", ev => {
          const p = pts[+el.dataset.i];
          tip.hidden = false;
          tip.textContent = `${p.label} · ${p.value}`;
          const r = svgEl.getBoundingClientRect();
          tip.style.left = (r.left + (ev.clientX - r.left) + 12) + "px";
          tip.style.top = (r.top + (ev.clientY - r.top) - 10) + "px";
        });
        el.addEventListener("mouseleave", () => { tip.hidden = true; });
      });
      $("p5-ch-svg").onclick = () => p5download("jarvik-chart.svg", svg, "image/svg+xml");
      $("p5-ch-png").onclick = () => {
        const img = new Image();
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const u = URL.createObjectURL(blob);
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = W * 2; c.height = H * 2;
          const cx = c.getContext("2d");
          cx.fillStyle = "#0d1219"; cx.fillRect(0, 0, c.width, c.height);
          cx.drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(b => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b); a.download = "jarvik-chart.png"; a.click();
          });
          URL.revokeObjectURL(u);
        };
        img.src = u;
      };
    };
    [xSel, ySel, typeSel].forEach(s => s.onchange = draw);
    draw();
    return ov;
  }
  function scanForCharts(scope) {
    $$(".mr.bot", scope || document).forEach(row => {
      const content = row.querySelector(".stream-content");
      if (!content) return;
      const tables = $$("table", content);
      if (!tables.length) return;
      const bar = row.querySelector(".msg-actions");
      if (!bar) return;
      const table = tables[0];
      if (table.dataset.p5Charted === "1") return;
      const btn = document.createElement("button");
      btn.className = "msg-act-btn jv-chip";
      btn.textContent = "📈 Chart";
      btn.title = "Plot the first table in this reply";
      btn.onclick = () => {
        const head = Array.from(table.querySelectorAll("thead th")).map(th => th.innerText.trim());
        const rows = Array.from(table.querySelectorAll("tbody tr")).map(tr => Array.from(tr.children).map(td => td.innerText.trim()));
        if (!head.length || !rows.length) return p5toast("Nothing to plot");
        chartModal(head, rows, head.join(" × "));
      };
      table.dataset.p5Charted = "1";
      bar.appendChild(btn);
    });
  }
  let chartObserverOn = false;
  function armCharts() {
    if (chartObserverOn) return;
    chartObserverOn = true;
    const cc = $("chat-container");
    if (!cc) { chartObserverOn = false; return; }
    new MutationObserver(() => scanForCharts()).observe(cc, { childList: true, subtree: true });
    scanForCharts();
  }
  feature("chat-charts", {
    label: "Interactive Reply Charts", icon: "📈", group: "intel",
    hint: "Any markdown table in a reply becomes a hoverable, exportable chart.",
    run() { armCharts(); p5toast("📈 Chart tool armed"); }
  });

  /* ═══════════════════════════════════════════════════════════════
     6 · BRANCH TREE — see every alternate reply as a tree
     ═══════════════════════════════════════════════════════════════ */
  function branchTree() {
    const nodes = [];
    botRows().forEach((row, i) => {
      let br = [];
      try { br = JSON.parse(row.dataset.br || "[]"); } catch (e) {}
      if (br.length > 1) nodes.push({ row, br, i });
    });
    const ov = p5open(p5modal("p5-branches", "🌿 <b>Reply Branch Tree</b> <span class='p5-muted'>" + nodes.length + " branched message(s)</span>", `
      ${nodes.length ? `<div id="p5-bt-list"></div>` : `<div class="p5-sl-empty">No branched replies yet. Use 🔄 Retry on a reply to create an alternative answer.</div>`}`));
    if (!nodes.length) return ov;
    const host = $("p5-bt-list");
    host.innerHTML = nodes.map(n => {
      const active = +(n.row.dataset.bi || 0);
      return `<div class="p5-bt-msg"><div class="p5-bt-prompt">${esc((n.row.dataset.prompt || "").slice(0, 140))}</div>
        <div class="p5-bt-track">${n.br.map((b, j) =>
          `<button class="p5-bt-node${j === active ? " on" : ""}" data-row="${n.i}" data-br="${j}"><i></i><span>${esc(String(b).replace(/[#*`>]/g, "").slice(0, 54))}</span></button>`
        ).join("")}</div></div>`;
    }).join("");
    $$(".p5-bt-node", host).forEach(el => el.onclick = () => {
      const row = nodes[+el.dataset.row].row;
      try { showBranch(row, +el.dataset.br); } catch (e) {}
      row.scrollIntoView({ block: "center", behavior: "smooth" });
      p5close(ov);
    });
  }
  feature("branch-tree", {
    label: "Reply Branch Tree", icon: "🌿", group: "studio",
    hint: "Every alternate answer in a thread, drawn as a clickable tree.",
    run: branchTree
  });

  /* ═══════════════════════════════════════════════════════════════
     7 · MEMORY GRAPH 2.0 — force-directed, auto-linked
     ═══════════════════════════════════════════════════════════════ */
  function memoryGraph2() {
    const mems = [];
    try {
      (JSON.parse(localStorage.getItem("jv_memory") || "[]") || []).forEach(m => mems.push({ text: m.text || "", tags: [], src: "panel" }));
      (JSON.parse(localStorage.getItem("jv_mem2") || "[]") || []).forEach(m => mems.push({ text: m.text || "", tags: m.tags || [], src: "graph" }));
    } catch (e) {}
    const STOP = new Set("the a an and or to of in for with is are be my me i you it on at this that as by from".split(" "));
    const words = t => String(t).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && !STOP.has(w));
    const nodes = mems.map((m, i) => ({ i, text: m.text, tags: m.tags, src: m.src, x: 0, y: 0, vx: 0, vy: 0, words: words(m.text) }));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sharedTag = (nodes[i].tags || []).some(t => (nodes[j].tags || []).includes(t));
        const shared = nodes[i].words.filter(w => nodes[j].words.includes(w));
        if (sharedTag || shared.length) {
          edges.push({ a: i, b: j, w: sharedTag ? 2 : 1, label: sharedTag ? "#" + (nodes[i].tags || []).find(t => (nodes[j].tags || []).includes(t)) : shared.slice(0, 3).join(", ") });
        }
      }
    }
    const ov = p5open(p5modal("p5-memgraph", "🕸️ <b>Memory Graph 2.0</b> <span class='p5-muted'>" + nodes.length + " facts · " + edges.length + " links</span>", `
      <p class="jv-hint">Links are inferred from shared tags and shared words. Hover a node to read it; click to act on it.</p>
      <canvas id="p5-mg-cv" class="p5-mg-cv" height="420"></canvas>
      <div id="p5-mg-detail" class="p5-mg-detail">Select a node.</div>`));
    const cv = $("p5-mg-cv"), ctx = cv.getContext("2d");
    const detail = $("p5-mg-detail");
    const W = cv.width = cv.clientWidth || 620, H = cv.height = 420;
    nodes.forEach(n => { n.x = W / 2 + (Math.random() - 0.5) * W * 0.7; n.y = H / 2 + (Math.random() - 0.5) * H * 0.7; });
    let hover = -1, sel = -1, raf = 0;
    const step = () => {
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.0009;
        n.vy += (H / 2 - n.y) * 0.0009;
        n.vx *= 0.92; n.vy *= 0.92;
      }
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const f = 900 / d * 0.006 * e.w;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(1, Math.hypot(dx, dy));
        if (d < 70) { a.vx -= dx * 0.004; a.vy -= dy * 0.004; b.vx += dx * 0.004; b.vy += dy * 0.004; }
      }
      nodes.forEach(n => { n.x += n.vx; n.y += n.vy; });
      paint();
      raf = requestAnimationFrame(step);
    };
    const paint = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fillRect(0, 0, W, H);
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        ctx.strokeStyle = e.w > 1 ? "rgba(53,214,232,.45)" : "rgba(255,255,255,.12)";
        ctx.lineWidth = e.w > 1 ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      nodes.forEach((n, i) => {
        const r = 6 + Math.min(10, n.text.length / 18);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, 7);
        ctx.fillStyle = i === sel ? "#fbbf24" : n.src === "graph" ? "rgba(53,214,232,.85)" : "rgba(255,255,255,.55)";
        ctx.fill();
        if (i === hover || i === sel) {
          ctx.strokeStyle = "#35d6e8"; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,.9)";
          ctx.font = "11px 'DM Sans'";
          ctx.fillText(n.text.slice(0, 46), n.x + r + 5, n.y + 4);
        }
      });
    };
    cv.onmousemove = e => {
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      hover = nodes.findIndex(n => Math.hypot(n.x - mx, n.y - my) < 14);
      cv.style.cursor = hover >= 0 ? "pointer" : "default";
      paint();
    };
    cv.onclick = () => {
      if (hover < 0) return;
      sel = hover;
      const n = nodes[sel];
      detail.innerHTML = `<b>${esc(n.text)}</b><div class="p5-mg-acts">
        <button class="jv-btn ghost" id="p5-mg-pin">📌 Pin to context</button>
        <button class="jv-btn ghost" id="p5-mg-ask">💬 Ask about this</button>
        <button class="jv-btn ghost" id="p5-mg-del">🗑 Forget</button></div>`;
      $("p5-mg-pin").onclick = () => p5send(`Remember this for the rest of our session: ${n.text}`);
      $("p5-mg-ask").onclick = () => { p5close(ov); p5send(`Based on what you know about me — "${n.text}" — what should I do next?`); };
      $("p5-mg-del").onclick = () => {
        const raw = JSON.parse(localStorage.getItem(n.src === "graph" ? "jv_mem2" : "jv_memory") || "[]");
        const idx = raw.findIndex(x => (x.text || "") === n.text);
        if (idx > -1) { raw.splice(idx, 1); localStorage.setItem(n.src === "graph" ? "jv_mem2" : "jv_memory", JSON.stringify(raw)); }
        nodes.splice(sel, 1); sel = -1; detail.textContent = "Select a node."; p5toast("Memory removed");
      };
      paint();
    };
    cv.onmouseleave = () => { hover = -1; paint(); };
    step();
    ov.addEventListener("mousedown", e => { if (e.target === ov) cancelAnimationFrame(raf); });
    return ov;
  }
  feature("memory-graph-2", {
    label: "Memory Graph 2.0", icon: "🕸️", group: "intel",
    hint: "Force-directed graph of every stored fact, with links inferred from tags and words.",
    run: memoryGraph2
  });

  /* ═══════════════════════════════════════════════════════════════
     8 · CHAT GIT — semantic diff between two conversations
     ═══════════════════════════════════════════════════════════════ */
  const STOPW = new Set("the a an and or to of in for with is are be my me i you it on at this that as by from was were will would can could".split(" "));
  function chatTerms(text) {
    const m = String(text || "").toLowerCase().match(/[a-z0-9']+/g) || [];
    const freq = {};
    m.forEach(w => { if (w.length > 3 && !STOPW.has(w)) freq[w] = (freq[w] || 0) + 1; });
    return freq;
  }
  function chatDigest(proj) {
    const body = String(proj.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const decisions = body.split(/(?<=[.!?])\s+/)
      .filter(s => /\b(decided|let's|we will|i will|going with|use |switch|plan is|approach)\b/i.test(s))
      .slice(0, 8).map(s => s.slice(0, 160));
    const questions = body.split(/(?<=[.!?])\s+/)
      .filter(s => /\?\s*$/.test(s.trim()) && s.trim().length > 12)
      .slice(0, 8).map(s => s.slice(0, 160));
    return { body, decisions, questions, terms: chatTerms(body) };
  }
  function chatGit() {
    const ps = getP() || [];
    if (ps.length < 2) return p5toast("Need at least two conversations");
    const ov = p5open(p5modal("p5-chatgit", "🌿 <b>Chat Git</b> <span class='p5-muted'>diff two conversations</span>", `
      <div class="jv-row2">
        <select id="p5-cg-a" class="jv-sel">${ps.map((p, i) => `<option value="${i}">${esc(p.title || "Untitled")}</option>`).join("")}</select>
        <select id="p5-cg-b" class="jv-sel">${ps.map((p, i) => `<option value="${i}" ${i === 1 ? "selected" : ""}>${esc(p.title || "Untitled")}</option>`).join("")}</select>
      </div>
      <button class="jv-btn" id="p5-cg-go">◐ Diff them</button>
      <div id="p5-cg-out"></div>`));
    $("p5-cg-go").onclick = () => {
      const a = ps[+$("p5-cg-a").value], b = ps[+$("p5-cg-b").value];
      if (!a || !b) return;
      const da = chatDigest(a), db = chatDigest(b);
      const keys = new Set([...Object.keys(da.terms), ...Object.keys(db.terms)]);
      const scored = [...keys].map(w => ({
        w, only: (db.terms[w] || 0) - (da.terms[w] || 0)
      })).filter(x => x.only !== 0).sort((x, y) => Math.abs(y.only) - Math.abs(x.only)).slice(0, 24);
      const inA = scored.filter(x => x.only < 0).map(x => x.w);
      const inB = scored.filter(x => x.only > 0).map(x => x.w);
      const setDiff = (list, other) => list.filter(w => !other.includes(w));
      const out = $("p5-cg-out");
      out.innerHTML = `
        <div class="p5-cg-grid">
          <div class="p5-cg-col"><b>${esc(a.title || "Untitled")}</b>
            <div class="p5-cg-sec"><em>Only here</em><div class="p5-cg-tags">${setDiff(inA, inB).map(w => `<span class="p5-cg-a">${esc(w)}</span>`).join("") || "<i>—</i>"}</div></div>
            <div class="p5-cg-sec"><em>Decisions</em><ul>${da.decisions.map(d => `<li>${esc(d)}</li>`).join("") || "<li>—</li>"}</ul></div>
            <div class="p5-cg-sec"><em>Open questions</em><ul>${da.questions.map(d => `<li>${esc(d)}</li>`).join("") || "<li>—</li>"}</ul></div>
          </div>
          <div class="p5-cg-col"><b>${esc(b.title || "Untitled")}</b>
            <div class="p5-cg-sec"><em>Only here</em><div class="p5-cg-tags">${setDiff(inB, inA).map(w => `<span class="p5-cg-b">${esc(w)}</span>`).join("") || "<i>—</i>"}</div></div>
            <div class="p5-cg-sec"><em>Decisions</em><ul>${db.decisions.map(d => `<li>${esc(d)}</li>`).join("") || "<li>—</li>"}</ul></div>
            <div class="p5-cg-sec"><em>Open questions</em><ul>${db.questions.map(d => `<li>${esc(d)}</li>`).join("") || "<li>—</li>"}</ul></div>
          </div>
        </div>
        <button class="jv-btn ghost" id="p5-cg-carry">📥 Carry decisions into a new chat</button>`;
      $("p5-cg-carry").onclick = () => {
        const carry = [...da.decisions, ...db.decisions].slice(0, 8).join("\n- ");
        p5close(ov);
        p5send(`Context carried over from two earlier conversations:\n- ${carry}\n\nAcknowledge briefly, then help me continue.`);
      };
    };
    return ov;
  }
  feature("chat-git", {
    label: "Chat Git (conversation diff)", icon: "🪵", group: "studio",
    hint: "Semantic diff of two conversations: unique topics, decisions and open questions.",
    run: chatGit
  });

  /* ═══════════════════════════════════════════════════════════════
     9 · PROMPT LIBRARY 2.0 — variables and a resolved preview
     ═══════════════════════════════════════════════════════════════ */
  const PL2_KEY = "jv_p5_prompts";
  const pl2load = () => { try { return JSON.parse(localStorage.getItem(PL2_KEY) || "[]"); } catch (e) { return []; } };
  const pl2save = a => { try { localStorage.setItem(PL2_KEY, JSON.stringify(a.slice(-80))); } catch (e) {} };
  function promptLibrary2() {
    const ov = p5open(p5modal("p5-plib", "📚 <b>Prompt Library 2.0</b> <span class='p5-muted'>variables + live preview</span>", `
      <div class="jv-row2">
        <input id="p5-pl-name" class="jv-field" placeholder="Name this prompt…">
        <button class="jv-btn" id="p5-pl-add">＋ Save current input</button>
      </div>
      <div id="p5-pl-list"></div>
      <div id="p5-pl-editor" hidden>
        <div class="jv-field"><label>Template</label><textarea id="p5-pl-tpl" rows="4" placeholder="e.g. Review {{code}} for {{focus}}"></textarea></div>
        <div class="jv-field"><label>Variables</label><div id="p5-pl-vars" class="p5-pl-vars"></div></div>
        <div class="jv-field"><label>Resolved preview</label><pre id="p5-pl-prev" class="p5-pl-prev"></pre></div>
        <div class="jv-row2"><button class="jv-btn" id="p5-pl-run">▶ Use it</button><button class="jv-btn ghost" id="p5-pl-del">🗑 Delete</button></div>
      </div>`));
    const listEl = $("p5-pl-list"), ed = $("p5-pl-editor");
    let current = null;
    const render = () => {
      const arr = pl2load();
      listEl.innerHTML = arr.length ? arr.map((p, i) =>
        `<div class="p5-pl-item" data-i="${i}"><b>${esc(p.name)}</b><i>${esc(p.tpl.slice(0, 90))}</i><span class="p5-pl-tags">${(p.vars || []).map(v => `<em>{{${esc(v)}}}</em>`).join("")}</span></div>`
      ).join("") : `<div class="p5-sl-empty">No saved prompts. Type something in the composer and hit “Save current input”.</div>`;
      $$(".p5-pl-item", listEl).forEach(el => el.onclick = () => openItem(pl2load()[+el.dataset.i]));
    };
    const openItem = p => {
      if (!p) return;
      current = p;
      ed.hidden = false;
      $("p5-pl-tpl").value = p.tpl || "";
      renderVars();
    };
    const renderVars = () => {
      const tpl = $("p5-pl-tpl").value || "";
      const vars = Array.from(new Set((tpl.match(/\{\{(\w+)\}\}/g) || []).map(v => v.slice(2, -2))));
      const cur = (current && current.vals) || {};
      $("p5-pl-vars").innerHTML = vars.map(v =>
        `<label class="p5-pl-var"><span>{{${esc(v)}}}</span><input data-v="${esc(v)}" value="${esc(cur[v] || "")}" placeholder="value…"></label>`
      ).join("") || `<div class="p5-sl-empty">No {{variables}} in this template.</div>`;
      $$("#p5-pl-vars input").forEach(inp => inp.oninput = () => {
        if (!current) return;
        current.vals = current.vals || {};
        current.vals[inp.dataset.v] = inp.value;
        pl2save(pl2load().map(p => (p.id === current.id ? current : p)));
        preview();
      });
      preview();
    };
    const preview = () => {
      const tpl = $("p5-pl-tpl").value || "";
      const cur = (current && current.vals) || {};
      const resolved = tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (cur[k] !== undefined && cur[k] !== "" ? cur[k] : `{{${k}}}`));
      $("p5-pl-prev").textContent = resolved || "(empty)";
    };
    $("p5-pl-tpl").oninput = () => { if (current) { current.tpl = $("p5-pl-tpl").value; pl2save(pl2load().map(p => (p.id === current.id ? current : p))); renderVars(); } };
    $("p5-pl-add").onclick = () => {
      const name = ($("p5-pl-name").value || "").trim();
      const body = (typeof ui !== "undefined" ? ui.value : "") || "";
      if (!name) return p5toast("Give it a name");
      const arr = pl2load();
      const p = { id: uid(), name, tpl: body, vars: [], vals: {} };
      arr.push(p); pl2save(arr);
      $("p5-pl-name").value = "";
      render(); openItem(p);
    };
    $("p5-pl-del").onclick = () => {
      if (!current) return;
      pl2save(pl2load().filter(p => p.id !== current.id));
      current = null; ed.hidden = true; render();
    };
    $("p5-pl-run").onclick = () => {
      const resolved = $("p5-pl-prev").textContent;
      p5close(ov);
      p5send(resolved);
    };
    render();
    return ov;
  }
  feature("prompt-library-2", {
    label: "Prompt Library 2.0", icon: "📚", group: "intel",
    hint: "Templates with {{variables}}, a live resolved preview, and one-click use.",
    run: promptLibrary2
  });

  /* ═══════════════════════════════════════════════════════════════
     HUB · sidebar · command palette · hotkeys
     ═══════════════════════════════════════════════════════════════ */
  function powerHub() {
    const groups = FEATURE_GROUPS.map(g => {
      const items = Object.values(FEATURES).filter(f => f.group === g.id);
      if (!items.length) return "";
      return `<div class="jv-hub-group"><b>${esc(g.label)}</b>
        <div class="p5-hub-grid">${items.map(f =>
          `<button class="p5-hub-card" data-f="${f.id}"><span class="p5-hub-ico">${f.icon}</span><b>${esc(f.label)}</b><i>${esc(f.hint || "")}</i></button>`
        ).join("")}</div></div>`;
    }).join("");
    const ov = p5open(p5modal("p5-hub", `⚡ <b>Power Pack 5</b> <span class='p5-muted'>${Object.keys(FEATURES).length} power-ups</span>`, groups || `<div class="p5-sl-empty">No features registered.</div>`));
    $$(".p5-hub-card", ov).forEach(b => b.onclick = () => { const f = FEATURES[b.dataset.f]; if (f) f.run(); });
    return ov;
  }
  function injectSidebar() {
    const host = document.querySelector(".sbt");
    if (!host || $("jv-p5-side")) return;
    const d = document.createElement("details");
    d.className = "sb-details"; d.id = "jv-p5-side";
    d.innerHTML = `<summary class="sb-summary">⚡ Power Pack 5 <span class="pulse-tag">NEW</span></summary><div class="sbn-inner"></div>`;
    const inner = d.querySelector(".sbn-inner");
    inner.innerHTML = `<div class="trow" data-go="hub">⚡ <span>Power Pack 5 Hub</span><span class="badge-count" id="p5-count">0</span></div>` +
      FEATURE_GROUPS.map(g => {
        const items = Object.values(FEATURES).filter(f => f.group === g.id);
        if (!items.length) return "";
        return `<div class="sblbl-sub">${esc(g.label)}</div>` + items.map(f =>
          `<div class="trow p5-row" data-go="${f.id}" title="${esc(f.hint || f.label)}"><span>${f.icon}</span><span>${esc(f.label)}</span></div>`
        ).join("");
      }).join("");
    host.appendChild(d);
    const cnt = $("p5-count");
    if (cnt) cnt.textContent = String(Object.keys(FEATURES).length);
    $$("div.trow", d).forEach(t => t.onclick = () => {
      const go = t.dataset.go;
      if (go === "hub") { powerHub(); return; }
      const f = FEATURES[go];
      if (f) f.run();
    });
  }
  function injectTopbar() {
    const tb = document.querySelector(".tb-hero-tools");
    if (!tb || $("jv-p5-top")) return;
    const b = document.createElement("button");
    b.id = "jv-p5-top";
    b.className = "jv-p5-topbtn";
    b.title = "Power Pack 5 — all power-ups";
    b.innerHTML = `<span>⚡</span><i>P5</i>`;
    b.onclick = powerHub;
    tb.insertBefore(b, tb.firstChild);
  }
  function installCommands() {
    try {
      if (typeof COMMANDS === "undefined") return;
      /* Idempotent: later waves add features, so re-running must not duplicate. */
      COMMANDS.filter(c => c.tag === "Power Pack 5").forEach(c => { const i = COMMANDS.indexOf(c); if (i > -1) COMMANDS.splice(i, 1); });
      Object.values(FEATURES).forEach(f => {
        COMMANDS.push({ icon: f.icon, title: f.label, tag: "Power Pack 5", action: () => f.run() });
      });
      COMMANDS.push({ icon: "🔦", title: "Spotlight Universal Search", tag: "Power Pack 5", action: spotlight });
    } catch (e) {}
  }
  function installHotkeys() {
    window.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key || "").toLowerCase() === "k") {
        e.preventDefault(); spotlight();
      }
    });
  }
  /* Slash commands: /p5, /spotlight, /radar, /diff … */
  function installSlash() {
    if (!window.JV || !window.JV.interceptSend) return;
    const prev = window.JV.interceptSend.bind(window.JV);
    window.JV.interceptSend = async raw => {
      const t = String(raw || "").trim();
      const m = t.match(/^\/([a-z0-9_-]+)\s*$/i);
      if (m) {
        const cmd = m[1].toLowerCase();
        if (cmd === "p5" || cmd === "power5") { powerHub(); return true; }
        if (cmd === "spotlight" || cmd === "sl") { spotlight(); return true; }
        if (cmd === "radar" || cmd === "privacy") { installRadar(); privacyRadar(); return true; }
        if (cmd === "diff") { showRealDiff(); return true; }
        if (cmd === "branches" || cmd === "bt") { branchTree(); return true; }
        if (cmd === "chatgit") { chatGit(); return true; }
        if (cmd === "memgraph" || cmd === "mg") { memoryGraph2(); return true; }
        if (cmd === "plib") { promptLibrary2(); return true; }
        const f = FEATURES[cmd.replace(/^p5[-_]?/, "")];
        if (f) { f.run(); return true; }
      }
      return prev(raw);
    };
  }
  function init() {
    try { injectTopbar(); } catch (e) {}
    try { injectSidebar(); } catch (e) {}
    try { installCommands(); } catch (e) {}
    try { installHotkeys(); } catch (e) {}
    try { installSlash(); } catch (e) {}
    try { installDiffButton(); } catch (e) {}
    try { installArtifactObserver(); } catch (e) {}
    try { installRadar(); } catch (e) {}
    try { armCharts(); } catch (e) {}
    /* Re-scan once the app has booted so restored chats get the new UI too. */
    setTimeout(() => { try { scanForCharts(); botRows().forEach(r => scanArtifacts(r)); } catch (e) {} }, 2200);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", () => setTimeout(init, 60));
  else setTimeout(init, 60);

  /* Expose the kernel for later waves. */
  window.JV5 = Object.assign(window.JV5 || {}, {
    feature, FEATURES, FEATURE_GROUPS, p5modal, p5open, p5close, p5toast, p5send, p5ask, p5copy, p5download,
    diffLines, diffWords, alignDiff, parseMarkdownTable, parseCsv, chartModal, fuzzyScore,
    radar, installRadar, powerHub, spotlight, p5get, p5set, esc, $, $$, clamp, installCommands,
    renderMarkdown: text => {
      try { return (typeof marked !== "undefined") ? JarvikRuntime.markdown(text) : esc(text).replace(/\n/g, "<br>"); }
      catch (e) { return esc(text).replace(/\n/g, "<br>"); }
    }
  });
})();
