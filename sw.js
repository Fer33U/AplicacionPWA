const CACHE_NAME = 'lista-compras-cache-v1';
const urlsToCache = [
    //Paginas html
    '/', 
    '/pages/index.html', 
    '/pages/articulo.html', 
    '/pages/historial.html', 
    '/pages/configuracion.html',
    // Archivo de estilos CSS
    '/css/style.css',
    '/css/historial.css',
    '/css/configuracion.css',
    '/css/articulo.css',
    //Iconos
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    //Archivos js
    '/js/articulo.js',
    '/js/configuracion.js',
    '/js/historial.js',
    '/js/index.js',
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
