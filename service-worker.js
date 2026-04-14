/* RaushanSYNC Computer Science & Data Science PWA Service Worker */

const APP_VERSION = '2026.04.14.2';
const CACHE_VERSION = 'csds-v' + APP_VERSION;
const CORE_CACHE = 'rs-core-' + CACHE_VERSION;
const RUNTIME_CACHE = 'rs-runtime-' + CACHE_VERSION;

const OFFLINE_URL = '/offline.html';
const MAX_RUNTIME_ENTRIES = 60;

/* ---------- Core assets (stable + intentional) ---------- */
const CORE_ASSETS = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/manifest.json',

  '/assets/css/style.css',
  '/assets/js/script.js',

  '/components/nav.html',
  '/components/footer.html',
  '/components/support-cta.html',

  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',

  '/about/',
  '/about/index.html',

  '/computer-science/',
  '/computer-science/index.html',
  '/computer-science/python/',
  '/computer-science/sql/',
  '/computer-science/sql/index.html',
  '/computer-science/sql/01-postgresql-foundations/',
  '/computer-science/sql/02-your-first-queries/',
  '/computer-science/sql/03-filtering-and-conditions/',
  '/computer-science/sql/04-intermediate-sql/',
  '/computer-science/sql/04-intermediate-sql/index.html',
  '/computer-science/python/01-programming-foundations/',
  '/data-science/',
  '/data-science/index.html',

  '/class11/',
  '/class11/index.html',
  '/class12/',
  '/class12/index.html'
];

/* ---------- Install ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

/* ---------- Activate ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => ![CORE_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------- Path classifiers ---------- */
function isNotesOrPractice(pathname) {
  return pathname.startsWith('/notes/')
    || pathname.startsWith('/questions/')
    || pathname.startsWith('/projects/');
}

function isComponent(pathname) {
  return pathname.startsWith('/components/');
}

function isStaticAsset(request, pathname) {
  if (pathname.startsWith('/assets/')) return true;
  if (request.destination) {
    return ['style', 'script', 'image', 'font', 'audio', 'video'].includes(request.destination);
  }
  return false;
}

function shouldCacheResponse(response) {
  return response && response.status === 200 && response.type === 'basic';
}

/* ---------- Cache size control ---------- */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await cache.delete(keys[0]);
  if (keys.length - 1 > maxEntries) {
    return trimCache(cacheName, maxEntries);
  }
}

async function matchCachedRequest(request) {
  return caches.match(request);
}

/* ---------- Strategies ---------- */
async function cacheFirst(request) {
  const cached = await matchCachedRequest(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (shouldCacheResponse(response)) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
      trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
    }
    return response;
  } catch (error) {
    if (request.destination === 'document') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (shouldCacheResponse(response)) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
      trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
    }
    return response;
  } catch (error) {
    const cached = await matchCachedRequest(request);
    if (cached) return cached;

    if (request.destination === 'document') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw error;
  }
}

/* ---------- Fetch routing ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const pathname = url.pathname;
  if (pathname === '/service-worker.js') return;

  if (
    isStaticAsset(request, pathname) ||
    isComponent(pathname) ||
    isNotesOrPractice(pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
