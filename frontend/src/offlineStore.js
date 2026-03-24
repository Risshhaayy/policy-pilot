/**
 * PolicyPilot Offline Store — IndexedDB helper for offline-first features
 */

const DB_NAME = 'PolicyPilotDB';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('offlineQueue')) {
                db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('cachedResults')) {
                db.createObjectStore('cachedResults', { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains('uploadedDocs')) {
                db.createObjectStore('uploadedDocs', { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ── Offline Form Queue ──

export async function addToQueue(formData) {
    const db = await openDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    tx.objectStore('offlineQueue').add({
        data: formData,
        timestamp: Date.now(),
        status: 'pending',
    });
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

export async function getQueue() {
    const db = await openDB();
    const tx = db.transaction('offlineQueue', 'readonly');
    const req = tx.objectStore('offlineQueue').getAll();
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

export async function removeFromQueue(id) {
    const db = await openDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    tx.objectStore('offlineQueue').delete(id);
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

export async function clearQueue() {
    const db = await openDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    tx.objectStore('offlineQueue').clear();
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

// ── Cached Results ──

export async function cacheResult(key, data) {
    const db = await openDB();
    const tx = db.transaction('cachedResults', 'readwrite');
    tx.objectStore('cachedResults').put({ key, data, timestamp: Date.now() });
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

export async function getCachedResult(key) {
    const db = await openDB();
    const tx = db.transaction('cachedResults', 'readonly');
    const req = tx.objectStore('cachedResults').get(key);
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result?.data || null);
        req.onerror = () => reject(req.error);
    });
}

// ── Manual Sync (for when Background Sync isn't available) ──

export async function syncQueuedForms() {
    const queue = await getQueue();
    const results = [];

    for (const item of queue) {
        try {
            const res = await fetch('/api/form/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
            });
            if (res.ok) {
                const data = await res.json();
                await removeFromQueue(item.id);
                results.push({ id: item.id, success: true, data });
            } else {
                results.push({ id: item.id, success: false, error: 'Server error' });
            }
        } catch (e) {
            results.push({ id: item.id, success: false, error: 'Network error' });
        }
    }

    return results;
}
