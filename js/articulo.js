document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-item-form');
    const itemName = document.getElementById('item-name');
    const itemQuantity = document.getElementById('item-quantity');
    const itemPhoto = document.getElementById('item-photo');

    // Comprobar si estamos editando un artículo
    const editItem = JSON.parse(localStorage.getItem('editItem'));

    if (editItem) {
        itemName.value = editItem.name;
        itemQuantity.value = editItem.quantity;
        // Aquí, deberías agregar código para mostrar la foto actual en el formulario
        // Puedes mostrarla de alguna forma, pero recuerda que IndexedDB guarda la foto como base64
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

        // Crear un objeto Image para comprimir la imagen
        const img = new Image();
        const reader = new FileReader();

        reader.onloadend = () => {
            img.src = reader.result;
        };

        reader.readAsDataURL(photo); // Convierte la foto a base64

        img.onload = function() {
            // Crear un canvas para redimensionar/comprimir la imagen
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Redimensiona la imagen para que no sea tan grande
            const maxWidth = 300;  // Ancho máximo de la imagen
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;

            // Dibuja la imagen redimensionada en el canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convierte el canvas en base64 con calidad ajustada (comprimir)
            const compressedPhoto = canvas.toDataURL('image/jpeg', 0.7); // Comprime a 70% de calidad

            const article = {
                name,
                quantity,
                photo: compressedPhoto // Almacena la imagen comprimida
            };

            // Si estamos editando, actualizamos el artículo
            const openRequest = indexedDB.open('shoppingListDB', 1);

            openRequest.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(['articles'], 'readwrite');
                const store = transaction.objectStore('articles');
                if (editItem) {
                    store.put(article); // Actualizar artículo
                } else {
                    store.add(article); // Nuevo artículo
                }

                transaction.oncomplete = () => {
                    localStorage.removeItem('editItem'); // Limpiar el artículo editado
                    window.location.href = 'index.html'; // Redirigir al inicio después de guardar
                };
            };
        };
    });
});
