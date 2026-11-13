/* ═══════════════════════════════════════════════════════════════════
   JARVIK ENGAGEMENT DECK (engage.js) · Phase 3
   Canvas Pack: templates · ZIP export · multi-tab co-edit · visual
   picker · error auto-fix · Voice: meeting mode · podcast TTS ·
   demo recorder · custom wake words · Content: landing pages ·
   blog/tweet writer · audience rewriter · chat-to-slides ·
   Engagement: daily quests · duel arena · weekly wins · skins ·
   Pro Profession Packs + Pro Hub UI
   Loads after studio.js
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const JV = window.JV, JVM = window.JVM;
  if (!JV || !JVM) return;
  const { $, $$, esc, sget, sset, uid, ask, chop, sendVia } = JVM;

  const cfg = () => sget("jv_pro", {});
  const setCfg = c => sset("jv_pro", Object.assign(cfg(), c));
  const editor = () => $("art-code-editor");
  function openCanvas() {
    const drawer = $("artifacts-drawer");
    if (drawer && getComputedStyle(drawer).display !== "none") return true;
    const b = $("cowork-toggle-btn"); if (b) b.click();
    return true;
  }
  function setEditorCode(code, alsoRun) {
    openCanvas();
    const ed = editor(); if (!ed) return JVM.toast("Canvas editor not found");
    ed.value = code;
    const run = $("art-run-btn"); if (alsoRun && run) run.click();
  }

  /* ═══════════════ 1 · CANVAS TEMPLATES ═══════════════ */
  const TPL = {
    "Landing page": () => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:'DM Sans',sans-serif;margin:0;background:#0b1017;color:#e8f6ff}header{display:flex;justify-content:space-between;padding:22px 34px}nav a{color:#8ab;margin-left:18px;text-decoration:none}.hero{padding:90px 34px;max-width:760px}.hero h1{font-size:44px;line-height:1.15;margin:0 0 14px}.hero h1 em{color:#35d6e8;font-style:normal}.hero p{color:#9fb9c9;font-size:17px}.cta{background:#35d6e8;color:#0b1017;border:none;padding:13px 26px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;padding:20px 34px 70px}.card{background:#111a24;border:1px solid #1c2a38;border-radius:14px;padding:20px}.card b{color:#35d6e8}</style></head><body><header><span>◈ ACME</span><nav><a href="#">Product</a><a href="#">Pricing</a><a href="#">Blog</a></nav></header><section class="hero"><h1>Ship your idea <em>10× faster</em> without burning out.</h1><p>Describe your product here in one punchy sentence. Speak to a real pain and promise a real outcome.</p><button class="cta">Start free →</button></section><section class="cards"><div class="card"><b>⚡ Fast</b>Explain the first benefit in two lines.</div><div class="card"><b>🔒 Secure</b>Explain the second benefit in two lines.</div><div class="card"><b>🎯 Simple</b>Explain the third benefit in two lines.</div></section></body></html>`,
    "Dashboard": () => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:'DM Sans',sans-serif;margin:0;background:#0b1017;color:#e8f6ff}.top{display:flex;gap:14px;padding:26px;flex-wrap:wrap}.kpi{flex:1;min-width:150px;background:#111a24;border:1px solid #1c2a38;border-radius:14px;padding:18px}.kpi b{display:block;font-size:26px;color:#35d6e8}.kpi span{color:#7f96a5;font-size:12px}.wrap{padding:0 26px 40px}canvas{width:100%;background:#111a24;border-radius:14px;border:1px solid #1c2a38}</style></head><body><div class="top"><div class="kpi"><b>1,204</b><span>users this week</span></div><div class="kpi"><b>$3.2k</b><span>revenue</span></div><div class="kpi"><b>42%</b><span>conversion</span></div><div class="kpi"><b>3.1m</b><span>avg session</span></div></div><div class="wrap"><canvas id="c" height="220"></canvas></div><script>const c=document.getElementById('c'),x=c.getContext('2d');c.width=c.clientWidth;const pts=[12,40,28,66,52,88,74,64,91];x.strokeStyle='#35d6e8';x.lineWidth=3;x.beginPath();pts.forEach((p,i)=>{const X=c.width*(i+ .5)/pts.length,Y=200-p;x[i?'lineTo':'moveTo'](X,Y)});x.stroke();</script></body></html>`,
    "Pricing page": () => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'DM Sans',sans-serif;margin:0;background:#0b1017;color:#e8f6ff;padding:60px 20px;text-align:center}h1{font-size:34px}.plans{display:flex;gap:18px;justify-content:center;margin-top:34px;flex-wrap:wrap}.plan{background:#111a24;border:1px solid #1c2a38;border-radius:16px;padding:26px;width:230px}.plan.hot{border-color:#35d6e8;box-shadow:0 0 30px rgba(53,214,232,.25)}.plan h2{margin:0;color:#35d6e8}.price{font-size:30px;font-weight:800;margin:10px 0}.plan ul{list-style:none;padding:0;color:#9fb9c9;font-size:14px;line-height:1.9}.btn{background:#35d6e8;color:#0b1017;border:none;border-radius:9px;padding:10px 0;width:100%;font-weight:700;cursor:pointer;margin-top:12px}.tag{background:rgba(53,214,232,.15);color:#35d6e8;border-radius:6px;padding:2px 8px;font-size:11px}</style></head><body><h1>Simple pricing that scales <span class="tag">14-day free</span></h1><div class="plans"><div class="plan"><h2>Starter</h2><div class="price">$0</div><ul><li>1 project</li><li>Community help</li><li>Basic analytics</li></ul><button class="btn">Choose</button></div><div class="plan hot"><h2>Pro</h2><div class="price">$19<small>/mo</small></div><ul><li>Projects ∞</li><li>Priority help</li><li>Big-time analytics</li></ul><button class="btn">Choose</button></div><div class="plan"><h2>Team</h2><div class="price">$59<small>/mo</small></div><ul><li>Everything in Pro</li><li>5 seats</li><li>SSO</li></ul><button class="btn">Choose</button></div></div></body></html>`,
    "Resume": () => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'DM Sans',sans-serif;background:#eef3f7;color:#223;margin:0}.page{max-width:720px;margin:30px auto;background:#fff;padding:50px 60px;box-shadow:0 4px 30px rgba(0,0,0,.08)}h1{margin:0;font-size:34px}h2{border-bottom:2px solid #35d6e8;padding-bottom:4px;font-size:17px;letter-spacing:1px}.row{display:flex;justify-content:space-between}.job{margin:12px 0}</style></head><body><div class="page"><div class="row"><h1>Jordan Vale</h1><div>Remote · jordan@example.com</div></div><p>Product-minded front-end engineer. 4 years shipping React + design systems. Looking for: senior front-end role.</p><h2>EXPERIENCE</h2><div class="job"><div class="row"><b>Sparkline Labs — Frontend Eng</b><i>2023–now</i></div><p>Built dashboard used by 12k teams; cut load time 61%; led design-system migration.</p></div><div class="job"><div class="row"><b>Nimble.io — Junior Eng</b><i>2021–2023</i></div><p>Shipped checkout A/B tests adding +8% conversion; mentored 2 interns.</p></div><h2>STACK</h2><p>TypeScript · React · Vite · Postgres · Canvas</p><h2>EDUCATION</h2><p>B.Sc. Computer Science, 2021</p></div></body></html>`,
    "Kanban": () => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'DM Sans',sans-serif;margin:0;background:#0b1017;color:#e8f6ff;padding:26px}h1{font-size:20px}.cols{display:flex;gap:14px}.col{flex:1;background:#111a24;border:1px solid #1c2a38;border-radius:14px;padding:14px;min-height:320px}.col h2{font-size:13px;color:#7f96a5;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px}.card{background:#17222f;border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:grab;border:1px solid #22303f}.card.gone{opacity:.35}.done{color:#34d399}</style></head><body><h1>🧩 Sprint board — click cards to move them to DONE</h1><div class="cols" id="b"></div><script>const data={todo:['Login flow','Email formatter'],split:['Dark mode','Webhook retries'],done:[]};const keys=['todo','split','done'],labels={todo:'TO DO',split:'SPLIT/REVIEW',done:'✓ DONE'};function render(){b.innerHTML=keys.map(k=>'<div class="col"><h2>'+labels[k]+'</h2>'+data[k].map(n=>'<div class="card'+(k=='done'?' gone':'')+'" data-n="'+n+'">'+n+'</div>').join('')+'</div>').join('');document.querySelectorAll('.card').forEach(c=>c.onclick=()=>{const n=c.dataset.n;keys.forEach(k=>data[k]=data[k].filter(x=>x!=n));data.done.push(n);render()});}render();</script></body></html>`,
    "Pomodoro": () => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'DM Sans',sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:radial-gradient(circle at 50% 20%,#12202c,#0b1017);color:#e8f6ff}#t{font-size:74px;font-weight:800;letter-spacing:2px}.pill{background:#111a24;border:1px solid #1c2a38;border-radius:40px;padding:30px 60px;text-align:center}button{background:#35d6e8;border:none;border-radius:9px;padding:10px 24px;font-weight:700;color:#0b1017;margin:6px;cursor:pointer}.mode{color:#7f96a5;font-size:12px;text-transform:uppercase;letter-spacing:2px}</style></head><body><div class="pill"><div class="mode" id="m">FOCUS · 25:00</div><div id="t">25:00</div><button onclick="start()">Start</button><button onclick="reset()">Reset</button><script>let s=1500,iv;const show=v=>{t.textContent=String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0')};function start(){clearInterval(iv);m.textContent='FOCUS · RUNNING';iv=setInterval(()=>{s--;show(s);if(s<=0){clearInterval(iv);t.textContent='DONE ✓';m.textContent='TAKE A BREAK';}},1000)}function reset(){clearInterval(iv);s=1500;show(s);m.textContent='FOCUS · 25:00'}show(s)</script></div></body></html>`
  };
  function templateGallery() {
    const ov = JVM.modal("jv-tpl", `🎨 Canvas Template Gallery`, `<div class="jv-tpl-grid">${Object.keys(TPL).map((k, i) => `<button class="jv-tpl-card" data-i="${i}"><b>${["🚀", "📊", "💰", "📄", "🧩", "🍅"][i]}</b><span>${esc(k)}</span></button>`).join("")}</div><p class="jv-hint">One click loads the template into your Co-Work Canvas, fully editable.</p>`);
    ov.classList.remove("hidden");
    $$("button.jv-tpl-card", ov).forEach(b => b.onclick = () => {
      const name = Object.keys(TPL)[+b.dataset.i];
      setEditorCode(TPL[name](), true); alsoRegisterWorkspace(name + ".html", TPL[name]());
      JVM.toast("🎨 " + name + " loaded"); JVM.bus("canvasUsed"); ov.classList.add("hidden");
    });
  }
  function alsoRegisterWorkspace(name, code) { JVM.workspace.write({[name]:code}); }

  /* ═══════════════ 2 · ZIP EXPORT (pure local) ═══════════════ */
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); }
    return ~c >>> 0;
  }
  function zipExport() {
    const files = JVM.workspace.read();
    const names = Object.keys(files);
    if (!names.length) return JVM.toast("Workspace empty — nothing to zip");
    const chunks = [], central = [];
    let offset = 0;
    const enc = new TextEncoder();
    names.forEach((name, i) => {
      if (!i) JVM.toast("⏳ zipping " + names.length + " files…");
      const data = enc.encode(files[name]);
      const nm = enc.encode(name);
      const crc = crc32(data);
      const local = new Uint8Array(30 + nm.length);
      const dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0, true);
      dv.setUint16(8, 0, true); dv.setUint16(10, 0, true); dv.setUint16(12, 0, true);
      dv.setUint32(14, crc, true); dv.setUint32(18, data.length, true); dv.setUint32(22, data.length, true);
      dv.setUint16(26, nm.length, true); dv.setUint16(28, 0, true);
      local.set(nm, 30);
      central.push({ nm, crc, size: data.length, offset });
      chunks.push(local); chunks.push(data);
      offset += local.length + data.length;
    });
    let cdStart = offset, cdLen = 0;
    central.forEach(c => {
      const rec = new Uint8Array(46 + c.nm.length);
      const dv = new DataView(rec.buffer);
      dv.setUint32(0, 0x02014b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 20, true);
      dv.setUint32(16, c.crc, true); dv.setUint32(20, c.size, true); dv.setUint32(24, c.size, true);
      dv.setUint16(28, c.nm.length, true); dv.setUint32(42, c.offset, true);
      rec.set(c.nm, 46);
      chunks.push(rec); cdLen += rec.length;
    });
    const end = new Uint8Array(22);
    const dv2 = new DataView(end.buffer);
    dv2.setUint32(0, 0x06054b50, true); dv2.setUint16(8, central.length, true); dv2.setUint16(10, central.length, true);
    dv2.setUint32(12, cdLen, true); dv2.setUint32(16, cdStart, true);
    chunks.push(end);
    const blob = new Blob(chunks, { type: "application/zip" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "jarvik-workspace.zip"; a.click();
    JVM.toast("📦 " + names.length + " files zipped"); JVM.bus("zipExported");
  }

  /* ═══════════════ 3 · MULTI-TAB CO-EDIT (BroadcastChannel) ═══════════════ */
  let bc = null;
  function coedit() {
    if (!("BroadcastChannel" in window)) return JVM.toast("Multi-tab co-edit needs BroadcastChannel (any modern browser)");
    if (bc) { bc.close(); bc = null; setCfg({ coedit: false }); return JVM.toast("Co-edit OFF"); }
    bc = new BroadcastChannel("jv-canvas");
    setCfg({ coedit: true });
    const ed = editor();
    bc.onmessage = e => {
      const d = e.data || {};
      if (!d.text || d.from === TAB) return;
      const ed = editor();
      if (!ed) return;
      if (document.activeElement !== ed) { ed.value = d.text; }
    };
    if (ed && !ed.dataset.jvBC) {
      ed.dataset.jvBC = "1";
      ed.addEventListener("input", () => bc && bc.postMessage({ from: TAB, text: ed.value }));
    }
    JVM.toast("🫂 Co-edit ON — open JARVIK in a second tab; the canvas mirrors edits");
    const h = document.querySelector(".art-header"); if (h && !$("jv-coedit-tag")) { const t = document.createElement("span"); t.id = "jv-coedit-tag"; t.className = "jv-coedit-tag"; t.textContent = "🫂 coedit"; h.appendChild(t); }
  }
  const TAB = uid();

  /* ═══════════════ 4 · VISUAL ELEMENT PICKER ═══════════════ */
  function visualPicker() {
    const frame = $("art-frame");
    if (!frame || !frame.contentDocument) { JVM.toast("Open the canvas Preview first"); return; }
    const doc = frame.contentDocument;
    if (armOn) return disarm();
    armOn = true;
    const style = doc.createElement("style");
    style.textContent = "*:hover{outline:2px solid #35d6e8 !important;outline-offset:1px}";
    doc.head.appendChild(style);
    const handler = e => {
      e.preventDefault(); e.stopPropagation();
      disarm();
      const el = e.target;
      const html = chop(el.outerHTML, 2200);
      const goalHolder = JVM.prompt("What should change on that element?", "e.g. make it sticky, change color, add animation…");
      goalHolder.then(goal => {
        if (!goal) return;
        JVM.toast("🎨 agent is restyling…");
        ask(`Here is an HTML element from my page:\n${html}\nRequested change: ${goal}\n\nReply with the UPDATED full element HTML only (style changes inline). No markdown fences.`, { maxTokens: 700 })
          .then(out => {
            const m = out.match(/<[^>][\s\S]*>/);
            const code = m ? m[0].replace(/<html[\s\S]*>|<\/html>/gi, "") : out;
            const ed = editor();
            if (!ed) return;
            /* naive replace: swap first identical opening occurrence via placeholder algorithm on full text */
            const full = ed.value;
            const patched = full.includes(html.slice(0, 40)) ? full.replace(html, code) : full + "\n<!-- agent patch -->\n" + code;
            setEditorCode(patched, true);
            JVM.toast("✅ applied — review in preview");
          }).catch(e2 => JVM.toast(e2.message));
      });
    };
    function attach() { try { doc.addEventListener("click", handler, true); } catch (e) {} }
    function disarm() { try { doc.removeEventListener("click", handler, true); style.remove(); } catch (e) {} armOn = false; JVM.toast("🎯 picker off"); }
    attach();
    JVM.toast("🎯 Click any element inside the preview to change it");
    setTimeout(disarm, 30000);
  }
  let armOn = false;

  /* ═══════════════ 5 · ERROR AUTO-FIX LOOP ═══════════════ */
  let lastFixBtn = null;
  setInterval(() => {
    const pane = $("art-console-logs"); if (!pane) return;
    let errs = $$(".log-error", pane).length;
    if (!errs || lastFixBtn && lastFixBtn.dataset.n == String(errs)) return;
    if (lastFixBtn) lastFixBtn.remove();
    const btn = document.createElement("button");
    btn.id = "jv-autofix"; btn.className = "jv-autofix"; btn.dataset.n = errs;
    btn.textContent = "🛠 Fix " + errs + " console error" + (errs > 1 ? "s" : "") + " with AI";
    pane.parentElement && pane.parentElement.appendChild(btn);
    lastFixBtn = btn;
    btn.onclick = async () => {
      const msgs = $$(".log-error", pane).map(e => e.textContent).join("\n").slice(0, 3000);
      const code = editor() ? editor().value : "";
      if (!code) return;
      JVM.toast("🛠 Forge is patching…");
      try {
        const reply = await ask(`Errors from my browser console:\n${msgs}\n\nMy code:\n${chop(code, 7000)}\n\nFix the root causes. Reply with the COMPLETE corrected code only, no fences.`, { maxTokens: 1600 });
        const clean = reply.replace(/```[a-zA-Z]*|```/g, "").trim();
        setEditorCode(clean, true);
        JVM.toast("✅ Patched — check the console");
      } catch (e) { JVM.toast(e.message); }
    };
  }, 2500);

  /* ═══════════════ 6 · MEETING MODE ═══════════════ */
  let mtg = null;
  function meetingMode() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return JVM.toast("SpeechRecognition unsupported in this browser");
    if (mtg) { stopMeeting(); return; }
    const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = localStorage.getItem("jx_lang") || "en-US";
    const panel = document.createElement("div"); panel.id = "jv-mtg";
    panel.innerHTML = `<div class="jv-mtg-head"><b>🎙 Meeting mode</b><i id="jv-mtg-st">listening…</i><button id="jv-mtg-stop">⏹ End & summarize</button></div><div id="jv-mtg-tx" class="jv-mtg-tx"></div>`;
    document.body.appendChild(panel);
    $("jv-mtg-stop").onclick = stopMeeting;
    let finalTxt = "";
    rec.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) finalTxt += e.results[i][0].transcript + " "; else interim += e.results[i][0].transcript; }
      $("jv-mtg-tx").textContent = chop(finalTxt + " " + interim, 4000);
    };
    rec.onerror = e => { if (e.error !== "aborted") $("jv-mtg-st").textContent = "mic error: " + e.error; };
    rec.onend = () => { if (mtg) { try { rec.start(); } catch (e) {} } };
    try { rec.start(); mtg = { rec, finalTxt: () => finalTxt }; JVM.toast("🎙 Meeting mode ON — talk away"); JVM.bus("voiceUsed"); }
    catch (e) { panel.remove(); JVM.toast(e.message); }
    function stopMeeting() {
      if (!mtg) return;
      try { mtg.rec.abort(); } catch (e) {}
      const txt = mtg.finalTxt();
      mtg = null; panel.remove();
      if (!txt.trim()) return JVM.toast("Nothing captured");
      JVM.toast("🧠 Writing minutes…");
      ask(`Raw meeting transcript:\n${chop(txt, 11000)}\n\nWrite minutes: TL;DR, decisions, action items (owner + deadline if said, else 'unassigned'). Under 180 words.`, { maxTokens: 400 })
        .then(min => sendVia("Meeting minutes:\n" + min));
    }
  }

  /* ═══════════════ 7 · PODCAST MODE (two-voice read) ═══════════════ */
  let pod = null;
  function podcastMode() {
    if (pod) { speechSynthesis.cancel(); pod.remove(); pod = null; return; }
    const rows = $$(".mr.bot", $("chat-container"));
    const last = rows[rows.length - 1];
    const text = last ? last.innerText : "";
    if (!text.trim()) return JVM.toast("No reply to podcast yet");
    JVM.toast("🎧 scripting the episode…");
    ask(`Rewrite this as a fun two-host podcast dialogue (HOST A and HOST B alternate, casual, short lines, keep facts accurate). Content:\n${chop(text, 7000)}\n\nFormat lines as "A: ..." or "B: ...". Max 24 lines.`, { maxTokens: 700 })
      .then(script => {
        const lines = script.split("\n").filter(l => /^[AB]:/.test(l.trim())).slice(0, 24);
        if (!lines.length) return JVM.toast("Script failed — try again");
        const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
        const vA = vs.find(v => /male|david|daniel|guy|fred/i.test(v.name)) || vs[0];
        const vB = vs.find(v => v !== vA && /female|samantha|victoria|zira|joanna/i.test(v.name)) || vs[1] || vs[0];
        const rate = parseFloat(localStorage.getItem("jarvik_tts_rate")) || 1;
        let i = 0;
        const panel = document.createElement("div"); panel.id = "jv-pod";
        panel.innerHTML = `<div class="jv-pod-head">🎧 Podcast mode <button id="jv-pod-x">⏹</button></div><div id="jv-pod-l" class="jv-pod-l"></div>`;
        document.body.appendChild(panel);
        pod = panel;
        $("jv-pod-x").onclick = () => podcastMode();
        const speakNext = () => {
          if (!pod) return;
          if (i >= lines.length) { JVM.toast("🎧 thanks for listening"); pod.remove(); pod = null; return; }
          const isA = lines[i].startsWith("A");
          $("jv-pod-l").textContent = "🎙 HOST " + lines[i][0] + " speaking…";
          const u = new SpeechSynthesisUtterance(lines[i].slice(2).trim());
          if (isA && vA) u.voice = vA; if (!isA && vB) u.voice = vB;
          u.rate = rate; u.onend = () => { i++; setTimeout(speakNext, 250); };
          u.onerror = () => { i++; speakNext(); };
          speechSynthesis.speak(u);
        };
        speakNext();
      }).catch(e => JVM.toast(e.message));
  }

  /* ═══════════════ 8 · DEMO RECORDER ═══════════════ */
  async function demoRecorder() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
      const chunks = [];
      const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: "video/webm" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "jarvik-demo.webm"; a.click();
        JVM.toast("🎬 demo saved (.webm)");
      };
      mr.start();
      const banner = document.createElement("div"); banner.id = "jv-rec";
      banner.innerHTML = `<span class="jv-rec-dot"></span> RECORDING your screen <button id="jv-rec-x">⏹ Stop</button>`;
      document.body.appendChild(banner);
      $("jv-rec-x").onclick = () => mr.stop();
      stream.getVideoTracks()[0].onended = () => mr.stop();
    } catch (e) { JVM.toast("Recording cancelled"); }
  }

  /* ═══════════════ 9 · CUSTOM WAKE WORDS ═══════════════ */
  function wakeWordConfig() {
    const cur = localStorage.getItem("jx_wake_word") || "";
    const ov = JVM.modal("jv-wake", `🗣 Custom Wake Word`, `
      <p class="jv-hint">Set any phrase. Say it anywhere in the room (with Boost's wake engine ON) to summon the Voice HUD.</p>
      <div class="jv-row2"><input id="jv-wake-w" placeholder='e.g. "Jarvis assemble"' value="${esc(cur)}"><button class="jv-btn" id="jv-wake-save">Save</button></div>
      <div class="jv-row2"><em>Current: <b>${esc(cur || "default (hey jarvik)")}</b></em> <button class="jv-btn ghost" id="jv-wake-reset">Restore default</button></div>`);
    ov.classList.remove("hidden");
    $("jv-wake-save").onclick = () => {
      const w = $("jv-wake-w").value.trim().toLowerCase();
      if (!w) return JVM.toast("Type a phrase");
      localStorage.setItem("jx_wake_word", w); JVM.toast("🗣 Listening for “" + w + "”"); ov.classList.add("hidden"); customWakeLoop(true);
    };
    $("jv-wake-reset").onclick = () => { localStorage.removeItem("jx_wake_word"); customWakeLoop(false); JVM.toast("Wake word reset"); };
  }
  let wakeRec = null;
  function customWakeLoop(restart) {
    if (wakeRec) { try { wakeRec.abort(); } catch (e) {} wakeRec = null; if (!restart) return; }
    const w = localStorage.getItem("jx_wake_word");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!w || !SR || localStorage.getItem("jx_wake") !== "1") return;
    wakeRec = new SR(); wakeRec.continuous = true;
    wakeRec.onresult = e => {
      const t = [...e.results].slice(e.resultIndex).map(r => r[0].transcript).join(" ").toLowerCase();
      if (t.includes(w)) {
        try { wakeRec.abort(); } catch (err) {}
        const hud = $$("button.tibtn").find(b => (b.title || "").includes("Hands-free"));
        if (hud) hud.click(); else JVM.toast("Voice HUD button not found");
        setTimeout(customWakeLoop, 2000);
      }
    };
    wakeRec.onerror = () => setTimeout(customWakeLoop, 4000);
    wakeRec.onend = () => setTimeout(customWakeLoop, 800);
    try { wakeRec.start(); } catch (e) {}
  }

  /* ═══════════════ 10 · LANDING PAGE GENERATOR ═══════════════ */
  function landingGen() {
    const ov = JVM.modal("jv-land", `🚀 Landing Page Forge`, `
      <div class="jv-field"><label>Product</label><input id="jv-lg-p" placeholder="e.g. habit tracker for college students"></div>
      <div class="jv-field"><label>Vibe</label><select id="jv-lg-v" class="jv-sel"><option>Neon tech</option><option>Clean minimal</option><option>Retro arcade</option><option>Luxury dark</option><option>Playful pastel</option></select></div>
      <button class="jv-btn" id="jv-lg-go">⚡ Forge the page</button>
      <p class="jv-hint">Builds a complete responsive page straight into your Canvas.</p>`);
    ov.classList.remove("hidden");
    $("jv-lg-go").onclick = async () => {
      const p = $("jv-lg-p").value.trim(); if (!p) return JVM.toast("Describe your product");
      const v = $("jv-lg-v").value;
      JVM.toast("🚀 forging…");
      try {
        const html = await ask(`Design a single-file responsive landing page for: ${p}. Vibe: ${v}. Must include: hero, 3 feature cards, pricing hint, footer. Complete HTML with inline CSS, polish, dark theme unless vibe says otherwise. Reply with ONLY the HTML starting <!DOCTYPE html>.`, { maxTokens: 2400, temp: .8 });
        const clean = html.replace(/```[a-zA-Z]*|```/g, "").replace(/^[^<]*/, "").trim();
        const name = "landing-" + p.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) + ".html";
        setEditorCode(clean, true); alsoRegisterWorkspace(name, clean);
        JVM.bus("canvasUsed"); JVM.toast("🚀 " + name + " is live in canvas");
      } catch (e) { JVM.toast(e.message); }
    };
  }

  /* ═══════════════ 11 · BLOG / TWEET WRITER ═══════════════ */
  function writes() {
    const ov = JVM.modal("jv-write", `✍️ Content Forge`, `
      <div class="jv-field"><label>Topic or draft</label><textarea id="jv-wr-in" rows="3" placeholder="What should the content be about?"></textarea></div>
      <div class="jv-row2">
        <button class="jv-btn ghost" data-act="thread">🧵 X thread (8)</button>
        <button class="jv-btn ghost" data-act="li">💼 LinkedIn post</button>
        <button class="jv-btn ghost" data-act="blog">📝 Blog intro + outline</button>
        <button class="jv-btn ghost" data-act="sort">💬 Sort of a launch note</button>
      </div>
      <div id="jv-wr-out" class="jv-ag-body"></div>`);
    ov.classList.remove("hidden");
    $$("button[data-act]", ov).forEach(b => b.onclick = async () => {
      const t = $("jv-wr-in").value.trim(); if (!t) return JVM.toast("Topic first");
      const asks = {
        thread: "Write an 8-tweet thread. Number tweets. Hook in tweet 1, value in 2-7, CTA in 8.",
        li: "Write a LinkedIn post: hook line, whitespace between ideas, one takeaway, 3 hashtags at the end.",
        blog: "Write a blog intro (2 paragraphs) + H2 outline with 1-line descriptions per section.",
        sort: "Write a 120-word launch announcement: what it is, who it's for, why it matters, one CTA."
      };
      b.textContent = "⏳"; b.disabled = true;
      try {
        const out = await ask(`Content request: ${asks[b.dataset.act]}\n\nTopic/draft: ${chop(t, 4000)}`, { system: "You are Quill, a senior content copywriter. Punchy, no corporate filler.", maxTokens: 800 });
        $("jv-wr-out").innerHTML = `<div class="jv-de-outbox">${esc(out).replace(/\n/g, "<br>")}</div><div class="jv-row2"><button class="jv-btn ghost" id="jv-wr-copy">📋 Copy</button></div>`;
        $("jv-wr-copy").onclick = () => { copyText(out, "Copied"); };
      } catch (e) { JVM.toast(e.message); }
      b.disabled = false; b.textContent = b.dataset.act[0].toUpperCase() + b.dataset.act.slice(1);
    });
  }

  /* ═══════════════ 12 · AUDIENCE REWRITER CHIPS ═══════════════ */
  function audienceChips() {
    const rows = $$(".mr.bot", $("chat-container"));
    if (!rows.length) return;
    const last = rows[rows.length - 1];
    const bar = last.querySelector(".msg-actions");
    if (!bar || bar.dataset.jvAud === "1" || (last.innerText || "").length < 80) return;
    bar.dataset.jvAud = "1";
    [["🧒 ELI5", "like I'm 12 with a fun analogy"], ["🧑‍💻 Expert", "for a senior expert — dense, no basics"], ["💼 Recruiter", "for a recruiting manager — signal, impact, outcomes"], ["🎓 Study", "as crisp exam-revision notes"]].forEach(([label, style]) => {
      if (bar.querySelector(`.jv-aud[data-style="${style}"]`)) return;
      const b = document.createElement("button");
      b.className = "msg-act-btn jv-chip jv-aud"; b.dataset.style = style; b.textContent = label;
      b.onclick = () => sendVia(`Rewrite this answer ${style}. Same information, new voice. No preamble.\n\n${last.querySelector(".stream-content")?.innerText || ""}`);
      bar.appendChild(b);
    });
  }
  setInterval(audienceChips, 1800);

  /* ═══════════════ 13 · CHAT → SLIDES ═══════════════ */
  function slides() {
    const rows = $$(".mr.bot", $("chat-container"));
    const last = rows[rows.length - 1];
    const text = last ? last.innerText : "";
    if (!text.trim()) return JVM.toast("No reply to slideify");
    JVM.toast("📊 deck building…");
    const sections = text.split(/\n(?=[A-Z0-9][^\n]{2,60})/).filter(s => s.trim()).slice(0, 10);
    const slidesHtml = sections.map((s, i) => {
      const [title, ...rest] = s.trim().split("\n");
      return `<section class="sl"><h2>${esc(chop(title, 80))}</h2><ul>${rest.slice(0, 6).map(r => `<li>${esc(chop(r, 130))}</li>`).join("")}</ul><footer>${i + 1} / ${sections.length} · built by JARVIK</footer></section>`;
    }).join("");
    const deck = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:'DM Sans',sans-serif;background:#0b1017;color:#e8f6ff;margin:0}.sl{min-height:100vh;display:grid;place-content:center;padding:60px;border-bottom:1px solid #1c2a38}h2{color:#35d6e8;font-size:34px}li{margin:10px 0;color:#b7cdd9}footer{margin-top:30px;color:#5a7382;font-size:12px}</style></head><body><h1 style="padding:40px;text-align:center">⚡ Presentation</h1>${slidesHtml}<script>let i=0;const sl=[...document.querySelectorAll('.sl')];addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key===' '){sl[Math.min(++i,sl.length-1)].scrollIntoView();}if(e.key==='ArrowUp'){sl[Math.max(--i,0)].scrollIntoView();}});</script></body></html>`;
    setEditorCode(deck, true); alsoRegisterWorkspace("presentation.html", deck);
    JVM.bus("canvasUsed"); JVM.toast("📊 presentation.html in canvas — ↑↓ arrows navigate");
  }

  /* ═══════════════ 14 · DAILY QUESTS ═══════════════ */
  const QPOOL = [
    { id: "prompt", label: "Send 3 prompts today", xp: 20, evs: 3, match: () => null },
    { id: "agent", label: "Deploy an agent", xp: 30, evs: 1, match: e => e === "agentDone" },
    { id: "canvas", label: "Use the Co-Work Canvas", xp: 20, evs: 1, match: e => e === "canvasUsed" },
    { id: "hook", label: "Build a pipeline", xp: 30, evs: 1, match: e => e === "pipeBuilt" },
    { id: "remember", label: "Save a memory", xp: 15, evs: 1, match: e => e === "memAdded" },
    { id: "voice", label: "Try a voice feature", xp: 15, evs: 1, match: e => e === "voiceUsed" }
  ];
  let questCounters = {};
  function todayQuests() {
    const d = new Date().toDateString();
    let q = sget("jv_quests", {});
    if (q.day !== d || !Array.isArray(q.items)) {
      const picks = QPOOL.slice().sort(() => Math.random() - .5).slice(0, 3);
      q = { day: d, items: picks.map(p => ({ id: p.id, label: p.label, xp: p.xp, need: p.evs, have: 0, done: false })) };
      sset("jv_quests", q);
      questCounters = {};
    }
    return q;
  }
  function questProgress(ev) {
    const q = todayQuests();
    q.items.forEach(it => {
      if (it.done) return;
      const pool = QPOOL.find(p => p.id === it.id);
      const ev0 = "prompt";
      if (it.id === "prompt" && ev === "promptSent") { it.have++; }
      if (pool && pool.match && pool.match(ev)) it.have++;
      if (it.have >= it.need) {
        it.done = true;
        const st = JSON.parse(localStorage.getItem("jx_stats") || '{"xp":0,"streak":0}');
        st.xp += it.xp; localStorage.setItem("jx_stats", JSON.stringify(st));
        JVM.toast("🏆 Quest complete: " + it.label + " (+" + it.xp + " XP)");
      }
    });
    sset("jv_quests", q);
  }
  JVM.on("busOn", () => JVM.bus("noop"));
  function questsPanel() {
    const q = todayQuests();
    const done = q.items.filter(i => i.done).length;
    const st = JSON.parse(localStorage.getItem("jx_stats") || '{"xp":0,"streak":0}');
    JVM.modal("jv-quests", `🎯 Daily Quests`, `
      <div class="jv-q-stats"><span>⚡ ${st.xp || 0} XP</span><span>🔥 ${st.streak || 0}-day streak</span><span>${done}/${q.items.length} today</span></div>
      ${q.items.map(i => `<div class="jv-q-item ${i.done ? "done" : ""}"><span>${i.done ? "✅" : "○"}</span><div><b>${esc(i.label)}</b><i>${Math.min(i.have, i.need)}/${i.need} · +${i.xp} XP</i></div></div>`).join("")}
      <p class="jv-hint">New quests each day. XP feeds the XP ring on your sidebar avatar.</p>`).classList.remove("hidden");
  }

  /* ═══════════════ 15 · DUEL ARENA (vote first) ═══════════════ */
  async function duelArena() {
    const ov = JVM.modal("jv-duel", `⚔️ Duel Arena`, `
      <div class="jv-field"><label>Debate topic</label><input id="jv-duel-t" placeholder="e.g. tabs > spaces"></div>
      <button class="jv-btn" id="jv-duel-go">🥊 Start duel</button>
      <div id="jv-duel-out"></div>`);
    ov.classList.remove("hidden");
    $("jv-duel-go").onclick = () => {
      const topic = $("jv-duel-t").value.trim(); if (!topic) return;
      const out = $("jv-duel-out"); out.innerHTML = "";
      let score = { A: 0, B: 0 };
      const run = async round => {
        const a = await ask(`Topic: "${topic}". Argue FOR in ${round <= 1 ? "your opening" : "rebuttal"} — under 80 words.`, { system: "You are gladiator A.", maxTokens: 200 });
        const b = await ask(`Topic: "${topic}". Argue AGAINST in ${round <= 1 ? "your opening" : "rebuttal"} — under 80 words. Make it land harder than: "${a}"`, { system: "You are gladiator B.", maxTokens: 200 });
        out.insertAdjacentHTML("beforeend", `
          <div class="jv-db-line a"><b>A</b>${esc(a)}</div>
          <div class="jv-db-line b"><b>B</b>${esc(b)}</div>
          <div class="jv-duel-vote">Round ${round} — who won?<button data-w="A">A</button><button data-w="B">B</button> <em id="jv-duel-${round}-res"></em></div>`);
        const vote = out.querySelectorAll(".jv-duel-vote")[out.querySelectorAll(".jv-duel-vote").length - 1];
        $$("button[data-w]", vote).forEach(btn => btn.onclick = async () => {
          score[btn.dataset.w]++;
          vote.querySelectorAll("button[data-w]").forEach(x => x.disabled = true);
          $("jv-duel-" + round + "-res").textContent = "score A:" + score.A + " · B:" + score.B;
          if (round < 3) return run(round + 1);
          const judge = await ask(`Topic: "${topic}"\nOverall crowd verdict so far — A has ${score.A} rounds, B has ${score.B}.\nDeclare the winner and give a 2-line judges' comment.`, { maxTokens: 140 });
          out.insertAdjacentHTML("beforeend", `<div class="jv-db-line judge"><b>⚖ JUDGE</b>${esc(judge)}<br><b>Final: A ${score.A} — ${score.B} B</b></div>`);
          JVM.bus("voiceUsed"); JVM.toast("🥊 Duel complete");
        });
      };
      run(1);
    };
  }

  /* ═══════════════ 16 · WEEKLY WINS REPORT ═══════════════ */
  function weeklyWins() {
    const pulse = sget("jv_pulse", {}); const days = pulse.days || {};
    let replies = 0, words = 0;
    for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); if (days[d]) { replies += days[d].n; words += days[d].w; } }
    const git = sget("jarvik_git", { commits: [] }).commits.filter(c => c.ts > Date.now() - 7 * 864e5);
    const agents = (sget("jv_docs", []) || []).filter(d => /agent|scheduled/i.test(d.name) && d.ts > Date.now() - 7 * 864e5).length;
    const st = JSON.parse(localStorage.getItem("jx_stats") || '{"xp":0}');
    const html = `<div class="jv-win-card"><h2>⚡ Your Week in JARVIK</h2>
      <div class="jv-ctx-grid">
        <div class="jv-pc"><b>${replies}</b><span>replies</span></div>
        <div class="jv-pc"><b>${words}</b><span>words</span></div>
        <div class="jv-pc"><b>${git.length}</b><span>commits</span></div>
        <div class="jv-pc"><b>${agents}</b><span>agent runs</span></div>
      </div>
      <p>XP: <b>${st.xp || 0}</b> · streak: <b>${st.streak || 0}</b> days · level: <b>${1 + Math.floor((st.xp || 0) / 100)}</b></p>
      <p class="jv-hint">${replies > 30 ? "This is main-character energy. 🏆" : "Best time to plant a tree was yesterday — send one more prompt. 🌱"}</p></div>`;
    const ov = JVM.modal("jv-wins", `📸 Weekly Wins`, html + `<div class="jv-row2"><button class="jv-btn" id="jv-wins-png">🖼 Download card</button></div>`);
    ov.classList.remove("hidden");
    $("jv-wins-png").onclick = () => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.onload = () => html2canvas(ov.querySelector(".jv-win-card"), { scale: 2, backgroundColor: "#0b1017" }).then(cv => { const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "jarvik-week.png"; a.click(); JVM.toast("🖼 saved"); });
      document.head.appendChild(s);
    };
  }

  /* ═══════════════ 17 · SKINS ═══════════════ */
  const SKINS = {
    "Reactor Cyan":  { accent: "cyan",    crt: false },
    "Oracle Violet": { accent: "violet",  crt: false },
    "Gold Rush":     { accent: "amber",   crt: false },
    "Bio Emerald":   { accent: "emerald", crt: false },
    "Rose Arcade":   { accent: "rose",    crt: true },
    "Ice Terminal":  { accent: "ice",     crt: true }
  };
  function skins() {
    const curName = localStorage.getItem("jv_skin") || "Reactor Cyan";
    const ov = JVM.modal("jv-skins", `🎨 Theme Skins`, `
      <div class="jv-tpl-grid">${Object.entries(SKINS).map(([n, s]) => `<button class="jv-tpl-card ${n === curName ? "on" : ""}" data-n="${esc(n)}"><span style="background:${({ cyan: "#35d6e8", violet: "#a78bfa", amber: "#fbbf24", emerald: "#34d399", rose: "#fb7185", ice: "#93c5fd" })[s.accent]}"></span>${esc(n)}${s.crt ? " · CRT" : ""}</button>`).join("")}</div>
      <p class="jv-hint">Skins restyle accent + CRT overlay instantly (full re-skin on reload).</p>`);
    ov.classList.remove("hidden");
    $$("button.jv-tpl-card", ov).forEach(b => b.onclick = () => {
      const s = SKINS[b.dataset.n];
      localStorage.setItem("jv_skin", b.dataset.n);
      const boost = sget("jv_boost", {}); boost.accent = s.accent; boost.crt = s.crt; sset("jv_boost", boost);
      const map = { cyan: "#35d6e8", violet: "#a78bfa", amber: "#fbbf24", emerald: "#34d399", rose: "#fb7185", ice: "#93c5fd" };
      document.documentElement.style.setProperty("--jv-a1", map[s.accent]);
      document.body.classList.toggle("jv-crt", !!s.crt);
      $$("button.jv-tpl-card", ov).forEach(x => x.classList.toggle("on", x === b));
      JVM.toast("🎨 Skin → " + b.dataset.n);
    });
  }

  /* ═══════════════ 18 · PROFESSION PACKS ═══════════════ */
  const PROPACKS = {
    "Founder": { mem: ["I pitch weekly and need brutal traction focus", "Launches go Fridays only", "Hero metric: active users/week"], pipe: "shipit", starter: "Roast my go-to-market plan like a YC partner" },
    "Student": { mem: ["I study for exams in 2-week blocks", "I prefer analogies over formulas first"], pipe: "deepdive", starter: "Make flashcards from my last doc" },
    "Designer": { mem: ["I work in Figma; paste HTML when I need JS", "I care about type + spacing rules"], pipe: "content", starter: "Polish this UI copy for a pricing page" },
    "Product Manager": { mem: ["I write one-pagers before anything else", "I ship behind flags"], pipe: "harden", starter: "Draft the sprint roadmap for Q4" }
  };
  function proPacks() {
    const ov = JVM.modal("jv-props", `💼 Profession Packs`, `
      <p class="jv-hint">One click installs memories + a pipeline + a starter prompt tuned to how you work.</p>
      <div class="jv-tpl-grid">${Object.keys(PROPACKS).map(k => `<button class="jv-tpl-card" data-k="${esc(k)}"><span></span>${esc(k)}</button>`).join("")}</div>`);
    ov.classList.remove("hidden");
    $$("button.jv-tpl-card", ov).forEach(b => b.onclick = () => {
      const p = PROPACKS[b.dataset.k];
      const mem2 = sget("jv_mem2", []);
      p.mem.forEach(m => mem2.push({ id: uid(), text: m, tags: ["profession"], ts: Date.now() }));
      sset("jv_mem2", mem2.slice(-60));
      sset("jv_pipes", sget("jv_pipes", []).concat({ id: uid(), name: "💼 " + b.dataset.k + " workflow", bots: { shipit: ["planner", "architect", "coder", "release"], deepdive: ["researcher", "analyst", "critic"], content: ["researcher", "copywriter", "growth"], harden: ["security", "tester", "refactor", "release"] }[p.pipe] }));
      alsoRegisterWorkspace("README-" + b.dataset.k.toLowerCase() + ".md", `# ${b.dataset.k} starter\\n\\n${p.mem.map(m => "- " + m).join("\\n")}\\n`);
      JVM.toast("💼 " + b.dataset.k + " pack installed"); JVM.bus("pipeBuilt"); ov.classList.add("hidden");
      sendVia(p.starter);
    });
  }

  /* ═══════════════ PRO HUB ═══════════════ */
  function proHub() {
    const cfg0 = cfg();
    const ov = JVM.modal("jv-prohub", `🧩 Pro Studio Hub`, `
      <div class="jv-hub-group"><b>🤖 Agents</b>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="agents">⚡ Agent Studio v2</button><button class="jv-btn ghost jv-mini-act" data-go="pipes">⛓ Pipelines</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="sched">⏰ Scheduler</button><button class="jv-btn ghost jv-mini-act" data-go="queue">📥 Task Queue</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="web">🌐 Web Agent</button><button class="jv-btn ghost jv-mini-act" data-go="duel">🥊 Duel Arena</button></div>
      </div>
      <div class="jv-hub-group"><b>🧠 Intelligence</b>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="mem">🧠 Memory Graph</button><button class="jv-btn ghost jv-mini-act" data-go="recall">🔎 Smart Recall</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="gsearch">🌐 Global Search</button><button class="jv-btn ghost jv-mini-act" data-go="branch">🌿 Summary Branches</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="cqa">🧭 Codebase Q&A</button><button class="jv-btn ghost jv-mini-act" data-go="drev">🧿 Code Review</button></div>
      </div>
      <div class="jv-hub-group"><b>🎨 Canvas</b>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="tpl">🎨 Templates</button><button class="jv-btn ghost jv-mini-act" data-go="zip">📦 ZIP export</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="coedit">🫂 Multi-tab co-edit</button><button class="jv-btn ghost jv-mini-act" data-go="pick">🎯 Element picker</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="slides">📊 Chat→Slides</button><button class="jv-btn ghost jv-mini-act" data-go="land">🚀 Landing forge</button></div>
      </div>
      <div class="jv-hub-group"><b>🎙 Voice & Media</b>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="meeting">🎙 Meeting mode</button><button class="jv-btn ghost jv-mini-act" data-go="pod">🎧 Podcast mode</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="rec">🎬 Demo recorder</button><button class="jv-btn ghost jv-mini-act" data-go="wake">🗣 Wake word</button></div>
      </div>
      <div class="jv-hub-group"><b>📊 Data & Writing</b>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="csv">📊 CSV Insights</button><button class="jv-btn ghost jv-mini-act" data-go="sql">🗃 SQL Sandbox</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="pdf">📑 PDF→Data</button><button class="jv-btn ghost jv-mini-act" data-go="doc">📝 Doc editor</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="flash">🃏 Flashcards</button><button class="jv-btn ghost jv-mini-act" data-go="write">✍️ Content forge</button></div>
      </div>
      <div class="jv-hub-group"><b>💪 Business & Engagement</b>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="quests">🎯 Quests</button><button class="jv-btn ghost jv-mini-act" data-go="wins">📸 Weekly wins</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="skins">🎨 Skins</button><button class="jv-btn ghost jv-mini-act" data-go="props">💼 Profession packs</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="git">🌿 Git-Lite</button><button class="jv-btn ghost jv-mini-act" data-go="cost">💰 Cost dashboard</button></div>
        <div class="jv-row2"><button class="jv-btn ghost jv-mini-act" data-go="lic">💼 JARVIK Pro</button><button class="jv-btn ghost jv-mini-act" data-go="packs">📦 Packs & share-codes</button></div>
      </div>
      <div class="jv-hub-group"><b>⚙ Under the hood</b>
        <label class="jv-srow"><span>BM25 Smart Recall (injects best knowledge chunks per prompt)</span><span class="jv-sw"><input type="checkbox" id="jv-hub-recall" ${cfg0.recall !== false ? "checked" : ""}><i></i></span></label>
        <label class="jv-srow"><span>Memory Graph injection</span><span class="jv-sw"><input type="checkbox" id="jv-hub-memg" ${cfg0.memgraph !== false ? "checked" : ""}><i></i></span></label>
      </div>`);
    ov.classList.remove("hidden");
    $$("button.jv-mini-act", ov).forEach(b => b.onclick = () => { ov.classList.add("hidden"); GO[b.dataset.go](); });
    $("jv-hub-recall").onchange = e => setCfg({ recall: e.target.checked });
    $("jv-hub-memg").onchange = e => setCfg({ memgraph: e.target.checked });
  }
  const GO = {
    agents: () => JV.agentStudio(""), pipes: () => JV.pipelines(), sched: () => JV.scheduler(), queue: () => JV.taskQueue(),
    web: () => JV.webAgent(), duel: duelArena, mem: () => JV.studio.memoryGraph(), recall: () => JV.studio.recallTester || JVM.toast("use /recall"),
    gsearch: () => JV.studio.globalSearch(), branch: () => JV.studio.summaryBranches(), cqa: () => JV.studio.codebaseQA(), drev: () => JV.studio.diffReview(),
    tpl: templateGallery, zip: zipExport, coedit: coedit, pick: visualPicker, slides: slides, land: landingGen,
    meeting: meetingMode, pod: podcastMode, rec: demoRecorder, wake: wakeWordConfig,
    csv: () => JV.studio.csvInsights(), sql: () => JV.studio.sqlSandbox(), pdf: () => JV.studio.pdfData(), doc: () => JV.studio.docEditor(),
    flash: () => JV.studio.flashcards(), write: writes, quests: questsPanel, wins: weeklyWins, skins: skins, props: proPacks,
    git: () => JV.studio.gitHub(), cost: () => JV.studio.costDashboard(), lic: () => JV.studio.licenseHub(), packs: () => JV.studio.packsHub()
  };
  /* studio didn't expose recallTester — add it here */
  if (!JV.studio.recallTester) JV.studio.recallTester = () => {
    JVM.prompt("Smart Recall test", "Type a query to test retrieval…").then(query => {
      if (!query) return;
      const hits = JV.studio.bm25(query, 5);
      JVM.modal("jv-recall", `🔎 Smart Recall`, hits.length ? hits.map(h => `<div class="jv-recall-hit"><b>${esc(h.c.name)}</b> <em>score ${h.score.toFixed(1)}</em><br>${esc(chop(h.c.body, 400))}</div>`).join("") : `<div class="jv-hint">No matching knowledge chunks.</div>`).classList.remove("hidden");
    });
  };

  /* UI injections */
  function injectSidebar() {
    const host = document.querySelector(".sbt");
    if (!host || $("jv-pro-side")) return;
    const d = document.createElement("details"); d.className = "sb-details"; d.id = "jv-pro-side";
    d.innerHTML = `<summary class="sb-summary">🧩 Pro Studio <span class="pulse-tag">NEW</span></summary>
      <div class="sbn-inner">
        <div class="trow" data-go="hub">🧩 <span>Pro Hub</span><span class="badge-count" style="background:var(--jv-a1,#35d6e8)">36</span></div>
        <div class="trow" data-go="agents">🤖 <span>Agent Studio</span></div>
        <div class="trow" data-go="mem">🧠 <span>Memory Graph</span></div>
        <div class="trow" data-go="gsearch">🌐 <span>Global Search</span></div>
        <div class="trow" data-go="tpl">🎨 <span>Canvas Templates</span></div>
        <div class="trow" data-go="meeting">🎙 <span>Meeting Mode</span></div>
        <div class="trow" data-go="quests">🎯 <span>Daily Quests</span></div>
        <div class="trow" data-go="wins">📸 <span>Weekly Wins</span></div>
        <div class="trow" data-go="lic">💼 <span>JARVIK Pro</span></div>
      </div>`;
    host.appendChild(d);
    $$("div.trow", d).forEach(t => t.onclick = () => { if (t.dataset.go === "hub") proHub(); else GO[t.dataset.go](); });
  }
  function injectTopbar() {
    const tb = document.querySelector(".tb-hero-tools");
    if (!tb || $("jv-pro-top")) return;
    const b = document.createElement("button");
    b.id = "jv-pro-top"; b.className = "jv-pro-topbtn"; b.title = "Pro Studio Hub (36 power-ups)";
    b.innerHTML = `<span>🧩</span><i>Pro</i>`;
    b.onclick = proHub;
    tb.insertBefore(b, tb.firstChild);
  }
  /* topbar quest/tracker tick */
  function inject() {
    injectSidebar(); injectTopbar();
    todayQuests();
  }

  /* stream hook for quests + counters */
  const as0 = JV.afterStream.bind(JV);
  JV.afterStream = info => { as0(info); try { JVM.bus("promptSent"); } catch (e) {} };
  /* canvas usage observer */
  let canvasOnce = false;
  try {
    new MutationObserver(() => { if ($("art-code-editor") && $("art-code-editor").value.length > 10 && !canvasOnce) { canvasOnce = true; JVM.bus("canvasUsed"); } }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  /* quest event bus */
  ["agentDone", "pipeBuilt", "memAdded", "voiceUsed", "canvasUsed", "queued", "gitCommitted", "packImported", "zipExported"].forEach(ev => JVM.on(ev, () => questProgress(ev)));
  JVM.on("promptSent", () => { const q = todayQuests(); const p = q.items.find(i => i.id === "prompt" && !i.done); if (p) { p.have++; if (p.have >= p.need) { p.done = true; const st = JSON.parse(localStorage.getItem("jx_stats") || '{"xp":0,"streak":0}'); st.xp += p.xp; localStorage.setItem("jx_stats", JSON.stringify(st)); JVM.toast("🏆 Quest: " + p.label + " (+" + p.xp + " XP)"); sset("jv_quests", q); } } });
  /* wire quest button daily reset */
  setInterval(todayQuests, 60000);
  customWakeLoop(true);

  /* slash: /pro /quests /duel /templates /zip /meeting /podcast /record /wake /land /write /slides /wins /skins */
  const is0 = JV.interceptSend.bind(JV);
  JV.interceptSend = async raw => {
    const t = (raw || "").trim();
    const map = { pro: "hub", prohub: "hub", quests: "quests", duel: "duel", templates: "tpl", zip: "zip", coedit: "coedit", picker: "pick", meeting: "meeting", podcast: "pod", record: "rec", wake: "wake", landing: "land", blog: "write", write: "write", slides: "slides", wins: "wins", skins: "skins", profpacks: "props" };
    const m = t.match(/^\/(\w+)$/i);
    if (m && map[m[1].toLowerCase()]) { GO[map[m[1].toLowerCase()]](); return true; }
    return is0(raw);
  };

  JV.pro = { proHub, templateGallery, zipExport, coedit, visualPicker, meetingMode, podcastMode, demoRecorder, wakeWordConfig, landingGen, writes, slides: slides, questsPanel: questsPanel, weeklyWins: weeklyWins, skins, proPacks, duelArena };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", inject);
  else inject();
})();
