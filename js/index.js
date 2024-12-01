document.addEventListener('DOMContentLoaded', () => {
    const itemList = document.getElementById('item-list');

    // Abre la base de datos IndexedDB
    const openRequest = indexedDB.open('shoppingListDB', 1);

    openRequest.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('articles')) {
            db.createObjectStore('articles', { keyPath: 'name' });
        }
    };

    openRequest.onsuccess = (e) => {
        const db = e.target.result;

        // Obtener los artículos desde la base de datos
        const transaction = db.transaction(['articles'], 'readonly');
        const store = transaction.objectStore('articles');
        const request = store.getAll();

        request.onsuccess = () => {
            const articles = request.result;
            articles.forEach(article => {
                const item = document.createElement('div');
                item.classList.add('list-group-item', 'd-flex', 'align-items-center', 'justify-content-between');

                item.innerHTML = `
                    <div class="d-flex align-items-center">
                        <img src="${article.photo}" alt="${article.name}" class="me-3" style="width: 50px; height: 50px; object-fit: cover;">
                        <span>${article.name}</span>
                    </div>
                    <div>
                        <button class="btn btn-success btn-sm me-1 check-btn"><i class="fas fa-check"></i></button>
                        <button class="btn btn-warning btn-sm me-1 edit-btn" onclick="editItem('${article.name}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm delete-btn" onclick="deleteItem('${article.name}')"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Agregar el evento para el botón de "check"
                const checkButton = item.querySelector('.check-btn');
                checkButton.addEventListener('click', () => {
                    // Cambiar el color del artículo
                    item.style.backgroundColor = '#f8f9fa'; // Gris claro

                    // Deshabilitar los botones de edición y check
                    const editButton = item.querySelector('.edit-btn');
                    const deleteButton = item.querySelector('.delete-btn');
                    checkButton.disabled = true;
                    editButton.disabled = true;
                    deleteButton.disabled = false; // Solo el de eliminar permanece habilitado
                });

                itemList.appendChild(item);
            });
        };
    };
});

// Función para editar un artículo
function editItem(itemName) {
    const openRequest = indexedDB.open('shoppingListDB', 1);

    openRequest.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction(['articles'], 'readonly');
        const store = transaction.objectStore('articles');
        const request = store.get(itemName);

        request.onsuccess = () => {
            const article = request.result;

            // Guardar el artículo en localStorage para usarlo en la página de edición
            localStorage.setItem('editItem', JSON.stringify(article));
            window.location.href = 'articulo.html'; // Redirigir a la página de editar artículo
        };
    };
}

// Eliminar artículo
function deleteItem(itemName) {
    const openRequest = indexedDB.open('shoppingListDB', 1);

    openRequest.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction(['articles'], 'readwrite');
        const store = transaction.objectStore('articles');
        store.delete(itemName);

        transaction.oncomplete = () => {
            location.reload(); // Recargar la lista
        };
    };
}
