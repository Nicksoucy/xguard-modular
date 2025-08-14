// views/employees.js - Toutes les vues liées aux employés

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

export function renderEmployeeDetails(app) {
    const employee = app.db.getEmployee(app.currentEmployee);
    if (!employee) {
        return app.renderError('Employé introuvable', 'Cet employé n\'existe pas.');
    }

    const transactions = app.db.getEmployeeTransactions(app.currentEmployee);
    const balance = app.db.getEmployeeBalance(app.currentEmployee);
    const totalValue = balance.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Détails de l'employé</h1>
                    <div class="flex gap-2">
                        <button onclick="app.navigateTo('employees')" 
                            class="p-2 hover:bg-white/20 rounded-lg transition" title="Retour">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                        </button>
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
                <!-- Info employé -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-2xl font-bold mb-2">${employee.name}</h2>
                            <p class="text-gray-600">${employee.id}</p>
                            <p class="text-gray-600">${employee.phone}</p>
                            ${employee.email ? `<p class="text-gray-600">${employee.email}</p>` : ''}
                            ${employee.notes ? `<p class="text-sm text-gray-500 mt-2 italic">${employee.notes}</p>` : ''}
                            ${!employee.active ? '<span class="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded">Employé inactif</span>' : ''}
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Valeur totale</p>
                            <p class="text-3xl font-bold text-green-600">$${totalValue}</p>
                            <p class="text-sm text-gray-500 mt-2">${balance.length} articles</p>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-2">
                        ${employee.active ? `
                            <button onclick="app.startTransactionForEmployee('attribution', '${employee.id}')" 
                                class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                                Attribution
                            </button>
                            <button onclick="app.startTransactionForEmployee('retour', '${employee.id}')" 
                                class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                                Retour
                            </button>
                            <button onclick="app.startTransactionForEmployee('ajout', '${employee.id}')" 
                                class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition">
                                Ajout
                            </button>
                            ${balance.length === 0 ? `
                                <button onclick="app.deactivateEmployee('${employee.id}')" 
                                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition ml-auto">
                                    <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                                    </svg>
                                    Désactiver l'employé
                                </button>
                            ` : ''}
                        ` : `
                            <button onclick="app.reactivateEmployee('${employee.id}')" 
                                class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Réactiver l'employé
                            </button>
                        `}
                    </div>
                    ${employee.active && balance.length > 0 ? `
                        <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p class="text-sm text-yellow-800">
                                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                L'employé doit retourner tous ses articles avant d'être désactivé
                            </p>
                        </div>
                    ` : ''}
                </div>

                <!-- Inventaire actuel -->
                ${balance.length > 0 ? `
                    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <h3 class="text-xl font-semibold mb-4">Articles en possession</h3>
                        <div class="grid md:grid-cols-2 gap-3">
                            ${balance.map(item => `
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <span class="font-medium">${item.name}</span>
                                            <span class="text-sm text-gray-600 ml-2">Taille: ${item.size}</span>
                                        </div>
                                        <div class="text-right">
                                            <span class="text-lg font-bold">${item.quantity}</span>
                                            <span class="text-sm text-gray-600 ml-1">× $${item.price}</span>
                                        </div>
                                    </div>
                                    <p class="text-sm text-green-600 font-semibold mt-1">$${item.quantity * item.price}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Historique -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4">Historique des transactions</h3>
                    ${transactions.length > 0 ? `
                        <div class="space-y-3">
                            ${transactions.map(t => {
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
                                    <div class="border rounded-lg p-4">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <span class="px-2 py-1 ${typeClasses} rounded text-sm font-medium">
                                                    ${typeText}
                                                </span>
                                                ${t.signed ? `
                                            <div class="mt-3 text-right">
                                                <button onclick="app.generatePDF(\`${t.id}\`)" 
                                                    class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm">
                                                    <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                    </svg>
                                                    PDF
                                                </button>
                                            </div>
                                        ` : ''}
                                            </div>
                                            <p class="text-sm text-gray-600">${new Date(t.createdAt).toLocaleString('fr-CA')}</p>
                                        </div>
                                        <div class="flex flex-wrap gap-2 mb-2">
                                            ${t.items.map(item => `
                                                <span class="px-2 py-1 bg-gray-100 rounded text-xs">
                                                    ${item.quantity}× ${item.name} (${item.size})
                                                </span>
                                            `).join('')}
                                        </div>
                                        <p class="text-right font-semibold ${t.type === 'retour' ? 'text-green-600' : ''}">
                                            ${t.type === 'retour' ? '-' : '+'}$${total}
                                        </p>
                                        ${t.notes ? `<p class="text-sm text-gray-600 mt-2 italic">Note: ${t.notes}</p>` : ''}
                                        ${t.signed ? `
                                            <div class="mt-3 text-right">
                                                <button onclick="app.generatePDF('${t.id}')" 
                                                    class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm">
                                                    <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                    </svg>
                                                    PDF
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<p class="text-gray-500 text-center py-8">Aucune transaction</p>'}
                </div>
            </div>
        </div>
    `;
}

export function renderNewEmployee(app) {
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-4xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Nouvel employé</h1>
                    <div class="flex gap-2">
                        <button onclick="app.navigateTo('home')" 
                            class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                        </button>
                        <button onclick="window.history.back()" 
                            class="p-2 hover:bg-white/20 rounded-lg transition" title="Retour">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="max-w-lg mx-auto p-6 animate-fade-in">
                <div class="bg-white rounded-2xl shadow-xl p-8">
                    <h2 class="text-xl font-semibold mb-6">Informations de l'employé</h2>
                    
                    <form id="new-employee-form" class="space-y-5">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                            <input type="text" id="emp-name" required 
                                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                            <input type="tel" id="emp-phone" required 
                                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                placeholder="+1 514 123 4567">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="emp-email" 
                                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea id="emp-notes" rows="3"
                                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"></textarea>
                        </div>

                        <button type="submit" 
                            class="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            Créer et continuer
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

export function renderSelectEmployee(app) {
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-4xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">
                        ${app.transactionType === 'attribution' ? 'Nouvelle attribution' : 
                          app.transactionType === 'retour' ? 'Retour d\'uniformes' : 
                          'Ajout d\'équipement'}
                    </h1>
                    <button onclick="app.navigateTo('home')" 
                        class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="max-w-4xl mx-auto p-6 animate-fade-in">
                <div class="bg-white rounded-2xl shadow-xl p-8">
                    <h2 class="text-xl font-semibold mb-6">Sélectionner un employé</h2>
                    
                    <!-- Recherche avec style moderne -->
                    <div class="mb-6">
                        <div class="relative">
                            <svg class="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <input type="text" id="employee-search" 
                                placeholder="Rechercher par nom, code ou téléphone..." 
                                class="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                oninput="app.filterEmployees(this.value)">
                        </div>
                    </div>

                    <!-- Bouton nouvel employé -->
                    <div class="mb-6">
                        <button onclick="app.navigateTo('newEmployee')" 
                            class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                            </svg>
                            Ajouter un nouvel employé
                        </button>
                    </div>

                    <!-- Liste des employés -->
                    <div id="employee-list" class="space-y-3 max-h-96 overflow-y-auto">
                        ${app.db.data.employees
                            .filter(e => e.active)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(emp => {
                                const balance = app.db.getEmployeeBalance(emp.id);
                                const totalItems = balance.reduce((sum, item) => sum + item.quantity, 0);
                                return `
                                    <button onclick="app.selectEmployee('${emp.id}')" 
                                        class="employee-item w-full text-left p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all group">
                                        <div class="flex justify-between items-center">
                                            <div class="flex items-center">
                                                <div class="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                                    <span class="text-purple-600 font-bold">${emp.name.substring(0, 1)}</span>
                                                </div>
                                                <div>
                                                    <div class="font-semibold text-gray-800">${emp.name}</div>
                                                    <div class="text-sm text-gray-600">
                                                        ${emp.id} • ${emp.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-2xl font-bold text-gray-800">${totalItems}</div>
                                                <div class="text-xs text-gray-500">articles</div>
                                            </div>
                                        </div>
                                    </button>
                                `;
                            }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}
