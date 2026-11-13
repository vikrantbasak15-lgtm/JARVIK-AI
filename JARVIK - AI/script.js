/* ═══════════════════════════════════════════════════════════════
   JARVIK AI — Next-Gen Co-Work & Intelligence Studio
   Created by Vikrant · Claude Co-Work Workspace Architecture
═══════════════════════════════════════════════════════════════ */

/* ── CONSTANTS & STORAGE KEYS ── */
const KK     = "jarvik_openrouter_key"; // OpenRouter API key (legacy key, kept in sync with provider store)
const PKEY_K = "jarvik_provider_keys";  // {providerId: apiKey} — secrets, NEVER included in backups
const PCFG_K = "jarvik_providers";      // {active, endpoints, models, selected} — safe to back up
const MK   = "jarvik_model";            // Chosen model
const TK   = "jarvik_theme";            // Theme (dark/light)
const VK   = "jarvik_voice";            // TTS auto-speak (on/off)
const SFX_K= "jarvik_sfx";              // Sci-Fi UI sound effects (1/0)
const PK   = key => `jarvik_${key}`;    // Local storage namespace helper

/* Model catalog: curated frontier free & pro models */
const MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", desc: "Meta's flagship 70B · deep reasoning & versatile", tag: "free" },
  { id: "google/gemini-2.0-flash-exp:free",      name: "Gemini 2.0 Flash", desc: "Google frontier model · vision & ultra-fast", tag: "free" },
  { id: "deepseek/deepseek-r1:free",             name: "DeepSeek R1",      desc: "State-of-the-art open reasoning champion", tag: "free" },
  { id: "deepseek/deepseek-chat:free",           name: "DeepSeek V3",      desc: "DeepSeek's flagship general conversation", tag: "free" },
  { id: "qwen/qwen-2.5-coder-32b-instruct:free",  name: "Qwen 2.5 Coder",   desc: "Alibaba's benchmark-topping coding model", tag: "free" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Nemotron 3 Ultra", desc: "Nvidia 550B · 1M context window", tag: "free" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super", desc: "Nvidia 120B · fast, reliable everyday", tag: "free" },
  { id: "mistralai/mistral-small-3.2:free",      name: "Mistral Small 3.2",desc: "Agile, sharp, multilingual reasoning", tag: "free" },
  { id: "openrouter/free",                       name: "Auto Free Router", desc: "OpenRouter automatically routes to active free models", tag: "free" },
  { id: "anthropic/claude-3.5-sonnet",           name: "Claude 3.5 Sonnet",desc: "Industry-leading intelligence & artifacts (credits)", tag: "pro" },
  { id: "openai/gpt-4o",                         name: "GPT-4o",           desc: "OpenAI flagship multimodal (credits)", tag: "pro" }
];
const DEFAULT_MDL = "meta-llama/llama-3.3-70b-instruct:free";
const FALLBACK_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-chat:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openrouter/free"
];

/* System directive presets */
const PERSONAS = {
  Default: `You are JARVIK AI, an elite, helpful, harmless, and honest next-generation AI co-working companion created by Vikrant.
You operate as an expert pair-programmer, technical architect, and strategic thought partner.
Always use rich markdown formatting: clear headers, code blocks with correct language tags and optional filename (e.g. \`\`\`html filename=app.html), bold text, bullet points, and KaTeX LaTeX formulas ($...$ or $$...$$).
When building software, write complete runnable solutions. If asked for a plan, structure it with checkable steps like "- [ ] Step 1: ...".`,
  "Senior Architect": `You are JARVIK AI in Senior Software Architect mode.
Prioritize clean code, robust software design patterns, maintainability, type safety, optimal asymptotic complexity, and security best practices.
Provide complete runnable code blocks with explanatory architecture rationale and Mermaid diagrams when appropriate.`,
  "Research Scientist": `You are JARVIK AI in Research Scientist mode.
Provide rigorous, structured, deeply reasoned answers with mathematical proofs and empirical citations.
Use KaTeX LaTeX notation ($...$ and $$...$$) for all mathematical expressions and formulas.`,
  "Patient Tutor": `You are JARVIK AI in Socratic Tutor mode.
Explain complex concepts using intuitive step-by-step analogies. Check for understanding, ask thought-provoking follow-up questions, and celebrate milestones.`,
  "Startup Mentor": `You are JARVIK AI in Startup Mentor mode.
Think like a Y Combinator partner: brutal honesty, focus on talking to users, unit economics, rapid shipping, distribution moat, and cutting non-essential work.`,
  "Sarcastic Butler": `You are JARVIK AI in Socratic Butler mode.
Reply as a witty, slightly droll, impeccably polite British butler who helps efficiently while delivering subtle, delightful dry humor.`,
  Pirate: `You are JARVIK AI in Pirate mode.
Speak like a charismatic swashbuckling pirate of the Caribbean, yet deliver 100% accurate, helpful, and technically sound answers.`
};

/* Slash commands catalog */
const SLASH_COMMANDS = [
  { cmd: "/code", desc: "Toggle Code Mode or generate full runnable code", prefix: "Please write full, clean, runnable code for: " },
  { cmd: "/explain", desc: "Explain concept simply with intuitive analogies", prefix: "Explain this concept simply, step-by-step with analogies: " },
  { cmd: "/fix", desc: "Debug code or analyze errors with solutions", prefix: "Find all bugs, explain the root causes, and provide the fixed code: \n```\n" },
  { cmd: "/summarize", desc: "Summarize text into structured key takeaways", prefix: "Provide a concise summary with executive bullet takeaways: \n" },
  { cmd: "/test", desc: "Write comprehensive unit tests with edge cases", prefix: "Write exhaustive unit test cases covering edge cases for: \n```\n" },
  { cmd: "/mermaid", desc: "Generate an interactive flowchart or architecture map", prefix: "Create an interactive Mermaid diagram (in a ```mermaid code block) visualizing: " },
  { cmd: "/sprint", desc: "Generate an interactive Co-Work sprint roadmap", prefix: "Create a structured, step-by-step co-work sprint plan with checkable tasks (- [ ]) for: " },
  { cmd: "/debate", desc: "Open debate mode where JARVIK challenges you", action: "debate" },
  { cmd: "/roast", desc: "Roast your conversation history playfully", action: "roast" },
  { cmd: "/da", desc: "Devil's Advocate ruthless pre-mortem", action: "da" },
  { cmd: "/genz", desc: "Translate text to Gen-Z slang", action: "genz" },
  { cmd: "/image", desc: "Generate an image via Pollinations AI", prefix: "Please generate an image of " },
  { cmd: "/compare", desc: "Compare same prompt across 2 models", action: "compare" },
  { cmd: "/clear", desc: "Start a fresh conversation", action: "clear" }
];

/* Starter prompts */
const STARTERS = [
  { i:"🚀", t:"Build an interactive web app with live canvas" },
  { i:"📊", t:"Design a microservices architecture in Mermaid" },
  { i:"📋", t:"Plan a product sprint roadmap for a new SaaS" },
  { i:"📐", t:"Derive machine learning backpropagation math" }
];

/* ── DOM REFERENCES ── */
const $ = id => document.getElementById(id);
const app           = $("app");
const cc            = $("chat-container");
const ui            = $("user-input");
const sb            = $("send-btn");
const stopGenBtn    = $("stop-gen-btn");
const mic           = $("mic-btn");
const miclbl        = $("miclbl");
const ab            = $("attach-btn");
const fi            = $("file-input");
const fb            = $("fbadge");
const npb           = $("new-project-btn");
const pl            = $("projects-list");
const ct            = $("chat-title");
const modelBadge    = $("model-badge");
const themeBtn      = $("theme-toggle");
const navThemeBtn   = $("nav-theme-btn");
const voiceBtn      = $("voice-toggle");
const sfxBtn        = $("sfx-toggle");
const pinsBtn       = $("pins-toggle");
const exportBtn     = $("export-btn");
const settingsBtn   = $("settings-btn");
const keyBtn        = $("key-btn");
const heroKeyBtn    = $("hero-key-btn");
const homeScreen    = $("home-screen");
const keyOverlay    = $("key-overlay");
const keyInput      = $("key-input");
const keyShow       = $("key-show");
const keySubmit     = $("key-submit");
const keyMsg        = $("key-msg");
const modal         = $("modal");
const mb            = $("modal-body");
const mc            = $("modal-close");
const jwf           = $("jw-font");
const jws           = $("jw-size");
const jwe           = $("jw-editor");
const dropOverlay   = $("drop-overlay");
const attPreview    = $("attachments-preview");
const slashPopup    = $("slash-popup");
const slashList     = $("slash-list");
const convSearch    = $("conv-search-input");
const convClear     = $("conv-search-clear");
const sbClearAll    = $("sb-clear-all");
const cmdPalette    = $("cmd-palette");
const cmdInput      = $("cmd-input");
const cmdResults    = $("cmd-results");
const cmdTrigger    = $("cmd-trigger");
const settingsModal = $("settings-modal");
const settingsClose = $("settings-close");
const settingsSave  = $("settings-save-btn");
const personaSelect = $("persona-select");
const customPromptEl= $("custom-system-prompt");
const paramTemp     = $("param-temp");
const paramTempText = $("param-temp-val");
const paramTokens   = $("param-tokens");
const paramTokensTxt= $("param-tokens-val");
const paramTopP     = $("param-top-p");
const paramTopPTxt  = $("param-top-p-val");
const sfxSetting    = $("sfx-setting-toggle");
const ttsVoiceSelect= $("tts-voice-select");
const ttsRateInput  = $("tts-rate");
const ttsRateText   = $("tts-rate-val");
const personaBadge  = $("current-persona-badge");

/* Co-Work Workspace DOM Refs */
const coworkTopBtn   = $("cowork-toggle-btn");
const sbCoworkBtn    = $("sb-cowork-btn");
const sprintToggleBtn= $("sprint-toggle-btn");
const sprintPanel    = $("sprint-panel");
const sprintList     = $("sprint-list");
const sprintProgress = $("sprint-progress-lbl");
const sprintAddBtn   = $("sprint-add-step-btn");
const sprintCloseBtn = $("sprint-close-btn");
const artDrawer      = $("artifacts-drawer");
const artTitle       = $("art-title");
const artFrame       = $("art-frame");
const artCodeEditor  = $("art-code-editor");
const artLogs        = $("art-console-logs");
const artCloseBtn    = $("art-close-btn");
const artFullscreenBtn = $("art-fullscreen-btn");
const artPreviewFsBtn = $("art-preview-fs-btn");
const artRunBtn      = $("art-run-btn");
const artSendToChatBtn= $("art-send-to-chat-btn");
const artCopyBtn     = $("art-copy-btn");
const artDownloadBtn = $("art-download-btn");
const artPopoutBtn   = $("art-popout-btn");
const artSwitcherBar = $("art-switcher-bar");
const artVersionSel  = $("art-version-select");
const canvasDock     = $("canvas-dock");
const canvasPromptInput = $("canvas-prompt-input");
const canvasSendBtn  = $("canvas-send-btn");
const topbarHomeBtn  = $("topbar-home-btn");
const sbHomeBtn      = $("sb-home-btn");
const artDataTab     = $("art-data-tab");
const artDataPane    = $("art-pane-data");
const dataContentArea= $("data-content-area");
const dataSearchInput= $("data-search-input");
const knowledgeBtn   = $("sb-knowledge-btn");
const knowledgeModal = $("knowledge-modal");
const knowledgeClose = $("knowledge-close");
const knowledgeDone  = $("knowledge-done-btn");
const knowledgeDrop  = $("knowledge-drop-area");
const knowledgeInput = $("knowledge-file-input");
const knowledgeList  = $("knowledge-list");
const knowledgeCount = $("knowledge-count-lbl");
const sbKnowledgeCnt = $("sb-knowledge-count");
const knowledgeClear = $("knowledge-clear-btn");

/* Modals */
const exportModal   = $("export-modal");
const exportClose   = $("export-close");
const pinsModal     = $("pins-modal");
const pinsClose     = $("pins-close");
const pinsList      = $("pins-list");
const lightboxModal = $("lightbox-modal");
const lightboxImg   = $("lightbox-img");
const lightboxClose = $("lightbox-close");
const lightboxSave  = $("lightbox-save");

/* ── STATE ── */
let MDL             = localStorage.getItem(MK) || DEFAULT_MDL;
let activePersona   = localStorage.getItem(PK("persona")) || "Default";
let customDirective = localStorage.getItem(PK("custom_prompt")) || "";
let ve              = localStorage.getItem(VK) === "on";
let sfxEnabled      = localStorage.getItem(SFX_K) !== "0"; // default ON
let busy            = false;
let abortController = null;
let debateMode      = false;
let debateTopic     = "";
let debateMem       = [];
let codeMode        = false;
let coworkMode      = true; // default side-by-side Claude Cowork mode
let demoMode        = false;
let attachedFiles   = [];
let appStarted      = false;
let slashActiveIdx  = 0;
let filteredSlash   = [];
let currentArtifact = { id: "art-1", title: "Live Canvas", code: "", versions: [] };
let sessionArtifacts= []; // array of artifacts in current session
let vscDirs = [];                  // virtual folders of the shared workspace
let termCwd = "";                  // terminal working directory (root-relative)
const artTreeOpen = new Set();     // collapsed folders in the canvas explorer
let sprintTasks     = []; // array of { id, text, done }

/* ── AUDIO SYNTHESIS FX (Zero-lag Web Audio API) ── */
class SoundEngine {
  constructor() { this.ctx = null; }
  init() {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }
  play(type) {
    if (!sfxEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
        osc.start(now); osc.stop(now + 0.03);
      } else if (type === "send") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.07);
        osc.start(now); osc.stop(now + 0.07);
      } else if (type === "complete") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.07);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        try { jbBorderBeat(); } catch (e) {}
      } else if (type === "mode") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
      }
    } catch(e) {}
  }
}
const sfx = new SoundEngine();

/* ── THEME MANAGEMENT: shared workspace palettes + ink-sweep reveal ── */
const THEMES6 = [
  { id: "black", name: "Pitch Black · Default", cls: "t-pitchblack", swatch: ["#000000", "#e8eef5"] },
  { id: "midnight", name: "Midnight Blue", cls: "", swatch: ["#080f1a", "#8196b2"] },
  { id: "light", name: "Warm Paper", cls: "light", swatch: ["#e4f4f7", "#0d8ea6"] },
  { id: "odysseus", name: "Odysseus Terminal", cls: "t-odysseus", swatch: ["#0b140e", "#8fa477"] },
  { id: "aurora", name: "Aurora Nebula", cls: "t-aurora", swatch: ["#110d1c", "#9c8fb8"] },
  { id: "ember", name: "Ember Forge", cls: "t-ember", swatch: ["#1b100b", "#bc8765"] },
  { id: "inkwell", name: "Inkwell Editorial", cls: "t-inkwell", swatch: ["#f5e8d6", "#b45309"] }
];
const THEME_K = "jarvik_theme6";
let _themeSweep = null;
function applyTheme(t) {
  const th = THEMES6.find(x => x.id === t) || THEMES6[0];
  document.body.classList.remove("t-pitchblack", "light", "t-odysseus", "t-aurora", "t-ember", "t-inkwell");
  if (th.cls) document.body.classList.add(th.cls);
  // Inkwell is a light theme: carry body.light too so every light-mode guard applies;
  // extras.css loads after style.css, so the t-inkwell variable block wins the cascade.
  if (th.id === "inkwell") document.body.classList.add("light");
  if (navThemeBtn) navThemeBtn.textContent = th.id === "light" ? "🌙 Dark mode" : "☀ " + th.name;
  if (themeBtn) themeBtn.title = "Theme: " + th.name + " (click to switch)";
  const mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.content = th.swatch[0];
}
/* Ink sweep: a radial ink-blot wipes over the screen from the click point while variables cross-fade underneath. */
function themeSweep(nextId, x, y) {
  if (_themeSweep) { applyTheme(nextId); return; }
  const d = document.createElement("div");
  d.className = "theme-sweep";
  d.style.left = x + "px"; d.style.top = y + "px";
  // Ink sweep in the NEW theme's own color — the Akira-style swipe-in
  d.style.background = `radial-gradient(circle, ${jbHexA((THEMES6.find(t => t.id === nextId) || THEMES6[0]).swatch[0], 0.96)} 0%, ${jbHexA((THEMES6.find(t => t.id === nextId) || THEMES6[0]).swatch[0], 0.72)} 55%, transparent 100%)`;
  d.style.setProperty("--ts-glow", (THEMES6.find(t => t.id === nextId) || THEMES6[0]).swatch[1]);
  document.body.appendChild(d);
  _themeSweep = d;
  setTimeout(() => applyTheme(nextId), 210);
  setTimeout(() => { d.classList.add("out"); }, 560);
  setTimeout(() => { d.remove(); _themeSweep = null; }, 1100);
}
function setTheme6(id, x, y) {
  if (!THEMES6.some(t => t.id === id) || id === currentThemeId()) return;
  localStorage.setItem(THEME_K, id); localStorage.setItem(TK, ["light", "inkwell"].includes(id) ? "light" : "dark");
  try { sfx.play("mode"); } catch (e) {}
  themeSweep(id, x, y);
  toast("Theme: " + (THEMES6.find(t => t.id === id) || THEMES6[0]).name);
  try { window.jbAchTheme && window.jbAchTheme(id); } catch (e) {}
  try { window.jbWallKick && window.jbWallKick(0.8); } catch (e) {}
}
function currentThemeId() {
  const b = document.body;
  return b.classList.contains("t-pitchblack") ? "black" : b.classList.contains("t-odysseus") ? "odysseus" : b.classList.contains("t-aurora") ? "aurora" : b.classList.contains("t-ember") ? "ember" : b.classList.contains("t-inkwell") ? "inkwell" : b.classList.contains("light") ? "light" : "midnight";
}
function showThemePicker(cx, cy) {
  mb.innerHTML = `<div class="mp-title">Appearance</div>
    <div class="mp-sub">Choose a color for the whole workspace, or go pitch black.</div>
    <div class="theme-grid">${THEMES6.map(t => `
      <button class="theme-card${t.id === currentThemeId() ? " on" : ""}" data-th="${t.id}" style="--sw1:${t.swatch[0]};--sw2:${t.swatch[1]}">
        <span class="theme-card-sw"></span><span class="theme-card-name">${t.name}</span>
        ${t.id === currentThemeId() ? '<span class="theme-card-check">✓</span>' : ""}
      </button>`).join("")}</div>`;
  modal.classList.remove("hidden");
  mb.querySelectorAll(".theme-card").forEach(b => {
    b.onclick = e => {
      modal.classList.add("hidden");
      setTheme6(b.dataset.th, e.clientX || innerWidth / 2, e.clientY || 60);
    };
  });
}
function cycleTheme(e) {
  const i = THEMES6.findIndex(t => t.id === currentThemeId());
  setTheme6(THEMES6[(i + 1) % THEMES6.length].id, (e && e.clientX) || innerWidth / 2, (e && e.clientY) || 60);
}
applyTheme(THEMES6.some(t => t.id === localStorage.getItem(THEME_K)) ? localStorage.getItem(THEME_K) : (localStorage.getItem(TK) === "light" ? "light" : "black"));
if (themeBtn) themeBtn.onclick = e => showThemePicker(e.clientX, e.clientY);
if (navThemeBtn && !navThemeBtn._t6) { navThemeBtn._t6 = 1; navThemeBtn.onclick = e => { e.preventDefault(); showThemePicker(e.clientX, e.clientY); }; }

/* ── SFX & VOICE TOGGLES ── */
function syncSFX() {
  if (!sfxBtn) return;
  sfxBtn.classList.toggle("on", sfxEnabled);
  sfxBtn.title = sfxEnabled ? "Sound effects: ON (click to mute)" : "Sound effects: OFF (click to enable)";
  const icon = sfxBtn.querySelector(".sfx-icon");
  if (icon) icon.textContent = sfxEnabled ? "🔊" : "🔇";
}
if (sfxBtn) {
  sfxBtn.onclick = () => {
    sfxEnabled = !sfxEnabled;
    localStorage.setItem(SFX_K, sfxEnabled ? "1" : "0");
    if (sfxSetting) sfxSetting.checked = sfxEnabled;
    syncSFX();
    if (sfxEnabled) sfx.play("complete");
  };
  syncSFX();
}

