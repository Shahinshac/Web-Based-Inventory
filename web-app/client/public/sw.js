const CACHE_NAME = 'inventory-pwa-v1';// Service Worker for 26:07 Electronics Inventory App

const OFFLINE_URL = '/offline.html';const CACHE_NAME = '2607-inventory-v1.0.0';

const urlsToCache = [

// Assets to cache on install  '/',

const STATIC_ASSETS = [  '/index.html',

  '/',  '/src/main.jsx',

  '/offline.html',  '/src/App.jsx',

  '/manifest.json',  '/src/styles.css',

  '/icon-192.png',  '/manifest.json'

  '/icon-512.png',];

  // Will be populated by Vite build process

];// Install event - cache resources

self.addEventListener('install', (event) => {

// API endpoints to cache with network-first strategy  console.log('[Service Worker] Installing...');

const API_CACHE_PATTERNS = [  event.waitUntil(

  /^\/api\/products$/,    caches.open(CACHE_NAME)

  /^\/api\/customers$/,      .then((cache) => {

  /^\/api\/bills$/,        console.log('[Service Worker] Caching app shell');

  /^\/api\/auth\/me$/        return cache.addAll(urlsToCache);

];      })

      .then(() => self.skipWaiting())

// Install event - cache static assets  );

self.addEventListener('install', (event) => {});

  console.log('🔧 Service Worker installing...');

  // Activate event - clean up old caches

  event.waitUntil(self.addEventListener('activate', (event) => {

    caches.open(CACHE_NAME)  console.log('[Service Worker] Activating...');

      .then((cache) => {  event.waitUntil(

        console.log('📦 Caching static assets');    caches.keys().then((cacheNames) => {

        return cache.addAll(STATIC_ASSETS);      return Promise.all(

      })        cacheNames.map((cacheName) => {

      .then(() => {          if (cacheName !== CACHE_NAME) {

        console.log('✅ Service Worker installed');            console.log('[Service Worker] Deleting old cache:', cacheName);

        return self.skipWaiting();            return caches.delete(cacheName);

      })          }

      .catch((error) => {        })

        console.error('❌ Failed to cache static assets:', error);      );

      })    }).then(() => self.clients.claim())

  );  );

});});



// Activate event - clean up old caches// Fetch event - serve from cache, fallback to network

self.addEventListener('activate', (event) => {self.addEventListener('fetch', (event) => {

  console.log('🚀 Service Worker activating...');  // Skip cross-origin requests

    if (!event.request.url.startsWith(self.location.origin)) {

  event.waitUntil(    return;

    caches.keys()  }

      .then((cacheNames) => {

        return Promise.all(  event.respondWith(

          cacheNames.map((cacheName) => {    caches.match(event.request)

            if (cacheName !== CACHE_NAME) {      .then((response) => {

              console.log('🗑️ Deleting old cache:', cacheName);        // Cache hit - return response

              return caches.delete(cacheName);        if (response) {

            }          return response;

          })        }

        );

      })        // Clone the request

      .then(() => {        const fetchRequest = event.request.clone();

        console.log('✅ Service Worker activated');

        return self.clients.claim();        return fetch(fetchRequest).then((response) => {

      })          // Check if valid response

  );          if (!response || response.status !== 200 || response.type !== 'basic') {

});            return response;

          }

// Fetch event - implement caching strategies

self.addEventListener('fetch', (event) => {          // Clone the response

  const { request } = event;          const responseToCache = response.clone();

  const url = new URL(request.url);

          caches.open(CACHE_NAME)

  // Skip non-HTTP requests            .then((cache) => {

  if (!request.url.startsWith('http')) {              cache.put(event.request, responseToCache);

    return;            });

  }

          return response;

  // Handle API requests        }).catch(() => {

  if (url.pathname.startsWith('/api/')) {          // Network failed, try to return offline page if available

    event.respondWith(handleApiRequest(request));          return caches.match('/offline.html');

    return;        });

  }      })

  );

  // Handle navigation requests (pages)});

  if (request.mode === 'navigate') {

    event.respondWith(handleNavigationRequest(request));// Background sync for offline actions

    return;self.addEventListener('sync', (event) => {

  }  if (event.tag === 'sync-transactions') {

    event.waitUntil(syncTransactions());

  // Handle static assets  }

  event.respondWith(handleStaticAssetRequest(request));});

});

async function syncTransactions() {

// API request handler - Network first, then cache  // Get pending transactions from IndexedDB and sync

async function handleApiRequest(request) {  console.log('[Service Worker] Syncing pending transactions...');

  const cache = await caches.open(CACHE_NAME);  // Implementation would go here

  }

  try {

    // Try network first// Push notifications

    const networkResponse = await fetch(request);self.addEventListener('push', (event) => {

      const options = {

    // Cache successful GET requests    body: event.data ? event.data.text() : 'New notification',

    if (request.method === 'GET' && networkResponse.ok) {    icon: '/icon-192.png',

      const responseClone = networkResponse.clone();    badge: '/icon-192.png',

      await cache.put(request, responseClone);    vibrate: [200, 100, 200],

      console.log('📡 Cached API response:', request.url);    tag: 'inventory-notification',

    }    requireInteraction: false

      };

    return networkResponse;

  } catch (error) {  event.waitUntil(

    console.log('🔌 Network failed, trying cache:', request.url);    self.registration.showNotification('26:07 Inventory', options)

      );

    // Try cache if network fails});

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {// Notification click event

      console.log('📦 Serving from cache:', request.url);self.addEventListener('notificationclick', (event) => {

      return cachedResponse;  event.notification.close();

    }  

      event.waitUntil(

    // Return offline response for API failures    clients.openWindow('/')

    return new Response(  );

      JSON.stringify({ });

        error: 'Offline', 
        message: 'This feature requires an internet connection',
        offline: true 
      }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Navigation request handler - Cache first for SPA
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // If network fails, serve cached index.html for SPA routing
    console.log('🔌 Navigation offline, serving cached app');
    
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    return cache.match(OFFLINE_URL);
  }
}

// Static asset handler - Cache first
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Try network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Failed to fetch asset:', request.url);
    
    // Return a fallback for images
    if (request.destination === 'image') {
      return new Response('', { status: 204 });
    }
    
    throw error;
  }
}

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-transactions') {
    console.log('🔄 Background sync: Processing offline transactions');
    event.waitUntil(syncOfflineTransactions());
  }
});

// Sync offline transactions when back online
async function syncOfflineTransactions() {
  try {
    // Get offline transactions from IndexedDB
    const transactions = await getOfflineTransactions();
    
    for (const transaction of transactions) {
      try {
        const response = await fetch('/api/bills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${transaction.token}`
          },
          body: JSON.stringify(transaction.data)
        });
        
        if (response.ok) {
          await removeOfflineTransaction(transaction.id);
          console.log('✅ Synced offline transaction:', transaction.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync transaction:', transaction.id, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// IndexedDB helpers (placeholder - will be implemented next)
async function getOfflineTransactions() {
  // Will implement with IndexedDB
  return [];
}

async function removeOfflineTransaction(id) {
  // Will implement with IndexedDB
  console.log('Removing offline transaction:', id);
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'general',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🔧 Service Worker loaded');