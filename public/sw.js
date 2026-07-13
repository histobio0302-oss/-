/* 의약품 안전정보 포털 — Service Worker (PWA 오프라인)
 * 캐시 전략:
 *   - 앱 셸/정적 아이콘 : cache-first (설치 시 프리캐시)
 *   - 네비게이션(문서)  : network-first → 오프라인 시 캐시된 셸
 *   - 대형 색인 JSON    : stale-while-revalidate (오프라인 약 검색)
 *   - /api/*           : network-only (실시간 데이터 — CDN이 캐싱)
 */
const CACHE_VERSION = 'v1-20260713';
const SHELL_CACHE = 'shell-' + CACHE_VERSION;
const DATA_CACHE = 'data-' + CACHE_VERSION;

const SHELL_ASSETS = [
  '/', '/manifest.json',
  '/icons/icon-192.png', '/icons/icon-512.png',
  '/icons/maskable-512.png', '/icons/apple-touch-icon.png'
];
const DATA_PATHS = ['/ingr-index.json', '/gnl-index.json', '/price-changes.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => Promise.allSettled(SHELL_ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isDataPath(url) { return DATA_PATHS.some((p) => url.pathname === p); }

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // 외부 오리진 통과
  if (url.pathname.startsWith('/api/')) return;          // 실시간 API — 네트워크

  if (isDataPath(url)) {                                 // 색인 — SWR
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (req.mode === 'navigate') {                         // 문서 — network-first
    event.respondWith(
      fetch(req).catch(() => caches.match('/').then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(                                     // 정적자원 — cache-first
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });
