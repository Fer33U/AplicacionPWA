document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');

    const openRequest = indexedDB.open('shoppingListDB', 1);

    openRequest.onsuccess = (e) => {
        const db = e.target.result;

        // Leer historial
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const request = store.getAll();

        request.onsuccess = () => {
            const historyItems = request.result;
            renderHistory(historyItems);
        };

        request.onerror = (e) => console.error('Error loading history:', e.target.error);
    };

    openRequest.onerror = (e) => console.error('Error opening database:', e.target.error);
});

// Renderizar historial
function renderHistory(historyItems) {
    const groupedByDate = groupBy(historyItems, 'date');
    const container = document.querySelector('.container');

    Object.entries(groupedByDate).forEach(([date, items]) => {
        const section = document.createElement('div');
        section.classList.add('bg-white', 'p-4', 'rounded-lg', 'shadow-sm', 'mb-4');

        section.innerHTML = `
            <h2 class="h4 font-weight-bold mb-4">Fecha: ${date}</h2>
        `;

        items.forEach(item => {
            section.innerHTML += `
                <div class="d-flex align-items-center mb-3">
                    <img src="${item.photo}" alt="${item.name}" class="img-fluid rounded" style="width: 50px; height: 50px;">
                    <div class="ms-3">
                        <span>${item.name} (${item.quantity || 1})</span>
                    </div>
                </div>
            `;
        });
        

        container.appendChild(section);
    });
}

// Agrupar por fecha
function groupBy(array, key) {
    return array.reduce((result, currentItem) => {
        const groupKey = currentItem[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(currentItem);
        return result;
    }, {});
}
