/* ═══════════════════════════════════════════════════════════════════════════
   JARVIK CONSOLE — behaviour layer
   Loaded last, after every legacy script. Three upgrades, all additive:

     1. Telemetry rail  — replaces the 5px "scar" ticks with a proper
                          conversation map: per-turn ticks, a viewport window,
                          hover labels, click-to-jump.
     2. Command palette — fuzzy subsequence matching, grouped results, recent
                          history, match highlighting. Reuses the existing
                          COMMANDS array and its window.COMMANDS.push contract.
     3. Reading mode    — a narrow serif column for prose-heavy answers.

   Nothing here renames a legacy selector, so the render pipeline, memory
   sync, markdown export and PDF export keep working unchanged.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const K_READ   = "jv_console_read";
  const K_RECENT = "jv_console_recent";

  /* the shell exposes these as lexical globals, not on window */
  const G = name => { try { return (0, eval)(name); } catch (e) { return undefined; } };
  const chat = () => G("cc");
  const toastFn = msg => { try { const t = G("toast"); if (typeof t === "function") return t(msg); } catch (e) {} };

  const reduceMotion = () => {
    try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ── run after the shell has booted ─────────────────────────────────────
     Every legacy script has already executed by the time this file runs,
     but `boot()` fires later still. Poll briefly for the chat mount. */
  function whenReady(fn) {
    if (chat()) return fn();
    let n = 0;
    const t = setInterval(() => {
      if (chat() || ++n > 60) { clearInterval(t); if (chat()) fn(); }
    }, 100);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     1 · TELEMETRY RAIL
     ═══════════════════════════════════════════════════════════════════════ */

  const Rail = (() => {
    let host = null, track = null, win = null, label = null;
    let ticks = [], activeIdx = -1, raf = 0, mounted = false;

    function el(tag, cls) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      return n;
    }

    function mount() {
      if (mounted || !chat()) return;
      mounted = true;

      host = el("div", "c-rail");
      host.setAttribute("role", "navigation");
      host.setAttribute("aria-label", "Conversation map");
      track = el("div", "c-rail-track");
      win = el("div", "c-rail-window");
      host.append(track, win);
      document.body.appendChild(host);

      label = el("div", "c-rail-label");
      label.setAttribute("aria-hidden", "true");
      document.body.appendChild(label);

      chat().addEventListener("scroll", schedule, { passive: true });
      addEventListener("resize", schedule, { passive: true });
      new MutationObserver(schedule).observe(chat(), { childList: true });

      schedule();
    }

    function position() {
      const cc = chat();
      if (!cc || !host) return;
      const r = cc.getBoundingClientRect();
      host.style.top = (r.top + 8) + "px";
      host.style.height = (r.height - 16) + "px";
      host.style.left = (r.right - 30) + "px";
    }

    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; render(); });
    }

    function render() {
      const cc = chat();
      if (!cc || !host) return;

      const turns = cc.querySelectorAll(".mr");
      const scrollable = cc.scrollHeight > cc.clientHeight + 40;

      // only show the rail when the conversation is long enough to need a map
      host.classList.toggle("on", scrollable && turns.length > 2);
      if (!scrollable) { ticks = []; return; }

      position();

      // rebuild ticks only when the turn count changed; otherwise reposition
      if (ticks.length !== turns.length) {
        host.querySelectorAll(".c-rail-tick").forEach(n => n.remove());
        ticks = [];
        turns.forEach((turn, i) => {
          const isUser = turn.classList.contains("user");
          const hasCode = !!turn.querySelector("pre code");
          const t = el("button", "c-rail-tick" + (isUser ? " u" : "") + (hasCode ? " code" : ""));
          t.type = "button";
          t.dataset.i = String(i);
          t.tabIndex = -1;
          t.setAttribute("aria-label", describe(turn, i));
          t.addEventListener("click", () => jump(turn));
          t.addEventListener("mouseenter", () => { t.classList.add("hot"); showLabel(t, turn); });
          t.addEventListener("mouseleave", () => { t.classList.remove("hot"); hideLabel(); });
          t.addEventListener("focus", () => { t.classList.add("hot"); showLabel(t, turn); });
          t.addEventListener("blur", () => { t.classList.remove("hot"); hideLabel(); });
          host.appendChild(t);
          ticks.push(t);
        });
      }

      // map each turn's offset into rail space
      const H = cc.scrollHeight;
      const h = host.clientHeight || 1;
      turns.forEach((turn, i) => {
        const t = ticks[i];
        if (!t) return;
        const p = Math.max(0, Math.min(1, turn.offsetTop / Math.max(1, H)));
        t.style.top = Math.round(p * (h - 2)) + "px";
      });

      // viewport window
      const top = cc.scrollTop / Math.max(1, H);
      const hFrac = cc.clientHeight / Math.max(1, H);
      win.style.top = Math.round(top * h) + "px";
      win.style.height = Math.max(8, Math.round(hFrac * h)) + "px";

      // mark the turn currently in the middle of the viewport
      const mid = cc.scrollTop + cc.clientHeight / 2;
      let best = -1, bestD = Infinity;
      turns.forEach((turn, i) => {
        const d = Math.abs(turn.offsetTop + turn.offsetHeight / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best !== activeIdx) {
        if (ticks[activeIdx]) ticks[activeIdx].classList.remove("active");
        if (ticks[best]) ticks[best].classList.add("active");
        activeIdx = best;
      }
    }

    function describe(turn, i) {
      const kind = turn.classList.contains("user") ? "Your prompt" : "Assistant reply";
      const txt = (turn.innerText || "").replace(/\s+/g, " ").trim().slice(0, 70);
      return `Turn ${i + 1} — ${kind}${txt ? ": " + txt : ""}`;
    }

    function jump(turn) {
      const cc = chat();
      const behavior = reduceMotion() ? "auto" : "smooth";
      const y = turn.offsetTop - cc.clientHeight / 3;
      cc.scrollTo({ top: Math.max(0, y), behavior });
      if (!reduceMotion()) {
        turn.animate(
          [{ background: "color-mix(in srgb, var(--c-info) 12%, transparent)" },
           { background: "transparent" }],
          { duration: 800, easing: "ease-out" }
        );
      }
    }

    function showLabel(tick, turn) {
      if (!label) return;
      const r = tick.getBoundingClientRect();
      label.textContent = describe(turn, +tick.dataset.i).slice(0, 64);
      label.style.top = (r.top + r.height / 2) + "px";
      label.style.left = (r.left - 6) + "px";
      label.classList.add("on");
    }

    function hideLabel() { if (label) label.classList.remove("on"); }

    return { mount, refresh: schedule };
  })();

  /* ═══════════════════════════════════════════════════════════════════════
     2 · COMMAND PALETTE — fuzzy, grouped, with recents
     ═══════════════════════════════════════════════════════════════════════ */

  const Palette = (() => {
    let flat = [];          // every non-conversation command, deduped
    let recents = [];
    let results = [];       // what's rendered, in order
    let active = 0;

    function loadRecents() {
      try { recents = JSON.parse(store.get(K_RECENT, "[]")) || []; } catch (e) { recents = []; }
      if (!Array.isArray(recents)) recents = [];
    }

    function remember(item) {
      const key = item.title;
      recents = [key, ...recents.filter(k => k !== key)].slice(0, 5);
      store.set(K_RECENT, JSON.stringify(recents));
    }

    function collect() {
      const cmds = G("COMMANDS") || window.COMMANDS || [];
      const seen = new Set();
      flat = [];
      (Array.isArray(cmds) ? cmds : []).forEach(c => {
        if (!c || !c.title || seen.has(c.title)) return;
        seen.add(c.title);
        flat.push({ icon: c.icon || "·", title: c.title, tag: c.tag || "", action: c.action });
      });
      // conversations, built fresh so they reflect the current store
      let convs = [];
      try {
        const ps = G("getP") ? G("getP")() : [];
        convs = (ps || []).slice(0, 10).map(p => ({
          icon: p.pinned ? "★" : "·",
          title: p.title || "Untitled",
          tag: "chat",
          group: "Conversations",
          action: () => {
            try { G("setCur")(p.id); G("loadChat")(); G("renderProjs")(); } catch (e) {}
          }
        }));
      } catch (e) {}
      return convs;
    }

    /* subsequence matcher with a contiguity bonus — "reth" matches "Retry". */
    function score(query, text) {
      if (!query) return 0;
      const q = query.toLowerCase(), t = text.toLowerCase();
      let qi = 0, s = 0, streak = 0, firstHit = -1;
      for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) {
          if (firstHit < 0) firstHit = i;
          streak++;
          s += 1 + streak * 1.6;
          qi++;
        } else streak = 0;
      }
      if (qi < q.length) return -1;              // not a subsequence
      if (t.startsWith(q)) s += 40;              // strong prefix bonus
      else if (t.includes(q)) s += 14;           // substring bonus
      s -= firstHit * 0.35;                      // earlier match wins
      s -= t.length * 0.03;                      // shorter labels win
      return s;
    }

    /* wrap matched characters so the user can see why a row matched */
    function highlight(text, query) {
      if (!query) return escapeHtml(text);
      const q = query.toLowerCase();
      const lower = text.toLowerCase();
      // find the best contiguous span first, else fall back to subsequence
      const at = lower.indexOf(q);
      if (at >= 0) {
        return escapeHtml(text.slice(0, at)) + "<mark>" + escapeHtml(text.slice(at, at + q.length)) +
               "</mark>" + escapeHtml(text.slice(at + q.length));
      }
      let out = "", qi = 0, inMark = false;
      for (let i = 0; i < text.length; i++) {
        const hit = qi < q.length && lower[i] === q[qi];
        if (hit) {
          if (!inMark) { out += "<mark>"; inMark = true; }
          out += escapeHtml(text[i]);
          qi++;
        } else {
          if (inMark) { out += "</mark>"; inMark = false; }
          out += escapeHtml(text[i]);
        }
      }
      if (inMark) out += "</mark>";
      return out;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }

    function build(query) {
      const q = (query || "").trim();
      const convs = collect();

      // score commands
      let hits = flat.map(c => {
        const st = score(q, c.title);
        const stag = q ? score(q, c.tag) : 0;
        const best = Math.max(st, stag >= 0 ? stag - 8 : -1);
        return { ...c, group: "Commands", _s: best };
      }).filter(c => !q || c._s >= 0);

      // score conversations
      let chits = convs.map(c => ({ ...c, _s: q ? score(q, c.title) : 0 })).filter(c => !q || c._s >= 0);

      if (!q) {
        // no query → recents first, then the full command list
        const rec = recents
          .map(t => flat.find(c => c.title === t))
          .filter(Boolean)
          .map(c => ({ ...c, group: "Recent" }));
        const recTitles = new Set(rec.map(c => c.title));
        hits = [...rec, ...flat.filter(c => !recTitles.has(c.title)).map(c => ({ ...c, group: "Commands" }))];
        chits = chits.map(c => ({ ...c, group: "Conversations" }));
        return [...hits, ...chits];
      }

      hits.sort((a, b) => b._s - a._s);
      chits.sort((a, b) => b._s - a._s);

      // interleave: a couple of best commands, then conversations, then rest
      const out = hits.slice(0, 6).map(c => ({ ...c, group: "Best matches" }));
      if (chits.length) out.push(...chits.slice(0, 4));
      const rest = hits.slice(6).map(c => ({ ...c, group: "Other commands" }));
      out.push(...rest);
      return out.slice(0, 24);
    }

    function render(query) {
      const box = $("cmd-results");
      if (!box) return;
      results = build(query);
      active = 0;

      if (!results.length) {
        box.innerHTML = `<div class="eml">Nothing matches “${escapeHtml(query)}”</div>`;
        return;
      }

      let html = "", lastGroup = "";
      results.forEach((r, i) => {
        if (r.group !== lastGroup) {
          html += `<div class="c-cmd-group">${escapeHtml(r.group)}</div>`;
          lastGroup = r.group;
        }
        html += `<div class="cmd-item${i === 0 ? " active" : ""}" data-i="${i}" role="option">` +
                  `<span class="cmd-item-icon">${escapeHtml(r.icon)}</span>` +
                  `<span class="cmd-item-title">${highlight(r.title, query)}</span>` +
                  `<span class="c-cmd-hint">↵</span>` +
                  `<span class="cmd-item-tag">${escapeHtml(r.tag)}</span>` +
                `</div>`;
      });
      box.innerHTML = html;

      box.querySelectorAll(".cmd-item").forEach(node => {
        node.addEventListener("click", () => run(+node.dataset.i));
        node.addEventListener("mousemove", () => setActive(+node.dataset.i, false));
      });
    }

    function setActive(i, scroll) {
      const box = $("cmd-results");
      if (!box || !results.length) return;
      active = (i + results.length) % results.length;
      const nodes = box.querySelectorAll(".cmd-item");
      nodes.forEach(n => n.classList.toggle("active", +n.dataset.i === active));
      if (scroll !== false && nodes[active]) nodes[active].scrollIntoView({ block: "nearest" });
    }

    function run(i) {
      const r = results[i];
      if (!r) return;
      remember(r);
      close();
      try { if (typeof r.action === "function") r.action(); } catch (e) { console.error(e); }
    }

    function open() {
      const pal = $("cmd-palette"), input = $("cmd-input");
      if (!pal || !input) return;
      loadRecents();
      pal.classList.remove("hidden");
      input.value = "";
      render("");
      input.focus();
    }

    function close() {
      const pal = $("cmd-palette");
      if (pal) pal.classList.add("hidden");
    }

    function move(d) { setActive(active + d); }

    function install() {
      const input = $("cmd-input");
      if (!input) return;

      // own the input entirely — replace the legacy inline handlers
      input.oninput = null;
      input.onkeydown = null;
      input.addEventListener("input", () => render(input.value));
      input.addEventListener("keydown", e => {
        const pal = $("cmd-palette");
        if (!pal || pal.classList.contains("hidden")) return;
        if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
        else if (e.key === "Enter") { e.preventDefault(); run(active); }
        else if (e.key === "Escape") { e.preventDefault(); close(); }
        else if (e.key === "Tab") { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
        else if (e.key === "Home") { e.preventDefault(); setActive(0); }
        else if (e.key === "End") { e.preventDefault(); setActive(results.length - 1); }
      });
      input.addEventListener("keydown", e => e.stopPropagation(), true);

      // the palette opens on Ctrl/Cmd+K via the shell; mirror its state
      const pal = $("cmd-palette");
      if (pal) {
        new MutationObserver(() => {
          if (!pal.classList.contains("hidden")) { loadRecents(); render(input.value || ""); }
        }).observe(pal, { attributes: true, attributeFilter: ["class"] });
        pal.addEventListener("click", e => { if (e.target === pal) close(); });
      }

      const trigger = $("cmd-trigger");
      if (trigger) {
        trigger.onclick = e => { e.preventDefault(); open(); };
      }
    }

    return { install, open, close, render };
  })();

  /* ═══════════════════════════════════════════════════════════════════════
     3 · READING MODE
     ═══════════════════════════════════════════════════════════════════════ */

  const Reading = (() => {
    let on = false;

    function apply(v, announce) {
      on = !!v;
      document.body.classList.toggle("c-read", on);
      store.set(K_READ, on ? "1" : "0");
      const btn = $("c-read-btn");
      if (btn) {
        btn.classList.toggle("active", on);
        btn.setAttribute("aria-pressed", String(on));
        btn.title = on ? "Reading mode on — click for console view (Ctrl+Shift+R)" : "Reading mode: wider type, serif, narrow column (Ctrl+Shift+R)";
      }
      if (announce) toastFn(on ? "Reading mode on" : "Console view restored");
      Rail.refresh();
    }

    function toggle() { apply(!on, true); }

    function install() {
      apply(store.get(K_READ, "0") === "1", false);
      addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "r") {
          e.preventDefault();
          toggle();
        }
      });
    }

    return { install, toggle, isOn: () => on };
  })();

  /* ═══════════════════════════════════════════════════════════════════════
     4 · BOOT
     ═══════════════════════════════════════════════════════════════════════ */

  function addTopbarButton() {
    const tools = document.querySelector(".topbar .tb-hero-tools");
    if (!tools || $("c-read-btn")) return;
    const btn = document.createElement("button");
    btn.id = "c-read-btn";
    btn.className = "cmd-trigger-btn";
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.title = "Reading mode: wider type, serif, narrow column (Ctrl+Shift+R)";
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" style="width:14px;height:14px">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M4 6.5h7M4 12h7M4 17.5h4M15 6.5h5M15 12h5M15 17.5h3"/></svg>';
    btn.addEventListener("click", () => Reading.toggle());
    tools.appendChild(btn);
    if (Reading.isOn()) btn.classList.add("active");
  }

  function addCommands() {
    const cmds = window.COMMANDS;
    if (!Array.isArray(cmds)) return;
    if (cmds.some(c => c && c.title === "Toggle Reading Mode")) return;
    cmds.push({
      icon: "▤",
      title: "Toggle Reading Mode",
      tag: "UI",
      action: () => Reading.toggle()
    });
  }

  whenReady(() => {
    Rail.mount();
    Palette.install();
    Reading.install();
    addTopbarButton();
    addCommands();

    // keep the rail honest when conversations switch or the window resizes
    const cc = chat();
    if (cc) {
      new MutationObserver(() => Rail.refresh())
        .observe(cc, { childList: true });
    }
    addEventListener("resize", () => Rail.refresh(), { passive: true });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) Rail.refresh(); });
  });

  /* expose a tiny surface for the shell and for debugging */
  window.JVConsole = {
    toggleReading: Reading.toggle,
    openPalette: Palette.open,
    refreshRail: Rail.refresh
  };
})();
