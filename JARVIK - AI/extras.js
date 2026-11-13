/* ═══════════════════════════════════════════════════════════════
   JARVIK Extras & Holographic Voice Orb HUD
   Extends JARVIK AI with immersive voice interaction & XP stats
═══════════════════════════════════════════════════════════════ */
(() => {
  const $ = id => document.getElementById(id), LS = localStorage;
  const tOf = el => (el.innerText || el.textContent || "");
  const body = document.body;

  /* ── 1. REACTOR GLOW STATES ── */
  const setState = (c, on) => body.classList.toggle(c, on);
  
  // Watch chat container for typing / thinking states
  const obs = new MutationObserver(() => {
    setState("jx-think", !!document.querySelector(".stream-cursor"));
  });
  if ($("chat-container")) obs.observe($("chat-container"), { childList: true, subtree: true });

  /* ── 2. JARVIK VOICE MODE ORB & WAKE WORD ── */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let J = false, state = "off", rec = null, muted = false, ttsQ = 0, savedVe = null;

  const orb = document.createElement("div");
  orb.id = "jx-orbwrap";
  orb.className = "jx-ov";
  orb.style.display = "none";
  orb.innerHTML = `
    <div class="jx-top"><span class="jx-tag">JARVIK VOICE HUD</span></div>
    <div class="jx-stage" id="jx-stage" title="Tap to interrupt">
      <i class="jx-ring r1"></i><i class="jx-ring r2"></i><i class="jx-ring r3"></i>
      <div id="jx-orb">${REACTOR}</div>
    </div>
    <div id="jx-st">Ready</div>
    <div id="jx-tx"></div>
    <div id="jx-err" style="display:none"></div>
    <div class="jx-ctl">
      <button id="jx-mute">Mute mic</button>
      <button id="jx-skip">Skip reply</button>
      <button id="jx-retry" style="display:none">Retry</button>
      <button id="jx-exit" class="end">End HUD</button>
    </div>
    <div class="jx-hint">Tip: tap the Arc Reactor orb to interrupt JARVIK</div>
  `;
  document.body.appendChild(orb);

  const ST = { idle: "", listen: "jx-listen", think: "jx-think", speak: "jx-speak", error: "jx-error", muted: "", off: "" };
  function st(s, label) {
    state = s;
    ["jx-listen", "jx-think", "jx-speak", "jx-error"].forEach(c => body.classList.remove(c));
    if (J && ST[s]) body.classList.add(ST[s]);
    $("jx-st").textContent = label != null ? label : ({
      idle: "Ready",
      listen: "Listening…",
      think: "Thinking…",
      speak: "Speaking…",
      error: "Voice error",
      muted: "Mic muted"
    }[s] || "");
  }

  function fatal(msg) {
    st("error");
    try { rec && rec.abort(); } catch {}
    const e = $("jx-err");
    e.textContent = msg;
    e.style.display = "block";
    $("jx-retry").style.display = "inline-block";
  }
  function clearErr() {
    $("jx-err").style.display = "none";
    $("jx-retry").style.display = "none";
  }

  function listen() {
    if (!J || muted || state !== "idle" || !SR) return;
    let got = false;
    rec = new SR();
    rec.lang = LS.jx_lang || "en-US";
    rec.interimResults = true;
    st("listen");
    $("jx-tx").textContent = "";

    rec.onresult = e => {
      let t = "", fin = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
        if (e.results[i].isFinal) fin = true;
      }
      $("jx-tx").textContent = t;
      if (fin && t.trim() && !got) {
        got = true;
        submit(t.trim());
      }
    };
    rec.onerror = e => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed") fatal("Microphone permission blocked. Please allow mic access in your browser.");
      else if (e.error === "network") fatal("Network connection to speech service failed.");
      else fatal("Voice recognition error: " + e.error);
    };
    rec.onend = () => {
      if (state === "listen" && !got) {
        st("idle");
        setTimeout(listen, 300);
      }
    };
    try { rec.start(); } catch { st("idle"); setTimeout(listen, 600); }
  }

  function submit(t) {
    st("think");
    $("jx-tx").textContent = t;
    const n = cc.querySelectorAll(".mr.bot").length;
    ui.value = t;
    send();

    const iv = setInterval(() => {
      if (!J) return clearInterval(iv);
      if (busy) return;
      clearInterval(iv);
      const bots = cc.querySelectorAll(".mr.bot");
      const last = bots[bots.length - 1];
      if (bots.length > n && last && tOf(last).trim()) {
        talk(tOf(last));
      } else {
        st("idle");
        listen();
      }
    }, 400);
  }

  function talk(raw) {
    const clean = raw
      .replace(/```[\s\S]*?```/g, " code omitted. ")
      .replace(/`[^`]*`/g, "")
      .replace(/https?:\/\/\S+/g, "link")
      .replace(/[#*_~>|]/g, "")
      .replace(/\s+/g, " ")
      .trim().slice(0, 1500);

    const parts = clean.match(/[^.!?\n]+[.!?]*/g) || [clean];
    const chunks = [];
    let c = "";
    parts.forEach(p => {
      if ((c + p).length > 180) { if (c) chunks.push(c); c = p; } else c += p;
    });
    if (c) chunks.push(c);

    const my = ++ttsQ;
    st("speak");
    $("jx-tx").textContent = raw.replace(/\s+/g, " ").slice(0, 260);

    speechSynthesis.cancel();
    const vs = speechSynthesis.getVoices();
    const v = vs.find(x => /^en/i.test(x.lang) && /male|david|daniel|guy|ryan|natural/i.test(x.name)) || vs.find(x => /^en/i.test(x.lang)) || vs[0];
    let i = 0;

    const next = () => {
      if (my !== ttsQ || !J) return;
      if (i >= chunks.length) {
        st("idle");
        setTimeout(listen, 400);
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[i++]);
      if (v) u.voice = v;
      u.pitch = 0.9;
      u.rate = 1.0;
      u.onend = next;
      u.onerror = next;
      speechSynthesis.speak(u);
    };
    next();
  }

  function skip() {
    ttsQ++;
    speechSynthesis.cancel();
    if (state === "speak" || state === "think") {
      st("idle");
      listen();
    }
  }

  function jarvis(on) {
    if (on && !SR) {
      toast("Voice HUD requires Chrome, Edge or Safari");
      return;
    }
    if (on === J) return;
    J = on;
    orb.style.display = on ? "flex" : "none";
    if (on) {
      stopWake();
      savedVe = ve;
      ve = false;
      muted = false;
      $("jx-mute").textContent = "Mute mic";
      clearErr();
      st("idle");
      $("jx-tx").textContent = "Say something or ask a question…";
      listen();
      sfx.play("mode");
    } else {
      try { rec && rec.abort(); } catch {}
      ttsQ++;
      speechSynthesis.cancel();
      if (savedVe !== null) ve = savedVe;
      syncVoice();
      st("off", "");
      startWake();
    }
  }

  $("jx-exit").onclick = () => jarvis(false);
  $("jx-skip").onclick = skip;
  $("jx-stage").onclick = skip;
  $("jx-retry").onclick = () => { clearErr(); st("idle"); listen(); };
  $("jx-mute").onclick = () => {
    muted = !muted;
    $("jx-mute").textContent = muted ? "Unmute mic" : "Mute mic";
    if (muted) {
      try { rec && rec.abort(); } catch {}
      if (state === "listen") st("muted");
    } else if (state === "muted") {
      st("idle"); listen();
    }
  };

  /* ── 3. WAKE WORD ENGINE ("Hey JARVIK") ── */
  let wake = null;
  function stopWake() {
    if (wake) {
      wake.onend = null;
      try { wake.abort(); } catch {}
      wake = null;
    }
  }
  function startWake() {
    stopWake();
    if (!SR || J || LS.jx_wake !== "1") return;
    wake = new SR();
    wake.continuous = true;
    wake.lang = "en-US";
    wake.onresult = e => {
      const t = [...e.results].slice(e.resultIndex).map(r => r[0].transcript).join(" ").toLowerCase();
      if (/hey,? (jarvik|jarvis|jervik|jarvick)/.test(t)) {
        stopWake();
        jarvis(true);
      }
    };
    wake.onerror = e => {
      if (e.error === "not-allowed") {
        LS.jx_wake = "0";
        stopWake();
        toast("Wake word needs mic permission");
      }
    };
    wake.onend = () => {
      if (wake && LS.jx_wake === "1" && !J) {
        setTimeout(() => { try { wake.start(); } catch {} }, 500);
      }
    };
    try { wake.start(); } catch {}
  }
  function wakeWord(on) {
    LS.jx_wake = on ? "1" : "0";
    on ? startWake() : stopWake();
  }

  /* ── 4. XP & STREAK GAMIFICATION ── */
  const stats = () => JSON.parse(LS.jx_stats || '{"xp":0,"streak":0,"day":""}');
  function gainXP() {
    const s = stats(), d = new Date().toDateString();
    if (s.day !== d) {
      s.streak = (s.day === new Date(Date.now() - 864e5).toDateString()) ? s.streak + 1 : 1;
      s.day = d;
    }
    s.xp += 10;
    LS.jx_stats = JSON.stringify(s);
  }
  if (sb) sb.addEventListener("click", gainXP);

  /* Add Voice HUD button in Topbar */
  const hudBtn = document.createElement("button");
  hudBtn.className = "tibtn";
  hudBtn.title = "Launch Hands-free JARVIK Voice HUD";
  hudBtn.innerHTML = `<span style="font-size:15px">🎙️</span>`;
  hudBtn.onclick = () => jarvis(true);
  const vToggle = $("voice-toggle");
  if (vToggle) {
    vToggle.before(hudBtn);
  } else {
    // topbar declutter removed #voice-toggle — anchor to the Theme control instead
    const anchor = $("theme-toggle") || document.querySelector(".tb-util-cluster");
    if (anchor) anchor.before(hudBtn);
  }

  if (LS.jx_wake === "1") wakeWord(true);

  /* ── 5. SERVICE WORKER REGISTRATION ── */
  if ("serviceWorker" in navigator && (location.protocol.startsWith("http") || location.protocol.startsWith("https"))) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();

