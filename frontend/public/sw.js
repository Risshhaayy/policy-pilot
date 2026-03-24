const CACHE_NAME = 'policypilot-v10-nc'; // bump this to bust old caches instantly
const STATIC_ASSETS = [
    '/manifest.json',
];

// Install: cache only manifest (NOT the app shell — Vite handles JS/CSS versioning)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).catch(() => { }) // don't block install on cache failure
    );
    self.skipWaiting(); // activate immediately
});

// Activate: delete ALL old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.map((k) => caches.delete(k))) // ← delete ALL, including current
        ).then(() => {
            return caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => { }));
        })
    );
    self.clients.claim();
});

// Fetch: NETWORK-FIRST for everything — always get the latest
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET and chrome-extension requests
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) return;

    // API calls: network only (with offline JSON fallback)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(
                    JSON.stringify({ offline: true, error: 'You are offline.' }),
                    { headers: { 'Content-Type': 'application/json' }, status: 503 }
                )
            )
        );
        return;
    }

    // Everything else: NETWORK-FIRST (always fetch latest JS/CSS/HTML from Vite)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses for non-JS/CSS (manifest etc.)
                if (response.ok && !url.pathname.match(/\.(js|jsx|ts|tsx|css)$/)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Offline fallback: try cache, then index.html
                return caches.match(event.request)
                    .then((cached) => cached || caches.match('/index.html'));
            })
    );
});



// Background Sync: submit queued forms when back online
self.addEventListener('sync', (event) => {
    if (event.tag === 'submit-queued-forms') {
        event.waitUntil(submitQueuedForms());
    }
});

async function submitQueuedForms() {
    // Open IndexedDB and get queued forms
    const db = await openDB();
    const tx = db.transaction('offlineQueue', 'readonly');
    const store = tx.objectStore('offlineQueue');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
            const items = request.result || [];
            for (const item of items) {
                try {
                    const res = await fetch('/api/form/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.data),
                    });
                    if (res.ok) {
                        // Remove from queue
                        const delTx = db.transaction('offlineQueue', 'readwrite');
                        delTx.objectStore('offlineQueue').delete(item.id);
                    }
                } catch (e) {
                    console.log('[SW] Sync failed for item', item.id);
                }
            }
            // Notify all clients
            const clients = await self.clients.matchAll();
            clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETE' }));
            resolve();
        };
        request.onerror = reject;
    });
}

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('PolicyPilotDB', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('offlineQueue')) {
                db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('cachedResults')) {
                db.createObjectStore('cachedResults', { keyPath: 'key' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
