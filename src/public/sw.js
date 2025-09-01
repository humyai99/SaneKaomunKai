// Service Worker สำหรับ PWA และ caching
const CACHE_NAME = 'sanae-pos-v1'
const API_CACHE_NAME = 'sanae-api-v1'

// Assets ที่ต้อง cache
const STATIC_ASSETS = [
  '/',
  '/login',
  '/pos',
  '/kds/kitchen',
  '/kds/tea',
  '/bills',
  '/manager',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
]

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - different strategies for different types
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Static assets - Cache First
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) return response
          return fetch(request).then(response => {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseClone))
            return response
          })
        })
    )
    return
  }
  
  // Supabase API calls - Network First with cache fallback
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // ถ้าเป็น GET request ให้ cache ไว้
          if (request.method === 'GET' && response.ok) {
            const responseClone = response.clone()
            caches.open(API_CACHE_NAME)
              .then(cache => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // หาก network fail ให้ลอง cache
          if (request.method === 'GET') {
            return caches.match(request)
          }
          // สำหรับ POST/PUT/DELETE เก็บไว้ใน IndexedDB (handled by app)
          throw new Error('Network unavailable')
        })
    )
    return
  }
  
  // Menu images - Stale While Revalidate
  if (url.pathname.includes('/storage/') && url.pathname.includes('menu-images')) {
    event.respondWith(
      caches.open(API_CACHE_NAME)
        .then(cache => {
          return cache.match(request).then(response => {
            const fetchPromise = fetch(request).then(networkResponse => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone())
              }
              return networkResponse
            }).catch(() => response) // fallback to cache if network fails
            
            return response || fetchPromise
          })
        })
    )
    return
  }
  
  // Default - Network First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request)
    })
  )
})

// Background Sync สำหรับ offline queue
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineQueue())
  }
})

async function processOfflineQueue() {
  // จะได้รับการจัดการใน app โดยใช้ IndexedDB
  console.log('Processing offline queue...')
}

// Push notifications (อนาคต)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json()
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'default',
      data: data.data
    })
  }
})

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      // หาหน้าต่างที่เปิดอยู่แล้ว
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // เปิดหน้าต่างใหม่
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})