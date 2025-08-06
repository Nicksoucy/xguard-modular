// helpers.js - Fonctions utilitaires

export function downloadEmployeeReport(db) {
    const employees = db.data.employees.filter(e => e.active);
    let csv = 'Code employé,Nom,Téléphone,Email,Statut,Article,Taille,Quantité,Prix unitaire,Valeur totale\n';
    
    employees.forEach(employee => {
        const balance = db.getEmployeeBalance(employee.id);
        const status = employee.active ? 'Actif' : 'Inactif';
        if (balance.length === 0) {
            csv += `"${employee.id}","${employee.name}","${employee.phone}","${employee.email || ''}","${status}","","","0","0","0"\n`;
        } else {
            balance.forEach(item => {
                csv += `"${employee.id}","${employee.name}","${employee.phone}","${employee.email || ''}","${status}","${item.name}","${item.size}","${item.quantity}","${item.price}","${item.quantity * item.price}"\n`;
            });
        }
    });
    
    downloadCSV(csv, `xguard_employes_actifs_${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadInventoryReport(db) {
    let csv = 'Article,Catégorie,Taille,Stock actuel,Prix unitaire,Valeur totale,Statut\n';
    
    db.data.inventory.forEach(item => {
        Object.entries(item.sizes).forEach(([size, stock]) => {
            const status = stock === 0 ? 'Rupture' : stock < 10 ? 'Faible' : 'OK';
            csv += `"${item.name}","${item.category || 'Non catégorisé'}","${size}","${stock}","${item.price}","${stock * item.price}","${status}"\n`;
        });
    });
    
    downloadCSV(csv, `xguard_inventaire_${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadMovementsReport(db) {
    let csv = 'Date,Type,Article,Taille,Quantité,Raison,Fournisseur,Coût,Notes,Créé par\n';
    
    const movements = db.getInventoryMovements(999999);
    movements.forEach(m => {
        const typeText = m.type === 'purchase' ? 'Achat' : 
                       m.type === 'adjustment' ? 'Ajustement' : 
                       m.type === 'attribution' ? 'Attribution' : 
                       m.type === 'retour' ? 'Retour' : m.type;
        
        csv += `"${new Date(m.date).toLocaleDateString('fr-CA')}","${typeText}","${m.item}","${m.size}","${m.quantity}","${m.reason || ''}","${m.supplier || ''}","${m.cost || ''}","${m.notes || ''}","${m.createdBy}"\n`;
    });
    
    downloadCSV(csv, `xguard_mouvements_${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadCSV(csvContent, filename) {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

export function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        // Animation de confirmation
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copié!';
        btn.classList.add('bg-green-600');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('bg-green-600');
        }, 2000);
    }).catch(() => {
        // Fallback
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copié!';
        btn.classList.add('bg-green-600');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('bg-green-600');
        }, 2000);
    });
}

export function updateSizeFields(type) {
    const container = document.getElementById('size-fields');
    if (!container) return;

    const sizePresets = {
        standard: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        unique: ['Unique'],
        custom: []
    };

    if (type === 'custom') {
        container.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 mb-2">Tailles personnalisées</label>
            <div id="custom-sizes-container" class="space-y-2">
                <div class="flex gap-2">
                    <input type="text" id="custom-size-name" placeholder="Nom de la taille" class="flex-1 px-3 py-2 border rounded-lg">
                    <input type="number" id="custom-size-qty" placeholder="Quantité" min="0" class="w-24 px-3 py-2 border rounded-lg">
                    <button type="button" onclick="app.addCustomSize()" 
                        class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        +
                    </button>
                </div>
            </div>
            <div id="custom-sizes-list" class="mt-3 space-y-2"></div>
        `;
    } else {
        container.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 mb-2">Quantités initiales</label>
            <div class="grid ${type === 'unique' ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4'} gap-3">
                ${sizePresets[type].map(size => `
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">${size}</label>
                        <input type="number" 
                            data-size-input data-size="${size}"
                            min="0" value="0"
                            class="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-purple-500">
                    </div>
                `).join('')}
            </div>
        `;
    }
}

export function addCustomSize() {
    const nameInput = document.getElementById('custom-size-name');
    const qtyInput = document.getElementById('custom-size-qty');
    const listDiv = document.getElementById('custom-sizes-list');
    
    if (!nameInput || !qtyInput || !listDiv) return;
    
    const name = nameInput.value.trim();
    const qty = parseInt(qtyInput.value) || 0;
    
    if (name && qty >= 0) {
        const existingSize = listDiv.querySelector(`[data-custom-size="${name}"]`);
        if (existingSize) {
            alert('Cette taille existe déjà');
            return;
        }
        
        listDiv.innerHTML += `
            <div class="flex items-center gap-2 p-2 bg-gray-50 rounded" data-custom-size="${name}">
                <span class="flex-1">${name}: ${qty}</span>
                <input type="hidden" data-size-input data-size="${name}" value="${qty}">
                <button type="button" onclick="this.parentElement.remove()" 
                    class="text-red-500 hover:text-red-700">×</button>
            </div>
        `;
        
        nameInput.value = '';
        qtyInput.value = '';
    }
}

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-CA');
}

export function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('fr-CA');
}

export function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}
