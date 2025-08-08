// employees.js - Toutes les vues liées aux employés

export function renderEmployeesList(app) {
    const employees = app.db.data.employees.filter(e => e.active);
    const inactiveEmployees = app.db.data.employees.filter(e => !e.active);
    
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Liste des employés</h1>
                    <button onclick="app.navigateTo('home')" 
                        class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="max-w-6xl mx-auto p-6">
                <!-- Barre de recherche -->
                <div class="bg-white rounded-xl shadow-lg p-4 mb-4">
                    <div class="relative">
                        <svg class="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input type="text" id="employees-search" 
                            placeholder="Rechercher par nom, code employé, téléphone ou email..." 
                            class="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            oninput="app.filterEmployeesList(this.value)">
                    </div>
                </div>

                <!-- Onglets actifs/inactifs -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex gap-4">
                            <button onclick="app.showInactive = false; app.navigateTo('employees', { showInactive: false })" 
                                class="px-4 py-2 rounded-lg transition ${!app.showInactive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Actifs (${employees.length})
                            </button>
                            <button onclick="app.showInactive = true; app.navigateTo('employees', { showInactive: true })" 
                                class="px-4 py-2 rounded-lg transition ${app.showInactive ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Inactifs (${inactiveEmployees.length})
                            </button>
                        </div>
                        <button onclick="app.downloadEmployeeReport()" 
                            class="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Télécharger CSV
                        </button>
                    </div>
                </div>

                <div id="employees-list" class="grid md:grid-cols-2 gap-6">
                    ${(app.showInactive ? inactiveEmployees : employees).map(emp => {
                        const balance = app.db.getEmployeeBalance(emp.id);
                        const totalItems = balance.reduce((sum, item) => sum + item.quantity, 0);
                        const totalValue = balance.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                        const empClass = !emp.active ? 'opacity-75' : '';
                        const textClass = !emp.active ? 'text-gray-500' : '';
                        
                        let balanceHtml = '';
                        if (balance.length > 0) {
                            const itemsHtml = balance.map(item => 
                                `<div class="flex justify-between bg-gray-50 rounded px-2 py-1">
                                    <span>${item.quantity}× ${item.name} (${item.size})</span>
                                    <span class="text-gray-600">$${item.price * item.quantity}</span>
                                </div>`
                            ).join('');
                            
                            balanceHtml = `
                                <div class="border-t pt-4">
                                    <p class="text-sm font-semibold mb-2">En possession:</p>
                                    <div class="text-xs space-y-1 max-h-32 overflow-y-auto">
                                        ${itemsHtml}
                                    </div>
                                </div>
                            `;
                        } else {
                            balanceHtml = '<p class="text-sm text-gray-500 italic">Aucun article en possession</p>';
                        }
                        
                        return `
                            <div class="bg-white rounded-xl shadow-lg p-6 hover-lift animate-fade-in employee-card ${empClass}" 
                                 data-name="${emp.name.toLowerCase()}" 
                                 data-id="${emp.id.toLowerCase()}" 
                                 data-phone="${emp.phone}" 
                                 data-email="${(emp.email || '').toLowerCase()}">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="font-semibold text-lg ${textClass}">${emp.name}</h3>
                                        <p class="text-sm text-gray-600">${emp.id} • ${emp.phone}</p>
                                        ${emp.email ? `<p class="text-sm text-gray-600">${emp.email}</p>` : ''}
                                        ${!emp.active ? '<span class="inline-block mt-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">Inactif</span>' : ''}
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-bold ${!emp.active ? 'text-gray-500' : 'text-gray-800'}">${totalItems}</p>
                                        <p class="text-sm text-gray-500">articles</p>
                                        <p class="text-sm font-semibold ${!emp.active ? 'text-gray-500' : 'text-green-600'}">$${totalValue}</p>
                                    </div>
                                </div>
                                ${balanceHtml}
                                <div class="mt-4 flex gap-2">
                                    <button onclick="app.navigateTo('employeeDetails', { employee: '${emp.id}' })" 
                                        class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                                        Voir détails
                                    </button>
                                    ${emp.active ? `
                                        <button onclick="app.startTransactionForEmployee('attribution', '${emp.id}')" 
                                            class="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition text-sm">
                                            Attribuer
                                        </button>
                                    ` : `
                                        <button onclick="app.reactivateEmployee('${emp.id}')" 
                                            class="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition text-sm">
                                            Réactiver
                                        </button>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- Message si aucun résultat -->
                <div id="no-results" class="hidden bg-white rounded-xl shadow-lg p-12 text-center">
                    <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Aucun employé trouvé</h3>
                    <p class="text-gray-600">Essayez avec d'autres critères de recherche</p>
                </div>
            </div>
        </div>
    `;
}

// ... reste du fichier (les autres fonctions restent identiques)