function syncVoice() {
  if (!voiceBtn) return;
  voiceBtn.classList.toggle("on", ve);
  voiceBtn.title = ve ? "Voice auto-read ON (click to mute)" : "Voice auto-read OFF (click to enable)";
}
if (voiceBtn) {
  voiceBtn.onclick = () => {
    ve = !ve;
    localStorage.setItem(VK, ve ? "on" : "off");
    if (!ve && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    syncVoice();
    sfx.play("click");
    toast(ve ? "Voice speech enabled" : "Voice speech disabled");
  };
  syncVoice();
}

/* ── MODEL PICKER ── */
function updateModelBadge() {
  const p = activeProvider();
  const m = MODELS.find(x => x.id === MDL);
  const displayName = m ? m.name : (MDL.split("/").pop() || "No model");
  let suffix;
  if (p.id === "openrouter") suffix = m && m.tag === "pro" ? "Pro" : "Free";  // legacy badge behavior
  else suffix = p.short;
  if (modelBadge) modelBadge.textContent = `${displayName} · ${suffix}`;
}
if (modelBadge) {
  modelBadge.onclick = () => {
    sfx.play("click");
    showModelPickerModal();
  };
}

function showModelPickerModal() {
  const p = activeProvider();
  const list = currentModelList();
  const subText = p.id === "openrouter"
    ? "Choose from the world's best free and pro models. If one model is busy, JARVIK gracefully falls back to another free model."
    : `Models available on ${p.label}${p.id === "ollama" ? " — press Fetch to load your local models" : " — press Fetch to load the live catalog, or type any model ID"}.`;
  const customPlaceholder = p.id === "openrouter"
    ? "Or enter custom OpenRouter model ID…"
    : `Or enter a ${p.label} model ID…`;
  mb.innerHTML = `
    <div class="mp-title">Select AI Model</div>
    <div class="mp-sub">${subText}</div>
    <div class="custom-model-row">
      <input type="text" id="custom-model-input" placeholder="${customPlaceholder}" value="${list.some(x => x.id === MDL) ? "" : esc(MDL)}">
      <button id="custom-model-apply" class="hcta main" style="padding:6px 14px;font-size:12px">Apply</button>
      ${p.id === "openrouter" ? "" : `<button id="custom-model-fetch" class="hcta sec" style="padding:6px 14px;font-size:12px" title="GET ${esc(p.baseUrl)}/models">Fetch</button>`}
    </div>
    <div class="mp-list">
      ${list.length ? list.map(m => `
        <div class="mp-row ${m.id === MDL ? "sel" : ""}" data-m="${esc(m.id)}">
          <div class="mp-check">${m.id === MDL ? "✓" : ""}</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px">
              <span class="mp-name">${esc(m.name)}</span>
              <span class="mp-badge-tag ${m.tag}">${m.tag.toUpperCase()}</span>
            </div>
            <div class="mp-desc">${esc(m.desc)}</div>
            <div class="mp-id">${esc(m.id)}</div>
          </div>
        </div>
      `).join("") : `<div class="eml" style="padding:16px">No ${esc(p.label)} models loaded yet. Press <strong>Fetch</strong> or type a model ID above.</div>`}
    </div>
  `;
  modal.classList.remove("hidden");

  const pickModel = (id, label) => {
    MDL = id;
    localStorage.setItem(MK, MDL);
    pcfg.selected[p.id] = id; savePcfg();
    updateModelBadge();
    modal.classList.add("hidden");
    sfx.play("complete");
    toast("Model switched: " + label);
  };

  mb.querySelectorAll(".mp-row").forEach(row => {
    row.onclick = () => {
      const id = row.dataset.m;
      pickModel(id, (list.find(x => x.id === id)?.name) || id);
    };
  });

  const customInput = document.getElementById("custom-model-input");
  const customApply = document.getElementById("custom-model-apply");
  if (customApply && customInput) {
    const applyCustom = () => {
      const v = customInput.value.trim();
      if (!v) return;
      pickModel(v, v);
    };
    customApply.onclick = applyCustom;
    customInput.onkeydown = e => { if (e.key === "Enter") applyCustom(); };
  }
  const fetchBtn = document.getElementById("custom-model-fetch");
  if (fetchBtn) {
    fetchBtn.onclick = async () => {
      fetchBtn.disabled = true; fetchBtn.textContent = "…";
      try {
        const ids = await fetchProviderModels();
        toast(`Loaded ${ids.length} ${p.label} models`);
        showModelPickerModal();   // re-render with live list
      } catch (err) {
        fetchBtn.disabled = false; fetchBtn.textContent = "Fetch";
        toast(`${p.label} model list failed: ${err.message}`);
      }
    };
  }
}

/* ── STORAGE HELPERS ── */
const getP        = () => JarvikRuntime.readJSON(PK("proj"), []);
const saveP       = p  => localStorage.setItem(PK("proj"), JSON.stringify(p));
const getCur      = () => localStorage.getItem(PK("cur"));
const setCur      = id => localStorage.setItem(PK("cur"), id);
const getMem      = () => JarvikRuntime.readJSON(PK("mem"), []);
const saveMem     = m  => localStorage.setItem(PK("mem"), JSON.stringify(m));
const getPins     = () => JarvikRuntime.readJSON(PK("pins"), []);
const savePins    = p  => localStorage.setItem(PK("pins"), JSON.stringify(p));
const getKnowledge= () => JarvikRuntime.readJSON(PK("knowledge"), []);
const saveKnowledge=k => localStorage.setItem(PK("knowledge"), JSON.stringify(k));

/* ── USAGE ANALYTICS: estimated tokens/spend + top prompts ── */
const UA_K = "jarvik_usage", UA_RATE = { "anthropic/claude-3.5-sonnet": 0.015, "openai/gpt-4o": 0.015 };
const uaGet = () => { try { return JSON.parse(localStorage.getItem(UA_K)) || { events: [] }; } catch (e) { return { events: [] }; } };
const uaSave = u => { try { localStorage.setItem(UA_K, JSON.stringify(u)); } catch (e) {} };
function uaLog(words, prompt) { try { const u = uaGet(), t = Math.ceil(words * 1.33); u.events.push({ t: Date.now(), model: MDL, provider: activeProvider().id, words, estTokens: t, estCost: t / 1e3 * (UA_RATE[MDL] || 0), chatId: getCur(), prompt: String(prompt || "").slice(0, 80) }); uaSave({ events: u.events.slice(-500) }); } catch (e) {} }
// ponytail: estimated tokens/cost, 500-event cap; upgrade to provider usage API + IndexedDB when billing matters.
console.assert(Math.ceil(3 * 1.33) === 4, "ua tok self-check");
function showUA() {
  const evts = uaGet().events, ps = getP(), tn = id => ((ps.find(x => x.id === id) || {}).title) || "deleted";
  const g = k => { const m = {}; evts.forEach(e => { const key = k(e); if (key !== undefined) m[key] = (m[key] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const tot = evts.reduce((a, e) => a + e.estTokens, 0), sp = evts.reduce((a, e) => a + e.estCost, 0);
  const tbl = o => o.map(([k, v]) => `<tr><td>${esc(String(k).split("/").pop())}</td><td>${v}</td></tr>`).join("") || `<tr><td colspan="2">No data</td></tr>`;
  mb.innerHTML = `<div class="mp-title">Usage Analytics</div><div class="mp-sub">Estimated only.</div>
<div id="ua-totals"><div id="ua-total"><b>${evts.length}</b>prompts</div><div id="ua-total"><b>${tot}</b>est tokens</div><div id="ua-total"><b>$${sp.toFixed(4)}</b>est spend</div></div>
<table id="ua-table"><tr><th>Model</th><th>Uses</th></tr>${tbl(g(e => e.model))}</table>
<table id="ua-table"><tr><th>Project</th><th>Uses</th></tr>${tbl(g(e => tn(e.chatId)))}</table>
<ol id="ua-list">${g(e => e.prompt).slice(0, 10).map(([k, v]) => `<li>${esc(k)} (${v})</li>`).join("") || "<li>No data</li>"}</ol>
<div id="ua-row"><button id="ua-clear" class="hcta sec">Clear</button><button id="ua-csv" class="hcta main">Export CSV</button></div>`;
  modal.classList.remove("hidden");
  const cl = $("ua-clear"); if (cl) cl.onclick = () => { uaSave({ events: [] }); showUA(); };
  const cv = $("ua-csv"); if (cv) cv.onclick = () => { const r = ["t,model,provider,words,estTokens,estCost,chatId,prompt", ...uaGet().events.map(e => [e.t, e.model, e.provider, e.words, e.estTokens, e.estCost.toFixed(5), e.chatId, '"' + String(e.prompt).replace(/"/g, '""') + '"'].join(","))].join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r], { type: "text/csv" })); a.download = "jarvik_usage.csv"; a.click(); };
}
/* Team Rooms + Usage Analytics are free for everyone — no gates, no licenses. */

/* ── MULTI-PROVIDER ENGINE ───────────────────────────────────────
   Presets cover OpenAI-compatible endpoints (OpenRouter, NVIDIA NIM,
   Groq, Together, Mistral, DeepSeek, Gemini-compat, Ollama, custom)
   plus Anthropic's native Messages API. Every provider's base URL is
   user-editable, so gateways like LM Studio / vLLM work as "Custom". */
const PROVIDERS = [
  { id:"openrouter", label:"OpenRouter",  short:"OpenRouter", baseUrl:"https://openrouter.ai/api/v1",          fmt:"openai",     keyHint:"sk-or-v1-…",          defaultModel:"openrouter/free",              blurb:"Free + frontier models" },
  { id:"nvidia",     label:"NVIDIA NIM",  short:"NVIDIA",     baseUrl:"https://integrate.api.nvidia.com/v1",  fmt:"openai",     keyHint:"nvapi-…",             defaultModel:"meta/llama-3.1-8b-instruct",    blurb:"NIM hosted endpoints" },
  { id:"openai",     label:"OpenAI",      short:"OpenAI",     baseUrl:"https://api.openai.com/v1",            fmt:"openai",     keyHint:"sk-…",                defaultModel:"gpt-4o-mini",                   blurb:"GPT family" },
  { id:"anthropic",  label:"Anthropic",   short:"Claude",     baseUrl:"https://api.anthropic.com/v1",         fmt:"anthropic",  keyHint:"sk-ant-…",            defaultModel:"claude-sonnet-4-5",             blurb:"Claude models" },
  { id:"gemini",     label:"Google Gemini", short:"Gemini",   baseUrl:"https://generativelanguage.googleapis.com/v1beta/openai", fmt:"openai", keyHint:"AIza…",       defaultModel:"gemini-2.5-flash",              blurb:"OpenAI-compatible endpoint" },
  { id:"groq",       label:"Groq",        short:"Groq",       baseUrl:"https://api.groq.com/openai/v1",        fmt:"openai",     keyHint:"gsk_…",               defaultModel:"llama-3.3-70b-versatile",        blurb:"Ultra-fast inference" },
  { id:"together",   label:"Together AI", short:"Together",   baseUrl:"https://api.together.xyz/v1",           fmt:"openai",     keyHint:"…",                   defaultModel:"meta-llama/Llama-3.3-70B-Instruct-Turbo", blurb:"Open model hosting" },
  { id:"mistral",    label:"Mistral",     short:"Mistral",    baseUrl:"https://api.mistral.ai/v1",              fmt:"openai",     keyHint:"…",                   defaultModel:"mistral-small-latest",          blurb:"Mistral family" },
  { id:"deepseek",   label:"DeepSeek",    short:"DeepSeek",   baseUrl:"https://api.deepseek.com/v1",           fmt:"openai",     keyHint:"sk-…",                defaultModel:"deepseek-chat",                 blurb:"R1 + V3 models" },
  { id:"ollama",     label:"Ollama (Local)", short:"Ollama",  baseUrl:"http://localhost:11434/v1",             fmt:"openai",     keyHint:"no key needed",       defaultModel:"",                             blurb:"Your machine, offline", keyless:true },
  { id:"custom",     label:"Custom Endpoint", short:"Custom", baseUrl:"",                                      fmt:"openai",     keyHint:"optional",            defaultModel:"",                             blurb:"Any OpenAI-compatible API", keyless:true, custom:true }
];
const PROVIDER_IDS = () => PROVIDERS.map(p => p.id);
const providerDef  = id => PROVIDERS.find(p => p.id === id) || PROVIDERS[0];

function loadJSON(k, fb) { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch (e) { return fb; } }
function saveJSON(k, v)  { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

let pkeys = loadJSON(PKEY_K, null);
if (!pkeys) {                       // migrate the legacy OpenRouter key once
  const legacy = (localStorage.getItem(KK) || "").trim();
  pkeys = legacy ? { openrouter: legacy } : {};
  saveJSON(PKEY_K, pkeys);
}
let pcfg = Object.assign({ active: "openrouter", endpoints: {}, models: {}, selected: {} }, loadJSON(PCFG_K, {}));
if (!PROVIDER_IDS().includes(pcfg.active)) pcfg.active = "openrouter";
function savePcfg() { saveJSON(PCFG_K, pcfg); }

function activeProvider() {
  const def = providerDef(pcfg.active);
  return Object.assign({}, def, { baseUrl: (pcfg.endpoints[def.id] || def.baseUrl || "").replace(/\/+$/, "") });
}
function providerKey(id) {
  return (pkeys[id] || (id === "openrouter" ? (localStorage.getItem(KK) || "") : "")).trim();
}
function saveProviderKey(id, v) {
  v = (v || "").trim();
  if (v) pkeys[id] = v; else delete pkeys[id];
  saveJSON(PKEY_K, pkeys);
  if (id === "openrouter") { if (v) localStorage.setItem(KK, v); else localStorage.removeItem(KK); } // keep legacy key in sync
}
function setActiveProvider(id) {
  if (!PROVIDER_IDS().includes(id)) return;
  pcfg.active = id; savePcfg();
  const def = providerDef(id);
  MDL = pcfg.selected[id] || def.defaultModel || DEFAULT_MDL;
  localStorage.setItem(MK, MDL);
  if (typeof updateModelBadge === "function") updateModelBadge();
  if (typeof renderProvPanel === "function") renderProvPanel();
  // Providers without a preset model (Ollama / Custom): surface the picker so the user picks one
  if (!pcfg.selected[id] && !def.defaultModel && appStarted && typeof showModelPickerModal === "function") {
    setTimeout(() => showModelPickerModal(), 350);
  }
}
function getApiKey() { return providerKey(pcfg.active); }
function hasApiKey() { const p = activeProvider(); return p.keyless || getApiKey().length > 10; }
function providerNoun() { return activeProvider().label; }

function validateProviderKey(id, v) {
  if (!v) return providerDef(id).keyless ? null : "Please paste your " + providerDef(id).label + " API key.";
  if (id === "openrouter" && !v.startsWith("sk-or-")) return "That doesn't look like an OpenRouter key (starts with sk-or-).";
  if (id === "anthropic" && !v.startsWith("sk-ant-")) return "That doesn't look like an Anthropic key (starts with sk-ant-).";
  if (v.length < 10) return "That " + providerDef(id).label + " key looks too short.";
  return null;
}

/* Endpoint & request/response adapters */
function chatEndpoint(p) { p = p || activeProvider(); return p.baseUrl + (p.fmt === "anthropic" ? "/messages" : "/chat/completions"); }
function authHeaders(p) {
  p = p || activeProvider();
  const h = { "Content-Type": "application/json" };
  const key = providerKey(p.id);
  if (p.fmt === "anthropic") {
    if (key) h["x-api-key"] = key;
    h["anthropic-version"] = "2023-06-01";
    h["anthropic-dangerous-direct-browser-access"] = "true"; // enables CORS for direct browser calls
  } else if (key) {
    h["Authorization"] = "Bearer " + key;
    if (p.id === "openrouter") {       // OpenRouter-only attribution headers (others may reject them)
      h["HTTP-Referer"]  = location.origin || "https://jarvik.local";
      h["X-Title"]       = "JARVIK AI Co-Work Studio by Vikrant";
    }
  }
  return h;
}
function dataUrlToImageBlock(url) {
  const m = /^data:(image\/[^;]+);base64,([\s\S]+)$/.exec(url || "");
  if (!m) return null;
  return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
}
function buildChatBody(messages, opts, stream) {
  opts = opts || {};
  const p = activeProvider();
  const temp  = parseFloat(paramTemp ? paramTemp.value : 0.7);
  const maxT  = parseInt(paramTokens ? paramTokens.value : 4096);
  const topP  = parseFloat(paramTopP ? paramTopP.value : 0.9);
  if (p.fmt === "anthropic") {
    const sysParts = [], rest = [];
    messages.forEach(m => {
      if (m.role === "system") sysParts.push(typeof m.content === "string" ? m.content : JSON.stringify(m.content));
      else rest.push({
        role: m.role,
        content: Array.isArray(m.content)
          ? m.content.map(c => (c.type === "image_url" && c.image_url ? (dataUrlToImageBlock(c.image_url.url) || { type: "text", text: "[image]" }) : c)).filter(Boolean)
          : m.content
      });
    });
    const body = { model: opts.model || MDL, max_tokens: opts.maxTokens || maxT || 4096 };
    if (sysParts.length) body.system = sysParts.join("\n\n");
    body.messages = rest;
    if (stream) body.stream = true;
    if (isFinite(temp)) body.temperature = Math.max(0, Math.min(1, temp)); // Anthropic caps temperature at 1
    return body;
  }
  return {
    model: opts.model || MDL,
    messages,
    stream: !!stream,
    temperature: isFinite(temp) ? temp : 0.7,
    max_tokens: opts.maxTokens || maxT || 4096,
    top_p: isFinite(topP) ? topP : 0.9
  };
}
function parseCompletion(json) {
  const p = activeProvider();
  if (p.fmt === "anthropic") return (json && json.content || []).filter(c => c.type === "text").map(c => c.text).join("");
  return json?.choices?.[0]?.message?.content || "";
}
/* Returns the text delta for one parsed SSE payload, or null if it carries none.
   Handles both OpenAI-style and Anthropic-style event payloads. */
function sseDelta(payload) {
  const p = activeProvider();
  if (p.fmt === "anthropic") {
    return (payload && payload.type === "content_block_delta" && payload.delta && typeof payload.delta.text === "string") ? payload.delta.text : null;
  }
  const d = payload && payload.choices && payload.choices[0] && payload.choices[0].delta && payload.choices[0].delta.content;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map(x => (x && x.text) || "").join("");
  return null;
}
/* Non-streaming one-shot chat used by Roast / Devil's Advocate / Gen-Z. Returns text or throws. */
async function chatOnce(messages, opts) {
  const p = activeProvider();
  const res = await fetch(chatEndpoint(p), {
    method: "POST",
    headers: authHeaders(p),
    body: JSON.stringify(buildChatBody(messages, opts, false))
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error?.message || ("HTTP " + res.status + " " + res.statusText));
  }
  return parseCompletion(await res.json());
}
/* List model IDs from the active provider (GET {baseUrl}/models). */
async function fetchProviderModels() {
  const p = activeProvider();
  if (!p.baseUrl) throw new Error("Set an endpoint base URL first.");
  const res = await fetch(p.baseUrl.replace(/\/+$/, "") + "/models", { headers: authHeaders(p) });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error?.message || ("HTTP " + res.status + " " + res.statusText));
  }
  const j = await res.json();
  const arr = Array.isArray(j.data) ? j.data : (Array.isArray(j.models) ? j.models : []);
  const ids = arr.map(x => (typeof x === "string" ? x : (x.id || x.name || ""))).filter(Boolean);
  if (!ids.length) throw new Error("Endpoint responded but returned no model IDs.");
  pcfg.models[p.id] = ids; savePcfg();
  return ids;
}
function currentModelList() {
  const p = activeProvider();
  if (p.id === "openrouter") return MODELS;
  return (pcfg.models[p.id] || []).map(id => ({ id, name: id.split("/").pop(), desc: "From " + p.label, tag: "prov" }));
}
const keyProviderSelect = $("key-provider-select");
function refreshKeyModalFields() {
  const id = keyProviderSelect ? keyProviderSelect.value : pcfg.active;
  const def = providerDef(id);
  if (keyInput) {
    /* never surface the stored key — empty field + saved-state hint only */
    keyInput.value = "";
    keyInput.placeholder = providerKey(id) ? "Key saved ✓ — paste a new key to replace" : (def.keyHint || "API key…");
  }
}
function showKeyModal() {
  if (keyProviderSelect) {
    keyProviderSelect.innerHTML = PROVIDERS.map(p =>
      `<option value="${p.id}" ${p.id === pcfg.active ? "selected" : ""}>${p.label}${providerKey(p.id) ? " ✓" : ""}</option>`
    ).join("");
    keyProviderSelect.onchange = refreshKeyModalFields;
  }
  refreshKeyModalFields();
  keyMsg.className = "auth-msg"; keyMsg.textContent = "";
  keyOverlay.classList.remove("hidden");
  setTimeout(() => keyInput.focus(), 60);
}
if (keyShow) keyShow.onchange = () => { keyInput.type = keyShow.checked ? "text" : "password"; };
if (keySubmit) {
  keySubmit.onclick = () => {
    const id = keyProviderSelect ? keyProviderSelect.value : pcfg.active;
    const def = providerDef(id);
    const v = keyInput.value.trim();
    const err = validateProviderKey(id, v);
    if (err) { keyMsg.className = "auth-msg err"; keyMsg.textContent = err; return; }
    saveProviderKey(id, v);
    if (id !== pcfg.active) setActiveProvider(id);
    keyInput.value = "";
    keyOverlay.classList.add("hidden");
    sfx.play("complete");
    toast(v ? "API key saved locally." : `Key cleared for ${def.label}`);
  };
}
if (keyInput) keyInput.addEventListener("keydown", e => { if (e.key === "Enter") keySubmit.click(); });
if (keyBtn) keyBtn.onclick = showKeyModal;
if (heroKeyBtn) heroKeyBtn.onclick = showKeyModal;

/* Key modal dismissals: close button, click outside, Escape */
const keyCloseBtn = $("key-close");
if (keyCloseBtn) keyCloseBtn.onclick = () => keyOverlay.classList.add("hidden");
if (keyOverlay) keyOverlay.addEventListener("click", e => { if (e.target === keyOverlay) keyOverlay.classList.add("hidden"); });
window.addEventListener("keydown", e => {
  if (e.key === "Escape" && keyOverlay && !keyOverlay.classList.contains("hidden")) keyOverlay.classList.add("hidden");
});

/* Guest / Demo button in key modal */
const keyGuestBtn = $("key-guest-btn");
if (keyGuestBtn) {
  keyGuestBtn.onclick = () => {
    demoMode = true;
    keyOverlay.classList.add("hidden");
    boot();
    toast("⚡ Demo Mode Active: Co-Work Canvas ready!");
  };
}

/* ── UTILITIES ── */
const uid  = () => "j" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc  = s => String(s || "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const relt = ts => {
  const d = new Date(ts), n = new Date();
  return d.toDateString() === n.toDateString()
    ? d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })
    : d.toLocaleDateString([], { month:"short", day:"numeric" });
};
function grow(el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 180) + "px"; }
function scroll() { cc.scrollTop = cc.scrollHeight; }

function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._h);
  toast._h = setTimeout(() => t.classList.remove("show"), 3200);
}

/* Scratch Pad Notes */
function loadNotes() {
  try {
    const d = JSON.parse(localStorage.getItem(PK("notes")) || "{}");
    if (d.html && jwe) jwe.innerHTML = d.html;
    if (d.font && jwf) jwf.value = d.font;
    if (d.size && jws) jws.value = d.size;
    applyNote();
  } catch(e) {}
}
function saveNotes() {
  if (!jwe) return;
  localStorage.setItem(PK("notes"), JSON.stringify({
    html: jwe.innerHTML,
    font: jwf ? jwf.value : "",
    size: jws ? jws.value : ""
  }));
}
function applyNote() {
  if (!jwe) return;
  if (jwf) jwe.style.fontFamily = jwf.value;
  if (jws) jwe.style.fontSize = jws.value;
}
if (jwf) jwf.onchange = () => { applyNote(); saveNotes(); };
if (jws) jws.onchange = () => { applyNote(); saveNotes(); };
if (jwe) jwe.oninput  = saveNotes;

/* File download helper */
const EXT_LANG = {
  js:"javascript", ts:"typescript", py:"python", html:"html", css:"css",
  json:"json", md:"markdown", csv:"csv", java:"java", c:"c", cpp:"cpp",
  cs:"csharp", go:"go", rs:"rust", rb:"ruby", php:"php", sh:"bash",
  yml:"yaml", yaml:"yaml", xml:"xml", sql:"sql", txt:"text"
};
const MIME = {
  js:"text/javascript", ts:"text/typescript", py:"text/x-python", html:"text/html",
  css:"text/css", json:"application/json", md:"text/markdown", csv:"text/csv",
  txt:"text/plain", xml:"application/xml", yml:"text/yaml", svg:"image/svg+xml",
  png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", webp:"image/webp"
};
function fileExt(name) { const m = (name || "").match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : ""; }
async function saveTextFile(name, text) {
  try {
    const a = document.createElement("a");
    a.href = "data:" + (MIME[fileExt(name)] || "text/plain") + ";charset=utf-8," + encodeURIComponent(text);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    toast(`💾 Downloaded ${name}`);
    sfx.play("complete");
    return true;
  } catch (e) {
    toast("❌ Save failed: " + e.message);
    return false;
  }
}

/* ── EMPTY STATE ── */
const REACTOR = `<svg class="reactor" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="38" stroke="currentColor" stroke-width="5" stroke-dasharray="24.5 5.3" stroke-dashoffset="2.65"/><path d="M18 26H82L50 80Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M30.8 33.2H69.2L50 65.6Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M40.4 38.6H59.6L50 54.8Z" fill="currentColor"/></svg>`;
const BAV = () => `<div class="bav">${REACTOR}</div>`;

function showEmpty() {
  cc.innerHTML = "";
  const el = document.createElement("div");
  el.className = "es"; el.id = "es";
  el.innerHTML = `
    <div class="esico">${REACTOR}</div>
    <div class="esh">JARVIK Co-Work Studio</div>
    <div class="esp">Collaborative workspace active. Brainstorm, write code, run live artifacts, or try a prompt:</div>
    <div class="sg">
      ${STARTERS.map(s => `<button class="sc" data-p="${esc(s.t)}"><span class="sci">${s.i}</span>${esc(s.t)}</button>`).join("")}
    </div>
  `;
  cc.appendChild(el);
  el.querySelectorAll(".sc").forEach(c => {
    c.onclick = () => {
      ui.value = c.dataset.p;
      grow(ui);
      ui.focus();
      sfx.play("click");
    };
  });
}

/* ── CONVERSATIONS / PROJECTS ── */
function renderProjs(filter = "") {
  let list = getP();
  const cur = getCur();
  pl.innerHTML = "";

  if (filter) {
    const q = filter.toLowerCase().trim();
    list = list.filter(p => (p.title || "").toLowerCase().includes(q) || (p.content || "").toLowerCase().includes(q));
  }
  list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.created || 0) - (a.created || 0));

  if (!list.length) {
    pl.innerHTML = `<div class="eml">${filter ? "No matching chats" : "No conversations yet"}</div>`;
    return;
  }

  list.forEach(pr => {
    const d = document.createElement("div");
    d.className = "ci" + (pr.id === cur ? " active" : "") + (pr.pinned ? " pinned" : "");
    d.innerHTML = `
      <div class="cdot"></div>
      <div class="cmeta">
        <div class="cname">${pr.pinned ? '<span class="pin-star">★</span>' : ''}${esc(pr.title)}</div>
        <div class="ctime">${relt(pr.created)}</div>
      </div>
      <div class="cbtns">
        <button class="cbtn pb" title="${pr.pinned ? 'Unpin' : 'Pin to top'}">${pr.pinned ? '★' : '☆'}</button>
        <button class="cbtn rb" title="Rename">✎</button>
        <button class="cbtn db" title="Delete">✕</button>
      </div>
    `;

    d.querySelector(".pb").onclick = e => {
      e.stopPropagation();
      const ps = getP(), idx = ps.findIndex(x => x.id === pr.id);
      if (idx !== -1) { ps[idx].pinned = !ps[idx].pinned; saveP(ps); renderProjs(convSearch.value); }
      sfx.play("click");
    };

    d.querySelector(".rb").onclick = e => {
      e.stopPropagation();
      const t = prompt("Rename conversation:", pr.title);
      if (!t || !t.trim()) return;
      const ps = getP(), idx = ps.findIndex(x => x.id === pr.id);
      if (idx !== -1) { ps[idx].title = t.trim(); saveP(ps); }
      renderProjs(convSearch.value);
      if (pr.id === getCur()) ct.textContent = t.trim();
    };

    d.querySelector(".db").onclick = e => {
      e.stopPropagation();
      if (!confirm(`Delete "${pr.title}"?`)) return;
      const ps = getP().filter(x => x.id !== pr.id);
      saveP(ps);
      if (pr.id === getCur()) {
        if (ps.length) setCur(ps[0].id); else newConv();
      }
      renderProjs(convSearch.value); loadChat();
      sfx.play("click");
    };

    d.onclick = () => {
      if (pr.id !== getCur()) {
        setCur(pr.id);
        try { jbPageFlip(); } catch (e) {}
        loadChat();
        renderProjs(convSearch.value);
        sfx.play("click");
      }
    };
    pl.appendChild(d);
  });
}

function loadChat() {
  const ps = getP(), id = getCur(), pr = ps.find(x => x.id === id);
  cc.innerHTML = pr ? JarvikRuntime.sanitize(pr.content || "") : "";
  ct.textContent = pr ? pr.title : "JARVIK AI";
  // DOM listeners do not survive HTML persistence. Reset only wiring markers.
  cc.querySelectorAll('[data-hyd], [data-hyd-bot], [data-cb]').forEach(el => {
    delete el.dataset.hyd; delete el.dataset.hydBot; delete el.dataset.cb;
  });
  cc.querySelectorAll('.jv-chip, .jv-trace').forEach(el => el.remove());
  cc.querySelectorAll('.msg-actions').forEach(el => { delete el.dataset.jvChips; delete el.dataset.jvAud; });
  enhanceRenderedElements(cc);
  syncChatMemory();
  if (typeof hydrateBranches === "function") hydrateBranches(cc);
  if (typeof hydrateUserActions === "function") hydrateUserActions(cc);
  extractArtifactsFromDOM();
  if (!cc.innerHTML.trim()) showEmpty();
  try { jbEmotionRing(pr); } catch (e) {}
  try { jbRenderScars(); } catch (e) {}
  scroll();
}

function saveChat() {
  const ps = getP(), id = getCur(), i = ps.findIndex(x => x.id === id);
  if (i !== -1) {
    ps[i].content = cc.innerHTML;
    saveP(ps);
    try { if (typeof tmPushChat === "function") tmPushChat(id); } catch (e) {}
  }
}

function newConv(title) {
  const id = uid(), ps = getP(), t = title || "New conversation";
  ps.unshift({ id, title: t, created: Date.now(), content: "", pinned: false });
  saveP(ps); setCur(id);
  saveMem([]);
  sessionArtifacts = [];
  updateArtifactSwitcherBar();
  renderProjs();
  cc.innerHTML = "";
  ct.textContent = t;
  showEmpty();
  sfx.play("mode");
}

if (convSearch) {
  convSearch.oninput = () => {
    const q = convSearch.value.trim();
    convClear.classList.toggle("hidden", !q);
    renderProjs(q);
  };
}
if (convClear) {
  convClear.onclick = () => {
    convSearch.value = "";
    convClear.classList.add("hidden");
    renderProjs();
  };
}
if (sbClearAll) {
  sbClearAll.onclick = () => {
    if (!confirm("Are you sure you want to clear ALL conversations? This cannot be undone.")) return;
    localStorage.removeItem(PK("proj"));
    localStorage.removeItem(PK("cur"));
    localStorage.removeItem(PK("mem"));
    newConv();
    toast("All conversations cleared");
  };
}
if (ct) {
  ct.onclick = () => {
    const curTitle = ct.textContent;
    const t = prompt("Edit conversation title:", curTitle);
    if (t && t.trim()) {
      const ps = getP(), id = getCur(), idx = ps.findIndex(x => x.id === id);
      if (idx !== -1) { ps[idx].title = t.trim(); saveP(ps); }
      ct.textContent = t.trim();
      renderProjs();
    }
  };
}

/* ── CLAUDE CO-WORK SPLIT-VIEW ENGINE ── */
function setCoworkMode(active) {
  coworkMode = active;
  app.classList.toggle("cowork-active", coworkMode);
  if (coworkTopBtn) {
    coworkTopBtn.classList.toggle("active", coworkMode);
    coworkTopBtn.title = coworkMode ? "Click to completely hide Co-Work Canvas" : "Click to open Co-Work Canvas";
  }
  if (sbCoworkBtn) {
    sbCoworkBtn.classList.toggle("active", coworkMode);
    const tag = sbCoworkBtn.querySelector(".pulse-tag");
    if (tag) {
      tag.textContent = coworkMode ? "ACTIVE" : "OFF";
      tag.style.background = coworkMode ? "rgba(52, 211, 153, 0.15)" : "rgba(255, 255, 255, 0.05)";
      tag.style.color = coworkMode ? "#34d399" : "var(--muted)";
      tag.style.borderColor = coworkMode ? "rgba(52, 211, 153, 0.3)" : "var(--border)";
    }
  }

  if (coworkMode) {
    artDrawer.classList.remove("hidden");
    if (!currentArtifact.code) {
      loadDefaultArtifact();
    }
  } else {
    artDrawer.classList.add("hidden");
    if (typeof canvasFullscreen !== "undefined" && canvasFullscreen) {
      toggleCanvasFullscreen(false);
    }
  }
}

function loadDefaultArtifact() {
  const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'DM Sans', system-ui, sans-serif; margin: 0; padding: 24px; background: #141413; color: #ececea; }
    h1 { color: #35d6e8; font-family: serif; }
    .card { background: #1d1d1b; border: 1px solid #2b2b29; border-radius: 12px; padding: 18px; margin-top: 14px; }
    button { background: #35d6e8; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; color: #0c1214; }
    button:hover { opacity: .9; }
  </style>
</head>
<body>
  <h1>⚡ JARVIK Co-Work Canvas</h1>
  <p>Welcome to your live collaborative workspace. Code, preview, and build together in real-time.</p>
  <div class="card">
    <h3>Interactive Widget Demo</h3>
    <p>Counter: <strong id="cnt">0</strong></p>
    <button onclick="inc()">Click to Increment</button>
  </div>
  <script>
    let c = 0;
    function inc() {
      c++;
      document.getElementById('cnt').textContent = c;
      console.log('Counter value updated to: ' + c);
    }
  <\/script>
</body>
</html>`;
  registerArtifact("Co-Work Welcome.html", defaultHtml, "html");
}

if (coworkTopBtn) coworkTopBtn.onclick = () => { setCoworkMode(!coworkMode); sfx.play("mode"); };
if (sbCoworkBtn) sbCoworkBtn.onclick = () => { if (!coworkMode) { setCoworkMode(true); toggleCanvasFullscreen(true); } else { toggleCanvasFullscreen(); } sfx.play("mode"); };

/* ── MULTI-ARTIFACT MANAGER (RENAME, REMOVE & ADD TABS) ── */
function registerArtifact(title, code, lang) {
  let art = sessionArtifacts.find(a => a.title.toLowerCase() === title.toLowerCase());
  if (art) {
    if (art.code !== code) {
      art.code = code;
      art.versions.push(code);
    }
  } else {
    art = { id: uid(), title, code, lang, versions: [code] };
    sessionArtifacts.push(art);
  }
  syncArtifactToWorkspace(title, code);
  updateArtifactSwitcherBar();
  openArtifact(art.title, art.code, art.lang);
}

function renameArtifact(oldTitle, newTitle) {
  newTitle = (newTitle || "").trim();
  if (!newTitle || newTitle === oldTitle) return;
  const art = sessionArtifacts.find(a => a.title === oldTitle);
  if (!art) return;

  const duplicate = sessionArtifacts.find(a => a !== art && a.title.toLowerCase() === newTitle.toLowerCase());
  if (duplicate) {
    toast(`⚠️ A tab named "${newTitle}" already exists`);
    return;
  }

  art.title = newTitle;
  const ext = fileExt(newTitle);
  if (ext) art.lang = ext;
  if (vscFiles[oldTitle]) {
    vscFiles[newTitle] = vscFiles[oldTitle];
    delete vscFiles[oldTitle];
    if (vscActiveFile === oldTitle) vscActiveFile = newTitle;
    vscOpenTabs = vscOpenTabs.map(f => (f === oldTitle ? newTitle : f));
    saveWorkspaceSoon();
    refreshWorkspaceViews();
  }

  if (currentArtifact.title === oldTitle) {
    currentArtifact.title = newTitle;
    if (ext) currentArtifact.lang = ext;
    if (artTitle) artTitle.textContent = newTitle;
  }
  updateArtifactSwitcherBar();
  toast(`Renamed tab to "${newTitle}"`);
}

function removeArtifact(title) {
  const index = sessionArtifacts.findIndex(a => a.title === title);
  if (index === -1) return;

  sessionArtifacts.splice(index, 1);
  toast(`Removed tab "${title}"`);

  if (currentArtifact.title === title) {
    if (sessionArtifacts.length > 0) {
      const nextArt = sessionArtifacts[Math.min(index, sessionArtifacts.length - 1)];
      openArtifact(nextArt.title, nextArt.code, nextArt.lang);
    } else {
      const blankHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <style>body{font-family:'DM Sans',sans-serif;padding:24px;background:#141413;color:#ececea;}</style>\n</head>\n<body>\n  <h2>Blank Canvas</h2>\n  <p>Start writing code or asking JARVIK to generate an artifact.</p>\n</body>\n</html>`;
      registerArtifact("untitled.html", blankHtml, "html");
    }
  } else {
    updateArtifactSwitcherBar();
  }
}

function addNewArtifactTab() {
  let count = sessionArtifacts.length + 1;
  let newTitle = `tab-${count}.html`;
  while (sessionArtifacts.some(a => a.title === newTitle)) {
    count++;
    newTitle = `tab-${count}.html`;
  }
  const defaultCode = `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <style>body{font-family:'DM Sans',sans-serif;padding:24px;background:#141413;color:#ececea;}h2{color:#35d6e8;font-family:serif;}</style>\n</head>\n<body>\n  <h2>${newTitle}</h2>\n  <p>Live interactive preview tab. Edit code or run widgets here.</p>\n</body>\n</html>`;
  registerArtifact(newTitle, defaultCode, "html");
  toast(`Created tab "${newTitle}"`);
}

function updateArtifactSwitcherBar() {
  if (!artSwitcherBar) return;
  artSwitcherBar.innerHTML = "";
  if (!sessionArtifacts.length) {
    artSwitcherBar.style.display = "none";
    return;
  }
  artSwitcherBar.style.display = "flex";

  sessionArtifacts.forEach(art => {
    const chip = document.createElement("div");
    chip.className = "art-tab-chip" + (art.title === currentArtifact.title ? " active" : "");
    chip.dataset.title = art.title;
    chip.title = `${art.title} (Double-click to rename)`;

    const iconSpan = document.createElement("span");
    iconSpan.className = "art-tab-icon";
    iconSpan.textContent = getLangIcon(art.lang);

    const nameSpan = document.createElement("span");
    nameSpan.className = "art-tab-name";
    nameSpan.textContent = art.title;

    function startTabRename(e) {
      if (e) e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.className = "art-tab-rename-input";
      input.value = art.title;
      nameSpan.replaceWith(input);
      input.focus();
      input.select();

      let committed = false;
      function commit() {
        if (committed) return;
        committed = true;
        const val = input.value.trim();
        if (val && val !== art.title) {
          renameArtifact(art.title, val);
        } else {
          updateArtifactSwitcherBar();
        }
      }

      input.onkeydown = (ke) => {
        if (ke.key === "Enter") commit();
        else if (ke.key === "Escape") {
          committed = true;
          updateArtifactSwitcherBar();
        }
      };
      input.onblur = commit;
    }

    nameSpan.ondblclick = startTabRename;

    const actionsSpan = document.createElement("span");
    actionsSpan.className = "art-tab-actions";

    const renameBtn = document.createElement("button");
    renameBtn.className = "art-tab-action-btn art-tab-rename-btn";
    renameBtn.title = "Rename tab";
    renameBtn.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
    renameBtn.onclick = startTabRename;

    const closeBtn = document.createElement("button");
    closeBtn.className = "art-tab-action-btn art-tab-close-btn";
    closeBtn.title = "Remove tab";
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      removeArtifact(art.title);
    };

    actionsSpan.appendChild(renameBtn);
    actionsSpan.appendChild(closeBtn);

    chip.appendChild(iconSpan);
    chip.appendChild(nameSpan);
    chip.appendChild(actionsSpan);

    chip.onclick = (e) => {
      if (e.target.closest(".art-tab-action-btn") || e.target.tagName === "INPUT") return;
      openArtifact(art.title, art.code, art.lang);
    };

    artSwitcherBar.appendChild(chip);
  });

  const addTabBtn = document.createElement("button");
  addTabBtn.className = "art-tab-add-btn";
  addTabBtn.id = "art-tab-add-btn";
  addTabBtn.title = "New Canvas Tab";
  addTabBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
  addTabBtn.onclick = addNewArtifactTab;
  artSwitcherBar.appendChild(addTabBtn);
}

function getLangIcon(lang) {
  if (/html|svg|jsx/i.test(lang)) return "🌐";
  if (/py|python/i.test(lang)) return "🐍";
  if (/mermaid/i.test(lang)) return "📊";
  if (/csv|json/i.test(lang)) return "📑";
  return "📄";
}

function extractArtifactsFromDOM() {
  sessionArtifacts = [];
  cc.querySelectorAll("pre").forEach(pre => {
    const codeEl = pre.querySelector("code");
    if (!codeEl) return;
    const code = codeEl.textContent.trim();
    const fname = pre.dataset.fname || suggestedName(pre);
    let lang = "";
    if (pre.dataset.fname) lang = fileExt(pre.dataset.fname);
    if (!lang) {
      codeEl.classList.forEach(cls => {
        if (cls.startsWith("language-")) lang = cls.replace("language-", "");
      });
    }
    if (code.length > 30) {
      sessionArtifacts.push({ id: uid(), title: fname, code, lang, versions: [code] });
    }
  });
  updateArtifactSwitcherBar();
}

/* ── CANVAS FILE EXPLORER (tree over the shared workspace) ── */
function buildWorkspaceTree() {
  const root = { dirs: new Map(), files: [] };
  const all = [...new Set([...Object.keys(vscFiles), ...vscDirs])];
  all.sort((a, b) => a.localeCompare(b));
  all.forEach(p => {
    const segs = p.split("/");
    let node = root;
    for (let i = 0; i < segs.length - 1; i++) {
      if (!node.dirs.has(segs[i])) node.dirs.set(segs[i], { dirs: new Map(), files: [] });
      node = node.dirs.get(segs[i]);
    }
    const name = segs[segs.length - 1];
    if (vscFiles[p]) node.files.push({ name, path: p });
    else if (!node.dirs.has(name)) node.dirs.set(name, { dirs: new Map(), files: [] });
  });
  return root;
}
function deleteWorkspacePath(path, isDir) {
  if (!path) return;
  if (isDir) {
    const pre = path + "/";
    const fileCount = Object.keys(vscFiles).filter(k => k.startsWith(pre)).length;
    const ok = fileCount
      ? confirm(`Delete folder "${path}" and its ${fileCount} file(s)?`)
      : confirm(`Delete empty folder "${path}"?`);
    if (!ok) return;
    termDelete(path, true);
    for (const k of [...artTreeOpen]) { if (k === path || k.startsWith(pre)) artTreeOpen.delete(k); }
  } else {
    if (!vscFiles[path]) return;
    if (!confirm(`Delete "${path}"?`)) return;
    termDelete(path, false);
  }
  sessionArtifacts = sessionArtifacts.filter(a => !(a.title === path || a.title.startsWith(path + "/")));
  saveWorkspaceSoon();
  refreshWorkspaceViews();
  updateArtifactSwitcherBar();
  if (currentArtifact && (currentArtifact.title === path || (isDir && currentArtifact.title.startsWith(path + "/")))) {
    if (sessionArtifacts.length) {
      const n = sessionArtifacts[0];
      openArtifact(n.title, n.code, n.lang);
    } else {
      currentArtifact = { id: "", title: "", code: "", lang: "", versions: [] };
      if (artTitle) artTitle.textContent = "Interactive Canvas";
      if (artCodeEditor) artCodeEditor.value = "";
      if (artLogs) artLogs.innerHTML = '<div class="log-info">Console initialized.</div>';
      if (artFrame) artFrame.srcdoc = '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px">Canvas empty — open or create a file.</body></html>';
      updateArtifactSwitcherBar();
    }
  }
  sfx.play("click");
  toast(`Deleted ${isDir ? "folder" : "file"} "${path}"`);
}
function renderArtExplorer() {
  const box = $("art-explorer-tree");
  if (!box) return;
  box.innerHTML = "";
  const root = buildWorkspaceTree();
  if (!root.dirs.size && !root.files.length) {
    box.innerHTML = '<div class="art-fs-empty">No files yet — use the + button or the terminal.</div>';
    return;
  }
  const walk = (node, prefix, depth) => {
    [...node.dirs.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([dname, dnode]) => {
      const path = prefix ? prefix + "/" + dname : dname;
      const open = !artTreeOpen.has(path);
      const row = document.createElement("div");
      row.className = "art-fs-folder";
      row.style.paddingLeft = (8 + depth * 14) + "px";
      row.innerHTML = `<span class="art-fs-arrow">${open ? "▾" : "▸"}</span><span class="art-fs-ic">📁</span><span class="art-fs-name">${esc(dname)}</span><button class="art-fs-del" title="Delete folder ${esc(path)}">✕</button>`;
      row.querySelector(".art-fs-del").onclick = e => { e.stopPropagation(); deleteWorkspacePath(path, true); };
      row.onclick = () => {
        if (artTreeOpen.has(path)) artTreeOpen.delete(path); else artTreeOpen.add(path);
        renderArtExplorer();
      };
      box.appendChild(row);
      if (open) walk(dnode, path, depth + 1);
    });
    node.files.forEach(f => {
      const row = document.createElement("div");
      row.className = "art-fs-file" + (f.path === currentArtifact.title ? " active" : "");
      row.style.paddingLeft = (14 + depth * 14) + "px";
      row.title = f.path;
      row.innerHTML = `<span class="art-fs-ic">${vscFiles[f.path].icon || getFileIcon(f.name)}</span><span class="art-fs-name">${esc(f.name)}</span><span class="lc-dots" data-lc-row="${esc(f.path)}"></span><button class="art-fs-del" title="Delete file ${esc(f.path)}">✕</button>`;
      row.querySelector(".art-fs-del").onclick = e => { e.stopPropagation(); deleteWorkspacePath(f.path, false); };
      row.onclick = () => openWorkspaceFile(f.path);
      box.appendChild(row);
    });
  };
  walk(root, "", 0);
}
function openWorkspaceFile(path) {
  const f = vscFiles[path];
  if (!f) return;
  const existing = sessionArtifacts.find(a => a.title === path);
  if (existing && existing.code === f.content) openArtifact(path, f.content, f.lang || "");
  else registerArtifact(path, f.content, f.lang || getFileLanguage(path));
  sfx.play("click");
}

/* ── INTERACTIVE ARTIFACTS / CANVAS RUNNER ── */
function openArtifact(title, code, lang = "") {
  currentArtifact = { title, code, lang };
  artTitle.textContent = title;
  artCodeEditor.value = code;
  artLogs.innerHTML = `<div class="log-info">Console initialized for ${esc(title)}.</div>`;

  // Update version selector
  const art = sessionArtifacts.find(a => a.title === title);
  if (art && art.versions && art.versions.length > 1) {
    artVersionSel.innerHTML = art.versions.map((_, i) => `<option value="${i+1}">v${i+1}${i+1 === art.versions.length ? " (Current)" : ""}</option>`).join("");
    artVersionSel.value = art.versions.length;
    artVersionSel.style.display = "inline-block";
  } else {
    artVersionSel.style.display = "none";
  }

  // Check if CSV/JSON data
  if (lang === "csv" || title.endsWith(".csv") || isCSV(code)) {
    artDataTab.style.display = "inline-block";
    renderDataTable(code);
  } else {
    artDataTab.style.display = "none";
  }

  // Render iframe
  runArtifactCode(code, lang);

  renderArtExplorer();
  updateArtifactSwitcherBar();
  artDrawer.classList.remove("hidden");
  if (typeof canvasFullscreen !== "undefined" && canvasFullscreen) toggleCanvasFullscreen(false);
  if (!coworkMode) setCoworkMode(true);
  switchArtifactTab("preview");
}

function runArtifactCode(code, lang = "") {
  code = bundleForPreview(currentArtifact.title, code);
  code = executableWrap(currentArtifact.title, code);
  const consoleSpy = `
    <script>
      (function(){
        const _log = console.log, _err = console.error;
        console.log = function(...args){
          window.parent.postMessage({ type: 'JARVIK_LOG', level: 'log', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          _log.apply(console, args);
        };
        console.error = function(...args){
          window.parent.postMessage({ type: 'JARVIK_LOG', level: 'err', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          _err.apply(console, args);
        };
        window.onerror = function(msg, url, line){
          window.parent.postMessage({ type: 'JARVIK_LOG', level: 'err', msg: 'Line ' + line + ': ' + msg }, '*');
        };
      })();
    <\/script>
  `;

  let finalHTML = code;
  if (!/<!doctype html|<html/i.test(code)) {
    if (code.trim().startsWith("<svg")) {
      finalHTML = `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#181817;">${code}</body></html>`;
    } else {
      finalHTML = `<!DOCTYPE html><html><head><meta charset="utf-8">${consoleSpy}</head><body style="font-family:'DM Sans',sans-serif;padding:20px;background:#141413;color:#ececea;"><pre style="font-family:monospace;white-space:pre-wrap;">${esc(code)}</pre></body></html>`;
    }
  } else {
    finalHTML = code.replace("<head>", "<head>" + consoleSpy);
  }

  artFrame.srcdoc = finalHTML;
}

window.addEventListener("message", e => {
  if (e.data && e.data.type === "JARVIK_LOG") {
    const row = document.createElement("div");
    row.className = e.data.level === "err" ? "log-err" : "log-msg";
    row.textContent = `[${new Date().toLocaleTimeString()}] ${e.data.msg}`;
    artLogs.appendChild(row);
    artLogs.scrollTop = artLogs.scrollHeight;
  }
});

function switchArtifactTab(tabName) {
  document.querySelectorAll(".art-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  document.querySelectorAll(".art-pane").forEach(p => p.classList.toggle("active", p.id === `art-pane-${tabName}`));
}
document.querySelectorAll(".art-tab").forEach(t => {
  t.onclick = () => switchArtifactTab(t.dataset.tab);
});
if (artCloseBtn) artCloseBtn.onclick = () => {
  if (canvasFullscreen) toggleCanvasFullscreen(false);
  setCoworkMode(false);
};

/* Co-Work Canvas Fullscreen Maximize / Restore */
let canvasFullscreen = false;
function toggleCanvasFullscreen(forceState) {
  canvasFullscreen = forceState !== undefined ? forceState : !canvasFullscreen;
  app.classList.toggle("canvas-fullscreen", canvasFullscreen);
  artDrawer.classList.toggle("is-fullscreen", canvasFullscreen);

  if (artFullscreenBtn) {
    artFullscreenBtn.innerHTML = canvasFullscreen
      ? `<span class="fs-icon">⤡</span> Restore`
      : `<span class="fs-icon">⛶</span> Fullscreen`;
    artFullscreenBtn.title = canvasFullscreen ? "Restore split-screen view (Esc)" : "Expand Co-Work Canvas to full screen";
  }
  if (artPreviewFsBtn) {
    artPreviewFsBtn.textContent = canvasFullscreen ? "⤡ Restore" : "⛶ Fullscreen";
  }
  sfx.play("mode");
  toast(canvasFullscreen ? "⛶ Co-Work Canvas Fullscreen" : "⤡ Restored Split-Screen View");
}

if (artFullscreenBtn) artFullscreenBtn.onclick = () => toggleCanvasFullscreen();
if (artPreviewFsBtn) artPreviewFsBtn.onclick = () => toggleCanvasFullscreen();

/* Co-Work push/pull edge-resize — ponytail: fixed px only; upgrade path: persist ratio + ResizeObserver if layout ever becomes nested */
(() => {
  const KEY = "cowork-drawer-w", MIN = 320, RATIO = 0.8;
  const grip = $("cowork-resize");
  if (!grip || !artDrawer) return;
  const max = () => Math.floor(innerWidth * RATIO);
  const ok = () => coworkMode && !canvasFullscreen && innerWidth > 768 && !app.classList.contains("canvas-fullscreen");
  const paint = px => { artDrawer.style.flex = "none"; artDrawer.style.width = px + "px"; };
  try {
    const saved = parseInt(localStorage.getItem(KEY), 10);
    if (saved >= MIN && saved <= max()) paint(saved);
  } catch (_) {}
  let startX = 0, startW = 0, raf = 0;
  grip.addEventListener("pointerdown", e => {
    if (!ok()) return;
    if (e.button !== undefined && e.button !== 0) return;
    startX = e.clientX; startW = artDrawer.getBoundingClientRect().width;
    grip.classList.add("dragging");
    try { grip.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  grip.addEventListener("pointermove", e => {
    if (!grip.classList.contains("dragging")) return;
    const px = Math.min(max(), Math.max(MIN, Math.round(startW + startX - e.clientX)));
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => paint(px));
  });
  const end = () => {
    if (!grip.classList.contains("dragging")) return;
    grip.classList.remove("dragging"); cancelAnimationFrame(raf);
    try { localStorage.setItem(KEY, String(Math.round(artDrawer.getBoundingClientRect().width))); } catch (_) {}
  };
  grip.addEventListener("pointerup", end);
  grip.addEventListener("pointercancel", end);
  const resetW = () => {
    if (!ok()) return;
    artDrawer.style.flex = ""; artDrawer.style.width = "";
    try { localStorage.removeItem(KEY); } catch (_) {}
    toast("Co-Work panel reset to default");
  };
  grip.addEventListener("dblclick", resetW);
  grip.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); resetW(); }
  });
})();

window.addEventListener("keydown", e => {
  if (e.key === "Escape" && canvasFullscreen) {
    toggleCanvasFullscreen(false);
  }
});

if (artRunBtn) artRunBtn.onclick = () => {
  const codeToRun = artCodeEditor ? artCodeEditor.value : currentArtifact.code;
  currentArtifact.code = codeToRun;
  syncArtifactToWorkspace(currentArtifact.title, codeToRun);
  runArtifactCode(codeToRun, currentArtifact.lang);
  sfx.play("complete");
  toast("▶ Re-rendered artifact");
};
if (artCopyBtn) artCopyBtn.onclick = async () => {
  const codeToCopy = artCodeEditor ? artCodeEditor.value : currentArtifact.code;
  if (!await copyText(codeToCopy)) return;
  toast("⧉ Artifact code copied");
  sfx.play("click");
};
if (artDownloadBtn) artDownloadBtn.onclick = () => {
  const codeToSave = artCodeEditor ? artCodeEditor.value : currentArtifact.code;
  saveTextFile(currentArtifact.title, codeToSave);
};
if (artPopoutBtn) artPopoutBtn.onclick = () => {
  const codeToPop = artCodeEditor ? artCodeEditor.value : currentArtifact.code;
  const blob = new Blob([codeToPop], { type: "text/html" });
  window.open(URL.createObjectURL(blob), "_blank");
};

/* Live bidirectional sync of edited code in Co-Work Canvas */
let previewDebounceTimer = null;
if (artCodeEditor) {
  artCodeEditor.addEventListener("input", () => {
    const editedCode = artCodeEditor.value;
    currentArtifact.code = editedCode;
    syncArtifactToWorkspace(currentArtifact.title, editedCode);

    // Keep sessionArtifacts in sync
    const art = sessionArtifacts.find(a => a.id === currentArtifact.id || a.title === currentArtifact.title);
    if (art) {
      art.code = editedCode;
      if (art.versions && art.versions.length) {
        art.versions[art.versions.length - 1] = editedCode;
      }
    }

    // Auto-update live iframe preview (350ms debounce)
    clearTimeout(previewDebounceTimer);
    previewDebounceTimer = setTimeout(() => {
      runArtifactCode(editedCode, currentArtifact.lang);
    }, 350);
  });
}

/* Send current edited canvas code directly to JARVIK Chat */
function sendEditedCodeToChat(customInstruction = "") {
  const editedCode = artCodeEditor ? artCodeEditor.value : (currentArtifact.code || "");
  if (!editedCode.trim()) {
    toast("⚠️ No code in the canvas to send.");
    return;
  }
  const title = currentArtifact.title || "artifact";
  const lang = currentArtifact.lang || "";
  const langHeader = lang ? `${lang} ` : "";

  let prompt = "";
  if (customInstruction && customInstruction.trim()) {
    prompt = `${customInstruction.trim()}\n\nHere is my updated code from the Co-Work Canvas (${title}):\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``;
  } else {
    prompt = `Here is my updated code from the Co-Work Canvas for "${title}". Please inspect my edits, verify them, and help me with the next improvements:\n\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``;
  }

  ui.value = prompt;
  grow(ui);
  send();
  sfx.play("send");
  toast("💬 Sent edited code to JARVIK Chat");
}

if (artSendToChatBtn) artSendToChatBtn.onclick = () => sendEditedCodeToChat();

if (canvasSendBtn) {
  canvasSendBtn.onclick = () => {
    const custom = canvasPromptInput ? canvasPromptInput.value : "";
    sendEditedCodeToChat(custom);
    if (canvasPromptInput) canvasPromptInput.value = "";
  };
}

if (canvasPromptInput) {
  canvasPromptInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canvasSendBtn) canvasSendBtn.click();
    }
  });
}

