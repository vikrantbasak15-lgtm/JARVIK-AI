/* Shared browser primitives. No DOM wiring or feature state belongs here. */
(function (root) {
  'use strict';
  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(root.localStorage.getItem(key));
      if (value == null || (Array.isArray(fallback) && !Array.isArray(value))) return fallback;
      return value;
    } catch { return fallback; } // Keep original stored bytes available for recovery.
  }
  function sanitize(html) {
    if (!root.DOMPurify) throw new Error('HTML sanitizer failed to load. Reload the application.');
    return root.DOMPurify.sanitize(html, { ADD_ATTR: ['target'], FORBID_TAGS: ['style','iframe','object','embed'], FORBID_ATTR:['srcdoc'] });
  }
  function markdown(text) {
    const value = String(text || '');
    if (root.marked) return sanitize(root.marked.parse(value));
    return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).replace(/\n/g,'<br>');
  }
  // Consume final unterminated events too; don't discard partial UTF-8 chunks.
  async function readEventStream(body, onEvent) {
    if (!body) throw new Error('The provider returned an empty response body.');
    const reader = body.getReader(), decoder = new TextDecoder();
    let buffer = '', stopped = false;
    const line = raw => {
      const value = raw.trim();
      if (!value.startsWith('data:')) return;
      const data = value.slice(5).trim();
      if (data === '[DONE]') { stopped = true; return; }
      if (!data) return;
      let parsed;
      try { parsed = JSON.parse(data); } catch { return; }
      onEvent(parsed);
    };
    try {
      while (!stopped) {
        const part = await reader.read();
        buffer += decoder.decode(part.value, {stream:!part.done});
        const lines = buffer.split('\n'); buffer = lines.pop();
        for (const raw of lines) { line(raw); if(stopped) break; }
        if (part.done) { if(buffer && !stopped)line(buffer); break; }
      }
    } finally { if(stopped)await reader.cancel().catch(()=>{}); reader.releaseLock(); }
  }
  root.JarvikRuntime = Object.freeze({readJSON,sanitize,markdown,readEventStream});
})(globalThis);
