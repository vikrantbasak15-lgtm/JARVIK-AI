/* ═══════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════ */
const KEY  = "put_your_API";
const URL2 = "https://openrouter.ai/api/v1/chat/completions";
const MDL  = "google/gemma-2-9b-it";

/* ═══════════════════════════════════════════
   FIREBASE CONFIG
═══════════════════════════════════════════ */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDmkAZvuGaH50SEkQ7IlpS3Mq2Pi7iR9IU",
  authDomain:        "jarviki-ai.firebaseapp.com",
  projectId:         "jarviki-ai",
  storageBucket:     "jarviki-ai.firebasestorage.app",
  messagingSenderId: "493716857713",
  appId:             "1:493716857713:web:7ff680627c721388b38cd0"
};

firebase.initializeApp(FIREBASE_CONFIG);
const fbAuth = firebase.auth();
const fbDb   = firebase.firestore();

const SYS = `You are JARVIK AI, a helpful, harmless, and honest AI assistant created by Vikrant.
You are thoughtful, warm, articulate, and genuinely care about helping users.
Respond clearly and use markdown formatting when appropriate — code blocks, bullet lists, bold text, headers.
You remember important facts the user shares (name, projects, preferences, interests).
Be concise when brevity is appropriate, and thorough when depth is needed.
Never break character. You are JARVIK AI — intelligent, curious, and kind.`;

const STARTERS = [
  { i:"✍️", t:"Help me write or improve something" },
  { i:"🧠", t:"Explain a concept simply" },
  { i:"💻", t:"Write or debug code" },
  { i:"📋", t:"Summarize or analyze a document" },
];

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const VK         = "cv2_voice";
const MAXM       = 12;

/* ═══════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════ */
const intro       = document.getElementById("intro");
const app         = document.getElementById("app");
const cc          = document.getElementById("chat-container");
const ui          = document.getElementById("user-input");
const sb          = document.getElementById("send-btn");
const mic         = document.getElementById("mic-btn");
const miclbl      = document.getElementById("miclbl");
const ab          = document.getElementById("attach-btn");
const npb         = document.getElementById("new-project-btn");
const pl          = document.getElementById("projects-list");
const ct          = document.getElementById("chat-title");
const fi          = document.getElementById("file-input");
const fb          = document.getElementById("fbadge");
const jwf         = document.getElementById("jw-font");
const jws         = document.getElementById("jw-size");
const jwe         = document.getElementById("jw-editor");
const modal       = document.getElementById("modal");
const mb          = document.getElementById("modal-body");
const mc          = document.getElementById("modal-close");
const vt          = document.getElementById("voice-toggle");
const homeScreen  = document.getElementById("home-screen");
const signupOverlay = document.getElementById("signup-overlay");
const loginOverlay  = document.getElementById("login-overlay");
const sbAvatar    = document.getElementById("sb-avatar");
const sbName      = document.getElementById("sb-name");
const sbEmail     = document.getElementById("sb-email");
const logoutBtn   = document.getElementById("logout-btn");

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let af          = null;
let ve          = localStorage.getItem(VK) !== "off";
let busy        = false;
let CU          = "";   // current logged-in username
let debateMode  = false;
let debateTopic = "";
let debateMem   = [];   // separate in-memory history for debate
let codeMode    = false; // code mode flag

/* ═══════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════ */
const uid  = () => "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc  = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const relt = ts => {
  const d = new Date(ts), n = new Date();
  return d.toDateString() === n.toDateString()
    ? d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })
    : d.toLocaleDateString([], { month:"short", day:"numeric" });
};
function grow(el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 150) + "px"; }
const scroll = () => cc.scrollTop = cc.scrollHeight;

/* ═══════════════════════════════════════════
   PER-USER STORAGE  (all keys prefixed with username)
═══════════════════════════════════════════ */
const uk      = key => `jarvik_u_${CU}_${key}`;
const getP    = ()   => JSON.parse(localStorage.getItem(uk("proj")) || "[]");
const saveP   = p    => localStorage.setItem(uk("proj"), JSON.stringify(p));
const getCur  = ()   => localStorage.getItem(uk("cur"));
const setCur  = id   => localStorage.setItem(uk("cur"), id);
const getMem  = ()   => JSON.parse(localStorage.getItem(uk("mem")) || "[]");
const saveMem = m    => localStorage.setItem(uk("mem"), JSON.stringify(m));

function pushMem(role, content) {
  let m = getMem();
  m.push({ role, content });
  if (m.length > MAXM) m = m.slice(-MAXM);
  saveMem(m);
}

function loadNotes() {
  try {
    const d = JSON.parse(localStorage.getItem(uk("notes")) || "{}");
    if (d.html) jwe.innerHTML = d.html;
    if (d.font) jwf.value = d.font;
    if (d.size) jws.value = d.size;
    applyNote();
  } catch(e) {}
}

function saveNotes() {
  localStorage.setItem(uk("notes"), JSON.stringify({ html: jwe.innerHTML, font: jwf.value, size: jws.value }));
}

/* ═══════════════════════════════════════════
   PROJECTS / CONVERSATIONS
═══════════════════════════════════════════ */
function renderProjs() {
  const list = getP(), cur = getCur();
  pl.innerHTML = "";
  if (!list.length) { pl.innerHTML = `<div class="eml">No conversations yet</div>`; return; }
  list.forEach(pr => {
    const d = document.createElement("div");
    d.className = "ci" + (pr.id === cur ? " active" : "");
    d.innerHTML = `<div class="cdot"></div><div class="cmeta"><div class="cname">${esc(pr.title)}</div><div class="ctime">${relt(pr.created)}</div></div><div class="cbtns"><button class="cbtn rb">✎</button><button class="cbtn db">✕</button></div>`;
    d.querySelector(".rb").onclick = e => {
      e.stopPropagation();
      const t = prompt("Rename:", pr.title);
      if (!t?.trim()) return;
      const ps = getP(), i = ps.findIndex(x => x.id === pr.id);
      if (i !== -1) { ps[i].title = t.trim(); saveP(ps); }
      renderProjs();
      if (pr.id === getCur()) ct.textContent = t.trim();
    };
    d.querySelector(".db").onclick = e => {
      e.stopPropagation();
      if (!confirm("Delete this conversation?")) return;
      const ps = getP().filter(x => x.id !== pr.id);
      saveP(ps);
      if (pr.id === getCur()) { if (ps.length) setCur(ps[0].id); else newConv(); }
      renderProjs(); loadChat();
    };
    d.onclick = () => { setCur(pr.id); loadChat(); renderProjs(); };
    pl.appendChild(d);
  });
}