if (artVersionSel) {
  artVersionSel.onchange = () => {
    const verIdx = parseInt(artVersionSel.value) - 1;
    const art = sessionArtifacts.find(a => a.id === currentArtifact.id || a.title === currentArtifact.title);
    if (art && art.versions && art.versions[verIdx] !== undefined) {
      const verCode = art.versions[verIdx];
      currentArtifact.code = verCode;
      artCodeEditor.value = verCode;
      runArtifactCode(verCode, currentArtifact.lang);
      toast(`Switched to version v${verIdx + 1}`);
      sfx.play("click");
    }
  };
}

/* Canvas Header Title Rename */
function triggerHeaderTabRename() {
  const currentName = currentArtifact.title || (artTitle ? artTitle.textContent : "untitled");
  const newName = prompt("Rename canvas tab:", currentName);
  if (newName && newName.trim() && newName.trim() !== currentName) {
    renameArtifact(currentName, newName.trim());
  }
}

if (artTitle) {
  artTitle.style.cursor = "pointer";
  artTitle.title = "Click to rename this tab";
  artTitle.onclick = triggerHeaderTabRename;
}
const artRenameHeaderBtn = $("art-rename-header-btn");
if (artRenameHeaderBtn) {
  artRenameHeaderBtn.onclick = triggerHeaderTabRename;
}

/* Canvas Quick AI Actions — ALWAYS uses latest edited code */
document.querySelectorAll(".q-chip").forEach(chip => {
  chip.onclick = () => {
    const act = chip.dataset.act;
    const editedCode = artCodeEditor ? artCodeEditor.value : (currentArtifact.code || "");
    const title = currentArtifact.title || "artifact";
    const lang = currentArtifact.lang || "";
    const langHeader = lang ? `${lang} ` : "";

    if (act === "sendchat") {
      sendEditedCodeToChat();
      return;
    }

    const prompts = {
      refactor: `Please refactor and optimize this edited code from our Co-Work Canvas for maximum readability, performance, and best practices:\n\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``,
      tests: `Please write exhaustive unit tests with edge case coverage for this edited code from our Co-Work Canvas:\n\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``,
      security: `Please perform a security audit on this edited code from our Co-Work Canvas, finding vulnerabilities and providing the hardened code:\n\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``,
      docs: `Please add clear JSDoc / Docstring comments and documentation to this edited code from our Co-Work Canvas:\n\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``,
      ui: `Please modernize the CSS and visual styling of this edited code from our Co-Work Canvas with sleek dark mode aesthetics:\n\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``
    };
    ui.value = prompts[act] || `Here is my updated code from the Co-Work Canvas:\n\n\`\`\`${langHeader}filename=${title}\n${editedCode}\n\`\`\``;
    grow(ui);
    send();
    sfx.play("mode");
  };
});

/* ── DATA TABLE & CHART VIEWER ── */
function isCSV(text) {
  const lines = text.trim().split("\n");
  return lines.length > 1 && lines[0].includes(",");
}

function renderDataTable(csvText) {
  const lines = csvText.trim().split("\n").filter(l => l.trim());
  if (!lines.length) return;
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));

  dataContentArea.innerHTML = `
    <table class="data-table" id="parsed-data-table">
      <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;

  // Search filter
  if (dataSearchInput) {
    dataSearchInput.oninput = () => {
      const q = dataSearchInput.value.toLowerCase();
      document.querySelectorAll("#parsed-data-table tbody tr").forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    };
  }

  // Chart type switcher
  document.querySelectorAll(".chart-type-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".chart-type-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const chartType = btn.dataset.chart;
      if (chartType === "table") {
        renderDataTable(csvText);
      } else {
        renderSVGChart(headers, rows, chartType);
      }
    };
  });
}

function renderSVGChart(headers, rows, type) {
  // Try to find a numeric column
  const labelCol = 0;
  let numCol = 1;
  for (let c = 1; c < headers.length; c++) {
    if (!isNaN(parseFloat(rows[0][c]))) { numCol = c; break; }
  }

  const data = rows.map(r => ({ label: r[labelCol], value: parseFloat(r[numCol]) || 0 }));
  const maxVal = Math.max(...data.map(d => d.value), 1);

  let svgHtml = `<svg viewBox="0 0 500 240" style="width:100%;height:240px;background:#141413;border-radius:8px;padding:12px">`;

  if (type === "bar") {
    const barWidth = Math.min(36, 420 / data.length - 8);
    data.forEach((d, i) => {
      const x = 40 + i * (420 / data.length);
      const h = (d.value / maxVal) * 160;
      const y = 190 - h;
      svgHtml += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4" fill="#35d6e8"/>
        <text x="${x + barWidth/2}" y="210" fill="#a3a29d" font-size="9" text-anchor="middle">${esc(d.label.slice(0, 7))}</text>
        <text x="${x + barWidth/2}" y="${y - 4}" fill="#ececea" font-size="9" text-anchor="middle">${d.value}</text>
      `;
    });
  } else if (type === "line") {
    const points = data.map((d, i) => {
      const x = 40 + i * (420 / Math.max(1, data.length - 1));
      const y = 190 - (d.value / maxVal) * 160;
      return `${x},${y}`;
    }).join(" ");
    svgHtml += `
      <polyline fill="none" stroke="#35d6e8" stroke-width="3" points="${points}"/>
      ${data.map((d, i) => {
        const x = 40 + i * (420 / Math.max(1, data.length - 1));
        const y = 190 - (d.value / maxVal) * 160;
        return `<circle cx="${x}" cy="${y}" r="4" fill="#35d6e8"/><text x="${x}" y="${y-6}" fill="#ececea" font-size="9" text-anchor="middle">${d.value}</text>`;
      }).join("")}
    `;
  }

  svgHtml += `</svg>`;
  dataContentArea.innerHTML = svgHtml;
}

/* ── INTERACTIVE SPRINT ROADMAP ── */
function updateSprintPanel() {
  if (!sprintPanel || !sprintList) return;
  sprintList.innerHTML = "";
  if (!sprintTasks.length) {
    sprintPanel.classList.add("hidden");
    return;
  }
  sprintPanel.classList.remove("hidden");
  const doneCount = sprintTasks.filter(t => t.done).length;
  sprintProgress.textContent = `${doneCount}/${sprintTasks.length} done`;

  sprintTasks.forEach((task, idx) => {
    const item = document.createElement("div");
    item.className = "sprint-item" + (task.done ? " done" : "");
    item.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""}>
      <span class="sprint-item-text">${esc(task.text)}</span>
      <button class="sprint-item-run" title="Ask JARVIK to execute this step">▶ Run</button>
    `;
    item.querySelector("input").onchange = e => {
      task.done = e.target.checked;
      updateSprintPanel();
    };
    item.querySelector(".sprint-item-run").onclick = () => {
      ui.value = `Let's execute sprint task: "${task.text}". Please build and deliver the code/document for this step in our co-work canvas.`;
      send();
      sfx.play("mode");
    };
    sprintList.appendChild(item);
  });
}

function extractSprintTasksFromText(text) {
  const taskRegex = /(?:^|\n)\s*(?:-|\*|\d+\.)\s*\[([ xX])\]\s*(.+)/g;
  let match;
  let found = [];
  while ((match = taskRegex.exec(text)) !== null) {
    found.push({
      id: uid(),
      done: match[1].toLowerCase() === "x",
      text: match[2].trim()
    });
  }
  if (found.length) {
    sprintTasks = found;
    updateSprintPanel();
  }
}

if (sprintToggleBtn) {
  sprintToggleBtn.onclick = () => {
    if (sprintPanel.classList.contains("hidden")) {
      if (!sprintTasks.length) {
        sprintTasks = [
          { id: "s1", done: true, text: "Step 1: Requirements & Architecture Specs" },
          { id: "s2", done: false, text: "Step 2: Core Data Models & Schemas" },
          { id: "s3", done: false, text: "Step 3: Interactive UI Implementation" },
          { id: "s4", done: false, text: "Step 4: Unit Testing & Verification" }
        ];
      }
      sprintPanel.classList.remove("hidden");
    } else {
      sprintPanel.classList.add("hidden");
    }
    updateSprintPanel();
    sfx.play("click");
  };
}
if (sprintCloseBtn) sprintCloseBtn.onclick = () => sprintPanel.classList.add("hidden");
if (sprintAddBtn) {
  sprintAddBtn.onclick = () => {
    const t = prompt("Enter sprint task description:");
    if (t && t.trim()) {
      sprintTasks.push({ id: uid(), text: t.trim(), done: false });
      updateSprintPanel();
    }
  };
}

/* ── PROJECT KNOWLEDGE BASE SHELF ── */
function updateKnowledgeUI() {
  const k = getKnowledge();
  if (knowledgeCount) knowledgeCount.textContent = k.length;
  if (sbKnowledgeCnt) sbKnowledgeCnt.textContent = k.length;
  if (!knowledgeList) return;
  knowledgeList.innerHTML = "";
  if (!k.length) {
    knowledgeList.innerHTML = `<div class="eml" style="padding:12px">No files indexed yet. Upload reference docs or code.</div>`;
    return;
  }
  k.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "knowledge-item" + (item.enabled === false ? " kb-off" : "");
    row.dataset.kbid = item.id;
    row.innerHTML = `
      <label class="knowledge-item-meta kb-toggle">
        <input type="checkbox" class="kb-check"${item.enabled === false ? "" : " checked"} title="Include in chat context">
        <span>📄</span>
        <strong>${esc(item.name)}</strong>
        <span style="color:var(--subtle);font-size:10.5px">(${Math.round(item.size/1024)} KB)</span>
      </label>
      <button class="knowledge-item-del" data-idx="${idx}">✕</button>
    `;
    row.querySelector(".kb-check").onchange = e => {
      const current = getKnowledge();
      if (current[idx]) { current[idx].enabled = e.target.checked; saveKnowledge(current); }
      row.classList.toggle("kb-off", !e.target.checked);
    };
    row.querySelector(".knowledge-item-del").onclick = () => {
      const current = getKnowledge();
      current.splice(idx, 1);
      saveKnowledge(current);
      updateKnowledgeUI();
    };
    knowledgeList.appendChild(row);
  });
}

if (knowledgeBtn) knowledgeBtn.onclick = () => { updateKnowledgeUI(); knowledgeModal.classList.remove("hidden"); sfx.play("mode"); };
if (knowledgeClose) knowledgeClose.onclick = () => knowledgeModal.classList.add("hidden");
if (knowledgeDone) knowledgeDone.onclick = () => knowledgeModal.classList.add("hidden");
if (knowledgeClear) {
  knowledgeClear.onclick = () => {
    if (confirm("Clear all project knowledge files?")) {
      saveKnowledge([]);
      updateKnowledgeUI();
    }
  };
}
// ponytail: caps at 20 files / 30k chars each / ~120k total; raise KB_MAX_* when prompt budget grows.
const KB_MAX_FILES = 20, KB_PER_FILE = 30000, KB_MAX_TOTAL = 120000, KB_MAX_BYTES = 2097152;
async function readKnowledgeFile(file) {
  if ((file.name.endsWith(".pdf") || (file.type || "").includes("pdf")) && window.pdfjsLib) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = `[PDF "${file.name}" - ${pdf.numPages}p]\n`;
    for (let p = 1; p <= Math.min(pdf.numPages, 16) && out.length < KB_PER_FILE; p++)
      out += `--- p${p} ---\n` + (await (await pdf.getPage(p)).getTextContent()).items.map(i => i.str).join(" ") + "\n";
    return out.slice(0, KB_PER_FILE);
  }
  return (await file.text()).slice(0, KB_PER_FILE);
}
async function addKnowledgeFiles(files) {
  const k = getKnowledge();
  for (const f of files) {
    if (k.length >= KB_MAX_FILES) { toast(`Max ${KB_MAX_FILES} knowledge files`); break; }
    if (f.size > KB_MAX_BYTES) { toast(`Skipped ${f.name}: over 2 MB`); continue; }
    try { k.push({ id: uid(), name: f.name, size: f.size, content: await readKnowledgeFile(f), enabled: true }); }
    catch (e) { toast(`Skipped ${f.name}: unreadable`); }
  }
  try { saveKnowledge(k); updateKnowledgeUI(); toast(`Indexed ${files.length} file(s)`); try { if (typeof tmPushKnowledge === "function") tmPushKnowledge(); } catch (_) {} }
  catch (e) { toast("Storage full — remove a file first"); }
}
if (knowledgeDrop) {
  knowledgeDrop.onclick = e => { if (e.target.closest("button")) return; knowledgeInput.click(); };
  knowledgeDrop.ondragover = e => { e.preventDefault(); e.stopPropagation(); knowledgeDrop.classList.add("dragging"); };
  knowledgeDrop.ondragleave = () => knowledgeDrop.classList.remove("dragging");
  knowledgeDrop.ondrop = e => { e.preventDefault(); e.stopPropagation(); knowledgeDrop.classList.remove("dragging"); if (e.dataTransfer && e.dataTransfer.files.length) addKnowledgeFiles([...e.dataTransfer.files]); };
}
if (knowledgeInput) {
  knowledgeInput.onchange = () => { if (knowledgeInput.files.length) addKnowledgeFiles([...knowledgeInput.files]); knowledgeInput.value = ""; };
}
if (knowledgeModal) {
  knowledgeModal.onclick = e => { if (e.target === knowledgeModal) knowledgeModal.classList.add("hidden"); };
}

/* ── ADVANCED MARKDOWN, KATEX & MERMAID ── */
function enhanceRenderedElements(container) {
  if (!container) return;

  if (window.renderMathInElement) {
    try {
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$",  right: "$",  display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    } catch(e) {}
  }

  container.querySelectorAll("pre code:not(.hljs)").forEach(block => {
    try {
      if (window.hljs) hljs.highlightElement(block);
    } catch(e) {}
  });

  container.querySelectorAll("pre code.language-mermaid").forEach(codeEl => {
    const pre = codeEl.closest("pre");
    if (!pre || pre.dataset.mRendered) return;
    pre.dataset.mRendered = "1";
    const graphDefinition = codeEl.textContent.trim();
    const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
    const wrap = document.createElement("div");
    wrap.className = "mermaid-diagram-wrap";
    wrap.innerHTML = `
      <div class="mermaid-svg" id="${id}">Rendering diagram…</div>
      <div class="mermaid-bar">
        <button class="m-btn m-zoom">🔍 Fullscreen</button>
        <button class="m-btn m-svg">💾 Save SVG</button>
      </div>
    `;
    pre.parentNode.insertBefore(wrap, pre);
    pre.style.display = "none";

    if (window.mermaid) {
      mermaid.render(id + "-svg", graphDefinition).then(({ svg }) => {
        const target = document.getElementById(id);
        if (target) {
          target.innerHTML = svg;
          wrap.querySelector(".m-zoom").onclick = () => openCodeViewer("Mermaid Diagram", graphDefinition, "mermaid");
          wrap.querySelector(".m-svg").onclick = () => saveTextFile("diagram-" + Date.now() + ".svg", svg);
        }
      }).catch(err => {
        const target = document.getElementById(id);
        if (target) target.innerHTML = `<span style="color:#f87171">Failed to render Mermaid diagram: ${esc(err.message)}</span>`;
        pre.style.display = "block";
      });
    }
  });

  container.querySelectorAll("pre:not([data-cb])").forEach(pre => {
    if (pre.style.display === "none") return;
    pre.setAttribute("data-cb", "1");
    const code = pre.querySelector("code");
    if (!code) return;

    let lang = "";
    if (pre.dataset.fname) lang = fileExt(pre.dataset.fname);
    if (!lang) {
      code.classList.forEach(cls => {
        if (cls.startsWith("language-")) lang = cls.replace("language-", "");
      });
    }

    let bar = pre.querySelector(".code-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "code-bar";
      pre.insertBefore(bar, pre.firstChild);
    }

    const fnameDisplay = pre.dataset.fname ? `💾 ${pre.dataset.fname}` : "💾 Save";
    bar.innerHTML = `
      <span class="code-lang">${esc(pre.dataset.fname || lang || "code")}</span>
      <span class="code-actions">
        <button class="art-run-chip" title="Open &amp; run in Co-Work Canvas">⚡ Co-Work Canvas</button>
        <button class="copy-btn" title="Copy code">⧉ Copy</button>
        <button class="save-btn" title="Save file">${fnameDisplay}</button>
        <button class="exp-btn" title="Fullscreen view">⤢ Full</button>
      </span>
    `;

    bar.querySelector(".art-run-chip").onclick = () => {
      const title = pre.dataset.fname || suggestedName(pre);
      registerArtifact(title, code.textContent, lang);
      setCoworkMode(true);
    };

    bar.querySelector(".copy-btn").onclick = async function() {
      if (!await copyText(code.textContent)) return;
      this.textContent = "✓ Copied!";
      setTimeout(() => this.textContent = "⧉ Copy", 1500);
      sfx.play("click");
    };

    bar.querySelector(".save-btn").onclick = async function() {
      const name = pre.dataset.fname || prompt("Save file as:", suggestedName(pre));
      if (!name) return;
      await saveTextFile(name, code.textContent);
    };

    bar.querySelector(".exp-btn").onclick = () => {
      openCodeViewer(pre.dataset.fname || lang || "Code", code.textContent, lang);
    };
  });
}

function suggestedName(pre) {
  const langEl = pre.querySelector(".code-lang");
  const lang = langEl ? langEl.textContent.trim().toLowerCase() : "";
  const map = { javascript:"js", typescript:"ts", python:"py", html:"html", css:"css", json:"json", bash:"sh", markdown:"md", rust:"rs", go:"go" };
  return "jarvik-" + Date.now().toString(36) + (map[lang] ? "." + map[lang] : ".txt");
}

/* ── FULLSCREEN CODE VIEWER ── */
function openCodeViewer(title, codeText, lang) {
  let v = document.getElementById("code-viewer");
  if (!v) {
    v = document.createElement("div");
    v.id = "code-viewer";
    v.innerHTML = `
      <div class="cv-box">
        <div class="cv-bar">
          <span class="cv-title"></span>
          <span class="cv-actions">
            <button class="copy-btn cv-copy">⧉ Copy</button>
            <button class="cv-close">✕</button>
          </span>
        </div>
        <pre class="cv-pre"><code></code></pre>
      </div>
    `;
    document.body.appendChild(v);
    v.querySelector(".cv-close").onclick = () => v.classList.remove("open");
    v.onclick = e => { if (e.target === v) v.classList.remove("open"); };
    document.addEventListener("keydown", e => { if (e.key === "Escape" && v.classList.contains("open")) v.classList.remove("open"); });
  }
  v.querySelector(".cv-title").textContent = title;
  const c = v.querySelector("code");
  c.className = lang && window.hljs && hljs.getLanguage(lang) ? `language-${lang} hljs` : "hljs";
  c.textContent = codeText;
  try { if (window.hljs) hljs.highlightElement(c); } catch (e) {}
  v.querySelector(".cv-copy").onclick = async function() {
    if (!await copyText(codeText)) return;
    this.textContent = "✓ Copied!";
    setTimeout(() => this.textContent = "⧉ Copy", 1500);
  };
  v.classList.add("open");
  sfx.play("mode");
}

/* ── PINNED MESSAGES ── */
function pinMessage(text, role) {
  const pins = getPins();
  const body = String(text || "").trim();
  if (!body) { toast("Nothing to pin"); return; }
  if (pins.some(p => String(p.text || "").trim() === body)) { toast("Already pinned"); return; }
  pins.unshift({ id: uid(), text: body, role, time: Date.now() });
  savePins(pins);
  sfx.play("complete");
  toast("📌 Message pinned to drawer");
}
function renderPins() {
  const pins = getPins();
  pinsList.innerHTML = "";
  if (!pins.length) {
    pinsList.innerHTML = `<div class="eml" style="padding:24px">No pinned messages yet. Click 📌 on any chat message to save it here.</div>`;
    return;
  }
  pins.forEach(pin => {
    const card = document.createElement("div");
    card.className = "pin-card";
    card.innerHTML = `
      <div class="pin-meta">
        <span>${pin.role === "bot" ? "JARVIK AI" : "You"} · ${relt(pin.time)}</span>
        <button class="pin-unpin">Unpin ✕</button>
      </div>
      <div class="pin-body">${typeof marked !== "undefined" ? JarvikRuntime.markdown(pin.text) : esc(pin.text)}</div>
    `;
    card.querySelector(".pin-unpin").onclick = () => {
      savePins(getPins().filter(p => p.id !== pin.id));
      renderPins();
    };
    pinsList.appendChild(card);
  });
}
if (pinsBtn) {
  pinsBtn.onclick = () => {
    renderPins();
    pinsModal.classList.remove("hidden");
    sfx.play("click");
  };
}
if (pinsClose) pinsClose.onclick = () => pinsModal.classList.add("hidden");

/* ── SPEECH SYNTHESIS (TTS) ── */
function speak(text, manual = false) {
  if (!manual && !ve) return;
  if (typeof speechSynthesis === "undefined") { if (manual) toast("Read aloud is unavailable in this browser"); return; }
  try {
    speechSynthesis.cancel();
    const clean = text
      .replace(/```[\s\S]*?```/g, " code omitted. ")
      .replace(/`[^`]*`/g, "")
      .replace(/[#*_~>|]/g, "")
      .replace(/\$[^$]*\$/g, " formula ")
      .trim().slice(0, 1000);
    const u = new SpeechSynthesisUtterance(clean);
    const voices = speechSynthesis.getVoices();
    const chosenName = localStorage.getItem(PK("tts_voice"));
    const v = voices.find(x => x.name === chosenName) ||
              voices.find(x => /^en/i.test(x.lang) && /male|david|daniel|guy|ryan|natural/i.test(x.name)) ||
              voices.find(x => /^en/i.test(x.lang)) || voices[0];
    if (v) u.voice = v;
    u.rate = parseFloat(localStorage.getItem(PK("tts_rate")) || "1.0");
    u.pitch = 0.95;
    speechSynthesis.speak(u);
  } catch(e) {}
}

/* ── IMAGE LIGHTBOX ── */
function openLightbox(src) {
  lightboxImg.src = src;
  lightboxModal.classList.remove("hidden");
  lightboxSave.onclick = () => {
    const a = document.createElement("a");
    a.href = src; a.download = "jarvik-image-" + Date.now() + ".png";
    a.click();
  };
}
if (lightboxClose) lightboxClose.onclick = () => lightboxModal.classList.add("hidden");
if (lightboxModal) lightboxModal.onclick = e => { if (e.target === lightboxModal) lightboxModal.classList.add("hidden"); };

/* ── ATTACHMENT SYSTEM & MULTI-MODAL VISION ── */
function updateAttachmentPreview() {
  attPreview.innerHTML = "";
  if (!attachedFiles.length) {
    attPreview.classList.add("hidden");
    fb.textContent = "";
    fb.classList.remove("show");
    return;
  }
  attPreview.classList.remove("hidden");
  fb.textContent = `📎 ${attachedFiles.length} file(s) attached`;
  fb.classList.add("show");

  attachedFiles.forEach((f, idx) => {
    const chip = document.createElement("div");
    chip.className = "att-chip";
    chip.innerHTML = `
      ${f.isImage ? `<img src="${f.dataUrl}" alt="thumb">` : `<span class="att-icon">${f.type.includes("pdf") ? "📄" : "📎"}</span>`}
      <span class="att-name">${esc(f.name)}</span>
      <button class="att-rm" data-idx="${idx}">✕</button>
    `;
    chip.querySelector(".att-rm").onclick = () => {
      attachedFiles.splice(idx, 1);
      updateAttachmentPreview();
    };
    attPreview.appendChild(chip);
  });
}

async function processFile(file) {
  if (!file) return;
  const isImg = file.type.startsWith("image/");
  const isPdf = file.name.endsWith(".pdf") || file.type.includes("pdf");

  if (isImg) {
    const reader = new FileReader();
    reader.onload = e => {
      attachedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        isImage: true,
        dataUrl: e.target.result,
        content: e.target.result
      });
      updateAttachmentPreview();
      sfx.play("click");
    };
    reader.readAsDataURL(file);
  } else if (isPdf && window.pdfjsLib) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = `[PDF Document: "${file.name}" - ${pdf.numPages} pages]\n\n`;
      const maxPages = Math.min(pdf.numPages, 16);
      for (let p = 1; p <= maxPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += `--- Page ${p} ---\n${pageText}\n\n`;
      }
      attachedFiles.push({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        isImage: false,
        content: fullText.slice(0, 30000)
      });
      updateAttachmentPreview();
      sfx.play("click");
      toast(`📄 Extracted text from ${file.name}`);
    } catch(err) {
      toast("Could not read PDF: " + err.message);
    }
  } else {
    const reader = new FileReader();
    reader.onload = e => {
      attachedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || "text/plain",
        isImage: false,
        content: e.target.result.slice(0, 35000)
      });
      updateAttachmentPreview();
      sfx.play("click");
    };
    reader.readAsText(file);
  }
}

if (fi) {
  fi.onchange = () => {
    Array.from(fi.files).forEach(processFile);
    fi.value = "";
  };
}
if (ab) ab.onclick = () => fi.click();

window.addEventListener("paste", e => {
  if (e.clipboardData && e.clipboardData.items) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          toast("📸 Pasted screenshot from clipboard");
          break;
        }
      }
    }
  }
});

let dragCounter = 0;
window.addEventListener("dragenter", e => {
  e.preventDefault();
  dragCounter++;
  dropOverlay.classList.remove("hidden");
});
window.addEventListener("dragleave", e => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    dropOverlay.classList.add("hidden");
  }
});
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.add("hidden");
  if (e.dataTransfer && e.dataTransfer.files) {
    Array.from(e.dataTransfer.files).forEach(processFile);
  }
});

/* ── SLASH COMMANDS AUTOCOMPLETE ── */
function checkSlashCommand(val) {
  if (!val.startsWith("/")) {
    slashPopup.classList.add("hidden");
    return;
  }
  const query = val.toLowerCase();
  filteredSlash = SLASH_COMMANDS.filter(s => s.cmd.startsWith(query) || s.desc.toLowerCase().includes(query.slice(1)));
  if (!filteredSlash.length) {
    slashPopup.classList.add("hidden");
    return;
  }
  slashActiveIdx = 0;
  renderSlashList();
  slashPopup.classList.remove("hidden");
}

function renderSlashList() {
  slashList.innerHTML = "";
  filteredSlash.forEach((s, idx) => {
    const item = document.createElement("div");
    item.className = "slash-item" + (idx === slashActiveIdx ? " active" : "");
    item.innerHTML = `<span class="slash-cmd">${s.cmd}</span><span class="slash-desc">${esc(s.desc)}</span>`;
    item.onclick = () => selectSlashCommand(s);
    slashList.appendChild(item);
  });
}

function selectSlashCommand(cmdObj) {
  slashPopup.classList.add("hidden");
  if (cmdObj.action === "clear") {
    newConv();
    ui.value = "";
    return;
  }
  if (cmdObj.action === "debate") {
    document.getElementById("debate-btn").click();
    ui.value = "";
    return;
  }
  if (cmdObj.action === "roast") {
    document.getElementById("roast-btn").click();
    ui.value = "";
    return;
  }
  if (cmdObj.action === "da") {
    document.getElementById("da-btn").click();
    ui.value = "";
    return;
  }
  if (cmdObj.action === "genz") {
    document.getElementById("genz-btn").click();
    ui.value = "";
    return;
  }
  if (cmdObj.action === "compare") {
    openCompareModal((ui.value || "").replace(/^\/compare\s*/, ""));
    ui.value = "";
    return;
  }
  if (cmdObj.prefix) {
    ui.value = cmdObj.prefix;
    grow(ui);
    ui.focus();
  }
}

/* ── STREAMING AI ENGINE WITH PROJECT KNOWLEDGE ── */
async function send() {
  if (busy) return;
  const rawText = ui.value.trim();
  if (!rawText && !attachedFiles.length) return;
  if (!navigator.onLine && (rawText || attachedFiles.length)) {
    ooQueue(rawText || "[attachments]");
    ui.value = ""; ui.style.height = "auto";
    toast("Offline — prompt queued");
    return;
  }

  if (rawText.startsWith("/")) {
    const exactCmd = SLASH_COMMANDS.find(s => rawText.startsWith(s.cmd));
    if (exactCmd && exactCmd.action) {
      selectSlashCommand(exactCmd);
      return;
    }
  }

  slashPopup.classList.add("hidden");

  try { if (window.JV && window.JV.interceptSend && await window.JV.interceptSend(rawText) === true) { ui.value = ""; ui.style.height = "auto"; return; } } catch (e) {}

  let userDisplay = rawText;
  let promptText  = rawText;

  if (attachedFiles.length) {
    const fileSummaries = attachedFiles.map(f => {
      if (f.isImage) return `[Attached Image: "${f.name}"]`;
      return `[File: "${f.name}" (${f.size} bytes)]\n\`\`\`\n${f.content}\n\`\`\``;
    }).join("\n\n");

    promptText = `${fileSummaries}\n\n${rawText ? "User Request: " + rawText : "Please inspect the attached file(s) and provide thorough analysis."}`;
    userDisplay = attachedFiles.map(f => `📎 ${f.name}`).join(", ") + (rawText ? `\n\n${rawText}` : "");
  }

  const images = attachedFiles.filter(f => f.isImage);
  attachedFiles = [];
  updateAttachmentPreview();

  const ps = getP(), id = getCur(), pi = ps.findIndex(x => x.id === id);
  if (pi !== -1 && ps[pi].title === "New conversation" && rawText.length > 3) {
    const t2 = rawText.slice(0, 42) + (rawText.length > 42 ? "…" : "");
    ps[pi].title = t2; saveP(ps); ct.textContent = t2; renderProjs();
  }

  addMessageToDOM(userDisplay, "user", rawText);
  ui.value = ""; ui.style.height = "auto";
  sfx.play("send");

  if (!images.length && isImageRequest(rawText)) {
    await generateImage(extractImgPrompt(rawText));
    return;
  }

  await streamAIResponse(promptText, images);
}

function isImageRequest(txt) {
  return /^(?:please\s+)?(?:generate|create|draw|make|paint|render|show me)\s+(?:an?\s+)?(?:image|picture|photo|illustration|artwork)\s+(?:of\s+|showing\s+)?(.+)/i.test(txt.trim());
}
function extractImgPrompt(txt) {
  const m = txt.trim().match(/^(?:please\s+)?(?:generate|create|draw|make|paint|render|show me)\s+(?:an?\s+)?(?:image|picture|photo|illustration|artwork)\s+(?:of\s+|showing\s+)?(.+)/i);
  return m ? m[1].trim() : txt.trim();
}

