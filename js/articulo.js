document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-item-form');
    const itemName = document.getElementById('item-name');
    const itemQuantity = document.getElementById('item-quantity');
    const itemPhoto = document.getElementById('item-photo');

    const editItem = JSON.parse(localStorage.getItem('editItem'));

    if (editItem) {
        itemName.value = editItem.name;
        itemQuantity.value = editItem.quantity;
        // Mostrar la foto actual si es necesario
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = itemName.value.trim();
        const quantity = itemQuantity.value.trim();
        const photo = itemPhoto.files[0]; // Obtiene la foto seleccionada

        if (!name || !quantity || !photo) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onloadend = () => {
            img.src = reader.result;
        };

        reader.readAsDataURL(photo); // Convierte la foto a base64

        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const maxWidth = 300;  // Ancho máximo de la imagen
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedPhoto = canvas.toDataURL('image/jpeg', 0.7);

            const article = {
                name,
                quantity,
                photo: compressedPhoto,
                completed: false, // Indicamos que el artículo no está completado aún
            };

            const openRequest = indexedDB.open('shoppingListDB', 1);

            openRequest.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(['articles'], 'readwrite');
                const store = transaction.objectStore('articles');

                if (editItem) {
                    store.put(article); // Actualiza el artículo
                } else {
                    store.add(article); // Nuevo artículo
                }

                transaction.oncomplete = () => {
                    // Después de agregar el artículo, aseguramos la sincronización
                    if (!navigator.serviceWorker.controller) return;

                    navigator.serviceWorker.ready.then((registration) => {
                        registration.sync.register('sync-articles');
                    });

                    localStorage.removeItem('editItem');
                    window.location.href = 'index.html'; // Redirigir después de guardar
                };
            };
        };
    });
});