function loadChat() {
  const ps = getP(), id = getCur(), pr = ps.find(x => x.id === id);
  cc.innerHTML = pr ? pr.content : "";
  ct.textContent = pr ? pr.title : "JARVIK AI";
  if (!cc.innerHTML.trim()) showEmpty();
  scroll();
}

function saveChat() {
  const ps = getP(), id = getCur(), i = ps.findIndex(x => x.id === id);
  if (i !== -1) { ps[i].content = cc.innerHTML; saveP(ps); }
}

function newConv(title) {
  const id = uid(), ps = getP(), t = title || "New conversation";
  ps.unshift({ id, title: t, created: Date.now(), content: "" });
  saveP(ps); setCur(id);
  renderProjs(); cc.innerHTML = ""; ct.textContent = t; showEmpty();
}

/* ═══════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════ */
const BAV = () => `<div class="bav"><svg viewBox="0 0 32 32"><path d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4zm0 5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 14.2c-2.92 0-5.5-1.5-7-3.77.03-2.33 4.67-3.61 7-3.61s6.97 1.28 7 3.61A8.32 8.32 0 0116 23.2z"/></svg></div>`;

function showEmpty() {
  cc.innerHTML = "";
  const el = document.createElement("div");
  el.className = "es"; el.id = "es";
  el.innerHTML = `<div class="esico"><svg viewBox="0 0 32 32"><path d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4zm0 5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 14.2c-2.92 0-5.5-1.5-7-3.77.03-2.33 4.67-3.61 7-3.61s6.97 1.28 7 3.61A8.32 8.32 0 0116 23.2z"/></svg></div><div class="esh">How can I help?</div><div class="esp">Ask JARVIK AI anything — I'm here to help you think, write, code, and explore ideas.</div><div class="sg">${STARTERS.map(s => `<div class="sc" data-p="${esc(s.t)}"><div class="sci">${s.i}</div><div class="sct">${esc(s.t)}</div></div>`).join("")}</div>`;
  cc.appendChild(el);
  el.querySelectorAll(".sc").forEach(c => { c.onclick = () => { ui.value = c.dataset.p; grow(ui); ui.focus(); }; });
}

/* ═══════════════════════════════════════════
   MESSAGES
═══════════════════════════════════════════ */
function addMsg(text, who, md) {
  const es = document.getElementById("es"); if (es) es.remove();
  const row = document.createElement("div");
  row.className = "mr " + who;
  const html = who === "bot"
    ? (md && typeof marked !== "undefined" ? marked.parse(text) : esc(text).replace(/\n/g, "<br>"))
    : esc(text).replace(/\n/g, "<br>");
  row.innerHTML = who === "bot" ? `${BAV()}<div class="mb">${html}</div>` : `<div class="mb">${html}</div>`;
  cc.appendChild(row); scroll(); saveChat();
}

function showTyping() {
  if (document.getElementById("ty")) return;
  const r = document.createElement("div");
  r.id = "ty"; r.className = "tr2";
  r.innerHTML = `${BAV()}<div class="tb2"><div class="td"></div><div class="td"></div><div class="td"></div></div>`;
  cc.appendChild(r); scroll();
}
function hideTyping() { const t = document.getElementById("ty"); if (t) t.remove(); }

/* ═══════════════════════════════════════════
   IMAGE GENERATION
═══════════════════════════════════════════ */
const IMG_RE = /^(?:please\s+)?(?:generate|create|draw|make|paint|render|show me|give me|produce)\s+(?:an?\s+)?(?:image|picture|photo|illustration|artwork|drawing|painting)\s+(?:of\s+|showing\s+|depicting\s+)?(.+)/i;

function isImageRequest(txt) {
  return IMG_RE.test(txt.trim());
}

function extractImgPrompt(txt) {
  const m = txt.trim().match(IMG_RE);
  return m ? m[1].trim() : txt.trim();
}

function addImgMsg(src, prompt) {
  const es = document.getElementById("es"); if (es) es.remove();
  const row = document.createElement("div");
  row.className = "mr bot";
  row.innerHTML = `${BAV()}<div class="mb"><div class="imgwrap"><img src="${src}" alt="${esc(prompt)}" style="max-width:100%;border-radius:12px;display:block;margin-top:4px;" /><div style="font-size:11px;color:var(--t3);margin-top:6px;">🎨 "${esc(prompt)}"</div></div></div>`;
  cc.appendChild(row); scroll(); saveChat();
}

async function generateImage(prompt) {
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 999999);
  const src = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&seed=${seed}&nologo=true`;

  hideTyping();

  const es = document.getElementById("es"); if (es) es.remove();
  const row = document.createElement("div");
  row.className = "mr bot";

  const placeholder = `<div style="width:260px;height:260px;border-radius:12px;background:var(--s2);display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:13px;">Generating image…</div>`;
  row.innerHTML = `${BAV()}<div class="mb"><div id="imgblock">${placeholder}<div style="font-size:11px;color:var(--t3);margin-top:6px;">🎨 "${esc(prompt)}"</div></div></div>`;
  cc.appendChild(row); scroll();

  const img = new Image();
  img.onload = () => {
    const block = document.getElementById("imgblock");
    if (block) {
      block.innerHTML = `<img src="${src}" alt="${esc(prompt)}" style="max-width:100%;border-radius:12px;display:block;" /><div style="font-size:11px;color:var(--t3);margin-top:6px;">🎨 "${esc(prompt)}"</div>`;
    }
    saveChat(); scroll();
  };
  img.onerror = () => {
    const block = document.getElementById("imgblock");
    if (block) block.innerHTML = `<div style="color:var(--t3);font-size:13px;">❌ Image generation failed. Try a different prompt.</div>`;
  };
  img.src = src;
}

/* ═══════════════════════════════════════════
   VOICE
═══════════════════════════════════════════ */
function speak(text) {
  if (!ve) return;
  try {
    speechSynthesis.cancel();
    const plain = text.replace(/[#*`_~>]/g, "").slice(0, 700);
    const u = new SpeechSynthesisUtterance(plain);
    const vs = speechSynthesis.getVoices();
    const v = vs.find(x => /male/i.test(x.name)) || vs[0];
    if (v) u.voice = v;
    u.pitch = 0.72; u.rate = 0.96;
    speechSynthesis.speak(u);
  } catch(e) {}
}
function syncVoice() {
  vt.classList.toggle("on", ve);
  vt.title = ve ? "Voice on (click to mute)" : "Voice off (click to enable)";
}
vt.onclick = () => { ve = !ve; localStorage.setItem(VK, ve ? "on" : "off"); if (!ve) speechSynthesis.cancel(); syncVoice(); };

