/**
 * Service Worker for Quantum X Builder Command Center
 * Enables PWA functionality and GitHub mobile app integration
 */

const CACHE_NAME = 'qxb-command-center-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js',
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(response => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push notification handler for GitHub mobile
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.message || 'New command from GitHub mobile',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification('Quantum X Builder', options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Message handler for GitHub webhook events
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GITHUB_WEBHOOK') {
    // Process GitHub webhook event
    const payload = event.data.payload;

    // Broadcast to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'github_event',
          event: payload.action,
          data: payload,
        });
      });
    });
  }
});

// Background sync for offline commands
self.addEventListener('sync', event => {
  if (event.tag === 'sync-commands') {
    event.waitUntil(syncPendingCommands());
  }
});

/**
 * Sync pending commands when back online
 */
async function syncPendingCommands() {
  // Get pending commands from IndexedDB
  const db = await openDB();
  const tx = db.transaction('pending_commands', 'readonly');
  const store = tx.objectStore('pending_commands');
  const commands = await store.getAll();

  // Send each command
  for (const command of commands) {
    try {
      await fetch(command.url, {
        method: 'POST',
        headers: command.headers,
        body: command.body,
      });

      // Remove from pending if successful
      const deleteTx = db.transaction('pending_commands', 'readwrite');
      await deleteTx.objectStore('pending_commands').delete(command.id);
    } catch (error) {
      console.error('Failed to sync command:', error);
    }
  }
}

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('qxb_commands', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_commands')) {
        db.createObjectStore('pending_commands', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
