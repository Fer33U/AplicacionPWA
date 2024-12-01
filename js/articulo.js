document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-item-form');
    const itemName = document.getElementById('item-name');
    const itemQuantity = document.getElementById('item-quantity');
    const itemPhoto = document.getElementById('item-photo');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = itemName.value.trim();
        const quantity = itemQuantity.value.trim();
        const photo = itemPhoto.files[0]; // Obtiene la foto seleccionada

        if (!name || !quantity || !photo) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        // Usar FileReader para convertir la imagen a base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const article = {
                name,
                quantity,
                photo: reader.result // Aquí se guarda la imagen en formato base64
            };

            // Guardar artículo en IndexedDB
            const openRequest = indexedDB.open('shoppingListDB', 1);

            openRequest.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction(['articles'], 'readwrite');
                const store = transaction.objectStore('articles');
                store.add(article);

                transaction.oncomplete = () => {
                    window.location.href = 'index.html'; // Redirigir al inicio después de guardar
                };
            };
        };

        reader.readAsDataURL(photo); // Convertir la imagen a base64
    });
});