/* ═══════════════════════════════════════════
   FILE ATTACHMENT
═══════════════════════════════════════════ */
fi.addEventListener("change", () => {
  const f = fi.files[0];
  if (!f) { af = null; fb.textContent = ""; fb.classList.remove("show"); return; }
  const r = new FileReader();
  r.onload = e => { af = { name: f.name, content: e.target.result, size: f.size }; fb.textContent = `📎 ${f.name}`; fb.classList.add("show"); };
  r.readAsText(f);
});
ab.onclick = () => fi.click();

/* ═══════════════════════════════════════════
   NOTES (SCRATCH PAD)
═══════════════════════════════════════════ */
function applyNote() { jwe.style.fontFamily = jwf.value; jwe.style.fontSize = jws.value; }
jwf.onchange = () => { applyNote(); saveNotes(); };
jws.onchange = () => { applyNote(); saveNotes(); };
jwe.oninput  = saveNotes;

/* ═══════════════════════════════════════════
   SEND MESSAGE
═══════════════════════════════════════════ */
async function send() {
  if (busy) return;
  const txt = ui.value.trim();
  if (!txt && !af) return;

  let uc = txt, dt = txt || "(File only)";
  if (af) {
    uc = `I've attached: "${af.name}" (${af.size} bytes).\n\nContent:\n\`\`\`\n${af.content.slice(0, 8000)}\n\`\`\`\n\n${txt ? "My question: " + txt : "Please analyze this file."}`;
    dt = txt ? `📎 ${af.name}\n\n${txt}` : `📎 ${af.name}`;
    af = null; fi.value = ""; fb.textContent = ""; fb.classList.remove("show");
  }

  /* Auto-title from first message */
  const ps = getP(), id = getCur(), pi = ps.findIndex(x => x.id === id);
  if (pi !== -1 && ps[pi].title === "New conversation" && txt.length > 3) {
    const t2 = txt.slice(0, 42) + (txt.length > 42 ? "…" : "");
    ps[pi].title = t2; saveP(ps); ct.textContent = t2; renderProjs();
  }

  addMsg(dt, "user");
  ui.value = ""; ui.style.height = "auto";
  busy = true; sb.disabled = true;

  /* ── Image generation shortcut ── */
  if (!af && isImageRequest(txt)) {
    const imgPrompt = extractImgPrompt(txt);
    await generateImage(imgPrompt);
    busy = false; sb.disabled = false;
    return;
  }

  showTyping();
  try {
    let sysprompt = SYS;
    let history   = getMem();

    if (debateMode) {
      sysprompt = `You are JARVIK AI in DEBATE MODE. The user has stated their position: "${debateTopic}". Your ONLY job is to argue the COMPLETE OPPOSITE of whatever the user says, no matter how convincing their argument is. Be sharp, confident, witty and relentless. Use real facts and logical arguments but always in opposition to the user. Never agree. Never concede. Never break character. If they make a great point, call it interesting then immediately dismantle it. Keep responses under 120 words. End each response with a punchy one-liner challenge to keep them arguing.`;
      history = debateMem;
    }

    if (codeMode) {
      sysprompt = `You are JARVIK AI in CODE MODE — a elite, no-nonsense coding assistant. Rules:
1. ALWAYS wrap code in fenced code blocks with the correct language tag (e.g. \`\`\`python, \`\`\`javascript, \`\`\`html etc.)
2. Be concise and technical. Skip pleasantries. Get straight to the code.
3. After every code block, add a brief "What this does:" explanation in 1-2 sentences.
4. If you spot a bug or a better approach, point it out directly.
5. If the question is ambiguous, state your assumption then write the code.
6. Never say "certainly" or "of course". Just write the code.
7. Use modern best practices and clean, readable code always.`;
    }

    const res = await fetch(URL2, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + KEY,
        "HTTP-Referer": location.href,
        "X-Title": "JARVIK AI by Vikrant"
      },
      body: JSON.stringify({
        model: MDL,
        messages: [{ role: "system", content: sysprompt }, ...history, { role: "user", content: uc }]
      })
    });
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "I had trouble generating a response. Please try again.";
    hideTyping();

    if (debateMode) {
      addDebateMsg(reply, "bot");
      debateMem.push({ role: "user", content: uc });
      debateMem.push({ role: "assistant", content: reply });
      if (debateMem.length > 20) debateMem = debateMem.slice(-20);
    } else {
      addMsg(reply, "bot", true); speak(reply);
      pushMem("user", uc); pushMem("assistant", reply);
      if (codeMode) addCopyButtons();
    }
  } catch(e) {
    hideTyping(); addMsg("Connection error. Please check your internet and try again.", "bot", true);
  }

  busy = false; sb.disabled = false;
}

/* ═══════════════════════════════════════════
   MIC / VOICE INPUT
═══════════════════════════════════════════ */
mic.onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert("Voice input not supported. Use Chrome."); return; }
  const rec = new SR();
  rec.lang = "en-IN"; rec.continuous = false; rec.interimResults = false;
  miclbl.textContent = "Listening…";
  mic.querySelector("svg").style.stroke = "var(--acc)";
  mic.style.animation = "micPulse 1s infinite";
  rec.onresult = e => { ui.value = e.results[0][0].transcript; grow(ui); };
  rec.onerror  = () => {};
  rec.onend    = () => { miclbl.textContent = "Voice input"; mic.querySelector("svg").style.stroke = ""; mic.style.animation = ""; };
  rec.start();
};

