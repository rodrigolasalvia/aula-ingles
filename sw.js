// Service worker: app disponível offline.
// Código e visual: cache primeiro (versão nova só com o botão "Atualizar").
// Lições (pasta data/): rede primeiro, para lições novas aparecerem sem atualizar o app; cache como reserva offline.
// Ao publicar mudança de código, aumente CACHE_VERSION (igual a APP_VERSION em js/core.js).
const CACHE_VERSION = '1.0.0';
const CACHE = `aula-ingles-${CACHE_VERSION}`;
const DATA = 'aula-ingles-data';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/app.js', 'js/core.js', 'js/storage.js',
  'fonts/AtkinsonHyperlegible-Regular.woff2', 'fonts/AtkinsonHyperlegible-Bold.woff2', 'fonts/BricolageGrotesque.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ASSETS);
    // Pré-carrega as lições publicadas para uso offline (falha aqui não impede a instalação).
    try {
      const d = await caches.open(DATA);
      const res = await fetch('data/lessons.json', { cache: 'no-cache' });
      if (res.ok) {
        await d.put('data/lessons.json', res.clone());
        const { lessons = [] } = await res.json();
        await Promise.all(lessons.map(l => fetch(l.file, { cache: 'no-cache' }).then(r => r.ok && d.put(l.file, r))));
      }
    } catch { /* offline na instalação */ }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('aula-ingles-') && k !== CACHE && k !== DATA).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const isData = url.pathname.includes('/data/') && url.pathname.endsWith('.json');
  if (isData) {
    event.respondWith((async () => {
      const d = await caches.open(DATA);
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res.ok) d.put(req, res.clone());
        return res;
      } catch (e) {
        const hit = await d.match(req, { ignoreSearch: true });
        if (hit) return hit;
        throw e;
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      return await fetch(req);
    } catch (e) {
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      throw e;
    }
  })());
});
