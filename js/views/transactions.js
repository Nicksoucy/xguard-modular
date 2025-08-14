// transactions.js - Toutes les vues liées aux transactions

export function renderTransaction(app) {
    const employee = app.db.getEmployee(app.currentEmployee);
    if (!employee) {
        app.navigateTo('selectEmployee');
        return '';
    }
    
    const balance = app.db.getEmployeeBalance(app.currentEmployee);
    
    return `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="gradient-bg text-white shadow-lg">
                <div class="max-w-6xl mx-auto p-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 class="text-xl font-bold">
                                ${app.transactionType === 'attribution' ? 'Attribution d\'uniformes' : 
                                  app.transactionType === 'retour' ? 'Retour d\'uniformes' : 
                                  'Ajout d\'équipement'}
                            </h1>
                            <p class="text-purple-100">${employee.name} (${employee.id})</p>
                        </div>
                        <button onclick="app.navigateTo('home')" 
                            class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="max-w-6xl mx-auto p-6">
                <div class="grid lg:grid-cols-3 gap-6">
                    <!-- Sélection des articles -->
                    <div class="lg:col-span-2">
                        <div class="bg-white rounded-xl shadow-lg p-6">
                            <h2 class="text-xl font-semibold mb-4">
                                ${app.transactionType === 'retour' ? 'Articles à retourner' : 'Sélection des articles'}
                            </h2>
                            
                            ${app.transactionType === 'retour' ? `
                                <!-- Articles en possession pour retour -->
                                <div class="space-y-3">
                                    ${balance.length > 0 ? balance.map(item => `
                                        <div class="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition">
                                            <div class="flex justify-between items-center">
                                                <div>
                                                    <span class="font-medium">${item.name}</span>
                                                    <span class="text-sm text-gray-600 ml-2">Taille: ${item.size}</span>
                                                    <span class="text-sm text-gray-500 ml-2">En possession: ${item.quantity}</span>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <input type="number" 
                                                        id="return-${item.name}-${item.size}"
                                                        min="0" max="${item.quantity}" value="0"
                                                        class="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-green-500"
                                                        onchange="app.updateReturnQuantity('${item.name}', '${item.size}', ${item.price}, this.value)">
                                                    <span class="text-sm">retourner</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : '<p class="text-gray-500 text-center py-8">Aucun article en possession</p>'}
                                </div>
                            ` : `
                                <!-- Inventaire pour attribution/ajout -->
                                <div class="space-y-4 max-h-96 overflow-y-auto">
                                    ${app.db.data.inventory.map(item => `
                                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                            <div class="flex justify-between items-center mb-3">
                                                <h3 class="font-medium">${item.name}</h3>
                                                <span class="text-green-600 font-semibold">$${item.price}</span>
                                            </div>
                                            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                ${Object.entries(item.sizes).map(([size, stock]) => `
                                                    <button 
                                                        class="size-btn border rounded px-3 py-2 text-sm hover:bg-purple-50 hover:border-purple-300 transition
                                                            ${stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}"
                                                        data-item-name="${item.name}"
                                                        data-size="${size}"
                                                        data-stock="${stock}"
                                                        data-price="${item.price}"
                                                        ${stock === 0 ? 'disabled' : ''}
                                                        onclick="app.addToSelection('${item.name}', '${size}', ${item.price}, ${stock})"
                                                    >
                                                        <div class="font-medium">${size}</div>
                                                        <div class="text-xs ${stock < 10 ? 'text-red-500' : 'text-gray-500'}">
                                                            ${stock}
                                                        </div>
                                                    </button>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Résumé -->
                    <div>
                        <!-- Informations employé -->
                        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <h3 class="font-semibold mb-3">Employé</h3>
                            <div class="space-y-2">
                                <p class="text-sm"><span class="text-gray-600">Nom:</span> <span class="font-medium">${employee.name}</span></p>
                                <p class="text-sm"><span class="text-gray-600">Code:</span> <span class="font-medium">${employee.id}</span></p>
                                <p class="text-sm"><span class="text-gray-600">Tél:</span> <span class="font-medium">${employee.phone}</span></p>
                            </div>
                            
                            ${balance.length > 0 ? `
                                <div class="mt-4 pt-4 border-t">
                                    <p class="text-sm font-semibold mb-2">En possession:</p>
                                    <div class="text-xs space-y-1 bg-gray-50 rounded p-3">
                                        ${balance.map(item => 
                                            `<div class="flex justify-between">
                                                <span>${item.quantity}× ${item.name} (${item.size})</span>
                                                <span class="text-gray-600">$${item.price * item.quantity}</span>
                                            </div>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Résumé de la transaction -->
                        <div class="bg-white rounded-xl shadow-lg p-6">
                            <h3 class="font-semibold mb-3">
                                ${app.transactionType === 'retour' ? 'Articles à retourner' : 'Articles sélectionnés'}
                            </h3>
                            <div id="selection-summary" class="space-y-2 mb-4 max-h-64 overflow-y-auto">
                                <p class="text-gray-500 text-center py-4">Aucun article sélectionné</p>
                            </div>
                            <div class="border-t pt-4">
                                <div class="flex justify-between items-center">
                                    <span class="font-semibold">Total:</span>
                                    <span id="total-price" class="text-2xl font-bold text-green-600">$0</span>
                                </div>
                            </div>

                            <!-- Notes -->
                            <div class="mt-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea id="transaction-notes" rows="3"
                                    class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    placeholder="Notes optionnelles..."></textarea>
                            </div>

                            <!-- Bouton de validation -->
                            <button onclick="app.validateTransaction()" 
                                class="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                ${app.transactionType === 'retour' ? 
                                    'Confirmer le retour' : 
                                    'Générer le lien de signature'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderTransactionsList(app) {
    const transactions = app.db.data.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Historique des transactions</h1>
                    <button onclick="app.navigateTo('home')" 
                        class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="max-w-6xl mx-auto p-6">
                <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
                    <p class="text-lg font-semibold">Total: ${transactions.length} transactions</p>
                </div>

                <div class="space-y-4">
                    ${transactions.map(t => {
                        const employee = app.db.getEmployee(t.employeeId);
                        const total = t.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        
                        let typeClasses = '';
                        let typeText = '';
                        if (t.type === 'attribution') {
                            typeClasses = 'bg-blue-100 text-blue-700';
                            typeText = 'Attribution';
                        } else if (t.type === 'retour') {
                            typeClasses = 'bg-green-100 text-green-700';
                            typeText = 'Retour';
                        } else {
                            typeClasses = 'bg-purple-100 text-purple-700';
                            typeText = 'Ajout';
                        }
                        
                        return `
                            <div class="bg-white rounded-xl shadow-lg p-6 hover-lift animate-fade-in">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <div class="flex items-center gap-3 mb-2">
                                            <span class="px-3 py-1 ${typeClasses} rounded-full text-sm font-medium">
                                                ${typeText}
                                            </span>
                                            ${t.signed ? `
                                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                    ✓ Signé
                                                </span>
                                            ` : t.type !== 'retour' ? `
                                                <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                                                    En attente
                                                </span>
                                            ` : ''}
                                        </div>
                                        <p class="font-semibold">${employee ? employee.name : 'Employé supprimé'}</p>
                                        <p class="text-sm text-gray-600">${new Date(t.createdAt).toLocaleString('fr-CA')}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-bold ${t.type === 'retour' ? 'text-green-600' : 'text-gray-800'}">
                                            ${t.type === 'retour' ? '-' : ''}$${total}
                                        </p>
                                        <p class="text-sm text-gray-500">${t.items.length} articles</p>
                                    </div>
                                </div>
                                <div class="border-t pt-4">
                                    <div class="flex flex-wrap gap-2">
                                        ${t.items.map(item => `
                                            <span class="px-2 py-1 bg-gray-100 rounded text-xs">
                                                ${item.quantity}× ${item.name} (${item.size})
                                            </span>
                                        `).join('')}
                                    </div>
                                    ${t.notes ? `<p class="text-sm text-gray-600 mt-2 italic">Note: ${t.notes}</p>` : ''}
                                    ${t.signed ? `
                                        <div class="mt-3">
                                            <button onclick="app.generatePDF('${t.id}')" 
                                                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                </svg>
                                                Télécharger PDF
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}