/* ═══════════════════════════════════════════
   INPUT EVENTS
═══════════════════════════════════════════ */
ui.addEventListener("input",   () => grow(ui));
ui.addEventListener("keydown", e  => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
sb.onclick  = send;
npb.onclick = () => newConv();
mc.onclick  = () => modal.classList.add("hidden");
modal.onclick = e => { if (e.target === modal) modal.classList.add("hidden"); };


/* ═══════════════════════════════════════════
   ROAST MODE
═══════════════════════════════════════════ */
function buildRoastContext() {
  const ps = getP();
  const lines = [];
  ps.forEach(pr => {
    if (!pr.content) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = pr.content;
    tmp.querySelectorAll(".mr.user .mb").forEach(el => {
      const t = (el.innerText || el.textContent || "").trim();
      if (t && t.length > 1) lines.push(t);
    });
  });
  return lines;
}

function roastShow(loading, text, again) {
  document.getElementById("roast-loading").style.display = loading ? "flex" : "none";
  document.getElementById("roast-text").style.display    = text   ? "block" : "none";
  document.getElementById("roast-again").style.display  = again  ? "block" : "none";
}

function roastSetText(html) {
  document.getElementById("roast-text").innerHTML = html;
}

async function runRoast() {
  document.getElementById("roast-modal").classList.remove("hidden");
  roastShow(true, false, false);
  roastSetText("");

  const msgs = buildRoastContext();

  if (!msgs.length) {
    roastShow(false, true, true);
    roastSetText("<p>You haven't said anything yet.</p><p>JARVIK can't roast someone who doesn't exist. Go have a real conversation first. 💀</p>");
    return;
  }

  const sample = msgs.slice(-25).join("\n- ");
  const roastSys = `You are JARVIK AI in Roast Mode. You are given the user's actual chat messages. Deliver a SAVAGE, PERSONAL, HILARIOUS roast based specifically on what they said. Be brutally specific — call out their topics, their lazy questions, their patterns. Use Gen Z humor. End with one devastating italic one-liner. Under 160 words. 3 short paragraphs. No headers. Make it hurt (but funny).`;

  try {
    const res = await fetch(URL2, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + KEY,
        "HTTP-Referer": location.href,
        "X-Title": "JARVIK Roast Mode"
      },
      body: JSON.stringify({
        model: MDL,
        max_tokens: 300,
        messages: [
          { role: "system", content: roastSys },
          { role: "user",   content: "My messages to you:\n- " + sample + "\n\nNow roast me. Personal. Savage. Funny." }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      roastShow(false, true, true);
      roastSetText("<p>API error " + res.status + ". JARVIK is technically unable to roast you right now, which is honestly a win for you.</p><p style='font-size:11px;opacity:.5'>" + errText.slice(0, 120) + "</p>");
      return;
    }

    const data  = await res.json();
    const roast = data?.choices?.[0]?.message?.content;

    if (!roast) {
      roastShow(false, true, true);
      roastSetText("<p>JARVIK got tongue-tied. The roast was too devastating to render. Try again.</p>");
      return;
    }

    const paras = roast.split(/\n+/).filter(l => l.trim()).map((p, i, arr) =>
      i === arr.length - 1
        ? `<p style="color:#fb923c;font-style:italic;font-weight:600">${p}</p>`
        : `<p>${p}</p>`
    ).join("");

    roastShow(false, true, true);
    roastSetText(paras);

  } catch(e) {
    roastShow(false, true, true);
    roastSetText("<p>Network error: " + (e.message || "unknown") + "</p><p>Check your internet connection and try again.</p>");
  }
}

document.getElementById("roast-btn").onclick   = runRoast;
document.getElementById("roast-close").onclick  = () => document.getElementById("roast-modal").classList.add("hidden");
document.getElementById("roast-again").onclick  = runRoast;
document.getElementById("roast-modal").onclick  = e => { if (e.target.id === "roast-modal") document.getElementById("roast-modal").classList.add("hidden"); };


/* ═══════════════════════════════════════════
   DEBATE MODE
═══════════════════════════════════════════ */
function addDebateMsg(text, who) {
  const es = document.getElementById("es"); if (es) es.remove();
  const row = document.createElement("div");
  row.className = "mr " + who + (who === "bot" ? " debate-bot-msg" : " debate-user-msg");
  const html = who === "bot"
    ? (typeof marked !== "undefined" ? marked.parse(text) : esc(text).replace(/\n/g, "<br>"))
    : esc(text).replace(/\n/g, "<br>");
  const avatar = who === "bot"
    ? `<div class="bav debate-bav"><svg viewBox="0 0 24 24" fill="white" style="width:14px;height:14px"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg></div>`
    : "";
  row.innerHTML = who === "bot"
    ? `${avatar}<div class="mb debate-mb-bot">${html}</div>`
    : `<div class="mb debate-mb-user">${html}</div>`;
  cc.appendChild(row); scroll(); saveChat();
}

function showDebateBanner(topic) {
  const existing = document.getElementById("debate-banner");
  if (existing) existing.remove();
  const banner = document.createElement("div");
  banner.id = "debate-banner";
  banner.className = "debate-banner";
  banner.innerHTML = `
    <div class="debate-banner-left">
      <span class="debate-banner-icon">⚔️</span>
      <div>
        <div class="debate-banner-label">DEBATE MODE ACTIVE</div>
        <div class="debate-banner-topic">Your stance: <strong>${esc(topic)}</strong></div>
      </div>
    </div>
    <button class="debate-end-btn" id="debate-end-btn">End Debate</button>
  `;
  cc.parentElement.insertBefore(banner, cc);
  document.getElementById("debate-end-btn").onclick = endDebate;
}

function startDebate(topic) {
  debateMode  = true;
  debateTopic = topic;
  debateMem   = [];

  /* Update sidebar button */
  document.getElementById("debate-btn-label").textContent = "End debate ⚔️";
  document.getElementById("debate-btn").classList.add("debate-active");

  /* Switch to fresh conversation view */
  newConv("⚔️ Debate: " + topic.slice(0, 35));
  showDebateBanner(topic);

  /* JARVIK opens the debate */
  const openingSys = `You are JARVIK AI in DEBATE MODE. The user believes: "${topic}". Open the debate by immediately and confidently stating the OPPOSITE position in 2-3 punchy sentences. Be bold. End with a challenge question to the user. Under 80 words.`;
  busy = true; sb.disabled = true; showTyping();
  fetch(URL2, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY, "HTTP-Referer": location.href, "X-Title": "JARVIK Debate" },
    body: JSON.stringify({ model: MDL, max_tokens: 200, messages: [{ role: "system", content: openingSys }, { role: "user", content: "Start the debate." }] })
  })
  .then(r => r.json())
  .then(data => {
    const opening = data?.choices?.[0]?.message?.content || "I disagree. Completely. Want to fight about it?";
    hideTyping();
    addDebateMsg(opening, "bot");
    debateMem.push({ role: "assistant", content: opening });
    busy = false; sb.disabled = false;
  })
  .catch(() => {
    hideTyping();
    addDebateMsg("I disagree with everything you just said. Come on then — defend your position.", "bot");
    busy = false; sb.disabled = false;
  });
}

function endDebate() {
  debateMode  = false;
  debateTopic = "";
  debateMem   = [];

  document.getElementById("debate-btn-label").textContent = "Debate me ⚔️";
  document.getElementById("debate-btn").classList.remove("debate-active");

  const banner = document.getElementById("debate-banner");
  if (banner) banner.remove();

  /* Show a verdict message */
  const verdict = document.createElement("div");
  verdict.className = "debate-verdict";
  verdict.innerHTML = `<span>⚔️</span> Debate ended. JARVIK remains unconvinced. As always.`;
  cc.appendChild(verdict); scroll();
}

/* Debate modal controls */
document.getElementById("debate-btn").onclick = () => {
  if (debateMode) { endDebate(); return; }
  document.getElementById("debate-modal").classList.remove("hidden");
  setTimeout(() => document.getElementById("debate-topic-input").focus(), 80);
};

document.getElementById("debate-modal-close").onclick = () => {
  document.getElementById("debate-modal").classList.add("hidden");
};

document.getElementById("debate-modal").onclick = e => {
  if (e.target.id === "debate-modal") document.getElementById("debate-modal").classList.add("hidden");
};

document.getElementById("debate-start-btn").onclick = () => {
  const topic = document.getElementById("debate-topic-input").value.trim();
  if (!topic) { document.getElementById("debate-topic-input").focus(); return; }
  document.getElementById("debate-modal").classList.add("hidden");
  document.getElementById("debate-topic-input").value = "";
  startDebate(topic);
};

document.getElementById("debate-topic-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("debate-start-btn").click();
});

