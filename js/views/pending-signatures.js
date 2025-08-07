export function renderPendingSignatures(app) {
    const pendingLinks = app.db.data.links.filter(l => !l.used);
    const pendingTransactions = pendingLinks.map(link => ({
        link,
        transaction: app.db.data.transactions.find(t => t.id === link.transactionId)
    })).filter(item => item.transaction);
    
    return `
        <div class="min-h-screen gradient-bg">
            <!-- Header -->
            <div class="glass-effect shadow-lg">
                <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold text-gray-800">Signatures en attente</h1>
                    <button onclick="app.navigateTo('home')" 
                        class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="max-w-6xl mx-auto p-6">
                ${pendingTransactions.length === 0 ? `
                    <div class="bg-white rounded-xl shadow-lg p-12 text-center">
                        <div class="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-800 mb-2">Aucune signature en attente</h2>
                        <p class="text-gray-600">Toutes les transactions ont été signées</p>
                    </div>
                ` : `
                    <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
                        <p class="text-lg font-semibold text-orange-600">${pendingTransactions.length} signatures en attente</p>
                    </div>

                    <div class="space-y-4">
                        ${pendingTransactions.map(({ link, transaction }) => {
                            const employee = app.db.getEmployee(transaction.employeeId);
                            const total = transaction.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            const linkUrl = \`\${window.location.origin}\${window.location.pathname}?token=\${link.token}\`;
                            const daysAgo = Math.floor((new Date() - new Date(transaction.createdAt)) / (1000 * 60 * 60 * 24));
                            
                            return `
                                <div class="bg-white rounded-xl shadow-lg p-6 hover-lift animate-fade-in border-l-4 border-orange-500">
                                    <div class="flex justify-between items-start mb-4">
                                        <div>
                                            <p class="font-semibold text-lg">\${employee ? employee.name : 'Employé supprimé'}</p>
                                            <p class="text-sm text-gray-600">Créé il y a \${daysAgo} jour\${daysAgo > 1 ? 's' : ''}</p>
                                            <p class="text-sm text-gray-600">\${new Date(transaction.createdAt).toLocaleString('fr-CA')}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-2xl font-bold text-gray-800">$\${total}</p>
                                            <p class="text-sm text-gray-500">\${transaction.items.length} articles</p>
                                        </div>
                                    </div>
                                    <div class="border-t pt-4 mb-4">
                                        <div class="flex flex-wrap gap-2">
                                            \${transaction.items.map(item => \`
                                                <span class="px-2 py-1 bg-gray-100 rounded text-xs">
                                                    \${item.quantity}× \${item.name} (\${item.size})
                                                </span>
                                            \`).join('')}
                                        </div>
                                    </div>
                                    <div class="bg-orange-50 rounded-lg p-4">
                                        <p class="text-sm font-semibold mb-2">Lien de signature:</p>
                                        <div class="flex items-center gap-2">
                                            <input type="text" value="\${linkUrl}" readonly 
                                                class="flex-1 px-3 py-2 bg-white border rounded-lg text-xs" id="link-\${link.token}">
                                            <button onclick="app.copyLink('\${linkUrl}')" 
                                                class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                                                Copier
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}
