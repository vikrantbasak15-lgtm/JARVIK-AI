/* Presentation enhancements. Loaded last; does not own application data. */
/* Compact toolbar. Move original controls so their listeners and state survive. */
(() => {
  function compactToolbar() {
    const bar = document.querySelector('.topbar');
    if (!bar || document.getElementById('toolbar-more')) return;
    const right = bar.querySelector('.tbr');
    const trigger = document.createElement('button');
    trigger.id = 'toolbar-more'; trigger.type = 'button'; trigger.textContent = '⋯';
    trigger.title = 'More tools'; trigger.setAttribute('aria-label', 'More tools');
    trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', 'toolbar-menu');
    const menu = document.createElement('div'); menu.id = 'toolbar-menu'; menu.hidden = true;
    menu.setAttribute('role', 'group'); menu.setAttribute('aria-label', 'Workspace tools');
    right.appendChild(trigger); bar.appendChild(menu);
    const labels = {'cmd-trigger':'Commands · Ctrl+K','ts-toggle':'Find in conversation','fm-toggle':'Focus mode','oo-flush':'Send queued prompts','ua-btn':'Usage analytics'};
    const ids = ['jv-boost-top','jv-pro-top','sprint-toggle-btn','topbar-vscode-btn','topbar-browser-btn','cmd-trigger','ts-toggle','fm-toggle','oo-flush','ua-btn','tm-top'];
    function gather() {
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.parentElement === menu) return;
        if (labels[id] && !el.dataset.compactLabel) {
          if (id === 'oo-flush') { el.firstChild.textContent = 'Send queued prompts · '; }
          else el.textContent = labels[id];
          el.dataset.compactLabel = '1';
        }
        menu.appendChild(el);
      });
    }
    const voice = bar.querySelector('button[title="Launch Hands-free JARVIK Voice HUD"]');
    if (voice) { voice.textContent = 'Voice mode'; menu.appendChild(voice); }
    const canvasLabel = bar.querySelector('#cowork-toggle-btn > span:last-child');
    if (canvasLabel) canvasLabel.textContent = 'Canvas';
    gather();
    new MutationObserver(gather).observe(bar, {childList:true,subtree:true});
    function close(restore) { menu.hidden = true; trigger.setAttribute('aria-expanded','false'); if (restore) trigger.focus(); }
    trigger.onclick = () => { const open = menu.hidden; menu.hidden = !open; trigger.setAttribute('aria-expanded',String(open)); };
    trigger.onkeydown = e => { if(e.key === 'ArrowDown') {e.preventDefault();menu.hidden=false;trigger.setAttribute('aria-expanded','true');menu.querySelector('button')?.focus();} };
    menu.addEventListener('click', e => { if(e.target.closest('button')) close(false); });
    document.addEventListener('pointerdown', e => { if(!menu.hidden && !menu.contains(e.target) && !trigger.contains(e.target)) close(false); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && !menu.hidden) {e.preventDefault();close(true);} });
    menu.addEventListener('focusout', () => setTimeout(() => {if(!menu.contains(document.activeElement) && document.activeElement !== trigger) close(false);},0));
    const model = document.getElementById('model-badge');
    if(model) { model.tabIndex=0;model.setAttribute('role','button');model.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();model.click();}}; }
    // Model selection remains available on phones through the same existing action.
    const modelShortcut = document.createElement('button'); modelShortcut.type='button';modelShortcut.textContent='Choose AI model';modelShortcut.onclick=()=>model?.click();menu.prepend(modelShortcut);
    bar.querySelectorAll('button').forEach(b=>{if(!b.getAttribute('aria-label') && b.title)b.setAttribute('aria-label',b.title);});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(compactToolbar,0));
  else setTimeout(compactToolbar,0);
})();

/* Keep optional controls accessible without crowding the conversation. */
(() => {
  function refineConversation() {
    const composer = document.querySelector('.ia');
    const tools = document.getElementById('jv-compbar');
    if (composer && tools && !tools.closest('.composer-options')) {
      const fold = document.createElement('details'); fold.className = 'composer-options';
      const title = document.createElement('summary'); title.textContent = 'Workflow & voice settings';
      fold.appendChild(title); composer.appendChild(fold); fold.appendChild(tools);
    }
    const input = document.getElementById('user-input');
    if (input) { input.placeholder = 'Message JARVIK…'; input.setAttribute('aria-label','Message JARVIK'); }
    const hint = document.querySelector('.ia .ihint');
    if (hint) hint.textContent = 'Enter to send · Shift+Enter for a new line · / for commands';
    const chat = document.getElementById('chat-container'); if(!chat) return;
    let queued = false;
    function tidy() {
      queued = false;
      chat.querySelectorAll('.mr.bot .msg-actions').forEach(bar => {
        const extras = Array.from(bar.querySelectorAll(':scope > .jv-chip, :scope > .act-compare, :scope > .msg-metrics'));
        if(!extras.length) return;
        let fold = bar.querySelector('.reply-tools');
        if(!fold) {
          fold = document.createElement('details'); fold.className='reply-tools';
          fold.innerHTML='<summary>More ways to use this answer</summary><div class="reply-tools-items"></div>';
          bar.appendChild(fold);
        }
        const holder = fold.querySelector('.reply-tools-items'); extras.forEach(el=>holder.appendChild(el));
      });
    }
    new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(tidy);}}).observe(chat,{childList:true,subtree:true});
    tidy();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(refineConversation,0));
  else setTimeout(refineConversation,0);
})();

/* Decorative feature labels; preserve button contents, counters and listeners. */
(() => {
 const icons = {'sb-cowork-btn':'🎨','sb-vscode-btn':'💻','sb-browser-btn':'🌐','sb-knowledge-btn':'📚','tm-open-btn':'👥','ua-side-btn':'📊','settings-btn':'⚙️','sb-home-btn':'🏠','mic-btn':'🎙️','sprint-toggle-btn':'🗺️','topbar-vscode-btn':'💻','topbar-browser-btn':'🌐','cmd-trigger':'⌨️','ts-toggle':'🔎','fm-toggle':'🎯','ua-btn':'📊'};
 function decorate() {
  Object.entries(icons).forEach(([id,emoji])=>{
   const el=document.getElementById(id);if(!el||el.querySelector(':scope > .feature-emoji'))return;
   const icon=document.createElement('span');icon.className='feature-emoji';icon.textContent=emoji;icon.setAttribute('aria-hidden','true');el.dataset.featureEmoji='1';el.prepend(icon);
  });
 }
 function init(){ decorate(); const bar=document.querySelector('.topbar'); if(bar)new MutationObserver(decorate).observe(bar,{childList:true,subtree:true}); }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,20));else setTimeout(init,20);
})();