document.querySelectorAll(".debate-eg").forEach(btn => {
  btn.onclick = () => { document.getElementById("debate-topic-input").value = btn.dataset.t; document.getElementById("debate-topic-input").focus(); };
});


/* ═══════════════════════════════════════════
   CODE MODE
═══════════════════════════════════════════ */
const CODE_SYS_PLACEHOLDER = "Ask a coding question, paste code to debug, or describe what you want to build…";
const NORMAL_PLACEHOLDER   = "Message JARVIK AI…";

function addCopyButtons() {
  /* Add copy button + language label to every code block that doesn't have one yet */
  cc.querySelectorAll("pre:not([data-cb])").forEach(pre => {
    pre.setAttribute("data-cb", "1");
    const code  = pre.querySelector("code");
    if (!code) return;

    /* Detect language from class e.g. language-python */
    let lang = "";
    code.classList.forEach(cls => {
      if (cls.startsWith("language-")) lang = cls.replace("language-", "");
    });

    const bar = document.createElement("div");
    bar.className = "code-bar";
    bar.innerHTML = `<span class="code-lang">${lang || "code"}</span><button class="copy-btn" title="Copy code">Copy</button>`;
    pre.insertBefore(bar, pre.firstChild);

    bar.querySelector(".copy-btn").onclick = function() {
      const text = code.innerText || code.textContent;
      navigator.clipboard.writeText(text).then(() => {
        this.textContent = "Copied!";
        setTimeout(() => { this.textContent = "Copy"; }, 1500);
      }).catch(() => {
        this.textContent = "Error";
        setTimeout(() => { this.textContent = "Copy"; }, 1500);
      });
    };
  });
}

function toggleCodeMode() {
  codeMode = !codeMode;

  const btn   = document.getElementById("code-mode-btn");
  const label = document.getElementById("code-mode-label");
  const badge = document.getElementById("code-mode-badge");

  btn.classList.toggle("active", codeMode);
  badge.classList.toggle("hidden", !codeMode);
  label.textContent = codeMode ? "Code Mode ON" : "Code Mode";
  ui.placeholder    = codeMode ? CODE_SYS_PLACEHOLDER : NORMAL_PLACEHOLDER;
  app.classList.toggle("code-mode-active", codeMode);

  if (codeMode) {
    /* Start a fresh code conversation */
    newConv("💻 Code Session");
    /* Show welcome message inline */
    setTimeout(() => {
      const es = document.getElementById("es"); if (es) es.remove();
      const row = document.createElement("div");
      row.className = "mr bot";
      row.innerHTML = `${BAV()}<div class="mb"><div class="code-mode-welcome"><div class="cmw-title">⌨️ Code Mode activated</div><div class="cmw-body">I'll write clean, well-formatted code for every request. Every code block gets a copy button and language label. Just tell me what to build, debug, or explain.</div><div class="cmw-chips"><span>Debug my code</span><span>Write a function</span><span>Explain this snippet</span><span>Best practices</span></div></div></div>`;
      cc.appendChild(row);
      scroll();

      /* Make chips clickable */
      row.querySelectorAll(".cmw-chips span").forEach(chip => {
        chip.onclick = () => { ui.value = chip.textContent; grow(ui); ui.focus(); };
      });
    }, 100);
  } else {
    /* Return to normal */
    ui.placeholder = NORMAL_PLACEHOLDER;
    const ps = getP();
    if (!ps.length) newConv("New conversation");
    else { if (!getCur() || !ps.find(x => x.id === getCur())) setCur(ps[0].id); renderProjs(); loadChat(); }
  }
}

document.getElementById("code-mode-btn").onclick = toggleCodeMode;


