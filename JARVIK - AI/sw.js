/* JARVIK app shell: update on reconnect, retain an offline fallback. */
const C = 'jarvik-v24';
const A = ['./','index.html','style.css','extras.css','power.css','power2.css','power4.css','power5.css','power5b.css','script.js','extras.js','power.js','power2.js','agents.js','studio.js','engage.js','ui.js','power5.js','power5b.js','console.js','runtime.js','workspace.css','console.css','vendor/marked.min.js','vendor/purify.min.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(C).then(cache => cache.addAll(A)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('jarvik-') && key !== C).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(C);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (_) {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      if (event.request.mode === 'navigate') return (await cache.match('./')) || Response.error();
      return Response.error();
    }
  })());
});
