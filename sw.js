const CACHE_NAME = 'lista-compras-cache-v1';
const urlsToCache = [
    // Paginas html
    '/', 
    '/pages/index.html', 
    '/pages/articulo.html', 
    '/pages/historial.html', 
    '/pages/configuracion.html',
    // Archivos CSS
    '/css/style.css',
    '/css/historial.css',
    '/css/configuracion.css',
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
    // Archivos js
    '/js/articulo.js',
    '/js/configuracion.js',
    '/js/historial.js',
    '/js/index.js',
    // Manifiesto
    '/manifest.json',
    //ServiceWorker
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

// Agregar soporte para sincronización en segundo plano
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-articles') {
        event.waitUntil(syncArticles());
    }
});

function syncArticles() {
    return new Promise((resolve, reject) => {
        const dbPromise = indexedDB.open('shoppingListDB', 1);
        dbPromise.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction(['articles'], 'readonly');
            const store = transaction.objectStore('articles');
            const request = store.getAll();

            request.onsuccess = () => {
                const articles = request.result.filter(article => !article.completed);
                if (articles.length > 0) {
                    // Simulamos el envío de los artículos al servidor
                    fetch('/sync-articles', {
                        method: 'POST',
                        body: JSON.stringify(articles),
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                    .then(response => response.json())
                    .then(data => {
                        const transaction = db.transaction(['articles'], 'readwrite');
                        const store = transaction.objectStore('articles');
                        articles.forEach(article => {
                            article.completed = true;
                            store.put(article); // Marcar como completado
                        });
                        resolve();
                    })
                    .catch(reject);
                } else {
                    resolve();  // Si no hay artículos pendientes, resolver
                }
            };

            request.onerror = (e) => reject(e.target.error);
        };
    });
}