/* ═══════════════════════════════════════════
   DEVIL'S ADVOCATE
═══════════════════════════════════════════ */
const daBtn         = document.getElementById("da-btn");
const daModal       = document.getElementById("da-modal");
const daClose       = document.getElementById("da-close");
const daInput       = document.getElementById("da-input");
const daChars       = document.getElementById("da-chars");
const daSubmit      = document.getElementById("da-submit");
const daResultModal = document.getElementById("da-result-modal");
const daResultClose = document.getElementById("da-result-close");
const daResultText  = document.getElementById("da-result-text");
const daLoading     = document.getElementById("da-loading");
const daResultFoot  = document.getElementById("da-result-footer");
const daAgain       = document.getElementById("da-again");

daInput.addEventListener("input", () => { daChars.textContent = daInput.value.length; });

daBtn.onclick = () => { daModal.classList.remove("hidden"); setTimeout(() => daInput.focus(), 80); };

function closeDAModal()  { daModal.classList.add("hidden"); }
function closeDAResult() { daResultModal.classList.add("hidden"); }

daClose.onclick       = closeDAModal;
daResultClose.onclick = closeDAResult;
daModal.onclick       = e => { if (e.target === daModal) closeDAModal(); };
daResultModal.onclick = e => { if (e.target === daResultModal) closeDAResult(); };

daAgain.onclick = () => {
  closeDAResult();
  daInput.value = ""; daChars.textContent = "0";
  setTimeout(() => { daModal.classList.remove("hidden"); daInput.focus(); }, 150);
};

daSubmit.onclick = async () => {
  const idea = daInput.value.trim();
  if (!idea) { daInput.focus(); return; }

  closeDAModal();
  daResultModal.classList.remove("hidden");
  daLoading.style.display    = "flex";
  daResultText.style.display = "none";
  daResultFoot.style.display = "none";
  daResultText.innerHTML     = "";

  const daSys = `You are JARVIK AI in Devil's Advocate mode. The user has shared an idea, plan, or decision. Your job is to be a brutal but intelligent pre-mortem analyst. Find EVERY flaw, blind spot, risk, and failure mode you can. Be specific, sharp, and ruthlessly honest — but constructive. Do NOT be encouraging. Do NOT validate the idea at all. Structure your response exactly like this:

💀 FATAL FLAWS (2-3 things that could kill this entirely)
⚠️ SERIOUS RISKS (2-3 significant problems they haven't thought of)
🤦 BLIND SPOTS (1-2 things they're clearly not seeing)
🔮 MOST LIKELY OUTCOME (one brutal but honest prediction in 1-2 sentences)

Keep each point to 1-2 sharp sentences. Total under 220 words. No softening. No "but on the bright side." Pure devil's advocate.`;

  try {
    const res = await fetch(URL2, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY, "HTTP-Referer": location.href, "X-Title": "JARVIK Devils Advocate" },
      body: JSON.stringify({ model: MDL, max_tokens: 400, messages: [{ role: "system", content: daSys }, { role: "user", content: "My idea/plan: " + idea }] })
    });

    if (!res.ok) {
      const errText = await res.text();
      daLoading.style.display = "none"; daResultText.style.display = "block"; daResultFoot.style.display = "block";
      daResultText.innerHTML = `<p class="da-err">API error ${res.status}. Try again.</p>`;
      return;
    }

    const data   = await res.json();
    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      daLoading.style.display = "none"; daResultText.style.display = "block"; daResultFoot.style.display = "block";
      daResultText.innerHTML = `<p class="da-err">No response. Try again.</p>`;
      return;
    }

    const lines = result.split("\n").filter(l => l.trim());
    let html = "";
    lines.forEach(line => {
      const t = line.trim();
      if (t.startsWith("💀") || t.startsWith("⚠️") || t.startsWith("🤦") || t.startsWith("🔮")) {
        html += `<div class="da-section-head">${t}</div>`;
      } else if (t.startsWith("-") || t.startsWith("•")) {
        html += `<div class="da-point">${t.slice(1).trim()}</div>`;
      } else if (t) {
        html += `<div class="da-point">${t}</div>`;
      }
    });

    daLoading.style.display = "none"; daResultText.style.display = "block"; daResultFoot.style.display = "block";
    daResultText.innerHTML  = html || `<p>${esc(result)}</p>`;

  } catch(e) {
    daLoading.style.display = "none"; daResultText.style.display = "block"; daResultFoot.style.display = "block";
    daResultText.innerHTML  = `<p class="da-err">Network error: ${e.message || "unknown"}. Check your connection.</p>`;
  }
};


let sidebarHidden = false;


/* ═══════════════════════════════════════════
   GEN-Z CONVERTER
═══════════════════════════════════════════ */
let genzLevel = 2;

const GENZ_PROMPTS = {
  1: `Lightly rewrite the following text in a casual Gen-Z tone. Use a few modern slang terms naturally (like "lowkey", "ngl", "kinda", "tbh"). Keep it mostly readable and only slightly informal. Do not overdo it.`,
  2: `Rewrite the following text in a solid Gen-Z voice. Use slang like "no cap", "lowkey", "slay", "bussin", "fr fr", "it's giving", "vibe", "mid", "based". Make it feel like a real Gen-Z person wrote it. Natural, not forced.`,
  3: `Rewrite the following text in heavy Gen-Z slang. Go hard — "bestie", "slay", "no cap", "it's giving", "understood the assignment", "main character", "rent free", "ate and left no crumbs", "era", "hits different", "sending me", "I can't even". Make it chaotic but still understandable.`,
  4: `Rewrite the following text in absolute peak Gen-Z. Every sentence should drip with slang. Use: "no cap", "fr fr", "slay", "bussin", "lowkey ate", "understood the assignment", "this is my villain era", "not me", "I'm deceased", "rent free", "hits different", "main character energy", "giving", "it's giving", "delulu", "rizz", "understood". Go absolutely unhinged but coherent.`,
  5: `Rewrite the following text in the most extreme, unhinged Gen-Z possible. Think TikTok comment section at 3am. Use every slang term you know — "no cap fr fr", "understood the assignment bestie", "I'm so deceased rn", "this slaps", "we don't talk about that era", "living rent free", "slay queen", "delulu is the solulu", "rizz god", "touch grass", "it's giving main character", "ate and left no crumbs no cap". Make it barely comprehensible to anyone over 25 but still somehow convey the original meaning.`
};

