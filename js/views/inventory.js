// inventory.js - Toutes les vues liées à l'inventaire

export function renderInventory(app) {
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">État de l'inventaire</h1>
                    <button onclick="app.currentView='home'; app.render()" 
                        class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="max-w-6xl mx-auto p-6">
                <div class="grid md:grid-cols-2 gap-6">
                    ${app.db.data.inventory.map(item => {
                        const totalStock = Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0);
                        const isLowStock = totalStock < 20;
                        
                        return `
                            <div class="bg-white rounded-xl shadow-lg p-6 ${isLowStock ? 'ring-2 ring-red-500' : ''} hover-lift animate-fade-in">
                                <div class="flex justify-between items-start mb-4">
                                    <h3 class="font-semibold text-lg">${item.name}</h3>
                                    <div class="text-right">
                                        <p class="text-sm text-gray-500">Stock total</p>
                                        <p class="text-3xl font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}">${totalStock}</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    ${Object.entries(item.sizes).map(([size, stock]) => `
                                        <span class="px-3 py-1 rounded-full text-sm font-medium
                                            ${stock === 0 ? 'bg-red-100 text-red-700' : 
                                              stock < 10 ? 'bg-yellow-100 text-yellow-700' : 
                                              'bg-green-100 text-green-700'}">
                                            ${size}: ${stock}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

export function renderInventoryManagement(app) {
    const movements = app.db.getInventoryMovements(20);
    
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Gestion d'inventaire</h1>
                    <button onclick="app.currentView='home'; app.render()" 
                        class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="max-w-6xl mx-auto p-6">
                <!-- Actions rapides -->
                <div class="grid md:grid-cols-3 gap-4 mb-6">
                    <button onclick="app.showPurchaseModal()" 
                        class="bg-white rounded-xl shadow-lg p-6 hover-lift flex items-center">
                        <div class="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mr-4">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <div class="text-left">
                            <div class="font-bold text-gray-800">Enregistrer un achat</div>
                            <div class="text-sm text-gray-600">Ajouter du stock acheté</div>
                        </div>
                    </button>

                    <button onclick="app.showAdjustmentModal()" 
                        class="bg-white rounded-xl shadow-lg p-6 hover-lift flex items-center">
                        <div class="p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl mr-4">
                            <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                            </svg>
                        </div>
                        <div class="text-left">
                            <div class="font-bold text-gray-800">Ajustement manuel</div>
                            <div class="text-sm text-gray-600">Corriger les quantités</div>
                        </div>
                    </button>

                    <button onclick="app.currentView='newInventoryItem'; app.render()" 
                        class="bg-white rounded-xl shadow-lg p-6 hover-lift flex items-center">
                        <div class="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mr-4">
                            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </div>
                        <div class="text-left">
                            <div class="font-bold text-gray-800">Nouvel article</div>
                            <div class="text-sm text-gray-600">Ajouter un nouveau type</div>
                        </div>
                    </button>
                </div>

                <!-- État actuel de l'inventaire -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">Stock actuel</h2>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unit.</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${app.db.data.inventory.map(item => 
                                    Object.entries(item.sizes).map(([size, qty]) => `
                                        <tr class="${qty < 10 ? 'bg-red-50' : ''}">
                                            <td class="px-4 py-3 whitespace-nowrap">${item.name}</td>
                                            <td class="px-4 py-3 whitespace-nowrap">${size}</td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <span class="px-2 py-1 text-xs rounded-full ${qty === 0 ? 'bg-red-100 text-red-700' : qty < 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">
                                                    ${qty}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap">$${item.price}</td>
                                            <td class="px-4 py-3 whitespace-nowrap font-semibold">$${qty * item.price}</td>
                                            <td class="px-4 py-3 whitespace-nowrap">
                                                <button onclick="app.showAdjustStockModal('${item.name}', '${size}')" 
                                                    class="text-indigo-600 hover:text-indigo-900 text-sm">
                                                    Ajuster
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')
                                ).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Historique des mouvements -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold mb-4">Historique des mouvements</h2>
                    ${movements.length > 0 ? `
                        <div class="space-y-2">
                            ${movements.map(m => `
                                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <span class="font-medium">${m.item} (${m.size})</span>
                                        <span class="ml-2 px-2 py-1 text-xs rounded ${m.type === 'purchase' ? 'bg-green-100 text-green-700' : m.type === 'adjustment' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}">
                                            ${m.type === 'purchase' ? 'Achat' : m.type === 'adjustment' ? 'Ajustement' : m.type}
                                        </span>
                                        ${m.reason ? `<span class="text-sm text-gray-600 ml-2">(${m.reason})</span>` : ''}
                                    </div>
                                    <div class="text-right">
                                        <span class="font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}">
                                            ${m.quantity > 0 ? '+' : ''}${m.quantity}
                                        </span>
                                        <p class="text-xs text-gray-500">${new Date(m.date).toLocaleString('fr-CA')}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-gray-500 text-center py-8">Aucun mouvement enregistré</p>'}
                </div>
            </div>
        </div>
    `;
}

export function renderNewInventoryItem(app) {
    const categories = [
        'Hauts',
        'Bas',
        'Manteaux',
        'Accessoires',
        'Sécurité',
        'Autre'
    ];

    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-4xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Nouvel article d'inventaire</h1>
                    <div class="flex gap-2">
                        <button onclick="app.currentView='inventoryManagement'; app.render()" 
                            class="p-2 hover:bg-white/20 rounded-lg transition" title="Retour">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                        </button>
                        <button onclick="app.currentView='home'; app.render()" 
                            class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="max-w-2xl mx-auto p-6 animate-fade-in">
                <div class="bg-white rounded-2xl shadow-xl p-8">
                    <form id="new-inventory-form" class="space-y-6">
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nom de l'article *</label>
                                <input type="text" id="item-name" required 
                                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                                <select id="item-category" required 
                                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                                    <option value="">Sélectionner une catégorie</option>
                                    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Prix unitaire *</label>
                            <input type="number" id="item-price" min="0" step="0.01" required 
                                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Type de tailles</label>
                            <div class="grid grid-cols-3 gap-4">
                                <label class="cursor-pointer">
                                    <input type="radio" name="size-type" value="standard" checked
                                        class="sr-only peer"
                                        onchange="app.updateSizeFields('standard')">
                                    <div class="p-4 border-2 rounded-lg peer-checked:border-purple-500 peer-checked:bg-purple-50 hover:bg-gray-50 transition">
                                        <p class="font-semibold">Standard</p>
                                        <p class="text-xs text-gray-600">XS à 3XL</p>
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="size-type" value="unique"
                                        class="sr-only peer"
                                        onchange="app.updateSizeFields('unique')">
                                    <div class="p-4 border-2 rounded-lg peer-checked:border-purple-500 peer-checked:bg-purple-50 hover:bg-gray-50 transition">
                                        <p class="font-semibold">Unique</p>
                                        <p class="text-xs text-gray-600">Taille unique</p>
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="size-type" value="custom"
                                        class="sr-only peer"
                                        onchange="app.updateSizeFields('custom')">
                                    <div class="p-4 border-2 rounded-lg peer-checked:border-purple-500 peer-checked:bg-purple-50 hover:bg-gray-50 transition">
                                        <p class="font-semibold">Personnalisé</p>
                                        <p class="text-xs text-gray-600">Définir</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div id="size-fields">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Quantités initiales</label>
                            <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                ${['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(size => `
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">${size}</label>
                                        <input type="number" 
                                            data-size-input data-size="${size}"
                                            min="0" value="0"
                                            class="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-purple-500">
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="flex gap-4 mt-8">
                            <button type="button" onclick="app.currentView='inventoryManagement'; app.render()" 
                                class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition">
                                Annuler
                            </button>
                            <button type="submit" 
                                class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition font-medium">
                                Ajouter l'article
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}
