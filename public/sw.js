// Service Worker v1.3.2 - Safer SPA caching
// Precaches app shell for offline support

const CACHE_NAME = 'creator-armour-v6';
const STATIC_CACHE = 'creator-armour-static-v6';
const IMAGE_CACHE = 'creator-armour-images-v6';
const FONT_CACHE = 'creator-armour-fonts-v6';

// Files to precache for offline
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently ignore if precache fails
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('creator-armour-') && k !== STATIC_CACHE && k !== IMAGE_CACHE && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for images, stale-while-revalidate for static, network-only for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache API only supports http(s). Extensions can inject chrome-extension:// requests.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Never cache API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Never cache Supabase auth requests
  if (url.hostname.includes('supabase.co') || url.hostname.includes('onrender.com')) {
    return;
  }

  // Let the browser handle external font provider requests.
  // If the SW fetches these, it is governed by `connect-src` CSP and can be blocked.
  if (url.hostname === 'cdn.fontshare.com' || url.hostname === 'api.fontshare.com') {
    return;
  }

  // Let the browser handle external avatar generation (DiceBear).
  // Service-worker fetches can be blocked by CSP (`connect-src`) depending on environment.
  if (url.hostname === 'api.dicebear.com') {
    return;
  }

  // Let the browser handle hashed build assets directly.
  // Caching these in the SW can pin stale chunk URLs across deploys and cause
  // "module script served as text/html" failures when index.html updates first.
  if (url.pathname.startsWith('/assets/')) {
    return;
  }

  // Cache-first for images
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => new Response('', { status: 408 }));
        })
      )
    );
    return;
  }

  // Cache-first for fonts
  if (request.destination === 'font') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => new Response('', { status: 408 }));
        })
      )
    );
    return;
  }

  // Network-first for navigations so new deploys pick up the latest index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return response;
        })
        .catch(() =>
          caches.open(STATIC_CACHE).then((cache) => cache.match('/index.html')).then((cached) => cached || new Response('', { status: 408 }))
        )
    );
    return;
  }

  // Stale-while-revalidate for everything else (static assets, pages)
  event.respondWith(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok && request.method === 'GET') {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached || new Response('', { status: 408 }));
        return cached || fetchPromise;
      })
    )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let payload = {
    title: 'New Brand Offer',
    body: 'A brand wants to collaborate with you.',
    url: '/creator-dashboard?tab=deals&subtab=pending',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'brand-offer',
    requireInteraction: true,
    silent: false,
  };

  try {
    const parsed = event.data?.json();
    if (parsed && typeof parsed === 'object') {
      payload = {
        ...payload,
        ...parsed,
        title: parsed.title || payload.title,
        body: parsed.body || payload.body,
        url: parsed.url || payload.url,
        tag: parsed.requestId ? `collab-request-${parsed.requestId}` : payload.tag,
      };
    }
  } catch (e) {
    // Use defaults
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    requireInteraction: payload.requireInteraction,
    silent: payload.silent,
    vibrate: [200, 100, 200, 100, 200],
    data: { url: payload.url, requestId: payload.requestId, timestamp: Date.now() },
    actions: [
      { action: 'view', title: 'View Offer', icon: '/icon-192x192.png' },
      { action: 'dismiss', title: 'Later' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const targetUrl = event.notification?.data?.url || '/creator-dashboard?tab=deals&subtab=pending';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      return clients.openWindow ? clients.openWindow(targetUrl) : undefined;
    })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
