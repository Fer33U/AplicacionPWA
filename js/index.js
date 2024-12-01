document.addEventListener('DOMContentLoaded', () => {
    const itemList = document.getElementById('item-list');

    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')  // Ruta a tu service worker
                .then((registration) => {
                    console.log('Service Worker registrado con éxito:', registration);

                    // Registrar la sincronización cuando se realice una acción fuera de línea
                    if ('sync' in navigator) {
                        registration.sync.register('sync-articles')  // Nombre de la tarea de sincronización
                            .then(() => {
                                console.log('Sincronización registrada');
                            })
                            .catch((error) => {
                                console.log('Error al registrar la sincronización:', error);
                            });
                    }
                })
                .catch((error) => {
                    console.log('Error al registrar el Service Worker:', error);
                });
        });
    }

    // Inicializar IndexedDB
    initDB()
        .then(db => loadArticles(db))
        .catch(console.error);
});

// Inicializar la base de datos
function initDB() {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('shoppingListDB', 1);

        openRequest.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('articles')) {
                db.createObjectStore('articles', { keyPath: 'name' });
            }
            if (!db.objectStoreNames.contains('history')) {
                db.createObjectStore('history', { autoIncrement: true });
            }
        };

        openRequest.onsuccess = (e) => resolve(e.target.result);
        openRequest.onerror = (e) => reject(e.target.error);
    });
}

// Cargar los artículos en la lista
function loadArticles(db) {
    const transaction = db.transaction(['articles'], 'readonly');
    const store = transaction.objectStore('articles');
    const request = store.getAll();

    request.onsuccess = () => {
        const articles = request.result;
        articles.forEach(article => renderArticle(article));
    };

    request.onerror = (e) => console.error('Error loading articles:', e.target.error);
}

// Renderizar un artículo en la lista
function renderArticle(article) {
    const itemList = document.getElementById('item-list');
    const item = document.createElement('div');
    item.classList.add('list-group-item', 'd-flex', 'align-items-center', 'justify-content-between');
    item.dataset.name = article.name;

    if (article.completed) {
        item.style.backgroundColor = '#f8f9fa';
    }

    item.innerHTML = `
        <div class="d-flex align-items-center">
            <img src="${article.photo}" alt="${article.name}" class="me-3" style="width: 50px; height: 50px; object-fit: cover;">
            <span>${article.name} (${article.quantity || 1})</span>
        </div>
        <div>
            <button class="btn btn-success btn-sm me-1 check-btn" ${article.completed ? 'disabled' : ''}><i class="fas fa-check"></i></button>
            <button class="btn btn-warning btn-sm me-1 edit-btn" ${article.completed ? 'disabled' : ''}><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;

    item.querySelector('.check-btn').addEventListener('click', () => markAsChecked(item, article));
    item.querySelector('.edit-btn').addEventListener('click', () => editItem(article.name));
    item.querySelector('.delete-btn').addEventListener('click', () => deleteItem(article.name, item));

    itemList.appendChild(item);
}

// Marcar artículo como completado
function markAsChecked(item, article) {
    item.style.backgroundColor = '#f8f9fa';
    item.querySelector('.check-btn').disabled = true;
    item.querySelector('.edit-btn').disabled = true;
    item.querySelector('.delete-btn').disabled = false;

    // Actualizar el estado del artículo en la base de datos
    article.completed = true;

    initDB().then(db => {
        const transaction = db.transaction(['articles'], 'readwrite');
        const store = transaction.objectStore('articles');
        store.put(article);

        // Guardar en el historial
        const today = new Date().toISOString().split('T')[0];
        const historyItem = { ...article, date: today };

        const historyTransaction = db.transaction(['history'], 'readwrite');
        const historyStore = historyTransaction.objectStore('history');
        historyStore.add(historyItem);

        historyTransaction.onerror = (e) => console.error('Error saving to history:', e.target.error);
    });

    // Enviar una notificación push cuando se marque el artículo
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Bien hecho', {
                body: `¡Has comprado 1 de tus artículos!`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png'
            });
        });
    }

    // Si el navegador está offline, intentar sincronizar más tarde
    if (!navigator.onLine) {
        storeSyncData(article);
    }
}

// Guardar los datos que no se han sincronizado
function storeSyncData(article) {
    initDB().then(db => {
        const transaction = db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        store.add(article); // Guardar el artículo para sincronizarlo más tarde
    });
}

// Editar un artículo
function editItem(itemName) {
    initDB().then(db => {
        const transaction = db.transaction(['articles'], 'readonly');
        const store = transaction.objectStore('articles');
        const request = store.get(itemName);

        request.onsuccess = () => {
            const article = request.result;

            // Guardar en localStorage y redirigir
            localStorage.setItem('editItem', JSON.stringify(article));
            window.location.href = 'articulo.html';
        };

        request.onerror = (e) => console.error('Error fetching article for editing:', e.target.error);
    });
}

// Eliminar un artículo
function deleteItem(itemName, itemElement) {
    initDB().then(db => {
        const transaction = db.transaction(['articles'], 'readwrite');
        const store = transaction.objectStore('articles');
        store.delete(itemName);

        transaction.oncomplete = () => {
            itemElement.remove(); // Eliminar del DOM directamente
        };

        transaction.onerror = (e) => console.error('Error deleting article:', e.target.error);
    });
}

// Solicitar permiso para las notificaciones push
if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Permiso para notificaciones concedido');
        } else {
            console.log('Permiso para notificaciones denegado');
        }
    });
}
