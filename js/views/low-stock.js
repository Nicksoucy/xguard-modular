export function renderLowStock(app) {
    const lowStockItems = app.db.data.inventory.filter(item => 
        Object.values(item.sizes).some(qty => qty < 10)
    );
    
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Articles en stock faible</h1>
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
                    <div class="flex justify-between items-center">
                        <p class="text-lg font-semibold text-red-600">${lowStockItems.length} articles avec stock faible</p>
                        <button onclick="app.downloadInventoryReport()" 
                            class="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition">
                            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Télécharger inventaire
                        </button>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    ${lowStockItems.map(item => {
                        const totalStock = Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0);
                        const criticalSizes = Object.entries(item.sizes).filter(([size, qty]) => qty < 10);
                        const outOfStock = Object.entries(item.sizes).filter(([size, qty]) => qty === 0);
                        
                        return `
                            <div class="bg-white rounded-xl shadow-lg p-6 hover-lift animate-fade-in border-l-4 ${totalStock < 10 ? 'border-red-500' : 'border-orange-500'}">
                                <div class="flex justify-between items-start mb-4">
                                    <h3 class="font-semibold text-lg">${item.name}</h3>
                                    <div class="text-right">
                                        <p class="text-sm text-gray-500">Stock total</p>
                                        <p class="text-3xl font-bold ${totalStock < 10 ? 'text-red-600' : 'text-orange-600'}">${totalStock}</p>
                                    </div>
                                </div>
                                
                                ${outOfStock.length > 0 ? `
                                    <div class="bg-red-50 rounded-lg p-3 mb-3">
                                        <p class="text-sm font-semibold text-red-700 mb-1">Rupture de stock:</p>
                                        <div class="flex flex-wrap gap-2">
                                            ${outOfStock.map(([size]) => `
                                                <span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                    ${size}
                                                </span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="bg-orange-50 rounded-lg p-3">
                                    <p class="text-sm font-semibold text-orange-700 mb-1">Stock faible:</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${criticalSizes.map(([size, qty]) => `
                                            <span class="px-3 py-1 ${qty === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'} rounded-full text-sm font-medium">
                                                ${size}: ${qty}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="mt-4 pt-4 border-t">
                                    <p class="text-sm text-gray-600">Prix unitaire: <span class="font-semibold">$${item.price}</span></p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}