async function streamAIResponse(promptText, images = [], hostRow = null) {
  busy = true;
  sb.disabled = true;
  stopGenBtn.classList.remove("hidden");
  abortController = new AbortController();
  try { jbPulse("thinking"); jbStat("prompts"); jbAchHour(); } catch (e) {}

  const es = document.getElementById("es"); if (es) es.remove();
  const isBranch = !!hostRow;
  const row = hostRow || document.createElement("div");
  if (!isBranch) {
    row.className = "mr bot";
    row.id = uid();
    row.innerHTML = `
    ${BAV()}
    <div class="mb">
      <div class="stream-content"></div>
      <span class="stream-cursor"></span>
      <div class="msg-actions" style="display:none"></div>
    </div>
  `;
    cc.appendChild(row);
  } else {
    row.querySelector(".stream-content").innerHTML = "";
    if (!row.querySelector(".stream-cursor")) { const s = document.createElement("span"); s.className = "stream-cursor"; row.querySelector(".mb").insertBefore(s, row.querySelector(".msg-actions")); }
    row.querySelector(".msg-actions").style.display = "none";
  }
  scroll();

  row.dataset.prompt = promptText;
  const contentEl = row.querySelector(".stream-content");
  const cursorEl  = row.querySelector(".stream-cursor");
  const actionsEl = row.querySelector(".msg-actions");

  // System directive + Project Knowledge Injection
  let sys = PERSONAS[activePersona] || PERSONAS.Default;
  if (activePersona === "Custom" && customDirective) sys = customDirective;
  try { if (window.JV && window.JV.systemTune) sys += window.JV.systemTune(promptText); } catch (e) {}

  const knowledge = getKnowledge();
  let kbUsed = [];
  if (knowledge.length) {
    let budget = typeof KB_MAX_TOTAL !== "undefined" ? KB_MAX_TOTAL : 120000, parts = [];
    for (const doc of knowledge) {
      if (doc.enabled === false) continue;
      if (budget <= 0) break;
      const c = String(doc.content || "").slice(0, budget); budget -= c.length;
      if (!c) continue;
      parts.push(`[Document: "${doc.name}"]:\n${c}\n`);
      kbUsed.push({ id: doc.id, name: doc.name });
    }
    if (parts.length) sys += "\n\nPROJECT KNOWLEDGE BASE:\n" + parts.join("\n");
  }

  if (debateMode) {
    sys = `You are JARVIK AI in DEBATE MODE. The user's stance: "${debateTopic}". Argue the COMPLETE OPPOSITE position with relentless wit and sharp logic. Under 140 words.`;
  } else if (codeMode) {
    sys = `You are JARVIK AI in CODE MODE. Provide complete, fully runnable code in ONE code block with correct language tags and filename=... attributes.`;
  }

  let userContent = promptText;
  if (images.length) {
    userContent = [
      { type: "text", text: promptText },
      ...images.map(img => ({ type: "image_url", image_url: { url: img.dataUrl } }))
    ];
  }

  const history = debateMode ? debateMem : (isBranch
    ? Array.from(cc.querySelectorAll('.mr')).slice(0, Array.from(cc.querySelectorAll('.mr')).indexOf(row) - 1).flatMap(r => {
        const el = r.querySelector(r.classList.contains('user') ? '.user-txt' : '.stream-content');
        return el ? [{role:r.classList.contains('user') ? 'user' : 'assistant', content:el.innerText}] : [];
      }).slice(-14)
    : getMem());
  const messages = [
    { role: "system", content: sys },
    ...history,
    { role: "user", content: userContent }
  ];

  const startTime = Date.now();
  let fullResponseText = "";
  let lastError = null;

  // Demo mode simulated response if no API key
  if (demoMode && !hasApiKey()) {
    const demoReply = `I've analyzed your request: "${promptText.slice(0, 80)}". Here is a complete interactive application generated for our **Co-Work Canvas**!

\`\`\`html filename=interactive-app.html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'DM Sans', sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; text-align: center; }
    h2 { color: #38bdf8; }
    .box { background: #1e293b; border-radius: 12px; padding: 20px; max-width: 400px; margin: 20px auto; border: 1px solid #334155; }
    button { background: #38bdf8; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; color: #0f172a; }
  </style>
</head>
<body>
  <h2>⚡ JARVIK Interactive Sandbox</h2>
  <div class="box">
    <p>Everything is executing live in your side-by-side Co-Work Canvas.</p>
    <button onclick="alert('⚡ Live Sandbox Click!')">Test Event</button>
  </div>
</body>
</html>
\`\`\`

### Sprint Roadmap:
- [x] Step 1: Initialized Co-Work Split-Screen Workspace
- [ ] Step 2: Implement Real API Key for Live Multi-Model Access
- [ ] Step 3: Deploy Full-Stack Web Artifact

*Note: You are currently exploring in Demo Mode. Click 🔑 API Key in the sidebar anytime to connect a provider — OpenRouter, NVIDIA NIM, OpenAI, Anthropic, Groq, Ollama & more!*`;

    for (let i = 0; i < demoReply.length; i += 8) {
      if (abortController.signal.aborted) break;
      fullResponseText += demoReply.slice(i, i + 8);
      renderPartialMarkdown(contentEl, fullResponseText);
      try { jbParticlesSpawn(cursorEl); } catch (e) {}
      scroll();
      await new Promise(r => setTimeout(r, 20));
    }
  } else {
    const prov = activeProvider();
    // OpenRouter-only graceful fallback chain; other providers try just the chosen model
    const routeMDL = (window.JV && window.JV.routeModel) ? (window.JV.routeModel(promptText, MDL) || MDL) : MDL;
    const tryModels = prov.id === "openrouter"
      ? [routeMDL, ...FALLBACK_MODELS.filter(m => m !== routeMDL)]
      : [routeMDL];

    for (const m of tryModels) {
      try {
        const response = await fetch(chatEndpoint(prov), {
          method: "POST",
          headers: authHeaders(prov),
          signal: abortController.signal,
          body: JSON.stringify(buildChatBody(messages, { model: m, stream: true }, true))
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          lastError = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
          if (response.status === 401) {
            contentEl.innerHTML = `<span style="color:#f87171">⚠ ${esc(prov.label)} key was rejected. Click 🔑 API Key in the sidebar to set a valid ${esc(prov.label)} key.</span>`;
            showKeyModal();
            try { jbPulse("error"); } catch (e) {}
            break;
          }
          continue;
        }

        await JarvikRuntime.readEventStream(response.body, event => {
          if (event.error) throw new Error(event.error.message || 'Provider stream failed');
          const delta = sseDelta(event);
          if (delta) {
            fullResponseText += delta;
            renderPartialMarkdown(contentEl, fullResponseText);
            scroll();
          }
        });

        if (fullResponseText.trim()) break;

      } catch (err) {
        if (err.name === "AbortError") {
          toast("Generation stopped");
          break;
        }
        lastError = err.message || "Network error";
        if (err && err.name === "TypeError" && promptText) ooQueue(promptText);
      }
    }
  }

  try { jbParticlesStop(); } catch (e) {}
  if (cursorEl) cursorEl.remove();
  row.querySelectorAll(".retry-ph").forEach(el => el.remove());
  try { delete row.dataset.regenerating; } catch (e) { row.dataset.regenerating = ""; }
  try { jbPulse(fullResponseText.trim() ? "idle" : "error"); } catch (e) {}
  busy = false;
  sb.disabled = false;
  stopGenBtn.classList.add("hidden");

  if (!fullResponseText.trim() && lastError) {
    contentEl.innerHTML = `<div style="color:#f87171;padding:8px 0">⚠ Response error: ${esc(lastError)}. Please verify your ${esc(providerNoun())} key / model / endpoint in Settings → Provider, or click 🔑 API Key.</div>`;
    sfx.play("mode");
    try { jbPulse("error"); } catch (e) {}
    if (isBranch && getBranches(row).length) showBranch(row, +row.dataset.bi || 0);
    actionsEl.style.display = "flex";
    actionsEl.innerHTML = '<button class="msg-act-btn act-regen">🔄 Retry</button><button class="msg-act-btn act-del">🗑 Delete</button>';
    delete row.dataset.hydBot;
    hydrateBranches(cc); saveChat();
    return;
  }

  renderFinalMarkdown(contentEl, fullResponseText);
  enhanceRenderedElements(row);

  // Extract roadmap tasks & artifacts from bot response
  extractSprintTasksFromText(fullResponseText);

  // Auto-register first code block in Co-Work Canvas
  const firstPre = row.querySelector("pre");
  if (firstPre) {
    const codeEl = firstPre.querySelector("code");
    if (codeEl) {
      const title = firstPre.dataset.fname || suggestedName(firstPre);
      let lang = "";
      codeEl.classList.forEach(c => { if (c.startsWith("language-")) lang = c.replace("language-", ""); });
      registerArtifact(title, codeEl.textContent, lang);
    }
  }

  // Action Toolbar
  const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
  const words = fullResponseText.trim().split(/\s+/).length;
  const speed = Math.round(words / elapsedSec);

  if (!isBranch) { row.dataset.br = JSON.stringify([fullResponseText]); row.dataset.bi = "0"; row.dataset.prompt = promptText; }
  else { const b0 = getBranches(row); b0.push(fullResponseText); try { row.dataset.br = JSON.stringify(b0); } catch (e) {} row.dataset.bi = String(b0.length - 1); }
  const cur = () => (getBranches(row)[+row.dataset.bi || 0] || fullResponseText);
  row.dataset.prompt = promptText;
  const brCount = getBranches(row).length;
  actionsEl.style.display = "flex";
  delete actionsEl.dataset.jvChips; delete actionsEl.dataset.jvAud;
  row.querySelectorAll(".jv-trace").forEach(el => el.remove());
  actionsEl.innerHTML = `
    ${kbUsed.length ? `<div class="kb-cites">📚 ${kbUsed.map(d => `<button class="kb-cite" data-kbid="${esc(d.id)}">${esc(d.name)}</button>`).join("")}</div>` : ""}
    <button class="msg-act-btn act-copy" title="Copy markdown">⧉ Copy</button>
    <button class="msg-act-btn act-speak" title="Read aloud">🔊 Read</button>
    <button class="msg-act-btn act-regen" title="Regenerate response">🔄 Retry</button>
    <span class="br-switch"${brCount < 2 ? " hidden" : ""}><button class="msg-act-btn br-prev" title="Previous reply">◀</button><span class="br-count">${(+row.dataset.bi || 0) + 1}/${brCount}</span><button class="msg-act-btn br-next" title="Next reply">▶</button></span>
    <button class="msg-act-btn act-compare" title="Compare prompt on 2 models">⚖ Compare</button>
    <button class="msg-act-btn act-pin" title="Pin message">📌 Pin</button>
    <button class="msg-act-btn act-del" title="Delete message">🗑️</button>
    <span class="msg-metrics">⚡ ${words} words · ~${speed} w/s</span>
  `;

  actionsEl.querySelector(".act-copy").onclick = async function() {
    if (!await copyText(cur())) return;
    this.textContent = "✓ Copied!";
    setTimeout(() => this.textContent = "⧉ Copy", 1500);
    sfx.play("click");
  };
  actionsEl.querySelector(".act-speak").onclick = () => speak(cur(), true);
  actionsEl.querySelector(".act-regen").onclick = () => {
    if (busy) { toast("Wait for the current reply to finish"); return; }
    row.scrollIntoView({ block: "center" });
    streamAIResponse(promptText, images, row);
  };
  actionsEl.querySelector(".act-compare").onclick = () => openCompareModal(promptText);
  actionsEl.querySelector(".act-pin").onclick = () => pinMessage(cur(), "bot");
  actionsEl.querySelector(".act-del").onclick = () => {
    if (confirm("Delete this response?")) { row.remove(); saveChat(); syncChatMemory(); }
  };
  actionsEl.querySelector(".br-prev").onclick = () => showBranch(row, (+row.dataset.bi || 0) - 1);
  actionsEl.querySelector(".br-next").onclick = () => showBranch(row, (+row.dataset.bi || 0) + 1);
  actionsEl.querySelectorAll(".kb-cite").forEach(b => b.onclick = () => {
    updateKnowledgeUI(); knowledgeModal.classList.remove("hidden");
    requestAnimationFrame(() => { const t = knowledgeList.querySelector(`[data-kbid="${b.dataset.kbid}"]`); if (t) t.scrollIntoView({ block: "center" }); });
  });

  if (debateMode) {
    debateMem.push({ role: "user", content: promptText });
    debateMem.push({ role: "assistant", content: fullResponseText });
    if (debateMem.length > 20) debateMem = debateMem.slice(-20);
  } else {
    syncChatMemory();
    speak(fullResponseText);
  }

  saveChat();
  try { if (typeof uaLog === "function") uaLog(words, promptText); } catch (e) {}
  sfx.play("complete");
  try { if (window.JV && window.JV.afterStream) window.JV.afterStream({ prompt: promptText, text: fullResponseText, row: row, elapsed: Date.now() - startTime, kbUsed: kbUsed }); } catch (e) {}
}

function renderPartialMarkdown(el, text) {
  let safeText = text;
  const codeBlockCount = (safeText.match(/```/g) || []).length;
  if (codeBlockCount % 2 === 1) safeText += "\n```";

  if (typeof marked !== "undefined") {
    el.innerHTML = JarvikRuntime.markdown(safeText);
  } else {
    el.innerHTML = esc(safeText).replace(/\n/g, "<br>");
  }
}

/* Retry can now work on freshly loaded chats too — the streaming row is rebuilt when no prompt is stored. */
function rewireRetryLike(row) {
  if (!row || row.dataset.regenerating === "1" || busy) return;
  const p = (row.dataset.prompt || "").trim();
  if (!p) { toast("No prompt saved for this reply"); return; }
  row.scrollIntoView({ block: "center" });
  row.dataset.regenerating = "1";
  let ph = row.querySelector(".retry-ph");
  if (!ph) {
    ph = document.createElement("div");
    ph.className = "retry-ph";
    ph.innerHTML = `<div class="retry-ph-line spinner-line"></div><div class="retry-ph-line"></div><div class="retry-ph-line short"></div>`;
    row.prepend(ph);
  }
  streamAIResponse(p, [], row);
}

/* Rebind bot actions on freshly restored messages that never streamed this session. */
function hydrateBranches(scope) {
  (scope || document).querySelectorAll(".mr.bot").forEach(row => {
    const bar = row.querySelector(".msg-actions"); if (!bar) return;
    if (row.dataset.hydBot === "1") return;
    row.dataset.hydBot = "1";
    const firstPre = null; // Never mistake a code block for the entire response.
    if (firstPre && !(row.dataset.br || "").length) {
      try { row.dataset.br = JSON.stringify([firstPre.textContent]); row.dataset.bi = "0"; } catch (e) {}
    }
    const getT = () => { const branches = getBranches(row); if (branches.length) return branches[+row.dataset.bi || 0] || ""; const sc = row.querySelector(".stream-content"); return sc ? sc.innerText : (row.querySelector(".mb") ? row.querySelector(".mb").innerText : ""); };
    const cp0 = bar.querySelector(".act-copy"); if (cp0) cp0.onclick = async function() { if (!await copyText(getT())) return; this.textContent = "✓ Copied!"; setTimeout(() => this.textContent = "⧉ Copy", 1500); };
    const sp0 = bar.querySelector(".act-speak"); if (sp0) sp0.onclick = () => speak(getT(), true);
    const cmp = bar.querySelector(".act-compare"); if (cmp) cmp.onclick = () => openCompareModal(row.dataset.prompt || "");
    const rg0 = bar.querySelector(".act-regen"); if (rg0) rg0.onclick = () => rewireRetryLike(row);
     const pn0 = bar.querySelector(".act-pin"); if (pn0) pn0.onclick = () => pinMessage(getT(), "bot");
    const dl0 = bar.querySelector(".act-del"); if (dl0) dl0.onclick = () => { if (confirm("Delete this response?")) { row.remove(); saveChat(); syncChatMemory(); } };
    bar.querySelectorAll(".br-prev").forEach(b => b.onclick = () => showBranch(row, (+row.dataset.bi || 0) - 1));
    bar.querySelectorAll(".br-next").forEach(b => b.onclick = () => showBranch(row, (+row.dataset.bi || 0) + 1));
    bar.querySelectorAll(".kb-cite").forEach(b => b.onclick = () => { updateKnowledgeUI(); knowledgeModal.classList.remove("hidden"); requestAnimationFrame(() => { const t = knowledgeList.querySelector(`[data-kbid="${b.dataset.kbid}"]`); if (t) t.scrollIntoView({ block: "center" }); }); });
    const sw = bar.querySelector(".br-switch"); if (sw) sw.hidden = getBranches(row).length < 2;
    const bc = bar.querySelector(".br-count"); if (bc) bc.textContent = ((+row.dataset.bi || 0) + 1) + "/" + Math.max(1, getBranches(row).length);
  });
}

function renderFinalMarkdown(el, text) {
  if (typeof marked !== "undefined") {
    el.innerHTML = JarvikRuntime.markdown(text);
  } else {
    el.innerHTML = esc(text).replace(/\n/g, "<br>");
  }
}

/* ── BRANCH REPLIES: alternate answers kept under one prompt ── */
function getBranches(row) { try { return JSON.parse(row.dataset.br || "[]"); } catch (e) { return []; } }
// ponytail: dataset JSON duplicates rendered HTML; ceiling ~50KB/row, upgrade to id-keyed localStorage map when threads run long.
function showBranch(row, i) {
  const b = getBranches(row); if (!b.length) return;
  i = ((i % b.length) + b.length) % b.length; row.dataset.bi = String(i);
  renderFinalMarkdown(row.querySelector(".stream-content"), b[i]);
  enhanceRenderedElements(row);
  const c = row.querySelector(".br-count"); if (c) c.textContent = (i + 1) + "/" + b.length;
  const sw = row.querySelector(".br-switch"); if (sw) sw.hidden = b.length < 2;
  saveChat(); syncChatMemory();
}

function hydrateUserActions(scope) {
  (scope || document).querySelectorAll(".mr.user").forEach(row => {
    if (row.dataset.hyd === "1") return;
    const bar = row.querySelector(".msg-actions"); if (!bar) return;
    row.dataset.hyd = "1";
    const txt = row.querySelector(".user-txt");
    const orig = txt ? txt.innerText : "";
    const cp = bar.querySelector(".act-copy"); if (cp) cp.onclick = () => copyText(orig, "Copied prompt");
    const pn = bar.querySelector(".act-pin"); if (pn) pn.onclick = () => pinMessage(orig, "user");
    const ed = bar.querySelector(".act-edit");
    if (ed) ed.onclick = () => {
      const box = row.querySelector(".mb"); if (!box) return;
      box.innerHTML = `<div class="msg-editor"><textarea class="msg-edit-ta">${esc(orig)}</textarea><div class="msg-edit-btns"><button class="msg-edit-cancel">Cancel</button><button class="msg-edit-save">Save &amp; Resend</button></div></div>`;
      const ta = box.querySelector(".msg-edit-ta"); ta.focus();
      box.querySelector(".msg-edit-cancel").onclick = () => loadChat();
      box.querySelector(".msg-edit-save").onclick = () => {
        const v = ta.value.trim(); if (!v) return;
        while (row.nextElementSibling) row.nextElementSibling.remove();
        row.remove();
        saveChat(); syncChatMemory(); ui.value = v; send();
      };
    };
  });
}

/* Safe clipboard: API with manual fallback for file:// and denied permissions. */
async function copyText(t, doneMsg) {
  try { await navigator.clipboard.writeText(t); }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (_) {}
    ta.remove();
    if (!copied) { toast("Clipboard blocked. Select the text and copy manually."); return false; }
  }
  if (doneMsg) toast(doneMsg);
  return true;
}

/* ── DOM MESSAGE CREATION ── */
function addMessageToDOM(displayText, who, rawUserText = "") {
  const es = document.getElementById("es"); if (es) es.remove();
  const row = document.createElement("div");
  row.className = "mr " + who;
  const id = uid();
  row.id = id;

  const html = who === "bot"
    ? (typeof marked !== "undefined" ? JarvikRuntime.markdown(displayText) : esc(displayText).replace(/\n/g, "<br>"))
    : esc(displayText).replace(/\n/g, "<br>");

  row.innerHTML = who === "bot"
    ? `${BAV()}<div class="mb">${html}</div>`
    : `<div class="mb">
        <div class="user-txt">${html}</div>
        <div class="msg-actions">
          <button class="msg-act-btn act-edit" title="Edit prompt">✎ Edit</button>
          <button class="msg-act-btn act-copy" title="Copy">⧉</button>
          <button class="msg-act-btn act-pin" title="Pin">📌</button>
        </div>
      </div>`;

  if (who === "user") {
    const editBtn = row.querySelector(".act-edit");
    const copyBtn = row.querySelector(".act-copy");
    const pinBtn  = row.querySelector(".act-pin");

    if (copyBtn) copyBtn.onclick = () => copyText(rawUserText || displayText, "Copied prompt");
    if (pinBtn) pinBtn.onclick = () => pinMessage(rawUserText || displayText, "user");
    if (editBtn) {
      editBtn.onclick = () => {
        const mb = row.querySelector(".mb");
        const orig = rawUserText || displayText;
        mb.innerHTML = `
          <div class="msg-editor">
            <textarea class="msg-edit-ta">${esc(orig)}</textarea>
            <div class="msg-edit-btns">
              <button class="msg-edit-cancel">Cancel</button>
              <button class="msg-edit-save">Save &amp; Resend</button>
            </div>
          </div>
        `;
        const ta = mb.querySelector(".msg-edit-ta");
        ta.focus();
        mb.querySelector(".msg-edit-cancel").onclick = () => {
          loadChat();
        };
        mb.querySelector(".msg-edit-save").onclick = () => {
          const newTxt = ta.value.trim();
          if (!newTxt) return;
          while (row.nextElementSibling) row.nextElementSibling.remove();
          row.remove();
          saveChat(); syncChatMemory();
          ui.value = newTxt;
          send();
        };
      };
    }
  }

  cc.appendChild(row);
  scroll();
  saveChat();
  if (who === "bot") enhanceRenderedElements(row);
}

function syncChatMemory() {
  const messages = Array.from(cc.querySelectorAll('.mr')).flatMap(row => {
    const user = row.classList.contains('user');
    const el = row.querySelector(user ? '.user-txt' : '.stream-content');
    if (!el) return [];
    const branches = getBranches(row);
    const text = user ? el.innerText : (branches[+row.dataset.bi || 0] || el.innerText);
    return text.trim() ? [{role: user ? 'user' : 'assistant', content: text.slice(0, 4000)}] : [];
  });
  saveMem(messages.slice(-14));
}
function pushMem(role, content) {
  let m = getMem();
  m.push({ role, content: typeof content === "string" ? content.slice(0, 4000) : "multimodal input" });
  if (m.length > 14) m = m.slice(-14);
  saveMem(m);
}

/* ── STOP GENERATION BUTTON ── */
if (stopGenBtn) {
  stopGenBtn.onclick = () => {
    if (abortController) abortController.abort();
    // Keep the send lock until the active stream has finished cleanup.
    stopGenBtn.classList.add("hidden");
    sfx.play("click");
  };
}

/* ── IMAGE GENERATION (Pollinations AI) ── */
async function generateImage(prompt) {
  busy = true; sb.disabled = true;
  sfx.play("mode");

  const es = document.getElementById("es"); if (es) es.remove();
  const row = document.createElement("div");
  row.className = "mr bot";
  const seed = Math.floor(Math.random() * 999999);
  const src = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

  row.innerHTML = `
    ${BAV()}
    <div class="mb">
      <div class="img-render-box">
        <div class="img-loading-spinner">🎨 Generating artwork for "${esc(prompt)}"…</div>
      </div>
    </div>
  `;
  cc.appendChild(row);
  scroll();

  const img = new Image();
  img.onload = () => {
    row.querySelector(".img-render-box").innerHTML = `
      <img src="${src}" alt="${esc(prompt)}" class="generated-img" style="max-width:100%;border-radius:12px;cursor:zoom-in;display:block;margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:11.5px;color:var(--muted)">🎨 "${esc(prompt)}"</span>
        <button class="save-btn" id="save-art-${seed}">💾 Save High-Res</button>
      </div>
    `;
    const imgEl = row.querySelector(".generated-img");
    if (imgEl) imgEl.onclick = () => openLightbox(src);
    const saveBtn = document.getElementById(`save-art-${seed}`);
    if (saveBtn) {
      saveBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = src; a.download = prompt.replace(/[^a-z0-9_-]/gi, "-").slice(0, 30) + ".png";
        a.click();
      };
    }
    busy = false; sb.disabled = false;
    sfx.play("complete");
    saveChat(); scroll();
  };
  img.onerror = () => {
    row.querySelector(".img-render-box").innerHTML = `<span style="color:#f87171">Image generation service timed out. Please try another prompt.</span>`;
    busy = false; sb.disabled = false;
  };
  img.src = src;
}

/* ── COMMAND PALETTE (Ctrl+K) ── */
const COMMANDS = [
  { icon: "💻", title: "Launch VS Code Studio IDE", tag: "Editor", action: () => openVSCodeModal() },
  { icon: "🌐", title: "Open In-App Web Browser", tag: "Browser", action: () => openBrowserModal() },
  { icon: "👥", title: "Toggle Co-Work Split Canvas", tag: "Workspace", action: () => coworkTopBtn.click() },
  { icon: "📁", title: "Open Project Knowledge Shelf", tag: "Workspace", action: () => knowledgeBtn.click() },
  { icon: "📋", title: "Toggle Sprint Roadmap", tag: "Sprint", action: () => sprintToggleBtn.click() },
  { icon: "💬", title: "New Conversation", tag: "Chat", action: () => newConv() },
  { icon: "💻", title: "Toggle Code Mode", tag: "Mode", action: () => document.getElementById("code-mode-btn").click() },
  { icon: "⚡", title: "Open Live Canvas / Artifacts", tag: "Studio", action: () => openArtifact("Canvas Sandbox", "<!-- Live interactive app -->\n<h1>JARVIK Live Canvas</h1>") },
  { icon: "⚔️", title: "Start Debate Mode", tag: "Mode", action: () => document.getElementById("debate-btn").click() },
  { icon: "🔥", title: "Roast My Conversations", tag: "Fun", action: () => document.getElementById("roast-btn").click() },
  { icon: "😈", title: "Devil's Advocate Pre-Mortem", tag: "Tool", action: () => document.getElementById("da-btn").click() },
  { icon: "✨", title: "Gen-Z Converter", tag: "Tool", action: () => document.getElementById("genz-btn").click() },
  { icon: "⚙️", title: "Settings & AI Parameters", tag: "System", action: () => openSettingsModal() },
  { icon: "🔑", title: "API Key & Providers", tag: "Auth", action: () => showKeyModal() },
  { icon: "🌓", title: "Pick a Theme (7: Pitch Black, Blue, Paper…)", tag: "UI", action: () => showThemePicker(innerWidth / 2, 80) },
  { icon: "🔊", title: "Toggle Sci-Fi Sound FX", tag: "Audio", action: () => {
      sfxEnabled = !sfxEnabled;
      localStorage.setItem(SFX_K, sfxEnabled ? "1" : "0");
      if (sfxSetting) sfxSetting.checked = sfxEnabled;
      syncSFX();
      toast(sfxEnabled ? "🔊 Sound effects on" : "🔇 Sound effects off");
    } },
  { icon: "🎙️", title: "Toggle Auto Voice (TTS replies)", tag: "Audio", action: () => {
      ve = !ve;
      localStorage.setItem(VK, ve ? "on" : "off");
      if (!ve && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
      syncVoice();
      toast(ve ? "Voice speech enabled" : "Voice speech disabled");
    } },
  { icon: "📌", title: "View Pinned Messages", tag: "Saved", action: () => { renderPins(); pinsModal.classList.remove("hidden"); sfx.play("click"); } },
  { icon: "⚖️", title: "Compare Models Side-by-Side", tag: "Tool", action: () => openCompareModal((ui.value || "").trim()) },
  { icon: "📚", title: "Prompt Library", tag: "Tool", action: () => showPL() },
  { icon: "◉", title: "Toggle Focus Mode", tag: "UI", action: () => fmToggle() },
  { icon: "👥", title: "Join a Team Room", tag: "Team", action: () => showTeamModal() },
  { icon: "📊", title: "View Usage Analytics", tag: "Data", action: () => showUA() },
  { icon: "↗️", title: "Export Conversation", tag: "Data", action: () => { exportModal.classList.remove("hidden"); sfx.play("click"); } }
];

let cmdActiveIdx = 0;
let filteredCommands = [];

function openCommandPalette() {
  cmdPalette.classList.remove("hidden");
  cmdInput.value = "";
  cmdInput.focus();
  filterCommands("");
  sfx.play("mode");
}
function closeCommandPalette() {
  cmdPalette.classList.add("hidden");
}
function filterCommands(query) {
  const q = query.toLowerCase().trim();
  const ps = getP();

  const chatCommands = ps.slice(0, 10).map(p => ({
    icon: p.pinned ? "★" : "💬",
    title: `Chat: ${p.title}`,
    tag: relt(p.created),
    action: () => { setCur(p.id); loadChat(); renderProjs(); }
  }));

  filteredCommands = [...COMMANDS, ...chatCommands].filter(c =>
    c.title.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q)
  );
  cmdActiveIdx = 0;
  renderCommandResults();
}

function renderCommandResults() {
  cmdResults.innerHTML = "";
  if (!filteredCommands.length) {
    cmdResults.innerHTML = `<div class="eml" style="padding:18px">No matching commands or conversations</div>`;
    return;
  }
  filteredCommands.slice(0, 12).forEach((c, idx) => {
    const item = document.createElement("div");
    item.className = "cmd-item" + (idx === cmdActiveIdx ? " active" : "");
    item.innerHTML = `
      <span class="cmd-item-icon">${c.icon}</span>
      <span class="cmd-item-title">${esc(c.title)}</span>
      <span class="cmd-item-tag">${esc(c.tag)}</span>
    `;
    item.onclick = () => {
      closeCommandPalette();
      c.action();
    };
    cmdResults.appendChild(item);
  });
}

if (cmdTrigger) cmdTrigger.onclick = openCommandPalette;
if (cmdInput) {
  cmdInput.oninput = () => filterCommands(cmdInput.value);
  cmdInput.onkeydown = e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      cmdActiveIdx = (cmdActiveIdx + 1) % filteredCommands.length;
      renderCommandResults();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      cmdActiveIdx = (cmdActiveIdx - 1 + filteredCommands.length) % filteredCommands.length;
      renderCommandResults();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[cmdActiveIdx]) {
        closeCommandPalette();
        filteredCommands[cmdActiveIdx].action();
      }
    } else if (e.key === "Escape") {
      closeCommandPalette();
    }
  };
}
if (cmdPalette) {
  cmdPalette.onclick = e => { if (e.target === cmdPalette) closeCommandPalette(); };
}

window.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (cmdPalette.classList.contains("hidden")) openCommandPalette();
    else closeCommandPalette();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    document.getElementById("sidebar-toggle-btn").click();
  } else if (e.key === "Escape") {
    if (!cmdPalette.classList.contains("hidden")) closeCommandPalette();
    if (!modal.classList.contains("hidden")) modal.classList.add("hidden");
    if (!settingsModal.classList.contains("hidden")) settingsModal.classList.add("hidden");
    if (!exportModal.classList.contains("hidden")) exportModal.classList.add("hidden");
    if (!pinsModal.classList.contains("hidden")) pinsModal.classList.add("hidden");
    if (!knowledgeModal.classList.contains("hidden")) knowledgeModal.classList.add("hidden");
    if (!lightboxModal.classList.contains("hidden")) lightboxModal.classList.add("hidden");
    if (busy && abortController) abortController.abort();
  }
});

/* ── SETTINGS MODAL ── */
function openSettingsModal() {
  personaSelect.value = activePersona;
  customPromptEl.value = customDirective;
  customPromptEl.style.display = activePersona === "Custom" ? "block" : "none";
  sfxSetting.checked = sfxEnabled;
  populateTTSVoices();
  renderProvPanel();
  settingsModal.classList.remove("hidden");
  sfx.play("mode");
}

function populateTTSVoices() {
  if (typeof speechSynthesis === "undefined") return;
  const voices = speechSynthesis.getVoices();
  ttsVoiceSelect.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    if (v.name === localStorage.getItem(PK("tts_voice"))) opt.selected = true;
    ttsVoiceSelect.appendChild(opt);
  });
}
if (typeof speechSynthesis !== "undefined") speechSynthesis.onvoiceschanged = populateTTSVoices;

if (settingsBtn) settingsBtn.onclick = openSettingsModal;
if (settingsClose) settingsClose.onclick = () => settingsModal.classList.add("hidden");
if (settingsModal) settingsModal.onclick = e => { if (e.target === settingsModal) settingsModal.classList.add("hidden"); };

if (personaSelect) {
  personaSelect.onchange = () => {
    customPromptEl.style.display = personaSelect.value === "Custom" ? "block" : "none";
  };
}
if (paramTemp) paramTemp.oninput = () => paramTempText.textContent = paramTemp.value;
if (paramTokens) paramTokens.oninput = () => paramTokensTxt.textContent = paramTokens.value;
if (paramTopP) paramTopP.oninput = () => paramTopPTxt.textContent = paramTopP.value;
if (ttsRateInput) ttsRateInput.oninput = () => ttsRateText.textContent = ttsRateInput.value + "x";

if (settingsSave) {
  settingsSave.onclick = () => {
    activePersona = personaSelect.value;
    customDirective = customPromptEl.value.trim();
    localStorage.setItem(PK("persona"), activePersona);
    localStorage.setItem(PK("custom_prompt"), customDirective);
    localStorage.setItem(PK("param_temp"), paramTemp.value);
    localStorage.setItem(PK("param_tokens"), paramTokens.value);
    localStorage.setItem(PK("param_top_p"), paramTopP.value);
    localStorage.setItem(PK("tts_voice"), ttsVoiceSelect.value);
    localStorage.setItem(PK("tts_rate"), ttsRateInput.value);
    sfxEnabled = sfxSetting.checked;
    localStorage.setItem(SFX_K, sfxEnabled ? "1" : "0");
    syncSFX();
    if (personaBadge) personaBadge.textContent = activePersona;
    settingsModal.classList.add("hidden");
    sfx.play("complete");
    toast("Settings saved");
  };
}

/* ── SETTINGS · PROVIDER & ENDPOINT PANEL (instant-apply) ── */
const provGrid        = $("prov-grid");
const provKeyInput    = $("prov-key-input");
const provKeyShow     = $("prov-key-show");
const provKeySave     = $("prov-key-save");
const provEndpoint    = $("prov-endpoint-input");
const provEndpointRst = $("prov-endpoint-reset");
const provModelInput  = $("prov-model-input");
const provModelList   = $("prov-model-datalist");
const provFetchBtn    = $("prov-fetch-models");
const provStatus      = $("prov-status");

function populateProvDatalist() {
  if (!provModelList) return;
  const ids = currentModelList().map(m => m.id);
  provModelList.innerHTML = ids.slice(0, 200).map(id => `<option value="${esc(id)}"></option>`).join("");
}

function renderProvPanel() {
  if (!provGrid) return;
  const act = pcfg.active;
  provGrid.innerHTML = PROVIDERS.map(p => `
    <button type="button" class="prov-chip ${p.id === act ? "active" : ""}" data-prov="${p.id}" title="${esc(p.blurb)}">
      <span class="prov-chip-dot ${providerKey(p.id) ? "has-key" : ""}"></span>
      <span class="prov-chip-label">${esc(p.label)}</span>
    </button>
  `).join("");
  provGrid.querySelectorAll(".prov-chip").forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.prov === pcfg.active) return;
      setActiveProvider(btn.dataset.prov);
      sfx.play("click");
      toast(`Provider: ${providerDef(pcfg.active).label}`);
    };
  });

  const p = activeProvider();
  if (provKeyInput)    { provKeyInput.value = providerKey(p.id); provKeyInput.placeholder = p.keyHint || "API key…"; }
  if (provEndpoint)    { provEndpoint.value = pcfg.endpoints[p.id] || p.baseUrl; provEndpoint.placeholder = p.custom ? "https://your-gateway.example/v1" : p.baseUrl; }
  if (provModelInput)  provModelInput.value = MDL;
  populateProvDatalist();
  renderProvStatus();
}

function renderProvStatus() {
  if (!provStatus) return;
  const p = activeProvider();
  const hasKey = !!providerKey(p.id);
  const keyTxt = p.keyless ? "no key required" : (hasKey ? "key saved ✓" : `<button type="button" class="prov-status-link" id="prov-status-keybtn">add key</button>`);
  const endpoint = pcfg.endpoints[p.id] || p.baseUrl || "no endpoint set";
  const models = p.id === "openrouter" ? `${MODELS.length} curated` : ((pcfg.models[p.id] || []).length ? `${pcfg.models[p.id].length} loaded` : "not fetched");
  provStatus.innerHTML = `<span class="prov-pill">Auth: ${keyTxt}</span><span class="prov-pill">Endpoint: ${esc(endpoint)}</span><span class="prov-pill">Models: ${models}</span>`;
  const kb = $("prov-status-keybtn");
  if (kb) kb.onclick = () => { if (provKeyInput) { provKeyInput.focus(); provKeyInput.select(); } };
}

if (provGrid) {
  if (provKeyShow) provKeyShow.onchange = () => { provKeyInput.type = provKeyShow.checked ? "text" : "password"; };
  if (provKeySave) {
    provKeySave.onclick = () => {
      const id = pcfg.active, def = providerDef(id);
      const v = provKeyInput.value.trim();
      const err = validateProviderKey(id, v);
      if (err) { toast(err); return; }
      saveProviderKey(id, v);
      renderProvPanel();
      sfx.play("complete");
      toast(v ? `✅ ${def.label} key saved locally!` : `Key cleared for ${def.label}`);
      if (!appStarted && v) boot();
    };
  }
  if (provEndpoint) {
    provEndpoint.onchange = () => {
      const id = pcfg.active, def = providerDef(id);
      let v = provEndpoint.value.trim().replace(/\/+$/, "");
      if (!v || v === def.baseUrl.replace(/\/+$/, "")) delete pcfg.endpoints[id];
      else pcfg.endpoints[id] = v;
      savePcfg();
      renderProvStatus();
      toast("Endpoint saved");
    };
    provEndpoint.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); provEndpoint.blur(); } };
  }
  if (provEndpointRst) {
    provEndpointRst.onclick = () => {
      delete pcfg.endpoints[pcfg.active];
      savePcfg();
      if (provEndpoint) provEndpoint.value = providerDef(pcfg.active).baseUrl;
      renderProvStatus();
      toast("Endpoint reset to preset");
    };
  }
  if (provModelInput) {
    const applyModel = () => {
      const v = provModelInput.value.trim();
      if (!v || v === MDL) return;
      MDL = v; localStorage.setItem(MK, MDL);
      pcfg.selected[pcfg.active] = v; savePcfg();
      updateModelBadge();
      toast("Model set: " + v);
    };
    provModelInput.onchange = applyModel;
    provModelInput.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); applyModel(); } };
  }
  if (provFetchBtn) {
    provFetchBtn.onclick = async () => {
      const p = activeProvider();
      provFetchBtn.disabled = true; provFetchBtn.textContent = "Fetching…";
      try {
        const ids = await fetchProviderModels();
        provModelInput && (provModelInput.value = MDL);
        populateProvDatalist();
        renderProvStatus();
        sfx.play("complete");
        toast(`Loaded ${ids.length} ${p.label} models`);
      } catch (err) {
        sfx.play("mode");
        toast(`${p.label}: ${err.message}`);
      } finally {
        provFetchBtn.disabled = false; provFetchBtn.textContent = "Fetch models";
      }
    };
  }
}

/* ── EXPORT MODAL ── */
if (exportBtn) {
  exportBtn.onclick = () => {
    exportModal.classList.remove("hidden");
    sfx.play("click");
  };
}
if (exportClose) exportClose.onclick = () => exportModal.classList.add("hidden");
if (exportModal) exportModal.onclick = e => { if (e.target === exportModal) exportModal.classList.add("hidden"); };

document.getElementById("export-md-btn").onclick = () => {
  const ps = getP(), id = getCur(), pr = ps.find(x => x.id === id);
  const title = pr ? pr.title : "JARVIK-Conversation";
  const messages = Array.from(cc.querySelectorAll(".mr")).map(el => {
    const isBot = el.classList.contains("bot");
    const text = el.querySelector(".mb") ? el.querySelector(".mb").innerText : "";
    return `### ${isBot ? "JARVIK AI" : "User"}\n\n${text}\n`;
  }).join("\n---\n\n");
  const md = `# ${title}\n*Exported from JARVIK AI on ${new Date().toLocaleDateString()}*\n\n${messages}`;
  saveTextFile(title.replace(/[^a-z0-9_-]/gi, "-") + ".md", md);
};