const GENZ_LABELS = {
  1: "🙂 Mild",
  2: "😎 Mid",
  3: "🔥 Cooked",
  4: "💀 No cap",
  5: "🗿 Unalived"
};

/* Level selector */
document.querySelectorAll(".genz-lvl").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".genz-lvl").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    genzLevel = parseInt(btn.dataset.l);
  };
});

/* Char counter */
document.getElementById("genz-input").addEventListener("input", () => {
  document.getElementById("genz-chars").textContent = document.getElementById("genz-input").value.length;
});

/* Open / close */
document.getElementById("genz-btn").onclick = () => {
  document.getElementById("genz-modal").classList.remove("hidden");
  setTimeout(() => document.getElementById("genz-input").focus(), 80);
};
document.getElementById("genz-close").onclick = () => document.getElementById("genz-modal").classList.add("hidden");
document.getElementById("genz-modal").onclick = e => { if (e.target.id === "genz-modal") document.getElementById("genz-modal").classList.add("hidden"); };

/* Copy button */
document.getElementById("genz-copy").onclick = function() {
  const text = document.getElementById("genz-output").innerText;
  navigator.clipboard.writeText(text).then(() => {
    this.textContent = "Copied! ✅";
    setTimeout(() => { this.textContent = "Copy ✨"; }, 1500);
  });
};

/* Translate */
document.getElementById("genz-submit").onclick = async () => {
  const text = document.getElementById("genz-input").value.trim();
  if (!text) { document.getElementById("genz-input").focus(); return; }

  const outEl   = document.getElementById("genz-output");
  const copyBtn = document.getElementById("genz-copy");
  const outLbl  = document.getElementById("genz-output-label");
  const submitBtn = document.getElementById("genz-submit");

  outEl.innerHTML = '<div class="genz-loading"><div class="roast-dots"><div></div><div></div><div></div></div><div>cooking up the translation fr fr…</div></div>';
  copyBtn.style.display = "none";
  submitBtn.disabled = true;
  outLbl.textContent = "";

  try {
    const res = await fetch(URL2, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + KEY,
        "HTTP-Referer": location.href,
        "X-Title": "JARVIK GenZ Converter"
      },
      body: JSON.stringify({
        model: MDL,
        max_tokens: 500,
        messages: [
          { role: "system", content: GENZ_PROMPTS[genzLevel] + " Return ONLY the rewritten text. No explanations, no quotation marks, no preamble." },
          { role: "user", content: text }
        ]
      })
    });

    if (!res.ok) throw new Error("API error " + res.status);
    const data   = await res.json();
    const result = data?.choices?.[0]?.message?.content?.trim();

    if (!result) throw new Error("empty");

    outEl.innerHTML = "";
    outEl.textContent = result;
    outLbl.textContent = "— " + GENZ_LABELS[genzLevel];
    copyBtn.style.display = "block";

  } catch(e) {
    outEl.innerHTML = '<div class="genz-placeholder" style="color:#f87171">Translation failed bestie. Check your connection and try again fr.</div>';
  }

  submitBtn.disabled = false;
};

/* Enter key in genz textarea */
document.getElementById("genz-input").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.ctrlKey) document.getElementById("genz-submit").click();
});


/* ═══════════════════════════════════════════
   MOBILE SIDEBAR
═══════════════════════════════════════════ */
const backdrop = document.getElementById("sidebar-backdrop");

function isMobile() { return window.innerWidth <= 768; }

function openMobileSidebar() {
  document.getElementById("sidebar").classList.add("mobile-open");
  backdrop.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeMobileSidebar() {
  document.getElementById("sidebar").classList.remove("mobile-open");
  backdrop.classList.remove("show");
  document.body.style.overflow = "";
}

/* Backdrop tap closes sidebar */
backdrop.onclick = closeMobileSidebar;

/* Override sidebar toggle for mobile */
const origToggle = document.getElementById("sidebar-toggle-btn").onclick;
document.getElementById("sidebar-toggle-btn").onclick = () => {
  if (isMobile()) {
    const isOpen = document.getElementById("sidebar").classList.contains("mobile-open");
    if (isOpen) closeMobileSidebar(); else openMobileSidebar();
    return;
  }
  /* Desktop behaviour — keep existing toggle */
  sidebarHidden = !sidebarHidden;
  const sidebar = document.getElementById("sidebar");
  const btn     = document.getElementById("sidebar-toggle-btn");
  const svg     = btn.querySelector("svg");
  if (sidebarHidden) {
    sidebar.classList.add("sb-hidden");
    btn.title = "Show sidebar";
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/>';
  } else {
    sidebar.classList.remove("sb-hidden");
    btn.title = "Hide sidebar";
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/>';
  }
};

/* Close sidebar when a conversation is tapped on mobile */
const origRenderProjs = renderProjs;
renderProjs = function() {
  origRenderProjs();
  if (isMobile()) {
    document.querySelectorAll(".ci").forEach(el => {
      const orig = el.onclick;
      el.addEventListener("click", () => { if (isMobile()) closeMobileSidebar(); });
    });
  }
};

/* Close sidebar when new conversation started on mobile */
const origNewConv = newConv;
newConv = function(title) {
  origNewConv(title);
  if (isMobile()) closeMobileSidebar();
};

/* Close mobile sidebar when a tool is used */
["roast-btn","debate-btn","code-mode-btn","da-btn","genz-btn","interrogation-btn"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", () => { if (isMobile()) closeMobileSidebar(); });
});

/* Handle resize — reset state */
window.addEventListener("resize", () => {
  if (!isMobile()) closeMobileSidebar();
});

/* ═══════════════════════════════════════════
   AUTH SYSTEM  (Firebase)
═══════════════════════════════════════════ */
const toEmail = u => u.toLowerCase().trim() + "@jarvik.app";

function applyUser(username) {
  sbName.textContent   = username;
  sbEmail.textContent  = "Signed in";
  sbAvatar.textContent = username.slice(0, 2).toUpperCase();
}

