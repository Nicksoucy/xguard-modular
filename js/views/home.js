// home.js - Vue d'accueil
export function renderHome(app) {
    const stats = {
        totalEmployees: app.db.data.employees.filter(e => e.active).length,
        totalTransactions: app.db.data.transactions.length,
        pendingSignatures: app.db.data.links.filter(l => !l.used).length,
        lowStock: app.db.data.inventory.filter(item => 
            Object.values(item.sizes).some(qty => qty < 10)
        ).length
    };

    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header moderne avec effet verre -->
            <div class="glass-effect shadow-lg animate-slide-in">
                <div class="max-w-7xl mx-auto px-6 py-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                                <span class="text-2xl font-bold gradient-text">X</span>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-800">XGuard</h1>
                                <p class="text-sm text-gray-600">Système de Gestion des Uniformes</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-600">${new Date().toLocaleDateString('fr-CA')}</p>
                            <p class="text-xs text-gray-500">Interface Réception</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="max-w-7xl mx-auto p-6">
                <!-- Statistiques avec animation -->
                <div class="grid md:grid-cols-4 gap-6 mb-8 animate-fade-in">
                    <div onclick="app.currentView='employees'; app.render()" 
                        class="stat-card rounded-xl shadow-lg p-6 hover-lift cursor-pointer">
                        <div class="flex items-center justify-between mb-2">
                            <div class="p-3 bg-blue-100 rounded-lg">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <span class="text-3xl font-bold text-gray-800">${stats.totalEmployees}</span>
                        </div>
                        <p class="text-sm text-gray-600">Employés actifs</p>
                    </div>

                    <div onclick="app.currentView='transactions'; app.render()" 
                        class="stat-card rounded-xl shadow-lg p-6 hover-lift cursor-pointer">
                        <div class="flex items-center justify-between mb-2">
                            <div class="p-3 bg-green-100 rounded-lg">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                            </div>
                            <span class="text-3xl font-bold text-gray-800">${stats.totalTransactions}</span>
                        </div>
                        <p class="text-sm text-gray-600">Transactions totales</p>
                    </div>

                    <div onclick="app.currentView='pendingSignatures'; app.render()" 
                        class="stat-card rounded-xl shadow-lg p-6 hover-lift cursor-pointer">
                        <div class="flex items-center justify-between mb-2">
                            <div class="p-3 bg-orange-100 rounded-lg">
                                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <span class="text-3xl font-bold text-orange-600">${stats.pendingSignatures}</span>
                        </div>
                        <p class="text-sm text-gray-600">En attente signature</p>
                    </div>

                    <div onclick="app.currentView='lowStock'; app.render()" 
                        class="stat-card rounded-xl shadow-lg p-6 hover-lift cursor-pointer">
                        <div class="flex items-center justify-between mb-2">
                            <div class="p-3 bg-red-100 rounded-lg">
                                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </div>
                            <span class="text-3xl font-bold text-red-600">${stats.lowStock}</span>
                        </div>
                        <p class="text-sm text-gray-600">Stock faible</p>
                    </div>
                </div>

                <!-- Actions principales avec design moderne -->
                <div class="grid md:grid-cols-3 gap-6 mb-8">
                    <button onclick="app.startTransaction('attribution')" 
                        class="group bg-white rounded-2xl shadow-xl p-8 hover-lift text-center animate-fade-in"
                        style="animation-delay: 0.1s">
                        <div class="mb-6 relative">
                            <div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:animate-pulse">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Nouvelle attribution</h3>
                        <p class="text-gray-600 text-sm">Donner des uniformes à un employé</p>
                    </button>

                    <button onclick="app.startTransaction('retour')" 
                        class="group bg-white rounded-2xl shadow-xl p-8 hover-lift text-center animate-fade-in"
                        style="animation-delay: 0.2s">
                        <div class="mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:animate-pulse">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Retour d'uniformes</h3>
                        <p class="text-gray-600 text-sm">Enregistrer un retour d'équipement</p>
                    </button>

                    <button onclick="app.startTransaction('ajout')" 
                        class="group bg-white rounded-2xl shadow-xl p-8 hover-lift text-center animate-fade-in"
                        style="animation-delay: 0.3s">
                        <div class="mb-6">
                            <div class="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:animate-pulse">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Ajout d'équipement</h3>
                        <p class="text-gray-600 text-sm">Ajouter des uniformes supplémentaires</p>
                    </button>
                </div>

                <!-- Actions secondaires -->
                <div class="grid md:grid-cols-3 gap-4 animate-fade-in" style="animation-delay: 0.4s">
                    <button onclick="app.currentView='selectEmployee'; app.render()" 
                        class="bg-white/90 backdrop-blur rounded-xl p-6 hover:bg-white transition-all duration-300 flex items-center group">
                        <div class="p-4 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <div class="text-left">
                            <div class="font-bold text-gray-800">Gestion des employés</div>
                            <div class="text-sm text-gray-600">Voir la liste et l'historique</div>
                        </div>
                    </button>

                    <button onclick="app.currentView='inventory'; app.render()" 
                        class="bg-white/90 backdrop-blur rounded-xl p-6 hover:bg-white transition-all duration-300 flex items-center group">
                        <div class="p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <div class="text-left">
                            <div class="font-bold text-gray-800">État de l'inventaire</div>
                            <div class="text-sm text-gray-600">Voir les stocks disponibles</div>
                        </div>
                    </button>

                    <button onclick="app.currentView='inventoryManagement'; app.render()" 
                        class="bg-white/90 backdrop-blur rounded-xl p-6 hover:bg-white transition-all duration-300 flex items-center group">
                        <div class="p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <div class="text-left">
                            <div class="font-bold text-gray-800">Gestion d'inventaire</div>
                            <div class="text-sm text-gray-600">Achats et ajustements</div>
                        </div>
                    </button>
                </div>

                <!-- Footer avec boutons de téléchargement -->
                <div class="mt-12 text-center animate-fade-in" style="animation-delay: 0.5s">
                    <div class="flex flex-wrap gap-4 justify-center">
                        <button onclick="app.downloadEmployeeReport()" 
                            class="text-sm text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur px-6 py-2 rounded-full">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Rapport "Qui a quoi" (CSV)
                        </button>
                        <button onclick="app.downloadInventoryReport()" 
                            class="text-sm text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur px-6 py-2 rounded-full">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Inventaire complet (CSV)
                        </button>
                        <button onclick="app.downloadMovementsReport()" 
                            class="text-sm text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur px-6 py-2 rounded-full">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            Mouvements d'inventaire (CSV)
                        </button>
                        <button onclick="app.db.exportData()" 
                            class="text-sm text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur px-6 py-2 rounded-full">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                            </svg>
                            Sauvegarde complète (JSON)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