document.getElementById("export-html-btn").onclick = () => {
  const ps = getP(), id = getCur(), pr = ps.find(x => x.id === id);
  const title = pr ? pr.title : "JARVIK-Transcript";
  const bodyHtml = cc.innerHTML;
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font-family:'DM Sans',system-ui,sans-serif;background:#141413;color:#ececea;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7}
h1{font-family:serif;color:#35d6e8;border-bottom:1px solid #2b2b29;padding-bottom:12px}
.mr{margin:24px 0;padding:16px;border-radius:12px;background:#1d1d1b;border:1px solid #2b2b29}
.mr.user{background:#2c2c2a}
.bav svg{width:24px;height:24px;color:#35d6e8}
pre{background:#101010;padding:12px;border-radius:8px;overflow-x:auto}
code{color:#35d6e8;font-family:monospace}
</style></head><body><h1>${esc(title)}</h1>${bodyHtml}</body></html>`;
  saveTextFile(title.replace(/[^a-z0-9_-]/gi, "-") + ".html", doc);
};

document.getElementById("export-json-btn").onclick = () => {
  const ps = getP(), id = getCur(), pr = ps.find(x => x.id === id);
  const data = JSON.stringify(pr || {}, null, 2);
  saveTextFile("jarvik-chat-" + Date.now() + ".json", data);
};

document.getElementById("export-print-btn").onclick = () => window.print();

document.getElementById("backup-all-btn").onclick = () => {
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k !== KK && k !== PKEY_K) backup[k] = localStorage.getItem(k); // never export API keys
  }
  saveTextFile("jarvik-full-backup-" + Date.now() + ".json", JSON.stringify(backup, null, 2));
};

document.getElementById("import-file-input").onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.entries(data).forEach(([k, v]) => {
        if (k !== KK && k !== PKEY_K) localStorage.setItem(k, v); // never import keys from backups
      });
      toast("✅ Backup imported successfully!");
      setTimeout(() => location.reload(), 800);
    } catch(err) {
      toast("Invalid backup file: " + err.message);
    }
  };
  reader.readAsText(file);
};

/* ── INPUT EVENTS ── */
ui.addEventListener("input", () => {
  grow(ui);
  checkSlashCommand(ui.value);
});
ui.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    if (!slashPopup.classList.contains("hidden")) {
      e.preventDefault();
      if (filteredSlash[slashActiveIdx]) selectSlashCommand(filteredSlash[slashActiveIdx]);
      return;
    }
    e.preventDefault();
    send();
  } else if (!slashPopup.classList.contains("hidden")) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      slashActiveIdx = (slashActiveIdx + 1) % filteredSlash.length;
      renderSlashList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      slashActiveIdx = (slashActiveIdx - 1 + filteredSlash.length) % filteredSlash.length;
      renderSlashList();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (filteredSlash[slashActiveIdx]) selectSlashCommand(filteredSlash[slashActiveIdx]);
    } else if (e.key === "Escape") {
      slashPopup.classList.add("hidden");
    }
  }
});
sb.onclick = send;
npb.onclick = () => newConv();
mc.onclick = () => modal.classList.add("hidden");
modal.onclick = e => { if (e.target === modal) modal.classList.add("hidden"); };

if (mic) {
  mic.onclick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("Voice input not supported in this browser. Use Chrome/Edge/Safari."); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    miclbl.textContent = "Listening…";
    mic.querySelector("svg").style.stroke = "var(--accent)";
    sfx.play("mode");
    rec.onresult = e => {
      ui.value = (ui.value ? ui.value + " " : "") + e.results[0][0].transcript;
      grow(ui);
    };
    rec.onend = () => {
      miclbl.textContent = "Voice input";
      mic.querySelector("svg").style.stroke = "";
    };
    rec.onerror = () => {
      miclbl.textContent = "Voice input";
      mic.querySelector("svg").style.stroke = "";
    };
    rec.start();
  };
}

/* ── CODE MODE TOGGLE ── */
function toggleCodeMode() {
  codeMode = !codeMode;
  const btn   = document.getElementById("code-mode-btn");
  const label = document.getElementById("code-mode-label");
  const badge = document.getElementById("code-mode-badge");

  btn.classList.toggle("active", codeMode);
  badge.classList.toggle("hidden", !codeMode);
  label.textContent = codeMode ? "Code Mode ON" : "Code Mode";
  ui.placeholder    = codeMode ? "Describe code to build, paste bugs to fix, or ask architecture questions…" : "Message JARVIK AI…";
  app.classList.toggle("code-mode-active", codeMode);
  sfx.play("mode");

  if (codeMode) {
    newConv("💻 Code Session");
    setTimeout(() => {
      const row = document.createElement("div");
      row.className = "mr bot";
      row.innerHTML = `
        ${BAV()}
        <div class="mb">
          <div class="code-mode-welcome">
            <div class="cmw-title">⌨️ Code Mode Activated</div>
            <div class="cmw-body">Complete, production-ready code with syntax highlighting, one-click 💾 File Save, and ⚡ Live Canvas execution. Tell me what you're building.</div>
            <div class="cmw-chips">
              <span>Full-Stack Web App</span><span>Debug Algorithm</span><span>REST API in Python</span><span>Data Structures</span>
            </div>
          </div>
        </div>
      `;
      cc.appendChild(row); scroll();
      row.querySelectorAll(".cmw-chips span").forEach(chip => {
        chip.onclick = () => { ui.value = chip.textContent; grow(ui); ui.focus(); };
      });
    }, 100);
  }
}
document.getElementById("code-mode-btn").onclick = toggleCodeMode;

/* ── ROAST, DEBATE, DEVIL'S ADVOCATE, GEN-Z ── */
function buildRoastContext() {
  const ps = getP();
  const lines = [];
  ps.forEach(pr => {
    if (!pr.content) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = pr.content;
    tmp.querySelectorAll(".mr.user .mb .user-txt, .mr.user .mb").forEach(el => {
      const t = (el.innerText || el.textContent || "").trim();
      if (t && t.length > 2) lines.push(t);
    });
  });
  return lines;
}
async function runRoast() {
  document.getElementById("roast-modal").classList.remove("hidden");
  document.getElementById("roast-loading").style.display = "flex";
  document.getElementById("roast-text").style.display    = "none";
  document.getElementById("roast-again").style.display   = "none";
  sfx.play("mode");

  const msgs = buildRoastContext();
  if (!msgs.length) {
    document.getElementById("roast-loading").style.display = "none";
    document.getElementById("roast-text").style.display = "block";
    document.getElementById("roast-text").innerHTML = "<p>You haven't chatted with JARVIK yet.</p><p>Have a few real conversations first, then come back to get roasted! 💀</p>";
    return;
  }

  const sample = msgs.slice(-25).join("\n- ");
  const roastSys = `You are JARVIK AI in Roast Mode. Deliver a SAVAGE, HILARIOUS, brutally specific roast based on their actual questions and habits. Under 150 words. End with a devastating one-liner.`;

  try {
    const roast = await chatOnce([
      { role: "system", content: roastSys },
      { role: "user", content: "My chat history:\n- " + sample }
    ], { maxTokens: 300 }) || "JARVIK refuses to roast you — you are unroastable.";
    document.getElementById("roast-loading").style.display = "none";
    document.getElementById("roast-text").style.display = "block";
    document.getElementById("roast-again").style.display = "block";
    document.getElementById("roast-text").innerHTML = roast.split("\n\n").map(p => `<p>${esc(p)}</p>`).join("");
    sfx.play("complete");
  } catch(e) {
    document.getElementById("roast-loading").style.display = "none";
    document.getElementById("roast-text").style.display = "block";
    document.getElementById("roast-text").innerHTML = `<p style="color:#f87171">Roast engine error: ${esc(e.message)}</p>`;
  }
}
document.getElementById("roast-btn").onclick = runRoast;
document.getElementById("roast-close").onclick = () => document.getElementById("roast-modal").classList.add("hidden");
document.getElementById("roast-again").onclick = runRoast;

async function startDebate(topic) {
  debateMode = true;
  debateTopic = topic;
  debateMem = [];
  document.getElementById("debate-btn-label").textContent = "End debate ⚔️";
  document.getElementById("debate-btn").classList.add("debate-active");
  newConv("⚔️ Debate: " + topic.slice(0, 32));

  const banner = document.createElement("div");
  banner.id = "debate-banner";
  banner.className = "debate-banner";
  banner.innerHTML = `
    <div class="debate-banner-left">
      <span class="debate-banner-icon">⚔️</span>
      <div>
        <div class="debate-banner-label">DEBATE MODE ACTIVE</div>
        <div class="debate-banner-topic">Your position: <strong>${esc(topic)}</strong></div>
      </div>
    </div>
    <button class="debate-end-btn" id="debate-end-btn">End Debate</button>
  `;
  cc.parentElement.insertBefore(banner, cc);
  document.getElementById("debate-end-btn").onclick = endDebate;

  sfx.play("mode");
  await streamAIResponse(`I believe that: "${topic}". Open our debate with your counter-argument.`);
}

function endDebate() {
  debateMode = false;
  debateTopic = "";
  debateMem = [];
  document.getElementById("debate-btn-label").textContent = "Debate me ⚔️";
  document.getElementById("debate-btn").classList.remove("debate-active");
  const b = document.getElementById("debate-banner");
  if (b) b.remove();
  const verdict = document.createElement("div");
  verdict.className = "debate-verdict";
  verdict.innerHTML = `<span>⚔️</span> Debate concluded. JARVIK remains staunchly unconvinced. Good sparring.`;
  cc.appendChild(verdict); scroll();
  sfx.play("click");
}
document.getElementById("debate-btn").onclick = () => {
  if (debateMode) { endDebate(); return; }
  document.getElementById("debate-modal").classList.remove("hidden");
  setTimeout(() => document.getElementById("debate-topic-input").focus(), 80);
};
document.getElementById("debate-modal-close").onclick = () => document.getElementById("debate-modal").classList.add("hidden");
document.getElementById("debate-start-btn").onclick = () => {
  const topic = document.getElementById("debate-topic-input").value.trim();
  if (!topic) return;
  document.getElementById("debate-modal").classList.add("hidden");
  document.getElementById("debate-topic-input").value = "";
  startDebate(topic);
};
document.querySelectorAll(".debate-eg").forEach(b => {
  b.onclick = () => {
    document.getElementById("debate-topic-input").value = b.dataset.t;
    document.getElementById("debate-start-btn").click();
  };
});

const daModal       = $("da-modal");
const daResultModal = $("da-result-modal");
const daInput       = $("da-input");
const daChars       = $("da-chars");
if (daInput) daInput.oninput = () => daChars.textContent = daInput.value.length;
$("da-btn").onclick = () => { daModal.classList.remove("hidden"); setTimeout(() => daInput.focus(), 60); };
$("da-close").onclick = () => daModal.classList.add("hidden");
$("da-result-close").onclick = () => daResultModal.classList.add("hidden");
$("da-again").onclick = () => {
  daResultModal.classList.add("hidden");
  daModal.classList.remove("hidden");
  daInput.value = "";
  daChars.textContent = "0";
  daInput.focus();
};
$("da-submit").onclick = async () => {
  const idea = daInput.value.trim();
  if (!idea) return;
  daModal.classList.add("hidden");
  daResultModal.classList.remove("hidden");
  $("da-loading").style.display = "flex";
  $("da-result-text").style.display = "none";
  $("da-result-footer").style.display = "none";
  sfx.play("mode");

  const daSys = `You are JARVIK AI in Devil's Advocate mode. Dissect every vulnerability and fatal flaw in the user's idea. Under 220 words.`;
  try {
    const content = await chatOnce(
      [{ role: "system", content: daSys }, { role: "user", content: "My idea: " + idea }],
      { maxTokens: 350 }
    ) || "No analysis returned.";
    $("da-loading").style.display = "none";
    $("da-result-text").style.display = "block";
    $("da-result-footer").style.display = "block";
    $("da-result-text").innerHTML = JarvikRuntime.markdown(content);
    sfx.play("complete");
  } catch(e) {
    $("da-loading").style.display = "none";
    $("da-result-text").style.display = "block";
    $("da-result-text").innerHTML = `<span style="color:#f87171">Error: ${esc(e.message)}</span>`;
  }
};

let genzLevel = 2;
const GENZ_PROMPTS = {
  1: `Lightly rewrite this text into casual modern slang (lowkey, ngl, vibe, kinda).`,
  2: `Rewrite this in solid Gen-Z slang (no cap, fr fr, slay, bussin, based, it's giving). Natural tone.`,
  3: `Rewrite in heavy chaotic Gen-Z slang (bestie, understood the assignment, main character, ate and left no crumbs).`,
  4: `Rewrite in peak unhinged Gen-Z slang (delulu, rizz, rent free, villain era, touch grass).`,
  5: `Rewrite in pure Brainrot 3am TikTok comment section speak (skibidi, rizzler, mewing, no cap fr fr, deceased).`
};
document.querySelectorAll(".genz-lvl").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".genz-lvl").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    genzLevel = parseInt(b.dataset.l);
  };
});
$("genz-btn").onclick = () => { $("genz-modal").classList.remove("hidden"); setTimeout(() => $("genz-input").focus(), 60); };
$("genz-close").onclick = () => $("genz-modal").classList.add("hidden");
$("genz-input").oninput = () => $("genz-chars").textContent = $("genz-input").value.length;
$("genz-copy").onclick = async function() {
  if (!await copyText($("genz-output").innerText)) return;
  this.textContent = "Copied! ✅";
  setTimeout(() => this.textContent = "Copy ✨", 1500);
};
$("genz-submit").onclick = async () => {
  const text = $("genz-input").value.trim();
  if (!text) return;
  $("genz-output").innerHTML = '<div class="genz-loading"><div class="roast-dots"><div></div><div></div><div></div></div><div>Cooking up the slang fr fr…</div></div>';
  $("genz-copy").style.display = "none";
  sfx.play("mode");
  try {
    $("genz-output").textContent = await chatOnce([
      { role: "system", content: GENZ_PROMPTS[genzLevel] + " Output ONLY the translation. No preamble." },
      { role: "user", content: text }
    ], { maxTokens: 350 }) || "Could not translate.";
    $("genz-copy").style.display = "block";
    sfx.play("complete");
  } catch(e) {
    $("genz-output").textContent = "Translation failed: " + e.message;
  }
};

/* ── MOBILE SIDEBAR ── */
const backdrop = $("sidebar-backdrop");
const sidebar  = $("sidebar");
function isMobile() { return window.innerWidth <= 768; }
function openMobileSidebar() {
  sidebar.classList.add("mobile-open");
  backdrop.classList.add("show");
}
function closeMobileSidebar() {
  sidebar.classList.remove("mobile-open");
  backdrop.classList.remove("show");
}
if (backdrop) backdrop.onclick = closeMobileSidebar;

let sidebarDesktopHidden = false;
$("sidebar-toggle-btn").onclick = () => {
  if (isMobile()) {
    if (sidebar.classList.contains("mobile-open")) closeMobileSidebar();
    else openMobileSidebar();
  } else {
    sidebarDesktopHidden = !sidebarDesktopHidden;
    sidebar.classList.toggle("sb-hidden", sidebarDesktopHidden);
  }
  sfx.play("click");
};

/* ── HOME SCREEN SIMULATOR PLAYGROUND ── */
const SIMULATOR_DATA = {
  app: `
    <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;color:#f8fafc;box-shadow:inset 0 0 20px rgba(0,0,0,.5)">
      <h3 style="color:#38bdf8;margin-bottom:8px">⚡ Interactive Particle Gravity Engine</h3>
      <p style="font-size:12px;color:#94a3b8;margin-bottom:14px">Simulating N-body gravitational orbits in live Co-Work Canvas:</p>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:12px">
        <button style="background:#38bdf8;color:#0f172a;border:none;padding:6px 14px;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer" onclick="this.textContent = 'Orbit Velocity: ' + (Math.random()*100).toFixed(1) + ' km/s'">Accelerate Orbits</button>
        <button style="background:#334155;color:#f8fafc;border:none;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer" onclick="this.textContent = 'Bodies: ' + Math.floor(Math.random()*50 + 10)">Add Satellite</button>
      </div>
      <div style="font-size:11px;color:#38bdf8;font-family:monospace">Real-time sandboxed iframe execution</div>
    </div>
  `,
  code: `
    <pre style="background:#101010;padding:16px;border-radius:10px;color:#e8f2f4;font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;overflow-x:auto;border:1px solid #2b2b29"><code class="language-python">from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import asyncio

app = FastAPI(title="JARVIK Engine API", version="2.0")

class InferencePayload(BaseModel):
    prompt: str
    stream: bool = True
    temperature: float = 0.7

@app.post("/v1/cowork/generate")
async def generate_artifact(payload: InferencePayload):
    # Asynchronous non-blocking SSE streaming pipeline
    return {"status": "ok", "throughput": "65 tok/s", "artifact": "deployed"}
</code></pre>
  `,
  arch: `
    <div style="background:#1d1d1b;border:1px solid #2b2b29;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:#35d6e8;letter-spacing:.08em;margin-bottom:10px">MERMAID.JS DISTRIBUTED ARCHITECTURE</div>
      <svg viewBox="0 0 460 120" style="max-width:100%;height:auto">
        <rect x="10" y="40" width="90" height="40" rx="8" fill="#141413" stroke="#35d6e8" stroke-width="2"/>
        <text x="55" y="65" fill="#ececea" font-size="11" text-anchor="middle">Client App</text>
        <path d="M100 60 L140 60" stroke="#35d6e8" stroke-width="2" marker-end="url(#arr)"/>
        <rect x="140" y="30" width="100" height="60" rx="8" fill="#141413" stroke="#34d399" stroke-width="2"/>
        <text x="190" y="55" fill="#34d399" font-size="11" font-weight="bold" text-anchor="middle">JARVIK Core</text>
        <text x="190" y="75" fill="#a3a29d" font-size="9" text-anchor="middle">SSE Streamer</text>
        <path d="M240 60 L280 60" stroke="#34d399" stroke-width="2"/>
        <rect x="280" y="15" width="160" height="90" rx="8" fill="#141413" stroke="#a78bfa" stroke-width="2"/>
        <text x="360" y="40" fill="#a78bfa" font-size="11" font-weight="bold" text-anchor="middle">Frontier Models</text>
        <text x="360" y="60" fill="#a3a29d" font-size="9" text-anchor="middle">Llama 3.3 70B · DeepSeek R1</text>
        <text x="360" y="80" fill="#a3a29d" font-size="9" text-anchor="middle">Gemini 2.0 Flash · Qwen</text>
      </svg>
    </div>
  `,
  math: `
    <div style="background:#1d1d1b;border:1px solid #2b2b29;border-radius:12px;padding:24px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:#35d6e8;letter-spacing:.08em;margin-bottom:12px">KATEX MATHEMATICAL DERIVATION</div>
      <div style="font-size:18px;color:#ececea;margin-bottom:8px">$$\\mathcal{L}_{\\text{Attention}}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$</div>
      <div style="font-size:14px;color:#a3a29d">$$\\nabla_W \\mathcal{J}(\\theta) = \\frac{1}{m}\\sum_{i=1}^m \\left(h_\\theta(x^{(i)}) - y^{(i)}\\right)x^{(i)} + \\frac{\\lambda}{m}W$$</div>
    </div>
  `,
  sprint: `
    <div style="background:#1d1d1b;border:1px solid #2b2b29;border-radius:12px;padding:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:12px;font-weight:700;color:#34d399">📋 LIVE SPRINT ROADMAP</span>
        <span style="font-size:10px;color:var(--subtle);font-family:monospace">3/4 Done</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#ececea"><input type="checkbox" checked accent-color="#34d399"> Scaffold Next-Gen Architecture &amp; Schemas</label>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#ececea"><input type="checkbox" checked accent-color="#34d399"> Implement Side-by-Side Co-Work Canvas</label>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#ececea"><input type="checkbox" checked accent-color="#34d399"> Connect Client-Side PDF.js &amp; Vision Engine</label>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#35d6e8;font-weight:600"><input type="checkbox" accent-color="#35d6e8"> Execute Full Production Verification</label>
      </div>
    </div>
  `
};

function renderHomeSimulator(tabKey) {
  const simBody = $("sim-body");
  if (!simBody) return;
  simBody.innerHTML = SIMULATOR_DATA[tabKey] || SIMULATOR_DATA.app;
  enhanceRenderedElements(simBody);
}

document.querySelectorAll(".shot-tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".shot-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    renderHomeSimulator(tab.dataset.sim);
    sfx.play("click");
  };
});

/* Home Screen Template Launcher */
document.querySelectorAll(".tpl-card").forEach(card => {
  card.onclick = () => {
    const tpl = card.dataset.tpl;
    const prompts = {
      webapp: "Build an interactive, fully responsive single-page web app with live controls and modern styling in our Co-Work Canvas.",
      arch: "Design a high-scale microservices system architecture. Provide the complete topology diagram in a ```mermaid block and explain the component responsibilities.",
      review: "Conduct a rigorous code review on software architecture, finding potential race conditions, security vulnerabilities, and drafting unit test suites.",
      research: "Derive the mathematical principles of modern transformer attention with full LaTeX formulas ($...$) and intuitive conceptual explanations."
    };
    tryLaunchWithPrompt(prompts[tpl] || "Hello JARVIK, let's start co-working.");
  };
});

function tryLaunchWithPrompt(promptStr) {
  if (!hasApiKey()) {
    demoMode = true;
  }
  tryLaunch();
  setTimeout(() => {
    if (ui) {
      ui.value = promptStr;
      grow(ui);
      send();
    }
  }, 450);
}

/* Landing: chat mode pills */
document.querySelectorAll(".lp-mode").forEach(pill => {
  pill.onclick = () => toast(`${pill.dataset.mode} mode selected`);
});

/* ── BOOTSTRAP APPLICATION ── */
const navLaunchBtn = $("nav-launch-btn");
if (navLaunchBtn) navLaunchBtn.onclick = () => {
  const cta = $("hero-launch-btn");
  if (cta) cta.scrollIntoView({ behavior: "smooth", block: "center" });
  toast("JARVIK is launching soon.");
};
const heroLaunchBtn = $("hero-launch-btn");
if (heroLaunchBtn) heroLaunchBtn.onclick = () => { toast("Welcome to JARVIK AI."); tryLaunch(); };

const navDemoBtn  = $("nav-demo-btn");
const heroDemoBtn = $("hero-demo-btn");
if (navDemoBtn) {
  navDemoBtn.onclick = () => {
    demoMode = true;
    boot();
    toast("⚡ Demo Mode Active: Co-Work Canvas ready!");
  };
}
if (heroDemoBtn) {
  heroDemoBtn.onclick = () => {
    demoMode = true;
    boot();
    toast("⚡ Demo Mode Active: Co-Work Canvas ready!");
  };
}

const simOpenStudio = $("sim-open-studio-btn");
if (simOpenStudio) {
  simOpenStudio.onclick = () => {
    if (!hasApiKey()) demoMode = true;
    tryLaunch();
  };
}

function tryLaunch() {
  if (!hasApiKey() && !demoMode) {
    showKeyModal();
    return;
  }
  if (appStarted) {
    homeScreen.classList.add("hidden");
    keyOverlay.classList.add("hidden");
    app.classList.remove("hidden");
    sfx.play("complete");
    return;
  }
  boot();
}

function showHomeScreen() {
  app.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  sfx.play("click");
}

if (topbarHomeBtn) topbarHomeBtn.onclick = showHomeScreen;
if (sbHomeBtn) sbHomeBtn.onclick = showHomeScreen;

function boot() {
  if (appStarted) return;
  appStarted = true;
  homeScreen.classList.add("hidden");
  keyOverlay.classList.add("hidden");

  if (typeof marked !== "undefined") {
    marked.setOptions({ breaks: true, gfm: true });
  }

  if (typeof mermaid !== "undefined") {
    mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
  }

  const ps = getP();
  if (!ps.length) newConv("Welcome to JARVIK Co-Work Studio");
  else {
    if (!getCur() || !ps.find(x => x.id === getCur())) setCur(ps[0].id);
    renderProjs();
    loadChat();
  }

  loadNotes();
  updateModelBadge();
  updateKnowledgeUI();
  try { setTimeout(() => { try { tmHashRoom(); } catch (e) {} }, 0); } catch (e) {}
  setCoworkMode(false); // Launch with Co-Work hidden; open via sidebar (fullscreen) or artifact (split)

  if (personaBadge) personaBadge.textContent = activePersona;

  app.classList.remove("hidden");
  sfx.play("complete");
}

renderHomeSimulator("app");
if (window.location.hash === "#app" || window.location.search.includes("app")) {
  boot();
}

/* ═══════════════════════════════════════════════════════════════
   JARVIK VS CODE STUDIO (IN-APP IDE ENGINE)
   ═══════════════════════════════════════════════════════════════ */
const vscodeModal        = $("vscode-modal");
const vscodeWindow       = $("vscode-window");
const vscMinimizeBtn     = $("vsc-minimize-btn");
const vscFullscreenBtn   = $("vsc-fullscreen-btn");
const vscCloseBtn        = $("vsc-close-btn");
const vscFilenameTitle   = $("vsc-active-filename-title");
const vscSidebar         = $("vsc-sidebar");
const vscFileTree        = $("vsc-file-tree");
const vscTabsStrip       = $("vsc-tabs-strip");
const vscCodeInput       = $("vsc-code-input");
const vscGutter          = $("vsc-gutter");
const vscCrumbFile       = $("vsc-crumb-file");
const vscRunCanvasBtn    = $("vsc-run-canvas-btn");
const vscSendChatBtn     = $("vsc-send-chat-btn");
const vscNewFileBtn      = $("vsc-new-file-btn");
const vscRefreshTreeBtn  = $("vsc-refresh-tree-btn");
const vscTerminalPanel   = $("vsc-terminal-panel");
const vscTermLog         = $("vsc-term-log");
const vscTermInput       = $("vsc-term-input");
const vscTermClearBtn    = $("vsc-term-clear-btn");
const vscTermToggleBtn   = $("vsc-term-toggle-btn");
const vscTermCloseBtn    = $("vsc-term-close-btn");
const vscStatusMsg       = $("vsc-status-msg");
const vscLineCol         = $("vsc-line-col");
const vscLangMode        = $("vsc-lang-mode");
const topbarVscBtn       = $("topbar-vscode-btn");
const sbVscBtn           = $("sb-vscode-btn");

// Virtual Filesystem State
const VSC_DEFAULT_FILES = {
  "index.html": {
    lang: "HTML",
    icon: "📄",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JARVIK Next-Gen App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-card">
    <header>
      <h1>JARVIK Live Studio</h1>
      <span class="badge">v2.5 Production</span>
    </header>
    <main>
      <p>Edit this file inside JARVIK VS Code and click <strong>▶ Run in Canvas</strong> to preview instantly.</p>
      <button id="counter-btn">Click me: <span id="count">0</span></button>
    </main>
  </div>
  <script src="script.js"><\/script>
</body>
</html>`
  },
  "style.css": {
    lang: "CSS",
    icon: "🎨",
    content: `/* JARVIK Modern Glassmorphism Stylesheet */
:root {
  --primary: #35d6e8;
  --bg-gradient: linear-gradient(135deg, #0b1016 0%, #151b24 100%);
  --card-bg: rgba(255, 255, 255, 0.05);
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-gradient);
  color: #f1f5f9;
}

.app-card {
  background: var(--card-bg);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 36px 48px;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  text-align: center;
}

button {
  background: var(--primary);
  color: #0b1016;
  border: none;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(53, 214, 232, 0.4);
}`
  },
  "script.js": {
    lang: "JavaScript",
    icon: "⚡",
    content: `// Interactive Application Logic
console.log("JARVIK Studio initialized.");

let count = 0;
const btn = document.getElementById("counter-btn");
const label = document.getElementById("count");

if (btn && label) {
  btn.addEventListener("click", () => {
    count++;
    label.textContent = count;
    btn.style.transform = "scale(0.96)";
    setTimeout(() => btn.style.transform = "", 100);
  });
}`
  },
  "app.py": {
    lang: "Python",
    icon: "🐍",
    content: `"""
JARVIK REST & WebSocket API Server
FastAPI High-Performance Engine
"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI(title="JARVIK API", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "model": "Llama 3.3 70B", "engine": "JARVIK Co-Work"}

@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Connected to JARVIK real-time stream.")
    while True:
        data = await websocket.receive_text()
        await asyncio.sleep(0.05)
        await websocket.send_text(f"Processed: {data}")
`
  },
  "package.json": {
    lang: "JSON",
    icon: "📦",
    content: `{
  "name": "jarvik-studio-workspace",
  "version": "2.5.0",
  "description": "JARVIK Co-Work Studio & Autonomous Agent Environment",
  "main": "index.html",
  "scripts": {
    "start": "live-server .",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "katex": "^0.16.8",
    "marked": "^9.1.2",
    "mermaid": "^10.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}`
  },
  "README.md": {
    lang: "Markdown",
    icon: "📝",
    content: `# JARVIK AI Co-Work Studio

A next-generation, sovereign AI workspace pairing human developers with autonomous intelligence.

## Features
- 👥 **Split-Screen Co-Work Canvas**: Real-time two-way synchronization between chat and live code editor.
- 💻 **Integrated VS Code Studio**: Full activity bar, multi-file explorer, syntax editing, and interactive terminal.
- 🌐 **In-App Web Browser**: Browse the public internet, test web applications, and extract knowledge directly into conversations.
- 🔮 **Holographic Voice HUD**: Zero-lag voice recognition and reactive Arc Reactor visualization.
- 📋 **Sprint Roadmap**: Interactive kanban progress tracking directly within your session.
`
  }
};

let vscFiles = JSON.parse(JSON.stringify(VSC_DEFAULT_FILES));
let vscActiveFile = "index.html";
let vscOpenTabs = ["index.html", "style.css", "script.js"];
let vscIsMaximized = false;
let vscTerminalHistory = [];
let vscTermHistIdx = -1;

function getFileLanguage(fname) {
  if (fname.endsWith(".html") || fname.endsWith(".htm")) return "HTML";
  if (fname.endsWith(".css")) return "CSS";
  if (fname.endsWith(".js") || fname.endsWith(".mjs")) return "JavaScript";
  if (fname.endsWith(".py")) return "Python";
  if (fname.endsWith(".json")) return "JSON";
  if (fname.endsWith(".md")) return "Markdown";
  if (fname.endsWith(".ts")) return "TypeScript";
  return "Plain Text";
}

function getFileIcon(fname) {
  if (fname.endsWith(".html") || fname.endsWith(".htm")) return "📄";
  if (fname.endsWith(".css")) return "🎨";
  if (fname.endsWith(".js") || fname.endsWith(".ts")) return "⚡";
  if (fname.endsWith(".py")) return "🐍";
  if (fname.endsWith(".json")) return "📦";
  if (fname.endsWith(".md")) return "📝";
  return "📄";
}

function updateVscGutter() {
  if (!vscCodeInput || !vscGutter) return;
  const lineCount = vscCodeInput.value.split("\n").length;
  let lines = "";
  for (let i = 1; i <= lineCount; i++) {
    lines += i + "\n";
  }
  vscGutter.textContent = lines;
}

function renderVscFileTree() {
  if (!vscFileTree) return;
  vscFileTree.innerHTML = "";
  Object.keys(vscFiles).forEach(fname => {
    const item = document.createElement("div");
    item.className = "vsc-file-item" + (fname === vscActiveFile ? " active" : "");
    item.innerHTML = `
      <span class="vsc-file-icon">${vscFiles[fname].icon || getFileIcon(fname)}</span>
      <span class="vsc-file-name">${esc(fname)}</span>
    `;
    item.onclick = () => switchVscFile(fname);
    vscFileTree.appendChild(item);
  });
}

function renderVscTabs() {
  if (!vscTabsStrip) return;
  vscTabsStrip.innerHTML = "";
  vscOpenTabs.forEach(fname => {
    const tab = document.createElement("div");
    tab.className = "vsc-tab" + (fname === vscActiveFile ? " active" : "");
    tab.innerHTML = `
      <span class="vsc-tab-icon">${vscFiles[fname]?.icon || getFileIcon(fname)}</span>
      <span class="vsc-tab-name">${esc(fname)}</span>
      <span class="vsc-tab-close" title="Close Tab">✕</span>
    `;
    tab.onclick = e => {
      if (e.target.classList.contains("vsc-tab-close")) {
        e.stopPropagation();
        closeVscTab(fname);
      } else {
        switchVscFile(fname);
      }
    };
    vscTabsStrip.appendChild(tab);
  });
}

function switchVscFile(fname) {
  if (!vscFiles[fname]) return;
  // Save current open file in memory
  if (vscFiles[vscActiveFile] && vscCodeInput) {
    vscFiles[vscActiveFile].content = vscCodeInput.value;
  }
  vscActiveFile = fname;
  if (!vscOpenTabs.includes(fname)) {
    vscOpenTabs.push(fname);
  }
  if (vscCodeInput) {
    vscCodeInput.value = vscFiles[fname].content;
  }
  if (vscFilenameTitle) vscFilenameTitle.textContent = fname;
  if (vscCrumbFile) vscCrumbFile.textContent = fname;
  if (vscLangMode) vscLangMode.textContent = vscFiles[fname].lang || getFileLanguage(fname);
  if (vscStatusMsg) vscStatusMsg.textContent = `Opened ${fname}`;

  updateVscGutter();
  renderVscFileTree();
  renderVscTabs();
}

function closeVscTab(fname) {
  vscOpenTabs = vscOpenTabs.filter(f => f !== fname);
  if (!vscOpenTabs.length) {
    const remaining = Object.keys(vscFiles);
    if (remaining.length) vscOpenTabs.push(remaining[0]);
  }
  if (vscActiveFile === fname) {
    switchVscFile(vscOpenTabs[vscOpenTabs.length - 1] || "index.html");
  } else {
    renderVscTabs();
  }
}

function createNewVscFile() {
  const name = prompt("Enter new file name (e.g. script2.js, style2.css, components.html):");
  if (!name || !name.trim()) return;
  const cleanName = name.trim();
  if (vscFiles[cleanName]) {
    switchVscFile(cleanName);
    return;
  }
  vscFiles[cleanName] = {
    lang: getFileLanguage(cleanName),
    icon: getFileIcon(cleanName),
    content: `// New file: ${cleanName}\n\n`
  };
  switchVscFile(cleanName);
  saveWorkspaceSoon();
  renderArtExplorer();
  sfx.play("mode");
  toast(`📄 Created file: ${cleanName}`);
}

function runVscInCanvas() {
  if (vscFiles[vscActiveFile] && vscCodeInput) {
    vscFiles[vscActiveFile].content = vscCodeInput.value;
    saveWorkspaceSoon();
  }
  if (mountWorkspaceFile(vscActiveFile)) closeVSCodeModal();
}

function sendVscToChat() {
  if (vscFiles[vscActiveFile] && vscCodeInput) {
    vscFiles[vscActiveFile].content = vscCodeInput.value;
  }
  const code = vscCodeInput ? vscCodeInput.value : "";
  const promptStr = `Here is my code for **${vscActiveFile}** from VS Code Studio:\n\`\`\`${(vscFiles[vscActiveFile]?.lang || "text").toLowerCase()}\n${code}\n\`\`\`\nPlease review, optimize, or help me build features on top of this.`;
  closeVSCodeModal();
  if (ui) {
    ui.value = promptStr;
    grow(ui);
    ui.focus();
    toast(`💬 Code sent to JARVIK chat prompt!`);
  }
}

/* ═══════════════════════════════════════════════════════════
   SHARED VIRTUAL WORKSPACE + JARVIK SHELL TERMINAL
   One filesystem for VS Code Studio, the terminal and the
   Co-Work Canvas explorer · persisted to localStorage
═══════════════════════════════════════════════════════════ */

(function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(PK("workspace")) || "null");
    if (saved && saved.files && Object.keys(saved.files).length) {
      vscFiles = saved.files;
      vscDirs = Array.isArray(saved.dirs) ? saved.dirs : [];
      if (!vscFiles[vscActiveFile]) vscActiveFile = Object.keys(vscFiles)[0] || "";
      vscOpenTabs = vscOpenTabs.filter(f => vscFiles[f]);
      if (!vscOpenTabs.length) vscOpenTabs = Object.keys(vscFiles).slice(0, 3);
    }
  } catch (e) {}
})();

let _wsSaveTimer = 0;
function saveWorkspace() {
  try { localStorage.setItem(PK("workspace"), JSON.stringify({ files: vscFiles, dirs: vscDirs })); } catch (e) {}
  try { if (typeof tmFilesSoon === "function") tmFilesSoon(); } catch (e) {}
}
function saveWorkspaceSoon() { clearTimeout(_wsSaveTimer); _wsSaveTimer = setTimeout(saveWorkspace, 400); }

/* TEAM ROOMS (PeerJS star, host=first joiner; Codeweave-style presence) */
// ponytail: LWW-by-arrival + confirm on conflict, no CRDT; upgrade when concurrent edits collide often.
const TEAM_K = "jarvik_team";
const TM_COLORS = ["#4fc1ff", "#f48771", "#b5cea8", "#c586c0", "#dcdcaa", "#4ec9b0", "#ce9178", "#9cdcfe"];
let tmPeer = null, tmConns = [], tmHostConn = null, tmIsHost = false, tmRoom = "", tmPeers = {}, _tmT = 0;
let tmMe = { id: uid(), name: "", role: "editor", color: "#4fc1ff" };
try { Object.assign(tmMe, JSON.parse(localStorage.getItem(TEAM_K)) || {}, { id: uid() }); } catch (e) {}
const tmPID = r => "jarvik-" + String(r || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
const tmColor = n => { let h = 0; for (const c of String(n)) h += c.charCodeAt(0); return TM_COLORS[h % TM_COLORS.length]; };
function tmSaveMe() { try { localStorage.setItem(TEAM_K, JSON.stringify({ room: tmRoom, name: tmMe.name, role: tmMe.role, color: tmMe.color })); } catch (e) {} }
let _tmLibQ = null;
function tmEnsureLib(cb) { if (typeof Peer !== "undefined") return cb(true); if (_tmLibQ) return _tmLibQ.push(cb); _tmLibQ = [cb]; const s = document.createElement("script"); s.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"; s.defer = true; s.onload = () => { const q = _tmLibQ; _tmLibQ = null; q.forEach(f => { try { f(true); } catch (e) {} }); }; s.onerror = () => { const q = _tmLibQ; _tmLibQ = null; toast("Team offline — local-only"); q.forEach(f => { try { f(false); } catch (e) {} }); }; document.head.appendChild(s); }
function tmSend(m) { if (typeof Peer === "undefined" || !tmRoom || !m) return; try { m.from = tmMe.id; m.role = tmMe.role; if (tmIsHost) tmConns.forEach(c => { try { if (c && c.open) c.send(m); } catch (e) {} }); else if (tmHostConn && tmHostConn.open) { try { tmHostConn.send(m); } catch (e) {} } } catch (e) {} }
function tmSnap() { const f = {}; for (const k in vscFiles) f[k] = { content: vscFiles[k].content }; return f; }
function tmPushChat(id) { if (tmMe.role === "viewer" || typeof Peer === "undefined" || !tmRoom) return; const c = getP().find(x => x.id === (id || getCur())); if (c) { c._ts = Date.now(); tmSend({ t: "tm-chat", conv: c }); } }
function tmPushFiles() { if (tmMe.role === "viewer" || typeof Peer === "undefined" || !tmRoom) return; tmSend({ t: "tm-files", files: tmSnap(), dirs: vscDirs }); }
function tmFilesSoon() { clearTimeout(_tmT); _tmT = setTimeout(tmPushFiles, 1500); }
function tmPushKnowledge(item) { if (tmMe.role === "viewer" || typeof Peer === "undefined" || !tmRoom) return; tmSend({ t: "tm-knowledge", items: item ? [item] : getKnowledge() }); }
function tmHashRoom() { try { if (!tmRoom) { try { const sv = JSON.parse(localStorage.getItem(TEAM_K) || "{}"); if (sv && sv.room) tmRoom = String(sv.room); } catch (e) {} } const m = (location.hash.match(/team=([^&]+)/) || [])[1]; if (m) { tmRoom = decodeURIComponent(m); tmSaveMe(); } tmRender(); } catch (e) {} }
function tmInvite() { try { return location.href.split("#")[0] + "#team=" + encodeURIComponent(tmRoom); } catch (e) { return "#team=" + encodeURIComponent(tmRoom); } }
function tmSetRole(to, newRole) { if (tmMe.role !== "owner" || typeof Peer === "undefined" || !tmRoom) return toast("Owner only"); tmSend({ t: "tm-role", to, newRole }); }
function tmClearChat() { if (tmMe.role !== "owner" || typeof Peer === "undefined" || !tmRoom) return toast("Owner only"); if (!confirm("Clear chat for everyone?")) return; saveP([]); renderProjs(); loadChat(); tmSend({ t: "tm-clear", scope: "chat" }); }
function tmState() {
  if (!tmRoom) return "offline";
  if (typeof Peer === "undefined" || (!tmIsHost && !tmHostConn && !tmConns.length)) return "local";
  return tmIsHost ? "host" : "client";
}
function tmRender() {
  const top = $("tm-top"), tag = $("tm-room-tag"), avs = $("tm-avs"), side = $("tm-side-badge"), ppl = $("tm-people");
  const on = !!tmRoom, now = Date.now();
  for (const k in tmPeers) if (now - tmPeers[k].at > 12000) delete tmPeers[k];
  const all = on ? [{ name: (tmMe.name || "You") + " (you)", color: tmMe.color }, ...Object.values(tmPeers)] : [];
  const cnt = $("tm-count"), srow = $("tm-status-row"), sside = $("tm-status-side");
  const state = tmState();
  const label = !on ? "Offline" : state === "host" ? "Hosting" : state === "client" ? "Connected" : "Offline — local-only";
  if (srow) srow.hidden = !on;
  if (sside) sside.textContent = on ? label + " · " + all.length + " online" : "Offline";
  if (cnt) cnt.textContent = all.length;
  if (top) top.hidden = !on;
  if (tag && on) tag.textContent = "Team: " + tmRoom;
  const lcLine = p => { try { const t = ((vscFiles[p.file] || {}).content || "").slice(0, p.sel ? p.sel[0] : 0); return t.split("\n").length; } catch (e) { return 1; } };
  if (avs) avs.innerHTML = all.slice(0, 5).map(p => `<span class="tm-av" style="background:${esc(p.color)}" title="${esc(p.name)}${p.file ? " · viewing " + esc(p.file) : ""}">${esc((p.name[0] || "?").toUpperCase())}</span>`).join("") + (all.length > 5 ? `<span class="tm-av tm-more">+${all.length - 5}</span>` : "");
  if (ppl) {
    const entries = on ? [["@self", tmMe], ...Object.entries(tmPeers)] : [];
    ppl.hidden = !entries.length;
    ppl.innerHTML = entries.map(([id, p]) => `<div class="tm-p" data-id="${esc(id)}"><u style="background:${esc(p.color)}"></u>${esc(id === "@self" ? (p.name || "You") + " (you)" : (p.name || "?"))}${p.file && id !== "@self" ? ` <span class="lc-view">viewing ${esc(p.file)}:L${lcLine(p)}</span>` : ""}</div>`).join("");
  }
  if (side) side.textContent = on ? (all.length + " online") : "Offline";
  const chips = $("lc-chips"); if (chips) chips.innerHTML = Object.values(tmPeers).filter(p => p.file).map(p => `<button class="lc-chip" data-f="${esc(p.file)}" style="--lc:${esc(p.color)}" title="${esc(p.name)} · L${lcLine(p)}">${esc(p.name)} · ${esc(p.file.split("/").pop())}:L${lcLine(p)}</button>`).join("");
  if (chips && !chips._bound) { chips._bound = 1; chips.onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; openWorkspaceFile(b.dataset.f); sfx.play("click"); }; }
}
function lcPaint() { document.querySelectorAll("[data-lc-row]").forEach(el => { const path = el.dataset.lcRow; el.innerHTML = Object.values(tmPeers).filter(p => p.file === path).map(p => `<i class="lc-dot" style="background:${esc(p.color)}" title="${esc(p.name)}"></i>`).join(""); }); }
function tmLeave() {
  try { if (tmPeer) tmPeer.destroy(); } catch (e) {}
  tmPeer = null; tmConns = []; tmHostConn = null; tmIsHost = false; tmRoom = ""; tmPeers = {};
  try { for (const id in _tmCursorEls) { _tmCursorEls[id].remove(); delete _tmCursorEls[id]; } } catch (e) {}
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  tmSaveMe(); tmRender();
  toast("Left team room");
  sfx.play("click");
}
function tmOnData(m, from) {
  if (tmIsHost) tmConns.forEach(c => { if (c !== from && c.open) c.send(m); });
  if (!m || typeof m !== "object") return;
  if (m.t === "tm-presence") { const f = String(m.file || "").slice(0, 120); let s = [0, 0]; if (Array.isArray(m.sel)) s = [Math.max(0, m.sel[0] | 0), Math.max(0, m.sel[1] | 0)]; const _p0 = tmPeers[m.from]; tmPeers[m.from] = { name: String(m.name || "").slice(0, 20), color: m.color, role: m.role, file: f, sel: s, at: Date.now(), px: _p0 && _p0.px, py: _p0 && _p0.py }; tmRender(); lcPaint(); tmCursorWake(); return; }
  if (m.t === "tm-ptr") { const isNew = !tmPeers[m.from]; const peer = tmPeers[m.from] || (tmPeers[m.from] = { name: String(m.name || "").slice(0, 20), color: m.color || "#4fc1ff", role: m.role, file: "", sel: [0, 0] }); if (m.color && !peer.color) peer.color = m.color; peer.px = Math.min(1, Math.max(0, +m.px || 0)); peer.py = Math.min(1, Math.max(0, +m.py || 0)); peer.at = Date.now(); if (isNew) tmRender();  if (m.c) tmRipple(peer, m.px, m.py, m.n); tmCursorWake(); return; }
  if ((m.t === "tm-role" || m.t === "tm-clear") && m.role !== "owner") return;
  if (m.role === "viewer") return;
  if (m.t === "tm-chat" && m.conv) {
    const ps = getP(), i = ps.findIndex(x => x.id === m.conv.id);
    if (i < 0) ps.unshift(m.conv); else if ((m.conv._ts || 0) >= (ps[i]._ts || 0)) ps[i] = m.conv;
    saveP(ps); renderProjs(); if (m.conv.id === getCur()) loadChat();
    toast("Chat synced"); sfx.play("click");
  } else if (m.t === "tm-files" && m.files) {
    let ch = false;
    for (const k in m.files) {
      const inc = m.files[k], loc = vscFiles[k];
      if (!loc) { vscFiles[k] = { lang: getFileLanguage(k), icon: getFileIcon(k), content: inc.content }; ch = true; }
      else if (loc.content !== inc.content) { if (!confirm("Overwrite " + k + " with team copy?")) continue; loc.content = inc.content; ch = true; }
    }
    if (m.dirs) vscDirs = [...new Set([...vscDirs, ...m.dirs])];
    if (ch) { saveWorkspace(); refreshWorkspaceViews(); toast("Files synced"); sfx.play("click"); }
  } else if (m.t === "tm-knowledge" && m.items) {
    const k = getKnowledge(), ids = new Set(k.map(x => x.id));
    m.items.forEach(it => { if (it && it.id && !ids.has(it.id)) { k.push(it); ids.add(it.id); } });
    saveKnowledge(k); updateKnowledgeUI(); toast("Knowledge synced");
  } else if (m.t === "tm-clear" && m.scope === "chat") { saveP([]); renderProjs(); loadChat(); }
  else if (m.t === "tm-role" && m.to === tmMe.id) { tmMe.role = m.newRole; tmSaveMe(); toast("Role: " + m.newRole); }
  tmRender();
}
let tmPendingMode = "join";
function tmMsg(t) { const m = $("tm-msg"); if (m) m.textContent = t || ""; }
function tmStart(room, name, role, mode) {
  tmRoom = String(room || "").trim();
  tmMe.name = String(name || "").trim().slice(0, 20) || "Guest";
  tmMe.color = tmColor(tmMe.name); if (role) tmMe.role = role;
  if (!tmRoom) { tmMsg("Enter the secret room code"); toast("Enter the secret room code"); return; }
  tmPendingMode = mode || tmPendingMode || "join";
  tmSaveMe(); tmRender();
  try { history.replaceState(null, "", "#team=" + encodeURIComponent(tmRoom)); } catch (e) {}
  tmMsg(tmPendingMode === "create" ? "Checking code…" : "Joining room…");
  tmEnsureLib(ok => { if (!ok) { tmMsg("Team offline — local-only"); return; } if (tmPendingMode === "create") tmConnect(); else tmJoin(); });
}
function tmConnect() {
  if (typeof Peer === "undefined") return;
  try { if (tmPeer) tmPeer.destroy(); } catch (e) {}
  tmConns = []; tmHostConn = null;
  const p = tmPeer = new Peer(tmPID(tmRoom));
  p.on("open", () => { tmIsHost = true; toast("Hosting team " + tmRoom); sfx.play("complete"); modal.classList.add("hidden"); tmRender(); });
  p.on("connection", c => {
    c.on("open", () => { tmConns.push(c); c.send({ t: "tm-files", files: tmSnap(), dirs: vscDirs }); c.send({ t: "tm-knowledge", items: getKnowledge() }); tmRender(); });
    c.on("data", d => tmOnData(d, c));
    c.on("close", () => { tmConns = tmConns.filter(x => x !== c); tmRender(); });
  });
  p.on("error", e => {
    if (e && e.type === "unavailable-id") {
      try { p.destroy(); } catch (_) {}
      if (tmPendingMode === "create") {
        tmIsHost = false; tmHostConn = null; tmConns = [];
        tmRender();
        modal.classList.remove("hidden");
        tmMsg("That secret code is already taken — pick another one.");
        toast("Code already taken — pick another one");
      } else tmJoin();
    } else if (!tmIsHost && !tmHostConn) { toast("Team offline — local-only"); tmRender(); }
  });
}
function tmJoin() {
  if (typeof Peer === "undefined") return;
  try { if (tmPeer) tmPeer.destroy(); } catch (e) {}
  const p = tmPeer = new Peer();
  let done = false;
  const miss = why => {
    if (done) return; done = true;
    try { p.destroy(); } catch (_) {}
    tmHostConn = null; tmIsHost = false; tmRender();
    modal.classList.remove("hidden");
    tmMsg(why || "Room not found — check the code or create the room.");
    toast("Room not found — check the code");
  };
  const timer = setTimeout(() => { if (!tmHostConn) miss(); }, 12000);
  p.on("open", () => {
    let c;
    try { c = p.connect(tmPID(tmRoom), { reliable: true }); }
    catch (e) { clearTimeout(timer); miss(); return; }
    c.on("open", () => { clearTimeout(timer); done = true; tmHostConn = c; tmIsHost = false; toast("Joined team " + tmRoom); sfx.play("complete"); modal.classList.add("hidden"); c.send({ t: "tm-files", files: tmSnap(), dirs: vscDirs }); c.send({ t: "tm-knowledge", items: getKnowledge() }); tmRender(); });
    c.on("data", d => tmOnData(d, c));
    c.on("close", () => { tmHostConn = null; toast("Team offline — local-only"); tmRender(); });
    c.on("error", () => { clearTimeout(timer); miss(); });
  });
  p.on("error", () => { clearTimeout(timer); miss(); });
}
function showTeamModal() {
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(TEAM_K)) || {}; } catch (e) {}
  let pre = tmRoom;
  try { const m = (location.hash.match(/team=([^&]+)/) || [])[1]; if (m && !pre) pre = decodeURIComponent(m); } catch (e) {}
  tmPendingMode = pre ? "join" : (tmPendingMode || "join");
  mb.innerHTML = `<div class="auth-card" id="tm-join-card" style="width:100%;padding:0;box-shadow:none;border:none;background:none">
    <div class="mp-title">Team Room</div>
    <div class="mp-sub">Pick any display name — it is yours to keep. Creators choose a secret code; joiners enter the code they were given.</div>
    <div class="tm-mode-row" role="tablist">
      <button class="tm-mode-btn${tmPendingMode === "create" ? " active" : ""}" data-mode="create">Create room</button>
      <button class="tm-mode-btn${tmPendingMode === "join" ? " active" : ""}" data-mode="join">Join room</button>
    </div>
    <div class="auth-field"><label class="auth-label" for="tm-name">Your name</label><input class="auth-input" id="tm-name" maxlength="20" placeholder="e.g. Vikrant" autocomplete="nickname" spellcheck="false" enterkeyhint="next" value="${esc(tmMe.name || saved.name || "")}"></div>
    <div class="auth-field"><label class="auth-label" for="tm-room">Secret room code</label><div class="tm-row2"><input class="auth-input" id="tm-room" maxlength="40" placeholder="any secret word" autocomplete="off" spellcheck="false" enterkeyhint="go" value="${esc(pre || saved.room || "")}"><button type="button" id="tm-rand" class="cmd-trigger-btn" title="Random room">🎲</button></div></div>
    <div id="tm-mode-hint"></div>
    <div class="auth-field"><label class="auth-label" for="tm-role">Role</label><select class="auth-input" id="tm-role"><option value="editor" selected>Editor — chat, canvas, knowledge</option><option value="viewer">Viewer — read-only</option><option value="owner">Owner — manage room</option></select></div>
    <button class="auth-submit" id="tm-go">Join room</button>
    <div class="tm-chips" id="tm-chips" aria-hidden="true"><span>Chat</span><span>Canvas</span><span>Knowledge</span><span>Files</span></div>
    <div class="auth-msg" id="tm-msg"></div></div>`;
  modal.classList.remove("hidden");
  const nm = $("tm-name"), rm = $("tm-room"), rl = $("tm-role");
  if (rl && (tmMe.role || saved.role)) rl.value = tmMe.role || saved.role || "editor";
  const syncMode = () => {
    mb.querySelectorAll(".tm-mode-btn").forEach(x => x.classList.toggle("active", x.dataset.mode === tmPendingMode));
    const go0 = $("tm-go"); if (go0) go0.textContent = tmPendingMode === "create" ? "Create room" : "Join room";
    const h = $("tm-mode-hint"); if (h) h.textContent = tmPendingMode === "create" ? "Pick a secret code — if it is taken you will be asked to choose another." : "Enter the secret code the creator gave you.";
  };
  mb.querySelectorAll(".tm-mode-btn").forEach(b => b.onclick = () => { tmPendingMode = b.dataset.mode; tmMsg(""); syncMode(); });
  syncMode();
  const rd = $("tm-rand");
  if (rd) rd.onclick = () => { const a = ["swift", "quiet", "amber", "lunar", "neon", "solar", "misty", "cosmic"], b = ["fox", "owl", "wave", "spark", "pixel", "comet", "byte", "forge"]; if (rm) rm.value = a[Math.random() * 8 | 0] + "-" + b[Math.random() * 8 | 0] + "-" + (100 + Math.random() * 900 | 0); };
  const go = $("tm-go");
  if (go) go.onclick = () => { tmMsg(""); tmStart(rm ? rm.value : "", nm ? nm.value : "", rl ? rl.value : "editor", tmPendingMode); };
  if (rm) rm.onkeydown = e => { if (e.key === "Enter" && go) go.click(); };
}
const _tmOpen = $("tm-open-btn"); if (_tmOpen) _tmOpen.onclick = () => { showTeamModal(); sfx.play("click"); };
const _tmLeave = $("tm-leave-btn"); if (_tmLeave) _tmLeave.onclick = tmLeave;
const _tmInv = $("tm-invite-btn"); if (_tmInv) _tmInv.onclick = async () => { const l = tmInvite(); try { await navigator.clipboard.writeText(l); toast("Invite link copied"); } catch (e) { prompt("Copy invite link:", l); } };
const _uaBtn = $("ua-btn"); if (_uaBtn) _uaBtn.onclick = () => showUA();
const _uaSide = $("ua-side-btn"); if (_uaSide) _uaSide.onclick = () => showUA();
tmRender();
const lcFile = () => (typeof currentArtifact !== "undefined" && currentArtifact.title) || vscActiveFile || "";
const lcSelOf = ed => { try { return [ed.selectionStart | 0, ed.selectionEnd | 0]; } catch (e) { return [0, 0]; } };
let _lcT = 0;
function lcSend() {
  clearTimeout(_lcT);
  _lcT = setTimeout(() => {
    if (!tmRoom) return;
    const ed = document.activeElement === artCodeEditor ? artCodeEditor : vscCodeInput;
    tmSend({ t: "tm-presence", name: tmMe.name, color: tmMe.color, file: String(lcFile()).slice(0, 120), sel: lcSelOf(ed || vscCodeInput) });
  }, 300);
}
[artCodeEditor, vscCodeInput].forEach(ed => { if (ed) ["select", "keyup", "click"].forEach(ev => ed.addEventListener(ev, lcSend, { passive: true })); });
setInterval(() => { if (!tmRoom || typeof Peer === "undefined") return; const ed = document.activeElement === artCodeEditor ? artCodeEditor : vscCodeInput; tmSend({ t: "tm-presence", name: tmMe.name, color: tmMe.color, file: String(lcFile()).slice(0, 120), sel: lcSelOf(ed || vscCodeInput) }); tmRender(); lcPaint(); }, 4000);

/* ═══ JARVIK-TEAM-UPGRADE-5: live pointer cursors — Figma-style name-tagged cursors + click ripples ═══ */
// ponytail: viewport-normalized coords (x/innerWidth, y/innerHeight) so mobile + desktop maps read the same spot;
// throttled 45 ms pointermove, instant click pings, rAF lerp for smooth glide. Mobile peers (no pointer) still show as presence chips only.
let _tmPtrT = 0, _tmPtrState = null, _tmRaf = 0;
const _tmCursorEls = {};
function tmPtrLabel(t) { try { if (!t || !t.tagName) return ""; return String(t.tagName || "").toLowerCase() + (t.id ? " #" + t.id : ""); } catch (e) { return ""; } }
function tmSendPtr() {
  _tmPtrT = 0; const p = _tmPtrState;
  if (!p || !tmRoom || typeof tmSend !== "function") return;
  tmSend({ t: "tm-ptr", name: tmMe.name, color: tmMe.color, px: +(Math.min(1, Math.max(0, p.x / Math.max(1, innerWidth)))).toFixed(4), py: +(Math.min(1, Math.max(0, p.y / Math.max(1, innerHeight)))).toFixed(4), c: p.c ? 1 : 0, n: p.n || "" });
  p.c = 0;
}
addEventListener("pointermove", e => {
  _tmPtrState = { x: e.clientX, y: e.clientY, c: _tmPtrState && _tmPtrState.c, n: _tmPtrState && _tmPtrState.n || "" };
  if (!_tmPtrT && tmRoom) _tmPtrT = setTimeout(tmSendPtr, 45);
}, { passive: true });
addEventListener("pointerdown", e => {
  clearTimeout(_tmPtrT); _tmPtrT = 0;
  _tmPtrState = { x: e.clientX, y: e.clientY, c: 1, n: tmPtrLabel(e.target) };
  tmSendPtr();
}, { passive: true });
function tmRipple(peer, px, py, label) {
  const x = Math.min(1, Math.max(0, +px || 0)) * innerWidth, y = Math.min(1, Math.max(0, +py || 0)) * innerHeight;
  const c = (peer && peer.color) || "#4fc1ff";
  const r = document.createElement("div");
  r.className = "tm-ripple";
  r.style.left = x + "px"; r.style.top = y + "px";
  r.style.setProperty("--tm-c", c);
  document.body.appendChild(r);
  setTimeout(() => { try { r.remove(); } catch (e) {} }, 900);
  if (label && String(label).length <= 40) {
    const l = document.createElement("div");
    l.className = "tm-click-lab";
    l.textContent = String(label);
    l.style.left = x + 14 + "px"; l.style.top = y + 14 + "px";
    l.style.setProperty("--tm-c", c);
    document.body.appendChild(l);
    setTimeout(() => { try { l.remove(); } catch (e) {} }, 1300);
  }
}
function tmCursorEl(id, p) {
  let el = _tmCursorEls[id];
  if (!el || !el.isConnected) {
    el = document.createElement("div");
    el.className = "tm-cursor";
    el.innerHTML = `<svg viewBox="0 0 20 20" width="18" height="18"><path d="M3 1.6L15.4 9.3L9.6 10.2L6.4 15.9Z" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"></path></svg><span class="tm-cursor-name"></span>`;
    document.body.appendChild(el);
    el._x = null; el._y = null; el._c = "";
    _tmCursorEls[id] = el;
  }
  const nm = el.querySelector(".tm-cursor-name"), ar = el.querySelector("path");
  const label = (p.name || "?");
  if (nm.textContent !== label) nm.textContent = label;
  if (p.color && el._c !== p.color) { el._c = p.color; ar.setAttribute("fill", p.color); nm.style.background = p.color; el.style.setProperty("--tm-c", p.color); }
  if (p._hot !== el._hot) { el._hot = p._hot; el.classList.toggle("hot", !!el._hot); }
  return el;
}
function tmCursorTick() {
  _tmRaf = 0;
  const k = (matchMedia("(prefers-reduced-motion: reduce)").matches) ? 1 : 0.25;
  for (const id in _tmCursorEls) {
    if (!tmRoom || !tmPeers[id] || tmPeers[id].px == null) { try { _tmCursorEls[id].remove(); } catch (e) {} delete _tmCursorEls[id]; }
  }
  if (tmRoom) { // every online teammate's cursor animates at once; rAF auto-pauses when the tab is hidden
    for (const id in tmPeers) {
      const p = tmPeers[id];
      if (p.px == null) continue;
      const el = tmCursorEl(id, p);
      const tx = p.px * innerWidth, ty = p.py * innerHeight;
      el._x = el._x == null ? tx : el._x + (tx - el._x) * k;
      el._y = el._y == null ? ty : el._y + (ty - el._y) * k;
      el.style.transform = `translate3d(${el._x.toFixed(1)}px,${el._y.toFixed(1)}px,0)`;
    }
    _tmRaf = requestAnimationFrame(tmCursorTick);
  }
}
function tmCursorWake() { if (!_tmRaf) _tmRaf = requestAnimationFrame(tmCursorTick); }
setInterval(tmCursorTick, 4000);
(function tmCursorHoverSpotlight() {
  const tp = $("tm-people");
  if (!tp || tp._hotBound) return; tp._hotBound = 1;
  tp.addEventListener("mouseover", e => { const r = e.target.closest(".tm-p[data-id]"), id = r && r.dataset.id; if (!id || id === "@self") return; const p = tmPeers[id]; if (p) { p._hot = 1; const c = _tmCursorEls[id]; if (c) c.classList.add("hot"); } if (r) r.setAttribute("data-hot", "1"); });
  tp.addEventListener("mouseout", e => { const r = e.target.closest(".tm-p[data-id]"), id = r && r.dataset.id; if (!id) return; const p = tmPeers[id]; if (p) { p._hot = 0; const c = _tmCursorEls[id]; if (c) c.classList.remove("hot"); } if (r) r.removeAttribute("data-hot"); });
})();

/* ═══ JARVIK-FEATURES-UPGRADE (2026-10-11): prompt library, thread search, canvas power, safety pack ═══ */
/* --- Prompt Library: reusable prompts with {{blanks}} --- */
const PL_K = "jarvik_prompts";
const getPL = () => { try { return JSON.parse(localStorage.getItem(PL_K)) || []; } catch (e) { return []; } };
const savePL = p => localStorage.setItem(PL_K, JSON.stringify(p));
const varsPL = t => [...new Set([...String(t).matchAll(/{{(\w+)}}/g)].map(m => m[1]))];
const fillPL = (t, v) => String(t).replace(/{{(\w+)}}/g, (_, k) => (v[k] !== undefined && v[k] !== "" ? v[k] : `{{${k}}}`));
// ponytail: unbounded array/body; ceiling 50 items, upgrade when budget matters.
function showPL() {
  const items = getPL();
  mb.innerHTML = `<div class="mp-title">Prompt Library</div>
    <div class="mp-sub">Save current input, then fill {{blanks}} and send.</div>
    <div class="custom-model-row"><input id="pl-name" class="auth-input" maxlength="60" placeholder="Name for current input…">
    <button id="pl-save" class="hcta main">Save current</button></div>
    <div class="mp-list" id="pl-list">${items.length ? items.map(p =>
      `<div class="mp-row" data-id="${p.id}"><div style="flex:1"><div class="mp-name">${esc(p.name)}</div>
      <div class="mp-desc">${esc(p.body.slice(0, 120))}</div></div>
      <button class="hcta sec" data-act="use">Use</button><button class="hcta sec" data-act="del">Del</button></div>`).join("")
      : `<div class="eml">No saved prompts yet.</div>`}</div>
    <div id="pl-vars"></div>`;
  modal.classList.remove("hidden");
  const sv = $("pl-save");
  if (sv) sv.onclick = () => {
    const body = (ui.value || "").trim(); if (!body) return toast("Type a prompt first");
    const name = ((($("pl-name") || {}).value) || body.slice(0, 40)).trim();
    const next = [{ id: uid(), name, body }, ...items].slice(0, 50);
    try { savePL(next); } catch (e) { return toast("Storage full"); }
    sfx.play("click"); showPL();
  };
  const lst = $("pl-list");
  if (lst) lst.onclick = e => {
    const row = e.target.closest(".mp-row"); if (!row) return;
    const p = getPL().find(x => x.id === row.dataset.id); if (!p) return;
    if (e.target.dataset.act === "del") { savePL(getPL().filter(x => x.id !== p.id)); return showPL(); }
    const vs = varsPL(p.body), box = $("pl-vars");
    if (!box) return;
    box.innerHTML = vs.map(v => `<input id="pl-v-${esc(v)}" class="auth-input" placeholder="{{${esc(v)}}}">`).join("") +
      `<button id="pl-send" class="hcta main">Fill &amp; Send</button>`;
    const snd = $("pl-send");
    if (snd) snd.onclick = () => {
      const vals = {}; vs.forEach(v => vals[v] = ((($("pl-v-" + v)) || {}).value) || "");
      ui.value = fillPL(p.body, vals); grow(ui); modal.classList.add("hidden"); send();
    };
  };
}
console.assert(fillPL("a {{x}}", { x: "b" }) === "a b", "pl fill self-check");
const _plBtn = $("pl-btn"); if (_plBtn) _plBtn.onclick = () => { sfx.play("click"); showPL(); };

/* --- Model Compare: same prompt across 2 models, word-diff highlight --- */
// ponytail: word-overlap mark only; upgrade to diff lib + streaming tokens when needed.
function cmpMark(t, other) {
  const s = new Set(String(other).toLowerCase().split(/\s+/));
  return esc(t).split(/(\s+)/).map(w => /^\s*$/.test(w) || s.has(w.toLowerCase()) ? w : `<mark class="cmp-diff">${w}</mark>`).join("");
}
function openCompareModal(prefill) {
  prefill = prefill || "";
  const list = currentModelList();
  const opt = sel => list.map(m => `<option value="${esc(m.id)}"${m.id === sel ? " selected" : ""}>${esc(m.name)}</option>`).join("");
  mb.innerHTML = `<div class="mp-title">Model Compare</div>
    <textarea id="cmp-prompt" class="auth-input" rows="3" placeholder="Prompt to run on both models…">${esc(prefill)}</textarea>
    <div class="cmp-picks"><select id="cmp-model-a" class="auth-input">${opt(MDL)}</select><select id="cmp-model-b" class="auth-input">${opt(list.length > 1 ? list[1].id : MDL)}</select>
    <button id="cmp-run" class="hcta main">Run compare</button></div>
    <div id="cmp-grid"><div class="cmp-pane"><div id="cmp-head-a" class="cmp-head"></div><div id="cmp-out-a" class="cmp-out"></div></div>
    <div class="cmp-pane"><div id="cmp-head-b" class="cmp-head"></div><div id="cmp-out-b" class="cmp-out"></div></div></div>`;
  modal.classList.remove("hidden");
  const oa = $("cmp-out-a"), ob = $("cmp-out-b");
  if (oa && ob) { let lk = false; oa.onscroll = () => { if (!lk) { lk = true; ob.scrollTop = oa.scrollTop; lk = false; } }; ob.onscroll = () => { if (!lk) { lk = true; oa.scrollTop = ob.scrollTop; lk = false; } }; }
  const run = $("cmp-run");
  if (run) run.onclick = async () => {
    const p = ((($("cmp-prompt") || {}).value) || "").trim(); if (!p) return;
    const a = $("cmp-model-a").value, b = $("cmp-model-b").value;
    const ha = $("cmp-head-a"), hb = $("cmp-head-b");
    if (ha) ha.textContent = a; if (hb) hb.textContent = b;
    if (oa) oa.textContent = "Running…"; if (ob) ob.textContent = "Running…";
    const msgs = [{ role: "user", content: p }];
    const res = await Promise.allSettled([chatOnce(msgs, { model: a }), chatOnce(msgs, { model: b })]);
    const ta = res[0].status === "fulfilled" ? res[0].value : "Error: " + (((res[0].reason || {}).message) || res[0].reason);
    const tb = res[1].status === "fulfilled" ? res[1].value : "Error: " + (((res[1].reason || {}).message) || res[1].reason);
    if (oa) oa.innerHTML = cmpMark(ta, tb); if (ob) ob.innerHTML = cmpMark(tb, ta);
  };
}

/* --- Thread Search: find phrase in long chats, jump to turn --- */
// ponytail: substring, 200-hit cap, text nodes only; upgrade to chunked walk + regex/fuzzy when needed.
const tsBar = $("ts-bar"), tsIn = $("ts-input"), tsCnt = $("ts-count");
let tsHits = [], tsIdx = -1;
function tsClear(silent) { cc.querySelectorAll("mark.ts-hit").forEach(m => m.replaceWith(...m.childNodes)); if (cc.normalize) cc.normalize(); tsHits = []; tsIdx = -1; if (!silent && tsCnt) tsCnt.textContent = "0/0"; }
function tsJump(i) { if (!tsHits.length) return; tsHits.forEach(h => h.classList.remove("ts-active")); tsIdx = (i + tsHits.length) % tsHits.length; const el = tsHits[tsIdx]; el.classList.add("ts-active"); el.scrollIntoView({ block: "center" }); if (tsCnt) tsCnt.textContent = `${tsIdx + 1}/${tsHits.length}`; }
function tsFind() {
  if (!tsIn) return;
  tsClear(true);
  const q = tsIn.value || ""; if (q.length < 2) { if (tsCnt) tsCnt.textContent = "0/0"; return; }
  const lw = q.toLowerCase();
  let ns = [];
  try {
    const w = document.createTreeWalker(cc, NodeFilter.SHOW_TEXT, { acceptNode(n) { return n.nodeValue.toLowerCase().includes(lw) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    while (w.nextNode()) ns.push(w.currentNode);
  } catch (e) { return; }
  for (const n of ns) {
    if (tsHits.length >= 200) break;
    const t = n.nodeValue, lt = t.toLowerCase();
    let f = null, last = 0, i;
    while ((i = lt.indexOf(lw, last)) > -1) {
      if (!f) f = document.createDocumentFragment();
      f.append(t.slice(last, i));
      const mk = document.createElement("mark"); mk.className = "ts-hit"; mk.textContent = t.substr(i, q.length); f.append(mk);
      last = i + q.length; tsHits.push(mk);
    }
    if (f) { f.append(t.slice(last)); n.replaceWith(f); }
  }
  tsHits = [...cc.querySelectorAll("mark.ts-hit")];
  if (tsCnt) tsCnt.textContent = tsHits.length ? `1/${tsHits.length}` : "0/0";
  if (tsHits.length) tsJump(0);
}
const _tsT = $("ts-toggle"); if (_tsT) _tsT.onclick = () => { if (!tsBar) return; tsBar.classList.toggle("hidden"); if (!tsBar.classList.contains("hidden") && tsIn) { tsIn.focus(); tsIn.select(); } };
const _tsC = $("ts-close"); if (_tsC) _tsC.onclick = () => { if (tsBar) tsBar.classList.add("hidden"); tsClear(); };
const _tsN = $("ts-next"); if (_tsN) _tsN.onclick = () => tsJump(tsIdx + 1);
const _tsP = $("ts-prev"); if (_tsP) _tsP.onclick = () => tsJump(tsIdx - 1);
if (tsIn) { tsIn.oninput = tsFind; tsIn.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); tsJump(tsIdx + (e.shiftKey ? -1 : 1)); } else if (e.key === "Escape") { const c = $("ts-close"); if (c) c.click(); } }; }
try {
  const _tsSave = saveChat;
  saveChat = () => { const open = tsBar && !tsBar.classList.contains("hidden"); if (open) tsClear(true); _tsSave(); if (open) tsFind(); };
} catch (e) {}

/* --- Canvas Power Pack: version diff, device widths, portable share --- */
// ponytail: index line-diff only; upgrade to LCS/Myers when versions get large.
const cdView = $("cd-view"), cdOld = $("cd-old"), cdNew = $("cd-new");
const cdPair = () => { const a = sessionArtifacts.find(x => x.title === currentArtifact.title), v = (a && a.versions) || []; return [v.length > 1 ? v[v.length - 2] : "", artCodeEditor ? artCodeEditor.value : (currentArtifact.code || "")]; };
function cdDiffLines(o, n) { o = String(o).split("\n"); n = String(n).split("\n"); const m = Math.max(o.length, n.length), r = []; for (let i = 0; i < m; i++) r.push({ o: o[i] !== undefined ? o[i] : "", n: n[i] !== undefined ? n[i] : "", same: o[i] === n[i] }); return r; }
function cdShow() {
  if (!cdView || !cdOld || !cdNew) return;
  const pr = cdPair();
  const vers = ((sessionArtifacts.find(x => x.title === currentArtifact.title) || {}).versions || []).length;
  const lo = $("cd-old-lbl"); if (lo) lo.textContent = "v" + Math.max(1, vers - 1);
  const ln = $("cd-new-lbl"); if (ln) ln.textContent = "current";
  const r = cdDiffLines(pr[0], pr[1]);
  cdOld.innerHTML = r.map(x => `<span class="${x.same ? "" : "cd-del"}">${esc(x.o)}</span>`).join("\n");
  cdNew.innerHTML = r.map(x => `<span class="${x.same ? "" : "cd-add"}">${esc(x.n)}</span>`).join("\n");
  cdView.hidden = false;
}
const cdAccept = t => { if (!artCodeEditor) return; artCodeEditor.value = t; artCodeEditor.dispatchEvent(new Event("input")); if (cdView) cdView.hidden = true; toast("Accepted into editor"); };
const _cdT = $("cd-toggle"); if (_cdT) _cdT.onclick = () => { if (!cdView) return; if (cdView.hidden) cdShow(); else cdView.hidden = true; };
const _cdC = $("cd-close"); if (_cdC) _cdC.onclick = () => { if (cdView) cdView.hidden = true; };
const _cdAO = $("cd-accept-old"); if (_cdAO) _cdAO.onclick = () => cdAccept(cdPair()[0]);
const _cdAN = $("cd-accept-new"); if (_cdAN) _cdAN.onclick = () => cdAccept(cdPair()[1]);
const dvMap = { "dv-phone": "390px", "dv-tablet": "768px", "dv-desktop": "100%" };
Object.entries(dvMap).forEach(([id, w]) => { const b = $(id); if (b) b.onclick = () => { if (artFrame) artFrame.style.width = w; Object.keys(dvMap).forEach(k => { const o = $(k); if (o) o.setAttribute("aria-pressed", String(k === id)); }); }; });
const seDoc = c => /<!doctype|<html/i.test(c) ? c : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${c}</body></html>`;
const _seS = $("se-save"); if (_seS) _seS.onclick = () => { const c = seDoc(artCodeEditor ? artCodeEditor.value : ""); const t = currentArtifact.title || ""; const n = t.endsWith(".html") ? t : "canvas.html"; saveTextFile(n, c); };
let seURL = "";
const _seL = $("se-link"); if (_seL) _seL.onclick = async () => { if (seURL) URL.revokeObjectURL(seURL); seURL = URL.createObjectURL(new Blob([seDoc(artCodeEditor ? artCodeEditor.value : "")], { type: "text/html" })); try { await navigator.clipboard.writeText(seURL); toast("Link copied (this tab only)"); } catch (e) { prompt("Copy canvas link:", seURL); } };
console.assert(cdDiffLines("a\nb", "a\nc").filter(r => !r.same).length === 1, "cd diff self-check");

/* --- Safety pack: restore points, offline outbox, focus mode, scheduled runs --- */
const rpK = () => PK("rps"), ooK = () => PK("outbox"), srK = () => PK("sched");
const rpList = () => loadJSON(rpK(), []);
const ooList = () => loadJSON(ooK(), []);
function rpSave() { try { const l = rpList(); l.unshift({ t: Date.now(), files: vscFiles, dirs: vscDirs }); saveJSON(rpK(), l.slice(0, 5)); rpRender(); toast("Snapshot saved"); } catch (e) { toast("Snapshot failed — storage full"); } }
function rpRoll(i) { const p = rpList()[i]; if (!p || !confirm("Rollback workspace? Current edits lost.")) return; vscFiles = JSON.parse(JSON.stringify(p.files)); vscDirs = [...p.dirs]; saveWorkspace(); refreshWorkspaceViews(); rpRender(); toast("Workspace restored"); }
function rpRender() { const w = $("rp-list"); if (!w) return; w.innerHTML = ""; rpList().forEach((p, i) => { const b = document.createElement("button"); b.className = "cmd-item"; b.innerHTML = `<span class="cmd-item-title">${esc(new Date(p.t).toLocaleString())}</span><span class="cmd-item-tag">restore</span>`; b.onclick = () => rpRoll(i); w.appendChild(b); }); }
function ooQueue(t) { try { const q = ooList(); q.push({ t: Date.now(), text: t }); saveJSON(ooK(), q); } catch (e) {} ooRender(); }
function ooRender() { const c = $("oo-count"); if (c) c.textContent = ooList().length; }
async function ooFlush() { if (busy || !navigator.onLine) return; const q = ooList(); if (!q.length) return; saveJSON(ooK(), []); ooRender(); for (const m of q) await streamAIResponse(m.text, []); }
window.addEventListener("online", ooFlush);
function fmToggle(force) { document.body.classList.toggle("fm-on", force !== undefined ? force : !document.body.classList.contains("fm-on")); }
let srT = 0;
function srTick() { if (busy || !navigator.onLine) return; const s = loadJSON(srK(), null); if (!s || !s.prompt || !s.minutes) return; if (Date.now() - (+loadJSON(PK("sched_last"), 0)) < s.minutes * 6e4) return; saveJSON(PK("sched_last"), Date.now()); streamAIResponse("[scheduled] " + s.prompt, []); }
function srInit() { try { clearInterval(srT); } catch (e) {} srT = setInterval(srTick, 3e4); const s = loadJSON(srK(), null); if (s) { const p = $("sr-prompt"); if (p) p.value = s.prompt; const m = $("sr-minutes"); if (m) m.value = s.minutes; } }
const _rpS = $("rp-save"); if (_rpS) _rpS.onclick = rpSave;
const _ooF = $("oo-flush"); if (_ooF) _ooF.onclick = ooFlush;
const _fmT = $("fm-toggle"); if (_fmT) _fmT.onclick = () => fmToggle();
const _srS = $("sr-save"); if (_srS) _srS.onclick = () => { const pv = (($("sr-prompt") || {}).value) || ""; const mv = Math.max(1, parseInt(((($("sr-minutes") || {}).value) || "0"), 10) || 0); if (!pv.trim() || !mv) return toast("Set prompt + minutes"); saveJSON(srK(), { prompt: pv.trim(), minutes: mv }); saveJSON(PK("sched_last"), Date.now()); toast("Scheduled every " + mv + "m"); };
const _srC = $("sr-clear"); if (_srC) _srC.onclick = () => { try { localStorage.removeItem(srK()); } catch (e) {} toast("Schedule cleared"); };
rpRender(); ooRender(); srInit();
window.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === ".") { e.preventDefault(); fmToggle(); } });

/* path helpers — root-relative, never a leading slash */
function fsResolve(base, p) {
  if (!p) return base || "";
  const rawPath = String(p).trim().replace(/^~\/?/, "");
  const segs = (rawPath.startsWith("/") ? rawPath.slice(1) : (base ? base + "/" : "") + rawPath).split("/");
  const out = [];
  for (const s of segs) { if (!s || s === ".") continue; if (s === "..") out.pop(); else out.push(s); }
  return out.join("/");
}
function termParent(path) { const i = path.lastIndexOf("/"); return i === -1 ? "" : path.slice(0, i); }
function termIsDir(path) {
  if (!path) return true;
  if (vscDirs.includes(path)) return true;
  const pre = path + "/";
  return Object.keys(vscFiles).some(k => k.startsWith(pre)) || vscDirs.some(d => d.startsWith(pre));
}
function termListChildren(dir) {
  const pre = dir ? dir + "/" : "";
  const dirs = new Set(), files = [];
  vscDirs.forEach(d => { if (d.startsWith(pre)) { const r = d.slice(pre.length); if (r) dirs.add(r.split("/")[0]); } });
  Object.keys(vscFiles).forEach(k => { if (k.startsWith(pre)) { const r = k.slice(pre.length); if (!r) return; if (r.includes("/")) dirs.add(r.split("/")[0]); else files.push(k); } });
  return { dirs: [...dirs].sort((a, b) => a.localeCompare(b)), files: files.sort((a, b) => a.localeCompare(b)) };
}
function termMkdir(path) {
  let cur = "";
  for (const s of path.split("/")) { if (!s) continue; cur = cur ? cur + "/" + s : s; if (!vscDirs.includes(cur)) vscDirs.push(cur); }
}
function termWrite(path, content, append) {
  const prev = vscFiles[path] ? (vscFiles[path].content || "") : "";
  vscFiles[path] = {
    lang: getFileLanguage(path),
    icon: getFileIcon(path),
    content: (append && prev) ? prev + (prev.endsWith("\n") ? "" : "\n") + content : content
  };
}
function termDelete(path, recursive) {
  if (vscFiles[path]) { delete vscFiles[path]; return "file"; }
  const pre = path + "/";
  const hasKids = Object.keys(vscFiles).some(k => k.startsWith(pre)) || vscDirs.some(d => d === path || d.startsWith(pre));
  if (hasKids && !recursive) return "dir";
  Object.keys(vscFiles).forEach(k => { if (k.startsWith(pre)) delete vscFiles[k]; });
  vscDirs = vscDirs.filter(d => d !== path && !d.startsWith(pre));
  return "dir";
}
function refreshWorkspaceViews() {
  vscOpenTabs = vscOpenTabs.filter(f => vscFiles[f]);
  if (!vscOpenTabs.length) { const k = Object.keys(vscFiles); if (k.length) vscOpenTabs = [k[0]]; }
  if (vscActiveFile && !vscFiles[vscActiveFile]) { const n = vscOpenTabs[0] || ""; vscActiveFile = ""; if (n) switchVscFile(n); }
  renderArtExplorer();
  renderVscFileTree();
  renderVscTabs();
}
function syncArtifactToWorkspace(title, code) {
  if (!title || !fileExt(title)) return;
  const existed = !!vscFiles[title];
  vscFiles[title] = { lang: getFileLanguage(title), icon: getFileIcon(title), content: code };
  saveWorkspaceSoon();
  if (!existed) refreshWorkspaceViews();
}

/* bundle same-folder <link>/<script src> refs for srcdoc preview */
function bundleForPreview(path, html) {
  if (!vscFiles[path] || !/\.html?$/i.test(path)) return html;
  const dir = termParent(path);
  return String(html)
    .replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (m, href) => {
      if (!/\.css$/i.test(href)) return m;
      const key = fsResolve(dir, href);
      return vscFiles[key] ? "<style>\n" + vscFiles[key].content + "\n</style>" : m;
    })
    .replace(/<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (m, src) => {
      if (!/\.m?js$/i.test(src)) return m;
      const key = fsResolve(dir, src);
      if (!vscFiles[key]) return m;
      return "<script>\n" + vscFiles[key].content.replace(/<\/script/gi, "<\\/script") + "\n<\/script>";
    });
}

/* js/css workspace files render as live documents; raw source stays in the editor */
function executableWrap(path, code) {
  if (!vscFiles[path]) return code;
  const c = String(code);
  if (/^\s*(<!doctype html|<html)/i.test(c)) return c;
  if (/\.(m?js)$/i.test(path)) {
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><script>\n"
      + c.replace(/<\/script/gi, "<\\/script")
      + "\n<\/script></body></html>";
  }
  if (/\.css$/i.test(path)) {
    return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>\n" + c
      + "\n</style></head><body><div style=\"font:13px 'DM Sans',sans-serif;color:#8a8a85;padding:14px\">CSS applied — add markup in index.html to see it styled.</div></body></html>";
  }
  return c;
}

function mountWorkspaceFile(path) {
  const f = vscFiles[path];
  if (!f) { logToTerminal("mount: '" + path + "': No such file", "error"); return false; }
  registerArtifact(path, f.content, f.lang || getFileLanguage(path));
  toast("⚡ Mounted " + path + " into Co-Work Canvas");
  sfx.play("complete");
  return true;
}

/* ── sandboxed JavaScript runner (worker = isolated & killable) ── */
let termRunSeq = 0;
function runJsSandboxed(code) {
  return new Promise(resolve => {
    const id = ++termRunSeq;
    const head = "const __CODE = " + JSON.stringify(String(code)).replace(/</g, "\\u003c") + ";\nconst __ID = " + id + ";\n";
    const body = [
      "const send = (level, msg) => self.postMessage({ jarvikRun: __ID, level: level, msg: String(msg) });",
      "const fmt = a => { try { return (a !== null && typeof a === \"object\") ? JSON.stringify(a) : String(a); } catch (e) { return String(a); } };",
      "console.log = (...a) => send(\"log\", a.map(fmt).join(\" \"));",
      "console.info = console.log;",
      "console.warn = (...a) => send(\"warn\", a.map(fmt).join(\" \"));",
      "console.error = (...a) => send(\"error\", a.map(fmt).join(\" \"));",
      "self.onerror = e => send(\"error\", e.message + \" (line \" + e.lineno + \")\");",
      "(async () => { try { await eval(__CODE); } catch (e) { send(\"error\", (e && e.stack) || String(e)); } finally { send(\"done\", \"\"); } })();"
    ].join("\n");
    const blob = new Blob([head + body], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    let worker;
    try { worker = new Worker(url); }
    catch (e) { logToTerminal("sandbox: " + e.message, "error"); URL.revokeObjectURL(url); resolve(); return; }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve();
    };
    const timer = setTimeout(() => { logToTerminal("⏱ timed out after 3s — killed", "error"); finish(); }, 3000);
    worker.onmessage = e => {
      const d = e.data;
      if (!d || d.jarvikRun !== id) return;
      if (d.level === "done") finish();
      else logToTerminal(d.msg, d.level === "error" ? "error" : d.level === "warn" ? "warn" : "");
    };
    worker.onerror = e => { logToTerminal("Error: " + (e.message || "failed to start sandbox"), "error"); finish(); };
  });
}

/* ── project scaffolding (starter files, JARVIK-style) ── */
function starterHTML(name) {
  return [
    "<!DOCTYPE html>",
    "<html lang=\"en\">",
    "<head>",
    "  <meta charset=\"utf-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "  <title>" + name + "</title>",
    "  <link rel=\"stylesheet\" href=\"style.css\">",
    "</head>",
    "<body>",
    "  <main class=\"card\">",
    "    <h1>" + name + "</h1>",
    "    <p>Scaffolded by the <strong>JARVIK Shell</strong>. Edit files in the explorer, then hit Run.</p>",
    "    <button id=\"btn\">Click me</button>",
    "    <p class=\"count\" id=\"count\">0 clicks</p>",
    "  </main>",
    "  <script src=\"script.js\"><\/script>",
    "</body>",
    "</html>"
  ].join("\n");
}
function starterCSS() {
  return [
    "* { box-sizing: border-box; margin: 0; }",
    "body {",
    "  min-height: 100vh;",
    "  display: grid;",
    "  place-items: center;",
    "  background: #111110;",
    "  color: #ececea;",
    "  font-family: 'DM Sans', system-ui, sans-serif;",
    "}",
    ".card {",
    "  background: #1b1b1a;",
    "  border: 1px solid rgba(255,255,255,.08);",
    "  border-radius: 16px;",
    "  padding: 34px 38px;",
    "  text-align: center;",
    "  box-shadow: 0 24px 60px -30px rgba(0,0,0,.7);",
    "}",
    "h1 { font-family: 'Playfair Display', serif; font-size: 34px; color: #f2f0ed; margin-bottom: 10px; }",
    "p { color: #a3a29d; font-size: 14px; line-height: 1.6; max-width: 380px; margin: 0 auto 18px; }",
    "button {",
    "  background: #27d3e8; color: #0c1214; border: 0;",
    "  font-weight: 700; font-size: 14px; padding: 11px 22px;",
    "  border-radius: 10px; cursor: pointer; transition: box-shadow .15s;",
    "}",
    "button:hover { box-shadow: 0 0 22px -6px #27d3e8; }",
    ".count { margin: 14px 0 0; color: #27d3e8; font-weight: 600; }"
  ].join("\n");
}
function starterJS() {
  return [
    "let clicks = 0;",
    "const hasDom = typeof document !== \"undefined\";",
    "const btn = hasDom ? document.getElementById(\"btn\") : null;",
    "const out = hasDom ? document.getElementById(\"count\") : null;",
    "if (btn && out) {",
    "  btn.addEventListener(\"click\", () => {",
    "    clicks++;",
    "    out.textContent = clicks + (clicks === 1 ? \" click\" : \" clicks\");",
    "    console.log(\"btn clicked\", clicks);",
    "  });",
    "}",
    "console.log(\"script.js ready\");"
  ].join("\n");
}

/* ── terminal output (multi-line safe) ── */
function logToTerminal(text, type) {
  if (!vscTermLog) return;
  String(text).split("\n").forEach(chunk => {
    const line = document.createElement("div");
    line.className = "term-line" + (type ? " " + type : "");
    line.textContent = chunk;
    vscTermLog.appendChild(line);
  });
  vscTermLog.scrollTop = vscTermLog.scrollHeight;
}

function termTreeLines(dir, indent) {
  const kids = termListChildren(dir);
  const entries = kids.dirs.map(d => ({ n: d, dir: true })).concat(kids.files.map(f => ({ n: f, dir: false })));
  entries.sort((a, b) => a.n.localeCompare(b.n));
  const out = [];
  entries.forEach((e, i) => {
    const last = i === entries.length - 1;
    const branch = last ? "└── " : "├── ";
    if (e.dir) {
      const p = dir ? dir + "/" + e.n : e.n;
      out.push(indent + branch + "📁 " + e.n + "/");
      out.push(...termTreeLines(p, indent + (last ? "    " : "│   ")));
    } else {
      out.push(indent + branch + (vscFiles[e.n].icon || "📄") + " " + e.n.split("/").pop());
    }
  });
  return out;
}

function termPrompt() { return "jarvik@workspace:" + (termCwd ? "~/" + termCwd : "~") + "$ "; }
function updateTermPrompt() { const el = document.querySelector(".term-ps1"); if (el) el.textContent = termPrompt(); }
function executeVscTerminal(rawCmd) {
  const cmd = rawCmd.trim();
  if (!cmd) return;
  vscTerminalHistory.push(cmd);
  vscTermHistIdx = vscTerminalHistory.length;

  logToTerminal(termPrompt() + cmd);

  /* echo text > file   |   echo text >> file */
  const redir = cmd.match(/^\s*echo\s+(.*?)\s*(>>?)\s*(\S+)\s*$/);
  if (redir) {
    let outText = redir[1].trim();
    if ((outText.startsWith("\"") && outText.endsWith("\"")) || (outText.startsWith("'") && outText.endsWith("'"))) outText = outText.slice(1, -1);
    const target = fsResolve(termCwd, redir[3]);
    if (!target) { logToTerminal("echo: invalid target path", "error"); updateTermPrompt(); return; }
    termWrite(target, outText, redir[2] === ">>");
    saveWorkspaceSoon();
    refreshWorkspaceViews();
    logToTerminal((redir[2] === ">>" ? "Appended to " : "Wrote ") + target, "success");
    updateTermPrompt();
    return;
  }

  const parts = cmd.split(/\s+/);
  const action = parts[0].toLowerCase();
  const arg = cmd.slice(parts[0].length).trim();
  const flags = parts.slice(1).filter(x => x.startsWith("-"));
  const posArgs = parts.slice(1).filter(x => !x.startsWith("-"));
  const pathArg = posArgs.join(" ");

  switch (action) {
    case "help": {
      [
        "JARVIK Shell — files, projects & real JavaScript",
        "  ls [path]             list a directory",
        "  tree [path]           show the folder tree",
        "  cd <path> | pwd       change / print working directory",
        "  mkdir <path>          create folder(s)",
        "  touch <file>          create an empty file",
        "  cat <file>            print file contents",
        "  echo <text> > <file>  write to a file (>> appends)",
        "  rm [-r] <path>        delete a file (folder needs -r)",
        "  mv <src> <dst>        move or rename",
        "  cp <src> <dst>        copy a file",
        "  open <file>           open in the VS Code editor",
        "  run [file]            preview in Co-Work Canvas",
        "  node <file.js>        run JavaScript in the sandbox",
        "  node -e \"code\"        run inline JavaScript",
        "  new <name>            scaffold a web project + preview it",
        "  cowork                send active file to JARVIK chat",
        "  clear · date · whoami · git status · python --version"
      ].forEach(l => logToTerminal(l, "info"));
      break;
    }

    case "ls":
    case "dir": {
      const target = pathArg ? fsResolve(termCwd, pathArg) : termCwd;
      if (vscFiles[target]) { logToTerminal(target); break; }
      if (!termIsDir(target)) { logToTerminal("ls: cannot access '" + pathArg + "': No such file or directory", "error"); break; }
      const kids = termListChildren(target);
      if (!kids.dirs.length && !kids.files.length) { logToTerminal("(empty)", "info"); break; }
      kids.dirs.forEach(d => logToTerminal("drwxr-xr-x  " + d + "/"));
      kids.files.forEach(k => logToTerminal("-rw-r--r--  " + String((vscFiles[k].content || "").length).padStart(6) + "B  " + k.split("/").pop()));
      break;
    }

    case "tree": {
      const target = pathArg ? fsResolve(termCwd, pathArg) : termCwd;
      if (!termIsDir(target)) { logToTerminal("tree: '" + pathArg + "': No such directory", "error"); break; }
      logToTerminal(target || ".");
      termTreeLines(target, "").forEach(l => logToTerminal(l));
      break;
    }

    case "cd": {
      const target = (pathArg === "~" || !pathArg) ? "" : fsResolve(termCwd, pathArg);
      if (!termIsDir(target)) { logToTerminal("cd: " + pathArg + ": No such directory", "error"); break; }
      termCwd = target;
      break;
    }

    case "pwd":
      logToTerminal("/" + (termCwd || ""));
      break;

    case "mkdir": {
      if (!pathArg) { logToTerminal("Usage: mkdir <path>", "warn"); break; }
      const p = fsResolve(termCwd, pathArg);
      termMkdir(p);
      saveWorkspaceSoon();
      refreshWorkspaceViews();
      logToTerminal("Created " + p + "/", "success");
      break;
    }

    case "touch": {
      if (!pathArg) { logToTerminal("Usage: touch <file>", "warn"); break; }
      const p = fsResolve(termCwd, pathArg);
      if (!vscFiles[p]) { termWrite(p, ""); saveWorkspaceSoon(); refreshWorkspaceViews(); }
      logToTerminal("Created " + p, "success");
      break;
    }

    case "cat": {
      if (!pathArg) { logToTerminal("Usage: cat <file>", "warn"); break; }
      const p = fsResolve(termCwd, pathArg);
      if (!vscFiles[p]) { logToTerminal("cat: " + pathArg + ": No such file", "error"); break; }
      logToTerminal(vscFiles[p].content || "(empty file)");
      break;
    }

    case "rm": {
      if (!posArgs.length) { logToTerminal("Usage: rm [-r] <path>", "warn"); break; }
      const p = fsResolve(termCwd, posArgs[0]);
      if (!p) { logToTerminal("rm: refusing to remove the workspace root", "error"); break; }
      if (!vscFiles[p] && !termIsDir(p)) { logToTerminal("rm: " + posArgs[0] + ": No such file or directory", "error"); break; }
      const res = termDelete(p, flags.some(f => f.includes("r")));
      if (res === "dir") { logToTerminal("rm: '" + posArgs[0] + "': is a directory (use -r)", "error"); break; }
      saveWorkspaceSoon();
      refreshWorkspaceViews();
      logToTerminal("Removed " + p, "success");
      break;
    }

    case "mv": {
      if (posArgs.length < 2) { logToTerminal("Usage: mv <src> <dst>", "warn"); break; }
      let src = fsResolve(termCwd, posArgs[0]);
      let dst = fsResolve(termCwd, posArgs[1]);
      if (vscFiles[src]) {
        if (termIsDir(dst) && dst) dst = dst + "/" + src.split("/").pop();
        if (!dst || dst === src) { logToTerminal("mv: invalid destination", "error"); break; }
        if (vscFiles[dst]) { logToTerminal("mv: '" + posArgs[1] + "' already exists", "error"); break; }
        termWrite(dst, vscFiles[src].content);
        delete vscFiles[src];
        if (vscActiveFile === src) vscActiveFile = dst;
        vscOpenTabs = vscOpenTabs.map(f => (f === src ? dst : f));
        saveWorkspaceSoon();
        refreshWorkspaceViews();
        if (vscFiles[vscActiveFile] && vscOpenTabs.includes(vscActiveFile)) switchVscFile(vscActiveFile);
        logToTerminal(src + " → " + dst, "success");
      } else if (termIsDir(src)) {
        if (!dst) { logToTerminal("mv: invalid destination", "error"); break; }
        const pre = src + "/";
        let moved = 0;
        Object.keys(vscFiles).forEach(k => {
          if (k.startsWith(pre)) { vscFiles[dst + "/" + k.slice(pre.length)] = vscFiles[k]; delete vscFiles[k]; moved++; }
        });
        vscDirs = vscDirs.filter(d => d !== src && !d.startsWith(pre));
        termMkdir(dst);
        vscOpenTabs = vscOpenTabs.map(f => (f.startsWith(pre) ? dst + "/" + f.slice(pre.length) : f));
        if (vscActiveFile.startsWith(pre)) vscActiveFile = dst + "/" + vscActiveFile.slice(pre.length);
        saveWorkspaceSoon();
        refreshWorkspaceViews();
        if (vscFiles[vscActiveFile]) switchVscFile(vscActiveFile);
        logToTerminal("Moved " + moved + " file(s) → " + dst + "/", "success");
      } else {
        logToTerminal("mv: " + posArgs[0] + ": No such file or directory", "error");
      }
      break;
    }

    case "cp": {
      if (posArgs.length < 2) { logToTerminal("Usage: cp <src> <dst>", "warn"); break; }
      const src = fsResolve(termCwd, posArgs[0]);
      let dst = fsResolve(termCwd, posArgs[1]);
      if (!vscFiles[src]) { logToTerminal("cp: " + posArgs[0] + ": No such file", "error"); break; }
      if (termIsDir(dst) && dst) dst = dst + "/" + src.split("/").pop();
      if (!dst) { logToTerminal("cp: invalid destination", "error"); break; }
      termWrite(dst, vscFiles[src].content);
      saveWorkspaceSoon();
      refreshWorkspaceViews();
      logToTerminal("Copied " + src + " → " + dst, "success");
      break;
    }

    case "open": {
      if (!pathArg) { logToTerminal("Usage: open <file>", "warn"); break; }
      const p = fsResolve(termCwd, pathArg);
      if (!vscFiles[p]) { logToTerminal("open: " + pathArg + ": No such file", "error"); break; }
      switchVscFile(p);
      logToTerminal("Opened " + p + " in the editor", "info");
      break;
    }

    case "run":
    case "preview": {
      const p = pathArg ? fsResolve(termCwd, pathArg) : vscActiveFile;
      if (!p || !vscFiles[p]) { logToTerminal("run: '" + (pathArg || p) + "': No such file", "error"); break; }
      logToTerminal("Mounting " + p + " → Co-Work Canvas…", "success");
      if (mountWorkspaceFile(p) && vscodeModal && !vscodeModal.classList.contains("hidden")) closeVSCodeModal();
      break;
    }

    case "node": {
      if (arg === "-v" || arg === "--version") { logToTerminal("v20.11.0", "success"); break; }
      const evalM = arg.match(/^(?:-e|--eval)\s+([\s\S]+)$/);
      let code = null, label = "-e";
      if (evalM) {
        code = evalM[1].trim();
        if ((code.startsWith("\"") && code.endsWith("\"")) || (code.startsWith("'") && code.endsWith("'"))) code = code.slice(1, -1);
      } else if (pathArg) {
        const p = fsResolve(termCwd, pathArg);
        if (!vscFiles[p]) { logToTerminal("node: cannot open '" + pathArg + "'", "error"); break; }
        if (!/\.(m?js)$/i.test(p)) { logToTerminal("node: '" + pathArg + "' is not a JavaScript file", "error"); break; }
        code = vscFiles[p].content;
        label = pathArg;
      } else {
        logToTerminal("Usage: node <file.js> | node -e \"console.log(1)\" | node -v", "warn");
        break;
      }
      logToTerminal("▶ node " + label, "info");
      runJsSandboxed(code);
      break;
    }

    case "new":
    case "scaffold": {
      if (!pathArg) { logToTerminal("Usage: new <project-name>", "warn"); break; }
      const name = pathArg.trim().replace(/[^\w\-. ]/g, "").replace(/\s+/g, "-");
      if (!name) { logToTerminal("new: invalid project name", "error"); break; }
      if (termIsDir(name) || Object.keys(vscFiles).some(k => k === name || k.startsWith(name + "/"))) {
        logToTerminal("new: '" + name + "' already exists", "error");
        break;
      }
      termMkdir(name);
      termWrite(name + "/index.html", starterHTML(name));
      termWrite(name + "/style.css", starterCSS());
      termWrite(name + "/script.js", starterJS());
      termWrite(name + "/README.md", "# " + name + "\n\nScaffolded by the JARVIK Shell.\n\n- node script.js — run the script in the sandbox\n- run index.html — preview in Co-Work Canvas\n");
      termCwd = name;
      saveWorkspaceSoon();
      refreshWorkspaceViews();
      logToTerminal("✓ created project '" + name + "/'", "success");
      ["index.html", "style.css", "script.js", "README.md"].forEach(f => logToTerminal("    " + name + "/" + f, "info"));
      logToTerminal("✓ cd " + name, "success");
      switchVscFile(name + "/index.html");
      logToTerminal("Mounting index.html → Co-Work Canvas…", "info");
      setTimeout(() => mountWorkspaceFile(name + "/index.html"), 400);
      break;
    }

    case "clear":
    case "cls":
      if (vscTermLog) vscTermLog.innerHTML = "";
      break;

    case "echo":
      logToTerminal(arg);
      break;

    case "date":
      logToTerminal(new Date().toString());
      break;

    case "whoami":
      logToTerminal("vikrant");
      break;

    case "python":
    case "python3":
      if (arg === "-v" || arg === "--version") logToTerminal("Python 3.12.2", "success");
      else logToTerminal("Python 3.12.2 (main) [Clang 15.0.0] on linux");
      break;

    case "git":
      if (arg === "status") {
        logToTerminal("On branch main\nWorkspace: " + Object.keys(vscFiles).length + " file(s), " + vscDirs.length + " folder(s)\nnothing to commit, working tree clean", "success");
      } else {
        logToTerminal("git: '" + arg + "' is simulated in the JARVIK workspace.");
      }
      break;

    case "cowork":
      logToTerminal("Passing " + vscActiveFile + " to JARVIK AI Chat…", "success");
      setTimeout(() => sendVscToChat(), 300);
      break;

    default:
      logToTerminal("zsh: command not found: " + action + ". Type 'help' for commands.", "error");
  }
  updateTermPrompt();
}

function openVSCodeModal() {
  if (!vscodeModal) return;
  vscodeModal.classList.remove("hidden");
  renderVscFileTree();
  renderVscTabs();
  switchVscFile(vscActiveFile);
  sfx.play("mode");
  setTimeout(() => {
    if (vscCodeInput) vscCodeInput.focus();
  }, 100);
}

function closeVSCodeModal() {
  if (!vscodeModal) return;
  if (vscFiles[vscActiveFile] && vscCodeInput) {
    vscFiles[vscActiveFile].content = vscCodeInput.value;
  }
  vscodeModal.classList.add("hidden");
  sfx.play("click");
}

function toggleVscFullscreen() {
  vscIsMaximized = !vscIsMaximized;
  if (vscodeWindow) vscodeWindow.classList.toggle("vsc-maximized", vscIsMaximized);
  if (vscFullscreenBtn) vscFullscreenBtn.textContent = vscIsMaximized ? "❐" : "▢";
}

// Wire VS Code Events
if (vscCloseBtn) vscCloseBtn.onclick = closeVSCodeModal;
if (vscMinimizeBtn) vscMinimizeBtn.onclick = closeVSCodeModal;
if (vscFullscreenBtn) vscFullscreenBtn.onclick = toggleVscFullscreen;
if (vscNewFileBtn) vscNewFileBtn.onclick = createNewVscFile;
if (vscRefreshTreeBtn) vscRefreshTreeBtn.onclick = () => { renderVscFileTree(); renderVscTabs(); toast("🔄 Explorer refreshed"); };
if (vscRunCanvasBtn) vscRunCanvasBtn.onclick = runVscInCanvas;
if (vscSendChatBtn) vscSendChatBtn.onclick = sendVscToChat;
if (topbarVscBtn) topbarVscBtn.onclick = openVSCodeModal;
if (sbVscBtn) sbVscBtn.onclick = openVSCodeModal;

// Terminal Buttons
if (vscTermClearBtn) vscTermClearBtn.onclick = () => { if (vscTermLog) vscTermLog.innerHTML = ""; };
if (vscTermToggleBtn) vscTermToggleBtn.onclick = () => {
  if (vscTerminalPanel) {
    if (vscTerminalPanel.classList.contains("expanded")) {
      vscTerminalPanel.classList.remove("expanded");
    } else {
      vscTerminalPanel.classList.add("expanded");
    }
  }
};
if (vscTermCloseBtn) vscTermCloseBtn.onclick = () => {
  if (vscTerminalPanel) vscTerminalPanel.classList.toggle("collapsed");
};

// Terminal Input
if (vscTermInput) {
  vscTermInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      executeVscTerminal(vscTermInput.value);
      vscTermInput.value = "";
    } else if (e.key === "ArrowUp") {
      if (vscTermHistIdx > 0) {
        vscTermHistIdx--;
        vscTermInput.value = vscTerminalHistory[vscTermHistIdx] || "";
      }
    } else if (e.key === "ArrowDown") {
      if (vscTermHistIdx < vscTerminalHistory.length - 1) {
        vscTermHistIdx++;
        vscTermInput.value = vscTerminalHistory[vscTermHistIdx] || "";
      } else {
        vscTermHistIdx = vscTerminalHistory.length;
        vscTermInput.value = "";
      }
    }
  });
}

// Code Editor Input & Gutter Sync
if (vscCodeInput) {
  vscCodeInput.addEventListener("input", () => {
    updateVscGutter();
    if (vscFiles[vscActiveFile]) {
      vscFiles[vscActiveFile].content = vscCodeInput.value;
      saveWorkspaceSoon();
    }
  });

  vscCodeInput.addEventListener("scroll", () => {
    if (vscGutter) vscGutter.scrollTop = vscCodeInput.scrollTop;
  });

  vscCodeInput.addEventListener("keydown", e => {
    // Tab key inserts 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = vscCodeInput.selectionStart;
      const end = vscCodeInput.selectionEnd;
      vscCodeInput.value = vscCodeInput.value.substring(0, start) + "  " + vscCodeInput.value.substring(end);
      vscCodeInput.selectionStart = vscCodeInput.selectionEnd = start + 2;
      updateVscGutter();
    }
    // Ctrl+S / Cmd+S Saves File
    else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (vscFiles[vscActiveFile]) {
        vscFiles[vscActiveFile].content = vscCodeInput.value;
      }
      if (vscStatusMsg) {
        vscStatusMsg.textContent = `Saved ${vscActiveFile} at ${new Date().toLocaleTimeString()}`;
        setTimeout(() => { if (vscStatusMsg) vscStatusMsg.textContent = "JARVIK IDE Ready"; }, 2500);
      }
      sfx.play("save");
      toast(`💾 Saved ${vscActiveFile}`);
    }
    // Ctrl+Enter Runs in Canvas
    else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runVscInCanvas();
    }
  });

  // Track cursor position for status bar
  const updateCursorPos = () => {
    if (!vscLineCol || !vscCodeInput) return;
    const pos = vscCodeInput.selectionStart;
    const lines = vscCodeInput.value.substring(0, pos).split("\n");
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    vscLineCol.textContent = `Ln ${ln}, Col ${col}`;
  };
  vscCodeInput.addEventListener("keyup", updateCursorPos);
  vscCodeInput.addEventListener("click", updateCursorPos);
}


/* ═══════════════════════════════════════════════════════════════
   JARVIK IN-APP WEB BROWSER ENGINE (SURF THE PUBLIC INTERNET)
   ═══════════════════════════════════════════════════════════════ */
const browserModal      = $("browser-modal");
const browserWindow     = $("browser-window");
const brCloseBtn        = $("br-close-btn");
const brMinBtn          = $("br-min-btn");
const brFullBtn         = $("br-full-btn");
const brTabStrip        = $("br-tab-strip");
const brNewTabBtn       = $("br-new-tab-btn");
const brBackBtn         = $("br-back-btn");
const brForwardBtn      = $("br-forward-btn");
const brReloadBtn       = $("br-reload-btn");
const brHomeBtn         = $("br-home-btn");
const brOmniboxForm     = $("br-omnibox-form");
const brUrlInput        = $("br-url-input");
const brClearUrlBtn     = $("br-clear-url-btn");
const brAskJarvikBtn    = $("br-ask-jarvik-btn");
const brExternalBtn     = $("br-external-btn");
const brProgressBar     = $("br-progress-bar");
const brIframe          = $("br-iframe");
const topbarBrowserBtn  = $("topbar-browser-btn");
const sbBrowserBtn      = $("sb-browser-btn");

let browserTabs = [
  { id: "tab-1", title: "Wikipedia", url: "https://en.m.wikipedia.org/wiki/Main_Page", history: ["https://en.m.wikipedia.org/wiki/Main_Page"], histIdx: 0 }
];
let activeBrowserTabId = "tab-1";
let browserIsMaximized = false;

function getActiveBrowserTab() {
  return browserTabs.find(t => t.id === activeBrowserTabId) || browserTabs[0];
}

function renderBrowserTabs() {
  if (!brTabStrip) return;
  brTabStrip.innerHTML = "";
  browserTabs.forEach(tab => {
    const el = document.createElement("div");
    el.className = "br-tab" + (tab.id === activeBrowserTabId ? " active" : "");
    el.innerHTML = `
      <span class="br-tab-icon">🌐</span>
      <span class="br-tab-title">${esc(tab.title)}</span>
      <span class="br-tab-close" title="Close Tab">✕</span>
    `;
    el.onclick = e => {
      if (e.target.classList.contains("br-tab-close")) {
        e.stopPropagation();
        closeBrowserTab(tab.id);
      } else {
        switchBrowserTab(tab.id);
      }
    };
    brTabStrip.appendChild(el);
  });
}

function switchBrowserTab(tabId) {
  activeBrowserTabId = tabId;
  const tab = getActiveBrowserTab();
  if (!tab) return;
  if (brUrlInput) brUrlInput.value = tab.url;
  if (brIframe) brIframe.src = tab.url;
  updateBrowserNavButtons();
  renderBrowserTabs();
}

function createNewBrowserTab(initialUrl = "https://en.m.wikipedia.org/wiki/Main_Page") {
  const newId = "tab-" + Date.now();
  browserTabs.push({
    id: newId,
    title: "New Tab",
    url: initialUrl,
    history: [initialUrl],
    histIdx: 0
  });
  switchBrowserTab(newId);
  sfx.play("mode");
}

function closeBrowserTab(tabId) {
  if (browserTabs.length <= 1) {
    // Reset the single tab rather than closing completely
    browserTabs[0].url = "https://en.m.wikipedia.org/wiki/Main_Page";
    browserTabs[0].title = "Wikipedia";
    switchBrowserTab(browserTabs[0].id);
    return;
  }
  const idx = browserTabs.findIndex(t => t.id === tabId);
  browserTabs = browserTabs.filter(t => t.id !== tabId);
  if (activeBrowserTabId === tabId) {
    const nextTab = browserTabs[Math.max(0, idx - 1)];
    switchBrowserTab(nextTab.id);
  } else {
    renderBrowserTabs();
  }
}

function updateBrowserNavButtons() {
  const tab = getActiveBrowserTab();
  if (!tab) return;
  if (brBackBtn) brBackBtn.disabled = tab.histIdx <= 0;
  if (brForwardBtn) brForwardBtn.disabled = tab.histIdx >= tab.history.length - 1;
}

function navigateBrowser(target, pushHistory = true) {
  if (!target || !target.trim()) return;
  const raw = target.trim();
  let finalUrl = raw;

  // Smart URL parser
  if (/^https?:\/\//i.test(raw)) {
    finalUrl = raw;
  } else if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(raw)) {
    finalUrl = "https://" + raw;
  } else {
    // Search query fallback via DuckDuckGo
    finalUrl = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(raw);
  }

  const tab = getActiveBrowserTab();
  if (tab) {
    tab.url = finalUrl;
    // Derive nice tab title
    try {
      const u = new URL(finalUrl);
      tab.title = u.hostname.replace(/^www\./, "");
    } catch(e) {
      tab.title = "Browsing";
    }

    if (pushHistory) {
      if (tab.histIdx < tab.history.length - 1) {
        tab.history = tab.history.slice(0, tab.histIdx + 1);
      }
      tab.history.push(finalUrl);
      tab.histIdx = tab.history.length - 1;
    }
  }

  if (brUrlInput) brUrlInput.value = finalUrl;

  // Animated loading progress bar
  if (brProgressBar) {
    brProgressBar.classList.add("loading");
    brProgressBar.style.width = "40%";
  }

  if (brIframe) {
    brIframe.src = finalUrl;
    brIframe.onload = () => {
      if (brProgressBar) {
        brProgressBar.style.width = "100%";
        setTimeout(() => {
          brProgressBar.classList.remove("loading");
          brProgressBar.style.width = "0%";
        }, 300);
      }
    };
  }

  updateBrowserNavButtons();
  renderBrowserTabs();
}

function openBrowserModal(initialUrl) {
  if (!browserModal) return;
  browserModal.classList.remove("hidden");
  renderBrowserTabs();
  if (initialUrl) {
    navigateBrowser(initialUrl);
  } else {
    const tab = getActiveBrowserTab();
    if (tab && brIframe && !brIframe.src) {
      navigateBrowser(tab.url);
    }
  }
  sfx.play("mode");
  setTimeout(() => {
    if (brUrlInput) brUrlInput.focus();
  }, 100);
}

function closeBrowserModal() {
  if (!browserModal) return;
  browserModal.classList.add("hidden");
  sfx.play("click");
}

function toggleBrowserFullscreen() {
  browserIsMaximized = !browserIsMaximized;
  if (browserWindow) browserWindow.classList.toggle("br-maximized", browserIsMaximized);
}

/* Best-effort extraction of the live page text: the JARVIK iframe is
   cross-origin for most sites, so we can't always read the DOM. */
function tryReadPageFromIframe(maxLen) {
  maxLen = maxLen || 12000;
  try {
    const doc = brIframe && brIframe.contentDocument;
    if (!doc || !doc.body) return null;
    const t = (doc.body.innerText || "").slice(0, maxLen);
    return t && t.trim() ? t : null;
  } catch (e) { return null; }
}

function sendBrowserPageToJarvik() {
  const tab = getActiveBrowserTab();
  const url = tab ? tab.url : (brUrlInput ? brUrlInput.value : "");
  setAskJarvikBusy(true);
  let pageText;
  try { pageText = tryReadPageFromIframe(); }
  catch (e) { pageText = null; }
  setAskJarvikBusy(false);
  closeBrowserModal();
  ui.value = "";
  ui.focus();
  let msg;
  const firstLine = `I am currently studying this webpage: ${url}\n\n`;
  if (pageText) {
    msg = `${firstLine}\`\`\`page-text\n${pageText}\n\`\`\`\n\nPlease read the page content above and: summarize its core concepts, highlight key insights, and explain how we can leverage this in our project.`;
  } else {
    msg = `${firstLine}\nI could not extract the raw page text because the site blocks cross-origin embedding.\n\nInstead, please answer about THIS page based on what you know / can infer about ${url}: summarize its core concepts, highlight likely key insights, and suggest how we might leverage this in our project. Clearly note you could not read the live page.`;
  }
  ui.value = msg;
  grow(ui);
  toast(pageText ? `🎯 JARVIK can see the live page content!` : `🔗 Page URL sent (site blocks live reading)`);
}

function openInExternalBrowserWindow() {
  const tab = getActiveBrowserTab();
  const url = tab ? tab.url : (brUrlInput ? brUrlInput.value : "https://en.wikipedia.org");
  window.open(url, "_blank");
  toast("↗ Opened in new tab");
}

// Wire Browser Events
if (brCloseBtn) brCloseBtn.onclick = closeBrowserModal;
if (brMinBtn) brMinBtn.onclick = closeBrowserModal;
if (brFullBtn) brFullBtn.onclick = toggleBrowserFullscreen;
if (brNewTabBtn) brNewTabBtn.onclick = () => createNewBrowserTab();
if (topbarBrowserBtn) topbarBrowserBtn.onclick = () => openBrowserModal();
if (sbBrowserBtn) sbBrowserBtn.onclick = () => openBrowserModal();

if (brBackBtn) {
  brBackBtn.onclick = () => {
    const tab = getActiveBrowserTab();
    if (tab && tab.histIdx > 0) {
      tab.histIdx--;
      navigateBrowser(tab.history[tab.histIdx], false);
    }
  };
}
if (brForwardBtn) {
  brForwardBtn.onclick = () => {
    const tab = getActiveBrowserTab();
    if (tab && tab.histIdx < tab.history.length - 1) {
      tab.histIdx++;
      navigateBrowser(tab.history[tab.histIdx], false);
    }
  };
}
if (brReloadBtn) {
  brReloadBtn.onclick = () => {
    const tab = getActiveBrowserTab();
    if (tab) navigateBrowser(tab.url, false);
  };
}
if (brHomeBtn) {
  brHomeBtn.onclick = () => {
    navigateBrowser("https://en.m.wikipedia.org/wiki/Main_Page");
  };
}

if (brOmniboxForm) {
  brOmniboxForm.onsubmit = e => {
    e.preventDefault();
    if (brUrlInput) navigateBrowser(brUrlInput.value);
  };
}
if (brClearUrlBtn) {
  brClearUrlBtn.onclick = () => {
    if (brUrlInput) {
      brUrlInput.value = "";
      brUrlInput.focus();
    }
  };
}

if (brAskJarvikBtn) brAskJarvikBtn.onclick = sendBrowserPageToJarvik;
if (brExternalBtn) brExternalBtn.onclick = openInExternalBrowserWindow;

/* AI Browser — progress state while JARVIK reads the live page */
function setAskJarvikBusy(busy) {
  if (!brAskJarvikBtn) return;
  const span = brAskJarvikBtn.querySelector("span");
  const label = busy ? "JARVIK is reading…" : "💬 Ask JARVIK";
  brAskJarvikBtn.disabled = busy;
  if (span) span.textContent = busy ? "🌀 JARVIK is reading…" : "💬 Ask JARVIK";
  brAskJarvikBtn.classList.toggle("busy", busy);
}

// Bookmark Chips Quick Navigation
document.querySelectorAll(".br-bm-chip").forEach(chip => {
  chip.onclick = () => {
    const url = chip.dataset.url;
    if (url) {
      navigateBrowser(url);
      sfx.play("click");
    }
  };
});

// Global Keyboard Shortcuts (Ctrl+Shift+E for VS Code, Ctrl+Shift+B for Browser, Escape to close)
window.addEventListener("keydown", e => {
  // Check Ctrl+Shift+E or Alt+E for VS Code IDE
  if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") || (e.altKey && e.key.toLowerCase() === "e")) {
    e.preventDefault();
    if (vscodeModal && !vscodeModal.classList.contains("hidden")) {
      closeVSCodeModal();
    } else {
      openVSCodeModal();
    }
  }
  // Check Ctrl+Shift+B or Alt+B for Web Browser
  else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "b") || (e.altKey && e.key.toLowerCase() === "b")) {
    e.preventDefault();
    if (browserModal && !browserModal.classList.contains("hidden")) {
      closeBrowserModal();
    } else {
      openBrowserModal();
    }
  }
  // Escape to close modals
  else if (e.key === "Escape") {
    if (vscodeModal && !vscodeModal.classList.contains("hidden")) {
      closeVSCodeModal();
    }
    if (browserModal && !browserModal.classList.contains("hidden")) {
      closeBrowserModal();
    }
  }
});

/* Canvas file explorer: initial render + new-file button */
if ($("art-explorer-tree")) renderArtExplorer();
if ($("art-explorer-new")) $("art-explorer-new").onclick = () => {
  const name = prompt("New file name (e.g. app.js, notes.md):");
  if (!name || !name.trim()) return;
  const clean = name.trim().replace(/^\/+/, "");
  if (vscFiles[clean]) { openWorkspaceFile(clean); return; }
  termWrite(clean, "");
  saveWorkspaceSoon();
  refreshWorkspaceViews();
  openWorkspaceFile(clean);
  toast("📄 Created " + clean);
};

/* ═══ JARVIK-F18-SECTION: SPRINT BOARD ═══ */
/* ═══ END-F18 ═══ */

/* ═══ JARVIK-F19-SECTION: CANVAS NOTES PANE ═══ */
/* ═══ END-F19 ═══ */

/* ═══ JARVIK-F20-SECTION: CODE SANDBOX ═══ */
/* ═══ END-F20 ═══ */

/* ═══ JARVIK-F21-SECTION: MERMAID EDITOR ═══ */
/* ═══ END-F21 ═══ */

/* ═══ JARVIK-F22-SECTION: KATEX SCRATCHPAD ═══ */
/* ═══ END-F22 ═══ */

/* ═══ JARVIK-F23-SECTION: MARKDOWN EDITOR ═══ */
/* ═══ END-F23 ═══ */

/* ═══ JARVIK-F24-SECTION: EXPORT UPGRADE ═══ */
/* ═══ END-F24 ═══ */

/* ═══ JARVIK-F25-SECTION: TAGS & FOLDERS ═══ */
/* ═══ END-F25 ═══ */

/* ═══════════════════════════════════════════════════════════════
   JARVIK-VISUAL-ENGINE (2026-10-14)
   20 features: heartbeat, particles, parallax, eyes, ripples,
   page-flip, wallpaper, border-beats, scars, emotion ring,
   boot splash, achievements, command wheel, PWA chip, local
   badge, prompt orb, split personas, room replay, team voice.
   Every piece is defensive: wrapped, capability-checked, and
   disabled under prefers-reduced-motion where it moves.
   ═══════════════════════════════════════════════════════════ */
(function jbVisualEngine(){
  if (window.__jbEngine) return; window.__jbEngine = 1;
  const $id = document.getElementById.bind(document);
  const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(pointer: coarse)").matches;
  const hexA = (h, a) => { try { const n = parseInt(String(h).slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; } catch (e) { return `rgba(53,214,232,${a})`; } };
  window.jbHexA = hexA;
  const accent = () => getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#35d6e8";
  const accentSoft = () => getComputedStyle(document.body).getPropertyValue("--accent-soft").trim() || "rgba(53,214,232,.12)";

  /* ── 2. REACTOR HEARTBEAT: idle breathe / thinking fast-pulse / error flicker ── */
  let _pulseT = [];
  window.jbPulse = function (state) {
    _pulseT.forEach(clearTimeout); _pulseT = [];
    document.body.classList.remove("jb-idle", "jb-thinking", "jb-error");
    if (!state || state === "idle") { document.body.classList.add("jb-idle"); return; }
    document.body.classList.add(state === "error" ? "jb-error" : "jb-thinking");
    if (state === "error") _pulseT.push(setTimeout(() => { document.body.classList.remove("jb-error"); document.body.classList.add("jb-idle"); }, 2600));
  };
  document.body.classList.add("jb-idle");

  /* ── 3. TYPING PARTICLES: motes drift up from the stream cursor ── */
  let _motT = 0, _mot = [], _motRaf = 0;
  const motHost = document.createElement("div"); motHost.className = "jb-mot-host"; document.body.appendChild(motHost);
  window.jbParticlesSpawn = function (cursorEl) {
    if (rm() || !cursorEl || !cursorEl.isConnected || _mot.length > 26) return;
    const now = performance.now(); if (now - _motT < 90) return; _motT = now;
    const r = cursorEl.getBoundingClientRect();
    const el = document.createElement("div"); el.className = "jb-mote";
    el.style.left = (r.left + 4 + Math.random() * 6) + "px";
    el.style.top = (r.top + Math.random() * 8) + "px";
    el.style.background = accent();
    motHost.appendChild(el);
    _mot.push({ el, vy: 0.7 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.5, life: 1 });
    if (!_motRaf) motTick();
  };
  function motTick() {
    _motRaf = _mot.length ? requestAnimationFrame(motTick) : 0;
    for (let i = _mot.length - 1; i >= 0; i--) {
      const m = _mot[i];
      m.life -= 0.022; m.el._y0 = (m.el._y0 || parseFloat(m.el.style.top)) - m.vy; m.el._x0 = (m.el._x0 || parseFloat(m.el.style.left)) + m.vx + Math.sin((m.life * 9)) * 0.4;
      m.el.style.transform = `translate(${(m.el._x0 - parseFloat(m.el.style.left)).toFixed(1)}px,${(m.el._y0 - parseFloat(m.el.style.top)).toFixed(1)}px)`;
      m.el.style.opacity = Math.max(0, m.life).toFixed(2);
      if (m.life <= 0) { m.el.remove(); _mot.splice(i, 1); }
    }
  }
  window.jbParticlesStop = function () { _mot.forEach(m => m.el.remove()); _mot = []; };
  setInterval(() => { if (document.hidden) { window.jbParticlesStop(); } }, 4000);

  /* ── 5. BUTTON WATER RIPPLES: expanding ring from any click ── */
  function ripple(x, y) {
    if (rm()) return;
    const r = document.createElement("div"); r.className = "jb-water";
    r.style.left = x + "px"; r.style.top = y + "px";
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 620);
  }
  addEventListener("pointerdown", e => { if (!touch && e.button === 0) ripple(e.clientX, e.clientY); rippleQueue(e.clientX, e.clientY); }, { passive: true });

  /* ── 13. COMMAND WHEEL: hold right-click → radial actions around the cursor ── */
  const WHEEL_ENTRIES = [
    { i: "📝", t: "Summarize chat", fn: () => runWheelPrompt("Summarize this conversation concisely, key decisions and open threads:") },
    { i: "⚡", t: "Refactor code", fn: () => runWheelPrompt("Review the latest code in this chat and propose an improved refactor:") },
    { i: "🔍", t: "Explain", fn: () => runWheelPrompt("Explain the most recent technical answer in this chat step by step:") },
    { i: "🖼", t: "Generate image", fn: () => { const v = (document.getElementById("user-input") || {}).value || ""; if (v.trim()) { sendWheelValue("generate an image of " + v.slice(0, 120)); } else toast("Type an image idea first"); } },
    { i: "🧪", t: "Write tests", fn: () => runWheelPrompt("Write unit tests for the latest code shown in this chat:") },
    { i: "🗺", t: "Plan a roadmap", fn: () => runWheelPrompt("Turn the latest plan in this chat into a numbered roadmap:") }
  ];
  let _wheelHold = 0, _wheelEl = null, _wheelArmed = 0;
  function wheelOpen(x, y) {
    wheelClose();
    const w = document.createElement("div"); w.className = "jb-wheel"; w.style.left = x + "px"; w.style.top = y + "px";
    WHEEL_ENTRIES.forEach((en, k) => {
      const a = (k / WHEEL_ENTRIES.length) * Math.PI * 2 - Math.PI / 2;
      const b = document.createElement("button");
      b.className = "jb-wheel-item";
      b.style.setProperty("--wx", (Math.cos(a) * 86).toFixed(0) + "px");
      b.style.setProperty("--wy", (Math.sin(a) * 86).toFixed(0) + "px");
      b.style.setProperty("--wd", (k * 40) + "ms");
      b.title = en.t; b.textContent = en.i;
          b.onclick = ev => { ev.stopPropagation(); wheelClose(); try { window.jbAchWheel(); } catch (e) {} en.fn(); };
      w.appendChild(b);
    });
    document.body.appendChild(w); _wheelEl = w;
  }
  function wheelClose() { if (_wheelEl) { _wheelEl.remove(); _wheelEl = null; } }
  addEventListener("contextmenu", e => { if (_wheelEl) { e.preventDefault(); wheelClose(); } }, { passive: false });
  addEventListener("pointerdown", e => { if (e.button === 2 && !touch) { _wheelHold = setTimeout(() => { _wheelArmed = 1; wheelOpen(e.clientX, e.clientY); try { sfx.play("mode"); } catch (err) {} }, 260); } }, { passive: true });
  addEventListener("pointerup", () => { clearTimeout(_wheelHold); }, { passive: true });
  addEventListener("pointermove", e => { if (_wheelHold && !e.buttons) { clearTimeout(_wheelHold); } }, { passive: true });
  addEventListener("keydown", e => { if (e.key === "Escape" && _wheelEl) wheelClose(); });
  function runWheelPrompt(text) { const i = $id("user-input"); if (i) { i.value = text + "\n"; grow(i); i.focus(); toast("Prompt ready — press Enter"); } }
  function sendWheelValue(v) { const i = $id("user-input"); if (i) { i.value = v; try { send(); } catch (e) { toast(v); } } }

  /* ── 4. DEPTH PARALLAX + 10. EYES-FOLLOW: layers drift at different rates ── */
  if (!touch && !rm()) {
    let _pf = 0;
    addEventListener("pointermove", e => {
      if (_pf) return; _pf = requestAnimationFrame(() => {
        _pf = 0;
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        const side = $id("sidebar"), draw = $id("artifacts-drawer");
        if (side) side.style.setProperty("--jb-px", `translate(${(-nx * 7).toFixed(1)}px,${(-ny * 5).toFixed(1)}px)`);
        if (draw) draw.style.setProperty("--jb-px", `translate(${(nx * 9).toFixed(1)}px,${(ny * 6).toFixed(1)}px)`);
        document.querySelectorAll(".bav svg.reactor, .lp-logo svg.reactor, .esico svg.reactor").forEach(sv => {
          sv.style.transform = `translate(${(nx * 4).toFixed(1)}px,${(ny * 3).toFixed(1)}px)`;
        });
      });
    }, { passive: true });
  }

  /* ── 6. PAGE-FLIP: tilt-and-fade on conversation switch (powered by .jb-flip) ── */
  window.jbPageFlip = function () {
    if (rm()) return;
    cc.classList.remove("jb-flip"); void cc.offsetWidth; cc.classList.add("jb-flip");
    setTimeout(() => cc.classList.remove("jb-flip"), 480);
  };

  /* ── 17. LIVE WALLPAPER: activity-linked particle field behind the app ── */
  const wall = document.createElement("canvas"); wall.className = "jb-wall"; document.body.appendChild(wall);
  const wtx = wall.getContext("2d");
  let wallParts = [], wallEnergy = 0.35, wallOn = !rm() && !touch, wallRaf = 0, wallWHOS = 0;
  function wallSize() { wall.width = Math.min(innerWidth, 1600); wall.height = Math.min(innerHeight, 1000); }
  wallSize(); addEventListener("resize", wallSize, { passive: true });
  window.jbWallKick = function (amt) { wallEnergy = Math.min(1, wallEnergy + (amt || 0.2)); };
  function wallSeed() {
    const n = 26;
    wallParts = Array.from({ length: n }, () => ({ x: Math.random() * wall.width, y: Math.random() * wall.height, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, r: 0.8 + Math.random() * 1.7 }));
  }
  wallSeed();
  function wallTick() {
    wallRaf = wallOn && !document.hidden ? requestAnimationFrame(wallTick) : 0;
    if (!wallOn || document.hidden) return;
    wtx.clearRect(0, 0, wall.width, wall.height);
    const c = accent();
    wallEnergy = Math.max(0.3, wallEnergy * 0.995);
    const speed = 0.5 + wallEnergy * 1.6;
    for (const p of wallParts) {
      p.x = (p.x + p.vx * speed + wall.width) % wall.width; p.y = (p.y + p.vy * speed + wall.height) % wall.height;
      wtx.globalAlpha = 0.24 + wallEnergy * 0.3; wtx.fillStyle = c;
      wtx.beginPath(); wtx.arc(p.x, p.y, p.r * (1 + wallEnergy * 0.8), 0, 7); wtx.fill();
    }
    for (let i = 0; i < wallParts.length; i++) for (let j = i + 1; j < wallParts.length; j++) {
      const a = wallParts[i], b = wallParts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120) {
        wtx.globalAlpha = (1 - Math.sqrt(d2) / 120) * (0.07 + wallEnergy * 0.1); wtx.strokeStyle = c; wtx.lineWidth = 1;
        wtx.beginPath(); wtx.moveTo(a.x, a.y); wtx.lineTo(b.x, b.y); wtx.stroke();
      }
    }
    wtx.globalAlpha = 1;
  }
  wallTick();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && wallOn && !wallRaf) wallTick(); });
  addEventListener("pointermove", () => { const n = Date.now(); if (n - wallWHOS > 2200) { wallWHOS = n; window.jbWallKick(0.05); } }, { passive: true });

  /* ── 18. SOUND-REACTIVE BORDER BEATS: the frame dances to its own SFX ── */
  let _beatT = 0;
  window.jbBorderBeat = function () {
    clearInterval(_beatT); let n = 0;
    const app = $id("app"); if (!app || rm()) return;
    _beatT = setInterval(() => { app.classList.toggle("jb-beat", n++ % 2 === 0); if (n > 5) { clearInterval(_beatT); app.classList.remove("jb-beat"); } }, 130);
    window.jbWallKick(0.5);
  };
  const rippleQueue = (x, y) => { try { window.jbWallKick(0.12); } catch (e) {} };

  /* ── 19. SESSION SCARS: colored scrollbar ticks per message type ── */
  let _scarsHost = null;
  function scarsHost() {
    if (_scarsHost && _scarsHost.isConnected) return _scarsHost;
    _scarsHost = document.createElement("div"); _scarsHost.className = "jb-scars"; _scarsHost.id = "jb-scars"; document.body.appendChild(_scarsHost);
    return _scarsHost;
  }
  window.jbRenderScars = function () {
    const h = scarsHost(); h.innerHTML = "";
    if (!cc || !cc.clientHeight) return;
    const H = cc.scrollHeight, top = cc.getBoundingClientRect().top, visH = cc.clientHeight;
    cc.querySelectorAll(".mr.bot, .mr.user, pre").forEach(el => {
      const codes = el.matches("pre");
      const isUser = el.classList.contains("user");
      const off = el.offsetTop, p = Math.max(0, Math.min(1, off / Math.max(1, H - visH)));
      const tick = document.createElement("button");
      tick.className = "jb-scar" + (isUser ? " user" : "") + (codes ? " code" : "");
      tick.style.top = (top + p * (visH - 18)) + "px";
      tick.title = isUser ? "Your prompt" : codes ? "Code block" : "JARVIK reply";
      tick.onclick = () => { el.scrollIntoView({ block: "center" }); el.animate([{ outline: "2px solid " + accent(), outlineOffset: "3px" }, { outline: "none" }], { duration: 900 }); };
      h.appendChild(tick);
    });
  };
  let _scarT = 0; cc && cc.addEventListener && cc.addEventListener("scroll", () => { clearTimeout(_scarT); _scarT = setTimeout(window.jbRenderScars, 160); }, { passive: true });

  /* ── 20. EMOTION RING: avatar ring tinted by the last message's sentiment ── */
  const EMO = {
    happy: ["#4ade80", "#a3e635", "#34d399"],
    excited: ["#f472b6", "#fb923c", "#facc15"],
    code: ["#35d6e8", "#60a5fa", "#818cf8"],
    sad: ["#71717a", "#94a3b8", "#cbd5e1"],
    neutral: ["#35d6e8", "#0d8ea6", "#2563eb"]
  };
  function sentiment(txt) {
    const t = String(txt || "").toLowerCase();
    if (/\b(fail|error|broken|wrong|cannot|unable)\b/.test(t)) return "sad";
    if (/```|\bfunction\b|\bconst\b|\bclass\b|\bimport\b/.test(t)) return "code";
    if (/\b(amazing|love|perfect|great|awesome|🎉|🚀|🔥|✅|congrat)\b/.test(t)) return "excited";
    if (/\b(ok|done|sure|happy|nice|✓)\b/.test(t)) return "happy";
    return "neutral";
  }
  window.jbEmotionRing = function (pr) {
    document.body.classList.remove("emo-happy", "emo-excited", "emo-code", "emo-sad", "emo-neutral");
    const m = String((pr && pr.content) || "");
    const lastBot = (m.match(/mr bot[\s\S]{0,4000}?(?=mr user|mr bot|$)/g) || [m]).slice(-1)[0] || "";
    const s = sentiment(lastBot.slice(0, 3000));
    document.body.classList.add("emo-" + s);
    const pal = EMO[s]; document.documentElement.style.setProperty("--emo-1", pal[0]); document.documentElement.style.setProperty("--emo-2", pal[1]); document.documentElement.style.setProperty("--emo-3", pal[2]);
  };

  /* ── 12. DAILY BOOT SPLASH: once per calendar day ── */
  function bootSplash() {
    try {
      const k = "jarvik_boot"; const today = new Date().toDateString();
      let last = ""; try { last = localStorage.getItem(k) || ""; } catch (e) {}
      if (last === today || rm()) return;
      try { localStorage.setItem(k, today); } catch (e) {}
      const s = document.createElement("div"); s.className = "jb-splash";
      s.innerHTML = `<div class="jb-splash-in"><div class="jb-splash-logo">◈</div><div class="jb-splash-scan"></div><div class="jb-splash-txt">JARVIK <b>// SYSTEM ONLINE</b></div><div class="jb-splash-sub">initiating neural co-work…</div></div>`;
      document.body.appendChild(s);
      setTimeout(() => s.classList.add("gone"), 1350);
      setTimeout(() => s.remove(), 2000);
    } catch (e) {}
  }
  bootSplash();

  /* ── 14. LOCAL MODEL BADGE: Ollama detect → LOCAL ⚡ 0ms ── */
  async function checkOllama() {
    const mb = $id("model-badge"); if (!mb) return;
    try {
      const r = await fetch("http://localhost:11434/api/tags", { method: "GET", mode: "cors" });
      if (!r.ok) throw 0;
      const j = await r.json(); const n = (j.models || []).length;
      if (n) { mb.classList.add("jb-local"); mb.textContent = `LOCAL ⚡ ${n} model${n > 1 ? "s" : ""}`; mb.title = "Ollama detected locally — privacy flex: on"; }
    } catch (e) { /* not running — leave cloud badge alone */ }
  }
  checkOllama();

  /* ── 16. PWA INSTALL FLARE: custom chip + footer badge ── */
  let installEvt = null;
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; pwaChip(); });
  function pwaChip() {
    if ($id("jb-pwa")) return;
    const c = document.createElement("button"); c.id = "jb-pwa"; c.className = "jb-pwa";
    c.innerHTML = `⬇ Install JARVIK`;
    c.title = "Install as a desktop app — runs offline";
    c.onclick = async () => {
      if (installEvt) { installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); if (r && r.outcome === "accepted") toast("JARVIK installed ⚡"); installEvt = null; c.remove(); }
      else toast("Open browser menu → Install / Add to Home screen");
      try { sfx.play("complete"); } catch (e) {}
    };
    document.body.appendChild(c);
    const foot = $id("ihint");
    if (foot && !$id("jb-pwa-badge")) { const b = document.createElement("span"); b.id = "jb-pwa-badge"; b.className = "jb-pwa-badge"; b.textContent = "⚡ Installable"; foot.appendChild(b); }
  }
  addEventListener("online", () => toast("Back online ⚡"));
  addEventListener("offline", () => toast("Offline — everything still works locally"));

  /* ── 15. PROMPT PHYSICS: type ?? → inline orb answers at your cursor ── */
  (function promptOrb() {
    const i = $id("user-input"); if (!i) return;
    let _q = 0;
    i.addEventListener("input", () => {
      if (i.value.endsWith("??")) { i.value = i.value.slice(0, -2); _q = 1; orbShow(); }
      else if (_q && i.key !== "Backspace") { _q = i.value.includes("?") ? 1 : 0; }
    });
    function orbShow() {
      document.querySelectorAll(".jb-orb").forEach(o => o.remove());
      const host = document.createElement("div"); host.className = "jb-orb";
      host.innerHTML = `<div class="jb-orb-core"></div><div class="jb-orb-ui"><span class="jb-orb-q" contenteditable="true" spellcheck="false" data-ph="quick question…"></span><div class="jb-orb-btns"><button class="jb-orb-go">Ask ⚡</button><button class="jb-orb-no">✕</button></div></div>`;
      document.body.appendChild(host);
      const ins = host.querySelector(".jb-orb-q"); ins.focus();
      host.querySelector(".jb-orb-no").onclick = () => host.remove();
      host.querySelector(".jb-orb-go").onclick = orbGo;
      ins.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); orbGo(); } if (e.key === "Escape") host.remove(); });
    }
    async function orbGo() {
      const host = document.querySelector(".jb-orb"); if (!host) return;
      const q = (host.querySelector(".jb-orb-q").innerText || "").trim(); if (!q) return;
      const btn = host.querySelector(".jb-orb-go"); btn.textContent = "…"; btn.disabled = true;
      try {
        const r = await chatOnce([{ role: "user", content: "Answer in under 40 words, no preamble: " + q }]);
        host.querySelector(".jb-orb-q").innerText = String(r || "").trim();
        const done = host.querySelector(".jb-orb-btns"); done.innerHTML = `<button class="jb-orb-go jb-orb-ins">Insert ↵</button><button class="jb-orb-no">✕</button>`;
        done.querySelector(".jb-orb-ins").onclick = () => { const i2 = $id("user-input"); if (i2) { i2.value = (i2.value ? i2.value + " " : "") + String(r).trim(); grow(i2); } host.remove(); i2 && i2.focus(); };
        done.querySelector(".jb-orb-no").onclick = () => host.remove();
      } catch (e) { toast("Orb needs an API key (or demo mode)"); host.remove(); }
    }
  })();

  /* ── 11. ACHIEVEMENTS: stats + trophies + toasts ── */
  const JB_STAT_K = "jarvik_stats", JB_ACH_K = "jarvik_ach";
  const jbStatGet = () => { try { return JSON.parse(localStorage.getItem(JB_STAT_K)) || {}; } catch (e) { return {}; } };
  const jbStatSet = s => { try { localStorage.setItem(JB_STAT_K, JSON.stringify(s)); } catch (e) {} };
  window.jbStat = function (k, amt) { const s = jbStatGet(); s[k] = (s[k] || 0) + (amt || 1); jbStatSet(s); achCheck(); };
  const ACHS = [
    { id: "first_prompt", name: "First Words", desc: "Send your first prompt", test: s => (s.prompts || 0) >= 1, icon: "🌱" },
    { id: "hundred", name: "Century Club", desc: "100 prompts sent", test: s => (s.prompts || 0) >= 100, icon: "💯" },
    { id: "canvas", name: "Canvas Runner", desc: "Run your first artifact", test: s => (s.canvas || 0) >= 1, icon: "⚡" },
    { id: "owl", name: "Night Owl", desc: "Prompt after 2:00 AM", test: s => (s.night || 0) >= 1, icon: "🦉" },
    { id: "team", name: "Team Player", desc: "Join a Team Room", test: s => (s.team || 0) >= 1, icon: "👥" },
    { id: "voice", name: "Clear Speaker", desc: "Use voice input", test: s => (s.voice || 0) >= 1, icon: "🎙" },
    { id: "theme", name: "Decorator", desc: "Try all 7 themes", test: s => (s.themes || 0) >= 7, icon: "🎨" },
    { id: "wheel", name: "Wheel Master", desc: "Use the command wheel", test: s => (s.wheel || 0) >= 1, icon: "☸" }
  ];
  function achCheck() {
    const s = jbStatGet(), got = (() => { try { return JSON.parse(localStorage.getItem(JB_ACH_K)) || []; } catch (e) { return []; } })();
    ACHS.forEach(a => {    if (!got.includes(a.id) && a.test(s)) { got.push(a.id); try { localStorage.setItem(JB_ACH_K, JSON.stringify(got)); } catch (e) {} toast(a.icon + " Achievement unlocked: " + a.name); try { sfx.play("complete"); } catch (e) {} } });
    try { window._achUpd && window._achUpd(); } catch (e) {}
  }
  window.jbAchHour = function () { const s = jbStatGet(); if (new Date().getHours() >= 2 && new Date().getHours() < 5) window.jbStat("night"); };
  window.jbAchTeam = function () { window.jbStat("team"); };
  window.jbAchVoice = function () { window.jbStat("voice"); };
  window.jbAchWheel = function () { window.jbStat("wheel"); };
  window.jbAchTheme = function (id) { try { const seen = JSON.parse(localStorage.getItem("jarvik_themes_seen") || "[]"); if (!seen.includes(id)) { seen.push(id); localStorage.setItem("jarvik_themes_seen", JSON.stringify(seen)); } const s = jbStatGet(); s.themes = seen.length; jbStatSet(s); achCheck(); } catch (e) {} };
  achShowTrophy();
  function achShowTrophy() {
    const wrap = document.querySelector(".trow#sb-knowledge-btn");
    if (!wrap || $id("jb-ach-row")) return;
    const row = document.createElement("div"); row.id = "jb-ach-row"; row.className = "trow"; row.title = "Your achievements";
    row.innerHTML = `<svg viewBox="0 0 24 24" stroke-width="1.8" fill="none"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75l-3.25 2.5h-2.5L7.5 18.75m9-5.25V7.5a4.5 4.5 0 10-9 0V13.5m9-.75h2.25a2.25 2.25 0 002.25-2.25V8.25h-4.5M7.5 12.75H5.25A2.25 2.25 0 013 10.5V8.25h4.5"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25"/></svg>
      <span>Achievements <b id="jb-ach-count" class="badge-count">0/${ACHS.length}</b></span>`;
    wrap.after(row);
    row.onclick = showAchModal;
    window._achUpd = () => { try { const got = JSON.parse(localStorage.getItem(JB_ACH_K)) || []; const el = $id("jb-ach-count"); if (el) el.textContent = got.length + "/" + ACHS.length; } catch (e) {} };
    window._achUpd();
  }
  function showAchModal() {
    const got = (() => { try { return JSON.parse(localStorage.getItem(JB_ACH_K)) || []; } catch (e) { return []; } })();
    mb.innerHTML = `<div class="mp-title">Achievements</div><div class="mp-sub">${got.length} of ${ACHS.length} unlocked. Grind for glory.</div>
      <div class="theme-grid">${ACHS.map(a => `<div class="theme-card ach ${got.includes(a.id) ? "on" : ""}"><span class="theme-card-sw jb-ach-ic">${got.includes(a.id) ? a.icon : "🔒"}</span><span class="theme-card-name">${a.name}</span><span style="font-size:10.5px;color:var(--subtle)">${a.desc}</span></div>`).join("")}</div>`;
    modal.classList.remove("hidden");
  }

  /* ── 7. SPLIT-PERSONA TEAMS + 8. ROOM REPLAY + 9. TEAM VOICE ── */
  const TM_FIELDS = ["tm-share", "tm-replay", "tm-voice"];
  // Extend the team modal with three new toggles
  const _origShowTeam = window.showTeamModal;
  if (typeof _origShowTeam === "function") {
    window.showTeamModal = function () {
      _origShowTeam();
      const card = $id("tm-join-card");
      if (card && !$id("tm-share")) {
        const chips = card.querySelector(".tm-chips");
        const row = document.createElement("div"); row.className = "tm-team-x-row";
        row.innerHTML = `
          <label class="tm-x"><input type="checkbox" id="tm-share" checked> Shared brain (personas merge into one context)</label>
          <label class="tm-x"><input type="checkbox" id="tm-replay"> Record session for replay</label>
          <label class="tm-x"><input type="checkbox" id="tm-voice"> Broadcast my voice to the room</label>`;
        if (chips) card.insertBefore(row, chips); else card.appendChild(row);
      }
    };
  }
  // Extend team Offers: presence carries persona + streaming flag via tm-presence naturally
  let jbPersonaTag = null;
  window.jbTeamPersona = function () {
    const sel = $id("persona-select");
    if (sel && typeof tmSend === "function" && tmRoom) {
      jbPersonaTag = sel.value;
      tmSend({ t: "tm-presence", name: tmMe.name, color: tmMe.color, file: lcFile(), sel: lcSelOf(document.activeElement === artCodeEditor ? artCodeEditor : vscCodeInput) , persona: sel.value });
    }
  };
  const _psel = $id("persona-select");
  if (_psel) _psel.addEventListener("change", () => { try { window.jbTeamPersona(); } catch (e) {} });

  /* ── 7b. SHARED BRAIN: team turns merge into one thread's memory ── */
  // When tm-chat syncs a teammate's conversation, their last user turn rides along in the
  // shared memory so responses see both people's context. Handled at the tail below.

  /* ── 8. ROOM REPLAY: record snapshots → speed-scrub through the session ── */
  const JB_REPLAY_K = "jarvik_replay_";
  let _recTimer = 0, _recChat = "", _recOn = false;
  window.jbReplayToggle = function (on) {
    _recOn = !!on;
    clearInterval(_recTimer);
    if (_recOn) {
      _recChat = getCur();
      try { localStorage.setItem(JB_REPLAY_K + _recChat, JSON.stringify({ t: Date.now(), frames: [] })); } catch (e) {}
      _recTimer = setInterval(() => {
        try {
          const k = JB_REPLAY_K + _recChat;
          const d = JSON.parse(localStorage.getItem(k) || "[]") || { t: Date.now(), frames: [] };
          const html = cc.innerHTML;
          const f = d.frames || [];
          if (!f.length || f[f.length - 1].h !== html) { f.push({ ts: Date.now(), h: html }); if (f.length > 400) f.shift(); }
          d.frames = f; localStorage.setItem(k, JSON.stringify(d));
        } catch (e) {}
      }, 3000);
      toast("⏺ Session recording started");
    } else toast("⏹ Recording stopped");
  };
  window.jbReplayShow = function () {
    const k = JB_REPLAY_K + getCur();
    let d = null; try { d = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    const doToggle = () => { window.jbReplayToggle(!_recOn); };
    if (!d || !d.frames || d.frames.length < 2) {
      mb.innerHTML = `<div class="mp-title">Session Replay</div>
        <div class="mp-sub">No recording for this conversation yet. Toggle recording below, chat a bit, then come back.</div>
        <button id="jr-rec" class="hcta main">${_recOn ? "⏹ Stop recording" : "⏺ Start recording"}</button>`;
      modal.classList.remove("hidden");
      const b = $("jr-rec"); if (b) b.onclick = () => { doToggle(); modal.classList.add("hidden"); };
      return;
    }
    let idx = d.frames.length - 1, playing = false, _rp = 0;
    mb.innerHTML = `<div class="mp-title">Session Replay · ${d.frames.length} snapshots</div>
      <div class="jr-stage" id="jr-stage"></div>
      <div class="jr-ctl"><button id="jr-play" class="hcta main">▶ Play 4×</button><input id="jr-scrub" type="range" min="0" max="${d.frames.length - 1}" value="${d.frames.length - 1}" style="flex:1"><button id="jr-live" class="hcta sec">Back to live</button></div>`;
    modal.classList.remove("hidden");
    const st = $("jr-stage");
    const show = i => { if (st) st.innerHTML = d.frames[i].h; const sc = $("jr-scrub"); if (sc) sc.value = i; };
    show(idx);
    const scr = $("jr-scrub"); if (scr) scr.oninput = () => { playing = false; show(+scr.value); };
    const pb = $("jr-play");
    if (pb) pb.onclick = () => {
      playing = !playing; pb.textContent = playing ? "⏸ Pause" : "▶ Play 4×";
      if (playing) { idx = 0; show(idx); _rp = setInterval(() => { if (!playing || idx >= d.frames.length - 1) { playing = false; clearInterval(_rp); if (pb) pb.textContent = "▶ Play 4×"; return; } idx++; show(idx); }, 120); }
      else clearInterval(_rp);
    };
    const lb = $("jr-live"); if (lb) lb.onclick = () => { clearInterval(_rp); modal.classList.add("hidden"); loadChat(); };
  };
  // Wire recording toggles into the team modal checkboxes + a command-palette entry
  setTimeout(() => {
    const sr = $id("tm-replay");
    if (sr) sr.onchange = () => window.jbReplayToggle(sr.checked);
  }, 400);

  /* ── 9. TEAM VOICE: speak → broadcast transcript bubbles to the room ── */
  window.jbVoiceBubble = function (from, name, text, color) {
    document.querySelectorAll(".jb-vb").forEach(b => b.remove());
    const b = document.createElement("div"); b.className = "jb-vb";
    b.style.setProperty("--tm-c", color || "#4fc1ff");
    b.innerHTML = `<b>${esc(String(name || from).slice(0, 20))} · 🎙</b><span>${esc(String(text || "").slice(0, 220))}</span>`;
    document.body.appendChild(b);
    b._kill = setTimeout(() => b.remove(), 6500);
  };
  if (mic && !mic._jbV) {
    mic._jbV = 1;
    mic.addEventListener("click", () => {
      try { window.jbAchVoice(); } catch (e) {} // jbAchVoice already logs the "voice" stat
    });
  }
  window.jbVoiceBroadcast = function (text) {
    if (tmRoom && typeof tmSend === "function" && text) tmSend({ t: "tm-voice", name: tmMe.name, color: tmMe.color, text: String(text).slice(0, 220) });
  };

  /* ── Team message plumbing: extend tmOnData once with the new events ── */
  const _origOnData = window.tmOnData;
  if (typeof _origOnData === "function" && !window.__jbOnData) {
    window.__jbOnData = 1;
    window.tmOnData = function (m, from) {
      try {
        if (m && m.t === "tm-voice") { window.jbVoiceBubble(m.from || from, m.name, m.text, m.color); return; }
        if (m && m.t === "tm-presence" && m.persona) { const p0 = tmPeers[m.from]; if (p0) p0.persona = String(m.persona).slice(0, 24); }
      } catch (e) {}
      return _origOnData(m, from);
    };
  }
  // Hook voice capture into the existing mic flow: patch SpeechRecognition results broadcast
  const _origMicClick = mic ? mic.onclick : null;
  if (mic && _origMicClick && !mic._jbWired) {
    mic._jbWired = 1;
    mic.onclick = function (...args) {
      const before = ui ? ui.value : "";
      const r = _origMicClick.apply(this, args);
      setTimeout(() => { try { const gained = (ui.value || "").slice(before.length).trim(); if (gained) window.jbVoiceBroadcast(gained); } catch (e) {} }, 2600);
      return r;
    };
  }

  /* ── Achievement hooks for team + wheel + canvas ── */
  const _origTmRender = window.tmRender;
  let _teamCounted = false;
  if (typeof _origTmRender === "function" && !window.__jbAchTeam) {
    window.__jbAchTeam = 1;
    window.tmRender = function (...a) {
      if (tmRoom && !_teamCounted) { _teamCounted = true; try { window.jbStat("team"); } catch (e) {} }
      return _origTmRender.apply(this, a);
    };
  }
  if (typeof registerArtifact === "function" && !window.__jbAchCanvas) {
    window.__jbAchCanvas = 1;
    const _ra = registerArtifact;
    window.registerArtifact = function (...a) { try { window.jbStat("canvas"); } catch (e) {} return _ra.apply(this, a); };
  }
  /* Command palette entries for the new engines */
  try {
    (window.COMMANDS || []).push(
      { icon: "⏺", title: "Session Replay (record / watch)", tag: "Studio", action: () => window.jbReplayShow() },
      { icon: "🏆", title: "View Achievements", tag: "You", action: () => showAchModal() }
    );
  } catch (e) {}
})();

/* Stable workspace adapter: extension features receive text, core stores file metadata. */
window.jarvikWorkspace = Object.freeze({
  read() {
    if (vscFiles[vscActiveFile] && vscCodeInput && !vscodeModal.classList.contains('hidden'))
      vscFiles[vscActiveFile].content = vscCodeInput.value;
    return Object.fromEntries(Object.entries(vscFiles).map(([name, file]) => [name, typeof file === 'string' ? file : file.content || '']));
  },
  write(files, replace = false) {
    if (replace) vscFiles = {};
    for (const [name, value] of Object.entries(files || {})) {
      if (!name || /(^|\/)\.\.(\/|$)/.test(name) || ['__proto__','constructor','prototype'].includes(name)) continue;
      const content = typeof value === 'string' ? value : value && value.content;
      if (typeof content !== 'string') continue;
      vscFiles[name] = {content, lang:getFileLanguage(name), icon:getFileIcon(name)};
    }
    vscOpenTabs = vscOpenTabs.filter(name => vscFiles[name]);
    if (!vscFiles[vscActiveFile]) vscActiveFile = Object.keys(vscFiles)[0] || '';
    if (vscFiles[vscActiveFile] && vscCodeInput) vscCodeInput.value = vscFiles[vscActiveFile].content;
    saveWorkspace(); renderVscFileTree(); renderVscTabs();
    if (vscActiveFile) switchVscFile(vscActiveFile);
  }
});
