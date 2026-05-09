/* RaushanSYNC Learning Platform PWA Service Worker */
const CACHE_VERSION = 'app-v1.1.2.3.4.2';  // Generic version for cross-site use
const CORE_CACHE = 'rs-core-' + CACHE_VERSION;
const RUNTIME_CACHE = 'rs-runtime-' + CACHE_VERSION;
const OFFLINE_URL = '/offline/';
const MAX_RUNTIME_ENTRIES = 60;

const SENSITIVE_DOCUMENT_PATHS = new Set([
  '/login',
  '/signup',
  '/dashboard',
  '/password-reset',
  '/reset-confirmation'
]);

function normalizePathname(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function matchesPathPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

const CORE_ASSETS = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/script.js',
  '/assets/js/homepage-hero.js',
  '/ai-chat.js',
  '/components/nav.html',
  '/components/footer.html',
  '/components/support-cta.html',
  '/favicon.ico',
  '/favicon-48x48.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/about/',
  '/class06/',
  '/class07/',
  '/class08/',
  '/class09/',
  '/class10/',
  '/class11/',
  '/class12/'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

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

function isProtectedRoute(pathname) {
  return matchesPathPrefix(pathname, '/practice') || matchesPathPrefix(pathname, '/practice-advanced');
}

function isSensitiveDocumentPath(pathname) {
  const normalizedPath = normalizePathname(pathname);
  return SENSITIVE_DOCUMENT_PATHS.has(normalizedPath) || isProtectedRoute(normalizedPath);
}

function isNotesOrPractice(pathname) {
  return matchesPathPrefix(pathname, '/notes')
    || matchesPathPrefix(pathname, '/practice')
    || matchesPathPrefix(pathname, '/practice-advanced')
    || matchesPathPrefix(pathname, '/practice-solution')
    || matchesPathPrefix(pathname, '/video-lessons');
}

function isComponent(pathname) {
  return matchesPathPrefix(pathname, '/components');
}

function isStaticAsset(request, pathname) {
  if (pathname.startsWith('/assets/')) return true;
  if (request.destination) {
    return ['style', 'script', 'image', 'font'].includes(request.destination);
  }
  return false;
}

function shouldCacheResponse(response) {
  return response && response.status === 200 && response.type === 'basic';
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await cache.delete(keys[0]);
  if (keys.length - 1 > maxEntries) {
    return trimCache(cacheName, maxEntries);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
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
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.destination === 'document') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw error;
  }
}

async function networkOnlyDocument(request) {
  try {
    return await fetch(request, { cache: 'no-store' });
  } catch (error) {
    // Try to serve offline page first
    const offline = await caches.match(OFFLINE_URL);
    if (offline) {
      return offline;
    }
    
    // Log error with context for debugging
    console.error(`Service Worker: Failed to fetch document at ${request.url}`, error);
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const pathname = normalizePathname(url.pathname);

  if (request.mode === 'navigate' || request.destination === 'document') {
    if (isSensitiveDocumentPath(pathname)) {
      event.respondWith(networkOnlyDocument(request));
      return;
    }

    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(request, pathname) || isComponent(pathname) || isNotesOrPractice(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

// needed to add offline urls after refactor. add screenshots in manifest.json.
