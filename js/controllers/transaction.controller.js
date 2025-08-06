export class TransactionController {
    constructor(app) {
        this.app = app;
    }

    startTransaction(type) {
        this.app.transactionType = type;
        this.app.selection = [];
        this.app.navigateTo('selectEmployee', { transactionType: type });
    }

    startTransactionForEmployee(type, employeeId) {
        this.app.transactionType = type;
        this.app.currentEmployee = employeeId;
        this.app.selection = [];
        this.app.navigateTo('transaction', { 
            transactionType: type, 
            employee: employeeId 
        });
    }

    addToSelection(name, size, price, stock) {
        const existing = this.app.selection.find(s => s.name === name && s.size === size);
        
        if (existing) {
            if (existing.quantity < stock) {
                existing.quantity++;
            } else {
                alert(`Stock maximum disponible: ${stock}`);
                return;
            }
        } else {
            this.app.selection.push({
                name,
                size,
                quantity: 1,
                price
            });
        }

        this.updateSelectionSummary();
    }

    updateReturnQuantity(name, size, price, quantity) {
        const qty = parseInt(quantity) || 0;
        
        this.app.selection = this.app.selection.filter(s => !(s.name === name && s.size === size));
        
        if (qty > 0) {
            this.app.selection.push({
                name,
                size,
                quantity: qty,
                price
            });
        }

        this.updateSelectionSummary();
    }

    updateSelectionSummary() {
        const summaryDiv = document.getElementById('selection-summary');
        const totalDiv = document.getElementById('total-price');
        
        if (!summaryDiv || !totalDiv) return;
        
        if (this.app.selection.length === 0) {
            summaryDiv.innerHTML = '<p class="text-gray-500 text-center py-4">Aucun article sélectionné</p>';
            totalDiv.textContent = '$0';
            return;
        }

        summaryDiv.innerHTML = this.app.selection.map(item => `
            <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span>${item.name} - ${item.size} (×${item.quantity})</span>
                <span class="font-medium">$${item.price * item.quantity}</span>
            </div>
        `).join('');

        const total = this.app.selection.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalDiv.textContent = `$${total}`;
    }

    validateTransaction() {
        if (this.app.selection.length === 0) {
            alert('Veuillez sélectionner au moins un article');
            return;
        }

        const notes = document.getElementById('transaction-notes')?.value || '';
        
        const transaction = this.app.db.createTransaction(
            this.app.transactionType,
            this.app.currentEmployee,
            this.app.selection,
            notes
        );

        if (this.app.transactionType === 'retour') {
            alert('Retour enregistré avec succès!');
            this.app.navigateTo('home');
        } else {
            const employee = this.app.db.getEmployee(this.app.currentEmployee);
            const linkUrl = `${window.location.origin}${window.location.pathname}?token=${transaction.linkToken}`;
            
            this.showSuccessModal(employee, linkUrl);
        }
    }

    showSuccessModal(employee, linkUrl) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-fade-in">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Lien généré avec succès!</h3>
                    <p class="text-gray-600">Envoyez ce lien à ${employee.name}</p>
                </div>
                
                <div class="bg-gray-50 rounded-xl p-4 mb-6">
                    <p class="text-sm text-gray-600 mb-3">Lien de signature:</p>
                    <div class="flex items-center gap-2">
                        <input type="text" value="${linkUrl}" readonly 
                            class="flex-1 px-3 py-2 bg-white border rounded-lg text-sm" id="modal-link-input">
                        <button onclick="app.copyLink('${linkUrl}')" 
                            class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition">
                            Copier
                        </button>
                    </div>
                </div>
                
                <div class="bg-blue-50 rounded-xl p-4 mb-6">
                    <p class="text-sm font-semibold mb-2">Message SMS suggéré:</p>
                    <textarea readonly rows="6" class="w-full p-3 bg-white rounded-lg text-xs border">Bonjour ${employee.name},

Vos uniformes XGuard sont prêts. Veuillez confirmer la réception en signant sur ce lien:

${linkUrl}

Merci,
XGuard Réception</textarea>
                </div>
                
                <button onclick="document.body.removeChild(this.closest('.fixed')); app.navigateTo('home');" 
                    class="w-full bg-gray-800 text-white py-3 rounded-xl hover:bg-gray-900 transition font-medium">
                    Fermer et terminer
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}
