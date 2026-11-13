/* ═══════════════════════════════════════════════════════════════════
   JARVIK POWER PACK 5 · WAVE 3 (power5c.js)
   On-device models: semantic recall (embeddings), WebGPU acceleration,
   offline speech-to-text (Whisper), persona voice casting.

   Everything here is OPT-IN and lazy. Nothing downloads until you ask for
   it, and the app stays fully usable if a download fails.
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  if (window.__jvPower5c) return;
  window.__jvPower5c = 1;

  const P5 = window.JV5;
  if (!P5) { console.warn("power5c: kernel missing"); return; }
  const { feature, p5modal, p5open, p5close, p5toast, p5send, p5copy, esc, $, $$ } = P5;

  const TFJS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5";
  const EMBED_MODEL = "Xenova/all-MiniLM-L6-v2";
  const STT_MODEL = "onnx-community/whisper-tiny.en";

  const ml = {
    tf: null,            /* the transformers.js module */
    embedder: null,
    transcriber: null,
    device: "wasm",
    embedState: "idle",  /* idle | loading | ready | error */
    sttState: "idle",
    embedError: "",
    sttError: "",
    semanticOn: false
  };

  /* ── lazy loader ─────────────────────────────────────────────── */
  async function loadTransformers() {
    if (ml.tf) return ml.tf;
    let mod = null;
    try {
      mod = await import(/* webpackIgnore: true */ TFJS_URL);
    } catch (e) {
      /* Dynamic import can be blocked on file:// origins — fall back to the
         UMD build, which exposes window.transformers. */
      mod = await loadScriptFallback("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/transformers.min.js");
    }
    if (!mod || !mod.pipeline) throw new Error("transformers.js could not be loaded");
    mod.env.allowLocalModels = false;
    mod.env.useBrowserCache = true;
    ml.tf = mod;
    return mod;
  }
  function loadScriptFallback(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(window.transformers);
      s.onerror = () => reject(new Error("Could not load " + src));
      document.head.appendChild(s);
    });
  }
  function detectDevice() {
    try {
      if (navigator.gpu && window.__p5_preferWebGPU !== false) return "webgpu";
    } catch (e) {}
    return "wasm";
  }
  async function getEmbedder() {
    if (ml.embedder) return ml.embedder;
    if (ml.embedState === "loading") return null;
    ml.embedState = "loading"; ml.embedError = "";
    try {
      const { pipeline } = await loadTransformers();
      ml.device = detectDevice();
      ml.embedder = await pipeline("feature-extraction", EMBED_MODEL, { dtype: "q8", device: ml.device });
      ml.embedState = "ready";
      p5toast("🧠 Embeddings ready on " + ml.device.toUpperCase());
    } catch (e) {
      ml.embedState = "error";
      ml.embedError = String(e && e.message || e);
      p5toast("🧠 Embedding model failed: " + ml.embedError.slice(0, 90));
      try { ml.embedder = await (await loadTransformers()).pipeline("feature-extraction", EMBED_MODEL, { dtype: "q8", device: "wasm" }); ml.embedState = "ready"; }
      catch (e2) { ml.embedState = "error"; ml.embedError = String(e2 && e2.message || e2); }
    }
    paintMlStatus();
    return ml.embedder;
  }
  async function getTranscriber() {
    if (ml.transcriber) return ml.transcriber;
    if (ml.sttState === "loading") return null;
    ml.sttState = "loading"; ml.sttError = "";
    try {
      const { pipeline } = await loadTransformers();
      ml.transcriber = await pipeline("automatic-speech-recognition", STT_MODEL, { dtype: "q8", device: detectDevice() });
      ml.sttState = "ready";
      p5toast("🎙 Offline transcription ready");
    } catch (e) {
      ml.sttState = "error";
      ml.sttError = String(e && e.message || e);
      p5toast("🎙 Whisper failed: " + ml.sttError.slice(0, 90));
    }
    paintMlStatus();
    return ml.transcriber;
  }

  /* ═══════════════════════════════════════════════════════════════
     A · VECTOR STORE (IndexedDB)
     ═══════════════════════════════════════════════════════════════ */
  const DB_NAME = "jarvik_p5_vectors", STORE = "vectors";
  let dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: "id" });
          s.createIndex("src", "src", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
    });
    return dbPromise;
  }
  function idbAll() {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    }));
  }
  function idbPut(records) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const s = tx.objectStore(STORE);
      records.forEach(r => s.put(r));
      tx.oncomplete = () => resolve(records.length);
      tx.onerror = () => reject(tx.error);
    }));
  }
  function idbClear() {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    }));
  }
  function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }
  async function embed(texts) {
    const ex = await getEmbedder();
    if (!ex) return null;
    const out = await ex(texts, { pooling: "mean", normalize: true });
    const t = out.tolist ? out.tolist() : out;
    return Array.isArray(t) ? t.map(v => Float32Array.from(v)) : [Float32Array.from(t)];
  }
  function corpusSources() {
    const out = [];
    try { (JSON.parse(localStorage.getItem("jarvik_knowledge") || "[]") || []).forEach(d => out.push({ id: "kb:" + d.id, src: "knowledge", name: d.name, text: d.content || "" })); } catch (e) {}
    try { (JSON.parse(localStorage.getItem("jv_docs") || "[]") || []).forEach(d => out.push({ id: "doc:" + d.name, src: "doc", name: d.name, text: d.content || "" })); } catch (e) {}
    try { (JSON.parse(localStorage.getItem("jv_memory") || "[]") || []).forEach((m, i) => out.push({ id: "mem:" + i, src: "memory", name: "Memory " + (i + 1), text: m.text || "" })); } catch (e) {}
    try { (JSON.parse(localStorage.getItem("jv_mem2") || "[]") || []).forEach((m, i) => out.push({ id: "graph:" + i, src: "graph", name: "Graph " + (i + 1), text: m.text || "" })); } catch (e) {}
    return out.filter(s => s.text.trim().length > 20);
  }
  function chunkText(text, size) {
    const words = String(text).split(/\s+/);
    const out = [];
    for (let i = 0; i < words.length; i += size) out.push(words.slice(i, i + size).join(" "));
    return out;
  }
  async function indexCorpus(progress) {
    const srcs = corpusSources();
    if (!srcs.length) return { chunks: 0 };
    const records = [];
    for (let s = 0; s < srcs.length; s++) {
      const src = srcs[s];
      const parts = chunkText(src.text, 130);
      for (let p = 0; p < parts.length; p++) {
        const body = parts[p];
        records.push({ id: src.id + "#" + p, src: src.src, name: src.name, body });
      }
      if (progress) progress(s + 1, srcs.length, src.name);
      await new Promise(r => setTimeout(r, 0));
    }
    let done = 0;
    for (let i = 0; i < records.length; i += 16) {
      const batch = records.slice(i, i + 16);
      const vecs = await embed(batch.map(r => r.body));
      if (!vecs) throw new Error("embedding failed");
      batch.forEach((r, j) => { r.vec = vecs[j]; r.ts = Date.now(); });
      await idbPut(batch);
      done += batch.length;
      if (progress) progress(done, records.length, "embedding");
    }
    return { chunks: records.length, sources: srcs.length };
  }
  async function semanticSearch(query, k) {
    const vecs = await idbAll();
    if (!vecs.length) return [];
    const qv = await embed([query]);
    if (!qv) return [];
    const q = qv[0];
    return vecs
      .map(v => ({ v, score: cosine(q, v.vec) }))
      .filter(x => x.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, k || 3);
  }

  /* ═══════════════════════════════════════════════════════════════
     B · SEMANTIC RECALL — the headline feature
     ═══════════════════════════════════════════════════════════════ */
  function semanticRecallUI() {
    const ov = p5open(p5modal("p5-semantic", "🧠 <b>Semantic Recall</b> <span class='p5-muted'>local embeddings</span>", `
      <p class="jv-hint">Keyword search only finds words you typed. Semantic recall finds <em>meaning</em> — a local embedding model runs entirely in this browser, so nothing leaves your machine.</p>
      <div class="p5-ml-status" id="p5-ml-status"></div>
      <div class="jv-row2">
        <button class="jv-btn" id="p5-sem-download">⬇ Download the model (~25 MB, once)</button>
        <button class="jv-btn ghost" id="p5-sem-index">🗂 Index my knowledge</button>
        <button class="jv-btn ghost" id="p5-sem-clear">🗑 Clear index</button>
      </div>
      <div class="jv-field"><label>Test a query</label><input id="p5-sem-q" placeholder="e.g. how do I stop the robot tipping over"></div>
      <button class="jv-btn ghost" id="p5-sem-test">🔍 Test recall</button>
      <div id="p5-sem-out" class="p5-sem-out"></div>
      <label class="jv-srow"><span>Inject semantic recall into every prompt</span><span class="jv-sw"><input type="checkbox" id="p5-sem-on" ${ml.semanticOn ? "checked" : ""}><i></i></span></label>`));
    const out = $("p5-sem-out");
    const status = () => {
      const s = $("p5-ml-status");
      if (!s) return;
      const n = { idle: "not loaded", loading: "loading…", ready: "ready", error: "failed" }[ml.embedState] || ml.embedState;
      s.innerHTML = `<span>Embedding model <b>${esc(n)}</b></span><span>Device <b>${esc(ml.device)}</b></span><span>Error <b>${esc(ml.embedError || "—")}</b></span>`;
    };
    status();
    $("p5-sem-download").onclick = async () => {
      $("p5-sem-download").textContent = "⏳ Loading…";
      await getEmbedder();
      $("p5-sem-download").textContent = "⬇ Download the model (~25 MB, once)";
      status();
    };
    $("p5-sem-index").onclick = async () => {
      out.innerHTML = `<div class="p5-sl-empty">Indexing…</div>`;
      try {
        const r = await indexCorpus((done, total, label) => { out.innerHTML = `<div class="p5-sl-empty">${esc(String(label))} — ${done}/${total}</div>`; });
        out.innerHTML = `<div class="p5-sem-ok">✅ Indexed ${r.chunks} chunks from ${r.sources} sources.</div>`;
      } catch (e) { out.innerHTML = `<div class="p5-dr-err">Indexing failed: ${esc(e.message)}</div>`; }
    };
    $("p5-sem-clear").onclick = async () => { await idbClear().catch(() => {}); out.innerHTML = `<div class="p5-sem-ok">🗑 Index cleared.</div>`; };
    $("p5-sem-test").onclick = async () => {
      const q = $("p5-sem-q").value.trim();
      if (!q) return;
      out.innerHTML = `<div class="p5-sl-empty">Searching…</div>`;
      const hits = await semanticSearch(q, 4);
      out.innerHTML = hits.length ? hits.map((h, i) =>
        `<div class="p5-sem-hit"><b>${i + 1}. ${esc(h.v.name)}</b><i>score ${h.score.toFixed(3)}</i><p>${esc(h.v.body.slice(0, 260))}</p></div>`).join("")
        : `<div class="p5-sl-empty">No matches — index your knowledge first.</div>`;
    };
    $("p5-sem-on").onchange = e => {
      ml.semanticOn = e.target.checked;
      P5.p5set("p5_semantic", ml.semanticOn);
      p5toast(ml.semanticOn ? "🧠 Semantic recall ON" : "🧠 Semantic recall off");
    };
    return ov;
  }
  feature("semantic-recall", {
    label: "Semantic Recall (local AI)", icon: "🧠", group: "local",
    hint: "A local embedding model finds meaning, not just keywords. Runs in your browser — nothing is uploaded.",
    run: semanticRecallUI
  });

  /* Wire semantic recall into the system prompt, on top of studio.js's BM25.
     JV.systemTune is synchronous, so the recall must be resolved BEFORE the
     prompt is assembled. We keep a rolling cache: the previous query's hits
     are injected while the new query is being embedded in the background. */
  let recallCache = [];
  let recallBusy = false;
  let lastQuery = "";
  function installSemanticHook() {
    if (!window.JV || !window.JV.systemTune) return;
    const prev = window.JV.systemTune.bind(window.JV);
    window.JV.systemTune = p => {
      const base = prev(p);
      const q = String(p || "");
      if (ml.semanticOn) {
        if (q !== lastQuery && !recallBusy) {
          lastQuery = q; recallBusy = true;
          semanticSearch(q, 2)
            .then(hits => { recallCache = hits; })
            .catch(() => {})
            .finally(() => { recallBusy = false; });
        }
        if (recallCache.length) {
          const extra = "\n\nSEMANTIC RECALL (meaning-matched from your local knowledge base — cite only if useful):\n" +
            recallCache.map(h => `[${h.v.name}] ${h.v.body.slice(0, 700)}`).join("\n---\n");
          return base + extra;
        }
      }
      return base;
    };
  }

  /* ═══════════════════════════════════════════════════════════════
     C · WEBGPU ACCELERATION
     ═══════════════════════════════════════════════════════════════ */
  async function webgpuInfo() {
    const out = { hasGpu: !!navigator.gpu, adapter: null, error: null };
    if (!navigator.gpu) { out.error = "navigator.gpu unavailable (needs Chrome/Edge 113+ over https or localhost)"; return out; }
    try {
      const a = await navigator.gpu.requestAdapter();
      if (!a) { out.error = "no adapter — the browser exposes WebGPU but found no usable GPU"; return out; }
      out.adapter = (a.info && (a.info.description || a.info.vendor)) || "adapter ready";
      out.features = Array.from(a.features || []).slice(0, 8);
    } catch (e) { out.error = e.message; }
    return out;
  }
  function webgpuPanel() {
    const ov = p5open(p5modal("p5-gpu", "⚡ <b>WebGPU Acceleration</b>", `
      <p class="jv-hint">The on-device models can run on your GPU instead of the CPU. This panel tells you exactly what your browser and machine support.</p>
      <div id="p5-gpu-out" class="p5-sl-empty">Probing…</div>
      <div class="jv-row2"><button class="jv-btn" id="p5-gpu-check">🔍 Probe GPU</button><button class="jv-btn ghost" id="p5-gpu-use">Use GPU for models</button></div>`));
    const paint = async () => {
      const info = await webgpuInfo();
      $("p5-gpu-out").innerHTML = `
        <div class="p5-health-row ${info.hasGpu ? "ok" : "warn"}"><span>${info.hasGpu ? "✅" : "⚠️"}</span><b>WebGPU API</b><i>${info.hasGpu ? "present" : "absent"}</i></div>
        <div class="p5-health-row ${info.adapter ? "ok" : "err"}"><span>${info.adapter ? "✅" : "⛔"}</span><b>Adapter</b><i>${esc(info.adapter || info.error || "none")}</i></div>
        <div class="p5-health-row"><span>ℹ️</span><b>Current model device</b><i>${esc(ml.device)}</i></div>`;
    };
    paint();
    $("p5-gpu-check").onclick = paint;
    $("p5-gpu-use").onclick = () => {
      window.__p5_preferWebGPU = true;
      ml.device = "webgpu";
      ml.embedder = null; ml.transcriber = null;   /* force a reload on the new device */
      p5toast("⚡ Models will load on the GPU next time they start");
      paint();
    };
    return ov;
  }
  feature("webgpu-accel", {
    label: "WebGPU Acceleration", icon: "⚡", group: "local",
    hint: "Run the on-device models on your GPU instead of the CPU, and see what your browser actually supports.",
    run: webgpuPanel
  });

  /* ═══════════════════════════════════════════════════════════════
     D · OFFLINE SPEECH TO TEXT (Whisper, in-browser)
     ═══════════════════════════════════════════════════════════════ */
  function recordPCM(sec) {
    return new Promise(async (resolve, reject) => {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (e) { return reject(new Error("Microphone blocked: " + e.message)); }
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        try {
          const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
          const buf = await blob.arrayBuffer();
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const decoded = await ac.decodeAudioData(buf);
          const target = 16000;
          const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * target), target);
          const src = off.createBufferSource();
          src.buffer = decoded;
          src.connect(off.destination);
          src.start();
          const rendered = await off.startRendering();
          resolve(rendered.getChannelData(0));
        } catch (e) { reject(e); }
      };
      mr.start();
      setTimeout(() => { try { mr.stop(); } catch (e) {} }, sec * 1000);
    });
  }
  function offlineSTT() {
    const ov = p5open(p5modal("p5-stt", "🎙 <b>Offline Speech-to-Text</b> <span class='p5-muted'>Whisper, in your browser</span>", `
      <p class="jv-hint">The browser's speech recognition sends your voice to a vendor service. This runs Whisper locally instead — your audio never leaves the machine, and it works with no connection.</p>
      <div class="p5-ml-status" id="p5-stt-status"></div>
      <div class="jv-row2">
        <button class="jv-btn" id="p5-stt-model">⬇ Load Whisper (~40 MB, once)</button>
        <button class="jv-btn ghost" id="p5-stt-rec">🎙 Record & transcribe</button>
      </div>
      <div class="jv-field"><label>Seconds to record</label><input id="p5-stt-sec" type="number" min="2" max="60" value="8"></div>
      <div id="p5-stt-out" class="p5-sem-out"><div class="p5-sl-empty">Record something, then transcribe it locally.</div></div>`));
    const out = $("p5-stt-out");
    const status = () => {
      const s = $("p5-stt-status");
      if (!s) return;
      const n = { idle: "not loaded", loading: "loading…", ready: "ready", error: "failed" }[ml.sttState] || ml.sttState;
      s.innerHTML = `<span>Whisper <b>${esc(n)}</b></span><span>Device <b>${esc(ml.device)}</b></span><span>Error <b>${esc(ml.sttError || "—")}</b></span>`;
    };
    status();
    $("p5-stt-model").onclick = async () => {
      $("p5-stt-model").textContent = "⏳ Loading…";
      await getTranscriber();
      $("p5-stt-model").textContent = "⬇ Load Whisper (~40 MB, once)";
      status();
    };
    $("p5-stt-rec").onclick = async () => {
      const tr = await getTranscriber();
      if (!tr) { out.innerHTML = `<div class="p5-dr-err">Whisper is not available: ${esc(ml.sttError)}</div>`; return; }
      const sec = Math.max(2, Math.min(60, +$("p5-stt-sec").value || 8));
      out.innerHTML = `<div class="p5-sl-empty">🎙 Recording ${sec}s… speak now.</div>`;
      try {
        const pcm = await recordPCM(sec);
        out.innerHTML = `<div class="p5-sl-empty">🧠 Transcribing locally…</div>`;
        const r = await tr(pcm, { chunk_length_s: 30, language: "en" });
        const text = (r && r.text || "").trim();
        out.innerHTML = text
          ? `<div class="p5-sem-ok">🎙 ${esc(text)}</div><div class="jv-row2"><button class="jv-btn" id="p5-stt-send">💬 Send to chat</button><button class="jv-btn ghost" id="p5-stt-copy">📋 Copy</button></div>`
          : `<div class="p5-sl-empty">Nothing recognised — try again, or speak closer to the mic.</div>`;
        if (text) {
          $("p5-stt-copy").onclick = () => p5copy(text);
          $("p5-stt-send").onclick = () => { p5close(ov); p5send(text); };
        }
      } catch (e) { out.innerHTML = `<div class="p5-dr-err">${esc(e.message)}</div>`; }
    };
    return ov;
  }
  feature("offline-stt", {
    label: "Offline Speech-to-Text", icon: "🎙", group: "local",
    hint: "Whisper running entirely in the browser — private, offline voice input that never reaches a vendor.",
    run: offlineSTT
  });

  /* ═══════════════════════════════════════════════════════════════
     E · PERSONA VOICE CASTING — each persona gets its own voice
     ═══════════════════════════════════════════════════════════════ */
  const CAST = {
    "Default":          { pitch: 1.0,  rate: 1.0,  prefer: /female|samantha|karen|zira|serena/i },
    "Senior Architect": { pitch: 0.9,  rate: 0.95, prefer: /male|david|daniel|guy|ryan/i },
    "Research Scientist": { pitch: 0.95, rate: 0.9,  prefer: /google|microsoft|english/i },
    "Patient Tutor":    { pitch: 1.1,  rate: 0.92, prefer: /samantha|karen|serena|female/i },
    "Startup Mentor":   { pitch: 0.92, rate: 1.08, prefer: /male|fred|alex/i },
    "Sarcastic Butler": { pitch: 0.88, rate: 0.93, prefer: /daniel|george|arthur|male/i },
    "Pirate":           { pitch: 0.95, rate: 1.0,  prefer: /fred|alex|daniel|male/i }
  };
  function castVoice() {
    if (typeof speechSynthesis === "undefined") return p5toast("No speech synthesis in this browser");
    const voices = speechSynthesis.getVoices();
    const persona = (typeof activePersona !== "undefined" ? activePersona : "Default");
    const c = CAST[persona] || CAST.Default;
    const en = voices.filter(v => /^en/i.test(v.lang));
    const v = en.find(x => c.prefer.test(x.name)) || en[0] || voices[0];
    const ov = p5open(p5modal("p5-cast", "🎭 <b>Persona Voice Casting</b>", `
      <p class="jv-hint">Give each persona a distinct voice, pitch and pace. Read the same line in every persona to compare.</p>
      <div class="p5-cast-grid" id="p5-cast-grid"></div>
      <div class="jv-field"><label>Sample line</label><input id="p5-cast-line" value="Good evening. The reactor is stable, and so are you."></div>
      <button class="jv-btn" id="p5-cast-play">🔊 Play with the current persona</button>`));
    const grid = $("p5-cast-grid");
    grid.innerHTML = Object.entries(CAST).map(([name, c2]) =>
      `<div class="p5-cast-row" data-p="${esc(name)}">
        <b>${esc(name)}</b>
        <span>pitch ${c2.pitch} · rate ${c2.rate}</span>
        <button>🔊 Test</button>
      </div>`).join("");
    $$(".p5-cast-row", grid).forEach(el => el.querySelector("button").onclick = () => {
      const name = el.dataset.p;
      const cc = CAST[name];
      const vv = en.find(x => cc.prefer.test(x.name)) || en[0] || voices[0];
      const u = new SpeechSynthesisUtterance($("p5-cast-line").value);
      if (vv) u.voice = vv;
      u.pitch = cc.pitch; u.rate = cc.rate;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    });
    $("p5-cast-play").onclick = () => {
      const u = new SpeechSynthesisUtterance($("p5-cast-line").value);
      if (v) u.voice = v;
      u.pitch = c.pitch; u.rate = c.rate;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    };
    return ov;
  }
  function applyCast() {
    /* Hook auto-voice so persona casting actually applies to replies. */
    try {
      if (typeof speak !== "function") return;
      const prev = window.speak;
      if (prev && prev.__p5cast) return;
      const wrapped = function (text, manual) {
        try {
          if (speechSynthesis && typeof speechSynthesis.speak === "function" && !speechSynthesis.speaking) {
            const persona = (typeof activePersona !== "undefined" ? activePersona : "Default");
            const c = CAST[persona];
            if (c) {
              const voices = speechSynthesis.getVoices();
              const en = voices.filter(v => /^en/i.test(v.lang));
              const v = en.find(x => c.prefer.test(x.name)) || en[0];
              const u = new SpeechSynthesisUtterance(text);
              if (v) u.voice = v;
              u.pitch = c.pitch; u.rate = c.rate;
              speechSynthesis.cancel();
              speechSynthesis.speak(u);
              return;
            }
          }
        } catch (e) {}
        return prev.apply(this, arguments);
      };
      wrapped.__p5cast = 1;
      window.speak = wrapped;
    } catch (e) {}
  }
  feature("persona-casting", {
    label: "Persona Voice Casting", icon: "🎭", group: "local", safe: true,
    hint: "Each persona speaks with its own voice, pitch and pace.",
    run: castVoice
  });

  /* ── status pill for the sidebar ── */
  function paintMlStatus() {
    try {
      const el = $("p5-ml-pill");
      if (!el) return;
      const bits = [];
      if (ml.embedState === "ready") bits.push("🧠");
      if (ml.sttState === "ready") bits.push("🎙");
      el.textContent = bits.join(" ");
      el.title = `embeddings: ${ml.embedState} · whisper: ${ml.sttState} · device: ${ml.device}`;
    } catch (e) {}
  }
  function injectMlPill() {
    if ($("p5-ml-pill")) return;
    const sb = document.getElementById("jv-p5-side");
    if (!sb) return;
    const el = document.createElement("span");
    el.id = "p5-ml-pill";
    el.className = "p5-ml-pill";
    el.textContent = "";
    const hub = sb.querySelector('.trow[data-go="hub"] .badge-count');
    if (hub) hub.after(el);
  }

  function init() {
    try { ml.semanticOn = !!P5.p5get("p5_semantic", false); } catch (e) {}
    try { installSemanticHook(); } catch (e) {}
    try { applyCast(); } catch (e) {}
    try { injectMlPill(); } catch (e) {}
    setTimeout(injectMlPill, 1500);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", () => setTimeout(init, 40));
  else setTimeout(init, 40);

  window.JV5C = { ml, embed, semanticSearch, indexCorpus, idbAll, idbClear, cosine, CAST };
})();