function launchApp(username, uid) {
  CU = uid;
  applyUser(username);
  homeScreen.classList.add("hidden");
  signupOverlay.classList.add("hidden");
  loginOverlay.classList.add("hidden");
  if (typeof marked !== "undefined") marked.setOptions({ breaks: true, gfm: true });
  const ps = getP();
  if (!ps.length) newConv("New conversation");
  else { if (!getCur() || !ps.find(x => x.id === getCur())) setCur(ps[0].id); renderProjs(); loadChat(); }
  loadNotes(); syncVoice();
  speechSynthesis.onvoiceschanged = () => {};
  const introEl = document.getElementById("intro");
  if (introEl) {
    setTimeout(() => {
      introEl.style.opacity = "0";
      setTimeout(() => { introEl.remove(); app.classList.remove("hidden"); }, 550);
    }, 2000);
  } else {
    app.classList.remove("hidden");
  }
}

/* SIGN UP */
document.getElementById("su-submit").onclick = async () => {
  const uval  = document.getElementById("su-user").value.trim().toLowerCase().replace(/\s+/g, "");
  const pval  = document.getElementById("su-pass").value;
  const p2val = document.getElementById("su-pass2").value;
  const msg   = document.getElementById("su-msg");
  const btn   = document.getElementById("su-submit");
  msg.className = "auth-msg";

  if (!uval)                         { msg.className="auth-msg err"; msg.textContent="Please enter a username."; return; }
  if (uval.length < 3)               { msg.className="auth-msg err"; msg.textContent="Username must be at least 3 characters."; return; }
  if (!/^[a-z0-9_]+$/.test(uval))   { msg.className="auth-msg err"; msg.textContent="Only letters, numbers, and underscores allowed."; return; }
  if (!pval)                         { msg.className="auth-msg err"; msg.textContent="Please enter a password."; return; }
  if (pval.length < 6)               { msg.className="auth-msg err"; msg.textContent="Password must be at least 6 characters."; return; }
  if (pval !== p2val)                { msg.className="auth-msg err"; msg.textContent="Passwords do not match."; return; }

  btn.disabled = true;
  msg.className = "auth-msg"; msg.textContent = "Checking username…";

  try {
    const uSnap = await fbDb.collection("usernames").doc(uval).get();
    if (uSnap.exists) {
      msg.className="auth-msg err"; msg.textContent="⚠ Username already taken. Please choose another.";
      btn.disabled = false; return;
    }
    const cred = await fbAuth.createUserWithEmailAndPassword(toEmail(uval), pval);
    await cred.user.updateProfile({ displayName: uval });
    await fbDb.collection("usernames").doc(uval).set({ uid: cred.user.uid, created: Date.now() });
    msg.className="auth-msg ok"; msg.textContent="Account created! Signing you in…";
  } catch(e) {
    msg.className="auth-msg err";
    msg.textContent = e.code === "auth/email-already-in-use"
      ? "⚠ Username already taken. Please choose another."
      : "Error: " + (e.message || "Something went wrong.");
    btn.disabled = false;
  }
};

/* LOG IN */
document.getElementById("li-submit").onclick = async () => {
  const uval = document.getElementById("li-user").value.trim().toLowerCase();
  const pval = document.getElementById("li-pass").value;
  const msg  = document.getElementById("li-msg");
  const btn  = document.getElementById("li-submit");
  msg.className = "auth-msg";

  if (!uval) { msg.className="auth-msg err"; msg.textContent="Please enter your username."; return; }
  if (!pval) { msg.className="auth-msg err"; msg.textContent="Please enter your password."; return; }

  btn.disabled = true;
  msg.className="auth-msg"; msg.textContent="Signing in…";

  try {
    await fbAuth.signInWithEmailAndPassword(toEmail(uval), pval);
  } catch(e) {
    msg.className="auth-msg err";
    msg.textContent = (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential")
      ? "Incorrect username or password."
      : "Error: " + (e.message || "Something went wrong.");
    btn.disabled = false;
  }
};

/* Enter key in auth forms */
["su-user","su-pass","su-pass2"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => { if (e.key==="Enter") document.getElementById("su-submit").click(); });
});
["li-user","li-pass"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", e => { if (e.key==="Enter") document.getElementById("li-submit").click(); });
});

/* Overlay open/close */
function openSignup() {
  loginOverlay.classList.add("hidden");
  signupOverlay.classList.remove("hidden");
  setTimeout(() => document.getElementById("su-user").focus(), 50);
}
function openLogin() {
  signupOverlay.classList.add("hidden");
  loginOverlay.classList.remove("hidden");
  setTimeout(() => document.getElementById("li-user").focus(), 50);
}
function closeOverlays() {
  signupOverlay.classList.add("hidden");
  loginOverlay.classList.add("hidden");
}

document.getElementById("nav-login-btn").onclick   = openLogin;
document.getElementById("nav-signup-btn").onclick  = openSignup;
document.getElementById("hero-signup-btn").onclick = openSignup;
document.getElementById("hero-login-btn").onclick  = openLogin;
document.getElementById("su-to-login").onclick     = openLogin;
document.getElementById("li-to-signup").onclick    = openSignup;
document.getElementById("signup-close").onclick    = closeOverlays;
document.getElementById("login-close").onclick     = closeOverlays;
signupOverlay.onclick = e => { if (e.target===signupOverlay) closeOverlays(); };
loginOverlay.onclick  = e => { if (e.target===loginOverlay)  closeOverlays(); };

/* Logout */
logoutBtn.onclick = async () => {
  if (!confirm("Sign out of JARVIK AI?")) return;
  await fbAuth.signOut();
  location.reload();
};

/* ═══════════════════════════════════════════
   INIT  (Firebase handles session automatically)
═══════════════════════════════════════════ */
fbAuth.onAuthStateChanged(user => {
  if (user) {
    const username = user.displayName || user.email.replace("@jarvik.app", "");
    launchApp(username, user.uid);
  }
});


/* ═══════════════════════════════════════════
   SERVICE WORKER — inline blob (no extra file)
═══════════════════════════════════════════ */
if ("serviceWorker" in navigator) {
  const swCode = `
const CACHE = "jarvik-v1";
const ASSETS = ["/index.html","/style.css","/script.js"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.url.includes("openrouter.ai") || e.request.url.includes("puter.com")) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (e.request.method === "GET" && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match("/index.html")))
  );
});
  `;
  const blob = new Blob([swCode], { type: "application/javascript" });
  const url  = URL.createObjectURL(blob);
  navigator.serviceWorker.register(url)
    .then(() => URL.revokeObjectURL(url))
    .catch(() => {});
}
