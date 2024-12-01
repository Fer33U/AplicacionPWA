const CACHE_NAME = 'lista-compras-cache-v1';
const urlsToCache = [
    // Páginas HTML
    '/', 
    '/pages/index.html', 
    '/pages/articulo.html', 
    '/pages/historial.html', 
    '/pages/informacion.html',
    // Archivos CSS
    '/css/style.css',
    '/css/historial.css',
    '/css/informacion.css',
    '/css/articulo.css',
    // Iconos
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    // Archivos JS
    '/js/articulo.js',
    '/js/historial.js',
    '/js/index.js',
    // Manifiesto
    '/manifest.json',
    // Service Worker
    '/sw.js'
];

// Evento de instalación: almacenamos en caché los recursos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);  // Cargar todos los archivos necesarios
            })
    );
});

// Escuchar eventos de notificación push
self.addEventListener('push', (event) => {
    let options = {
        body: event.data ? event.data.text() : 'Tienes un nuevo recordatorio.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png'
    };

    event.waitUntil(
        self.registration.showNotification('Lista de Compras', options)
    );
});


// Evento de activación: eliminamos cachés viejos
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];  // Mantenemos solo los cachés actuales

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);  // Limpiar caché viejo
                    }
                })
            );
        })
    );
});

// Evento de recuperación de recursos: buscamos primero en caché, luego en la red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)  // Verificar si el recurso está en caché
            .then((cachedResponse) => {
                // Si está en caché, devolverlo
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Si no está en caché, hacer la solicitud a la red
                return fetch(event.request);
            })
    );
});
