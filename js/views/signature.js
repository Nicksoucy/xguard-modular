// views/signature.js
export function renderSignature(app) {
    const link = app.db.data.links.find(l => l.token === app.currentToken);
    
    // Si le lien n'existe pas ou est déjà utilisé
    if (!link || link.used) {
        return `
            <div class="min-h-screen flex items-center justify-center p-4 gradient-bg">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
                    <div class="mb-6">
                        <div class="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto">
                            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Lien invalide</h2>
                    <p class="text-gray-600">Ce lien a déjà été utilisé ou n'existe pas.</p>
                </div>
            </div>
        `;
    }

    const transaction = app.db.data.transactions.find(t => t.id === link.transactionId);
    
    // Si la transaction n'existe pas
    if (!transaction) {
        return `
            <div class="min-h-screen flex items-center justify-center p-4 gradient-bg">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
                    <div class="mb-6">
                        <div class="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto">
                            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Transaction introuvable</h2>
                    <p class="text-gray-600">La transaction associée n'existe pas.</p>
                </div>
            </div>
        `;
    }

    const employee = app.db.getEmployee(transaction.employeeId);
    
    // Si l'employé n'existe pas
    if (!employee) {
        return `
            <div class="min-h-screen flex items-center justify-center p-4 gradient-bg">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
                    <div class="mb-6">
                        <div class="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto">
                            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Employé introuvable</h2>
                    <p class="text-gray-600">L'employé associé n'existe pas.</p>
                </div>
            </div>
        `;
    }
    
    const total = transaction.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return `
        <div class="min-h-screen bg-gray-50 p-4">
            <div class="max-w-2xl mx-auto animate-fade-in">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl font-bold text-white">X</span>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">
                            ${transaction.type === 'attribution' ? 'Attribution d\'uniformes' : 'Ajout d\'équipement'}
                        </h1>
                        <p class="text-gray-600">${employee.name}</p>
                    </div>
                </div>

                <!-- Détails -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">Articles</h2>
                    <div class="space-y-3">
                        ${transaction.items.map(item => `
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span class="font-medium">${item.name}</span>
                                    <span class="text-sm text-gray-600 ml-2">Taille: ${item.size} × ${item.quantity}</span>
                                </div>
                                <span class="font-semibold">$${item.price * item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="border-t mt-4 pt-4">
                        <div class="flex justify-between font-bold text-lg">
                            <span>Total à retenir si non retourné:</span>
                            <span class="text-red-600 text-2xl">$${total}</span>
                        </div>
                    </div>
                </div>

                <!-- Conditions -->
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
                    <p class="text-sm font-semibold mb-2">CONDITIONS IMPORTANTES:</p>
                    <ul class="text-sm space-y-1 list-disc list-inside">
                        <li>Je confirme avoir reçu les uniformes listés ci-dessus</li>
                        <li>En cas de démission ou renvoi, je dois retourner les uniformes dans les 5 jours ouvrables</li>
                        <li>Si je ne retourne pas les uniformes, le montant de <strong>$${total}</strong> sera déduit de ma dernière paie</li>
                        <li>Les uniformes restent la propriété de XGuard</li>
                    </ul>
                </div>

                <!-- Signature -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">Signature électronique</h2>
                    <p class="text-sm text-gray-600 mb-4">
                        En signant ci-dessous, j'accepte les conditions mentionnées
                    </p>
                    <canvas id="signature-pad" class="signature-pad w-full" height="200"></canvas>
                    <div class="mt-3 flex gap-3">
                        <button id="clear-signature" 
                            class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                            Effacer
                        </button>
                        <button id="submit-signature" 
                            class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition font-medium">
                            J'accepte et je signe
                        </button>
                    </div>
                </div>

                <div class="text-center text-sm text-gray-500">
                    <p>Date: ${new Date().toLocaleDateString('fr-CA')}</p>
                    <p>Code employé: ${employee.id}</p>
                </div>
            </div>
        </div>
    `;
}
