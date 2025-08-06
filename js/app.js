// app.js - Point d'entrée principal avec gestion de l'historique
import { Database } from './database.js';
import { renderHome } from './views/home.js';
import { renderEmployeesList, renderEmployeeDetails, renderNewEmployee, renderSelectEmployee } from './views/employees.js';
import { renderTransaction, renderTransactionsList } from './views/transactions.js';
import { renderInventory, renderInventoryManagement, renderNewInventoryItem } from './views/inventory.js';
import { renderSignature } from './views/signature.js';
import { 
    downloadEmployeeReport, 
    downloadInventoryReport, 
    downloadMovementsReport,
    copyLink,
    updateSizeFields,
    addCustomSize
} from './utils/helpers.js';

class XGuardApp {
    constructor() {
        this.db = new Database();
        this.currentView = 'home';
        this.currentEmployee = null;
        this.selection = [];
        this.transactionType = 'attribution';
        this.showInactive = false;
        
        // Vérifier si on a un token de signature
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            this.currentToken = token;
            this.currentView = 'signature';
        }

        // Exposer l'app globalement pour les onclick
        window.app = this;
        
        // Gérer l'historique du navigateur
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.view) {
                this.currentView = event.state.view;
                this.currentEmployee = event.state.employee || null;
                this.transactionType = event.state.transactionType || 'attribution';
                this.showInactive = event.state.showInactive || false;
                this.render();
            }
        });
        
        // Sauvegarder l'état initial
        if (!window.history.state) {
            window.history.replaceState({
                view: this.currentView,
                employee: this.currentEmployee,
                transactionType: this.transactionType,
                showInactive: this.showInactive
            }, '', window.location.href);
        }
        
        this.render();
    }

    render() {
        const app = document.getElementById('app');
        
        switch(this.currentView) {
            case 'home':
                app.innerHTML = renderHome(this);
                break;
            case 'newEmployee':
                app.innerHTML = renderNewEmployee(this);
                this.attachNewEmployeeEvents();
                break;
            case 'selectEmployee':
                app.innerHTML = renderSelectEmployee(this);
                break;
            case 'transaction':
                app.innerHTML = renderTransaction(this);
                break;
            case 'signature':
                app.innerHTML = renderSignature(this);
                this.attachSignatureEvents();
                break;
            case 'employeeDetails':
                app.innerHTML = renderEmployeeDetails(this);
                break;
            case 'employees':
                app.innerHTML = renderEmployeesList(this);
                break;
            case 'transactions':
                app.innerHTML = renderTransactionsList(this);
                break;
            case 'pendingSignatures':
                app.innerHTML = this.renderPendingSignatures();
                break;
            case 'lowStock':
                app.innerHTML = this.renderLowStock();
                break;
            case 'inventory':
                app.innerHTML = renderInventory(this);
                break;
            case 'inventoryManagement':
                app.innerHTML = renderInventoryManagement(this);
                break;
            case 'newInventoryItem':
                app.innerHTML = renderNewInventoryItem(this);
                this.attachNewInventoryItemEvents();
                break;
        }
    }

    navigateTo(view, params = {}) {
        // Mettre à jour l'état de l'application
        this.currentView = view;
        
        if (params.employee !== undefined) {
            this.currentEmployee = params.employee;
        }
        if (params.transactionType !== undefined) {
            this.transactionType = params.transactionType;
        }
        if (params.showInactive !== undefined) {
            this.showInactive = params.showInactive;
        }
        
        // Ajouter à l'historique du navigateur
        const state = {
            view: this.currentView,
            employee: this.currentEmployee,
            transactionType: this.transactionType,
            showInactive: this.showInactive
        };
        
        window.history.pushState(state, '', window.location.href);
        
        // Re-render
        this.render();
    }

    // Méthodes de navigation
    startTransaction(type) {
        this.transactionType = type;
        this.selection = [];
        this.navigateTo('selectEmployee', { transactionType: type });
    }

    startTransactionForEmployee(type, employeeId) {
        this.transactionType = type;
        this.currentEmployee = employeeId;
        this.selection = [];
        this.navigateTo('transaction', { 
            transactionType: type, 
            employee: employeeId 
        });
    }

    selectEmployee(employeeId) {
        this.currentEmployee = employeeId;
        this.navigateTo('transaction', { employee: employeeId });
    }

    // Gestion des employés
    filterEmployees(query) {
        const employees = this.db.searchEmployees(query);
        const listDiv = document.getElementById('employee-list');
        
        if (!listDiv) return;
        
        if (employees.length === 0) {
            listDiv.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun employé trouvé</p>';
            return;
        }

        listDiv.innerHTML = employees.map(emp => {
            const balance = this.db.getEmployeeBalance(emp.id);
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
        }).join('');
    }

    deactivateEmployee(employeeId) {
        if (confirm('Êtes-vous sûr de vouloir désactiver cet employé?')) {
            this.db.updateEmployee(employeeId, { active: false });
            this.navigateTo('employees');
        }
    }

    reactivateEmployee(employeeId) {
        this.db.updateEmployee(employeeId, { active: true });
        this.render();
    }

    // Gestion des transactions
    addToSelection(name, size, price, stock) {
        const existing = this.selection.find(s => s.name === name && s.size === size);
        
        if (existing) {
            if (existing.quantity < stock) {
                existing.quantity++;
            } else {
                alert(`Stock maximum disponible: ${stock}`);
                return;
            }
        } else {
            this.selection.push({
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
        
        this.selection = this.selection.filter(s => !(s.name === name && s.size === size));
        
        if (qty > 0) {
            this.selection.push({
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
        
        if (this.selection.length === 0) {
            summaryDiv.innerHTML = '<p class="text-gray-500 text-center py-4">Aucun article sélectionné</p>';
            totalDiv.textContent = '$0';
            return;
        }

        summaryDiv.innerHTML = this.selection.map(item => `
            <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span>${item.name} - ${item.size} (×${item.quantity})</span>
                <span class="font-medium">$${item.price * item.quantity}</span>
            </div>
        `).join('');

        const total = this.selection.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalDiv.textContent = `$${total}`;
    }

    validateTransaction() {
        if (this.selection.length === 0) {
            alert('Veuillez sélectionner au moins un article');
            return;
        }

        const notes = document.getElementById('transaction-notes')?.value || '';
        
        const transaction = this.db.createTransaction(
            this.transactionType,
            this.currentEmployee,
            this.selection,
            notes
        );

        if (this.transactionType === 'retour') {
            alert('Retour enregistré avec succès!');
            this.navigateTo('home');
        } else {
            const employee = this.db.getEmployee(this.currentEmployee);
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

    // Modals d'inventaire
    showPurchaseModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-fade-in">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Enregistrer un achat</h3>
                <form id="purchase-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Article</label>
                        <select id="purchase-item" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                            <option value="">Sélectionner un article</option>
                            ${this.db.data.inventory.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}
                        </select>
                    </div>
                    <div id="purchase-size-container" style="display:none;">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Taille</label>
                        <select id="purchase-size" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                        <input type="number" id="purchase-quantity" min="1" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Coût total</label>
                        <input type="number" id="purchase-cost" min="0" step="0.01" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fournisseur</label>
                        <input type="text" id="purchase-supplier" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea id="purchase-notes" rows="3" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>
                    <div class="flex gap-4 mt-6">
                        <button type="button" onclick="document.body.removeChild(this.closest('.fixed'))" 
                            class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition">
                            Annuler
                        </button>
                        <button type="submit" 
                            class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition font-medium">
                            Enregistrer l'achat
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Gérer le changement d'article
        document.getElementById('purchase-item').addEventListener('change', (e) => {
            const itemName = e.target.value;
            const sizeContainer = document.getElementById('purchase-size-container');
            const sizeSelect = document.getElementById('purchase-size');
            
            if (itemName) {
                const item = this.db.data.inventory.find(i => i.name === itemName);
                if (item) {
                    sizeSelect.innerHTML = Object.keys(item.sizes).map(size => 
                        `<option value="${size}">${size}</option>`
                    ).join('');
                    sizeContainer.style.display = 'block';
                }
            } else {
                sizeContainer.style.display = 'none';
            }
        });

        // Gérer la soumission
        document.getElementById('purchase-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const item = document.getElementById('purchase-item').value;
            const size = document.getElementById('purchase-size').value;
            const quantity = parseInt(document.getElementById('purchase-quantity').value);
            const cost = parseFloat(document.getElementById('purchase-cost').value);
            const supplier = document.getElementById('purchase-supplier').value;
            const notes = document.getElementById('purchase-notes').value;

            this.db.recordPurchase(item, size, quantity, cost, supplier, notes);
            alert('Achat enregistré avec succès!');
            document.body.removeChild(modal);
            this.render();
        });
    }

    showAdjustmentModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-fade-in">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Ajustement d'inventaire</h3>
                <form id="adjustment-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Article</label>
                        <select id="adjust-item" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                            <option value="">Sélectionner un article</option>
                            ${this.db.data.inventory.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}
                        </select>
                    </div>
                    <div id="adjust-size-container" style="display:none;">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Taille</label>
                        <select id="adjust-size" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Type d'ajustement</label>
                        <select id="adjust-type" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                            <option value="add">Ajouter au stock</option>
                            <option value="remove">Retirer du stock</option>
                            <option value="set">Définir le stock à</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Quantité</label>
                        <input type="number" id="adjust-quantity" min="0" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Raison</label>
                        <select id="adjust-reason" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                            <option value="inventory">Inventaire physique</option>
                            <option value="damage">Articles endommagés</option>
                            <option value="loss">Perte</option>
                            <option value="correction">Correction d'erreur</option>
                            <option value="other">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea id="adjust-notes" rows="3" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>
                    <div class="flex gap-4 mt-6">
                        <button type="button" onclick="document.body.removeChild(this.closest('.fixed'))" 
                            class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition">
                            Annuler
                        </button>
                        <button type="submit" 
                            class="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition font-medium">
                            Appliquer l'ajustement
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Gérer le changement d'article
        document.getElementById('adjust-item').addEventListener('change', (e) => {
            const itemName = e.target.value;
            const sizeContainer = document.getElementById('adjust-size-container');
            const sizeSelect = document.getElementById('adjust-size');
            
            if (itemName) {
                const item = this.db.data.inventory.find(i => i.name === itemName);
                if (item) {
                    sizeSelect.innerHTML = Object.keys(item.sizes).map(size => 
                        `<option value="${size}">${size} (Stock actuel: ${item.sizes[size]})</option>`
                    ).join('');
                    sizeContainer.style.display = 'block';
                }
            } else {
                sizeContainer.style.display = 'none';
            }
        });

        // Gérer la soumission
        document.getElementById('adjustment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const itemName = document.getElementById('adjust-item').value;
            const size = document.getElementById('adjust-size').value;
            const type = document.getElementById('adjust-type').value;
            const quantity = parseInt(document.getElementById('adjust-quantity').value);
            const reason = document.getElementById('adjust-reason').value;
            const notes = document.getElementById('adjust-notes').value;

            const item = this.db.data.inventory.find(i => i.name === itemName);
            const currentStock = item.sizes[size];
            
            let adjustmentQty = 0;
            if (type === 'add') {
                adjustmentQty = quantity;
            } else if (type === 'remove') {
                adjustmentQty = -quantity;
            } else if (type === 'set') {
                adjustmentQty = quantity - currentStock;
            }

            this.db.recordAdjustment(itemName, size, adjustmentQty, reason, notes);
            alert('Ajustement enregistré avec succès!');
            document.body.removeChild(modal);
            this.render();
        });
    }

    showAdjustStockModal(itemName, size) {
        this.showAdjustmentModal();
        setTimeout(() => {
            document.getElementById('adjust-item').value = itemName;
            document.getElementById('adjust-item').dispatchEvent(new Event('change'));
            setTimeout(() => {
                document.getElementById('adjust-size').value = size;
            }, 100);
        }, 100);
    }

    // Vues qui restent dans app.js pour l'instant (à modulariser plus tard)
    renderPendingSignatures() {
        const pendingLinks = this.db.data.links.filter(l => !l.used);
        const pendingTransactions = pendingLinks.map(link => ({
            link,
            transaction: this.db.data.transactions.find(t => t.id === link.transactionId)
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
                                const employee = this.db.getEmployee(transaction.employeeId);
                                const total = transaction.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                const linkUrl = `${window.location.origin}${window.location.pathname}?token=${link.token}`;
                                const daysAgo = Math.floor((new Date() - new Date(transaction.createdAt)) / (1000 * 60 * 60 * 24));
                                
                                return `
                                    <div class="bg-white rounded-xl shadow-lg p-6 hover-lift animate-fade-in border-l-4 border-orange-500">
                                        <div class="flex justify-between items-start mb-4">
                                            <div>
                                                <p class="font-semibold text-lg">${employee ? employee.name : 'Employé supprimé'}</p>
                                                <p class="text-sm text-gray-600">Créé il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}</p>
                                                <p class="text-sm text-gray-600">${new Date(transaction.createdAt).toLocaleString('fr-CA')}</p>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-2xl font-bold text-gray-800">$${total}</p>
                                                <p class="text-sm text-gray-500">${transaction.items.length} articles</p>
                                            </div>
                                        </div>
                                        <div class="border-t pt-4 mb-4">
                                            <div class="flex flex-wrap gap-2">
                                                ${transaction.items.map(item => `
                                                    <span class="px-2 py-1 bg-gray-100 rounded text-xs">
                                                        ${item.quantity}× ${item.name} (${item.size})
                                                    </span>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="bg-orange-50 rounded-lg p-4">
                                            <p class="text-sm font-semibold mb-2">Lien de signature:</p>
                                            <div class="flex items-center gap-2">
                                                <input type="text" value="${linkUrl}" readonly 
                                                    class="flex-1 px-3 py-2 bg-white border rounded-lg text-xs" id="link-${link.token}">
                                                <button onclick="app.copyLink('${linkUrl}')" 
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

    renderLowStock() {
        const lowStockItems = this.db.data.inventory.filter(item => 
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

    renderError(title, message) {
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
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">${title}</h2>
                    <p class="text-gray-600">${message}</p>
                </div>
            </div>
        `;
    }

    // Event Handlers
    attachNewEmployeeEvents() {
        const form = document.getElementById('new-employee-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const employee = {
                name: document.getElementById('emp-name').value,
                phone: document.getElementById('emp-phone').value,
                email: document.getElementById('emp-email').value,
                notes: document.getElementById('emp-notes').value
            };

            const newEmp = this.db.addEmployee(employee);
            this.currentEmployee = newEmp.id;
            this.navigateTo('transaction', { employee: newEmp.id });
        });
    }

    attachSignatureEvents() {
        const canvas = document.getElementById('signature-pad');
        if (!canvas) return;

        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });

        // Redimensionner
        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Boutons
        const clearBtn = document.getElementById('clear-signature');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                signaturePad.clear();
            });
        }

        const submitBtn = document.getElementById('submit-signature');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (signaturePad.isEmpty()) {
                    alert('Veuillez signer avant de soumettre');
                    return;
                }

                const signature = {
                    data: signaturePad.toDataURL(),
                    timestamp: new Date().toISOString()
                };

                const transaction = this.db.signTransaction(this.currentToken, signature);
                
                if (transaction) {
                    const employee = this.db.getEmployee(transaction.employeeId);
                    this.showSignatureSuccess(employee);
                }
            });
        }
    }

    showSignatureSuccess(employee) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-4 gradient-bg">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
                    <div class="mb-6">
                        <div class="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">Signature confirmée!</h2>
                    <div class="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                        <p class="text-sm mb-2"><span class="text-gray-600">Employé:</span> <span class="font-medium">${employee.name}</span></p>
                        <p class="text-sm mb-2"><span class="text-gray-600">Code:</span> <span class="font-medium">${employee.id}</span></p>
                        <p class="text-sm"><span class="text-gray-600">Date:</span> <span class="font-medium">${new Date().toLocaleString('fr-CA')}</span></p>
                    </div>
                    <p class="text-gray-600">La transaction a été enregistrée avec succès.</p>
                </div>
            </div>
        `;
    }

    attachNewInventoryItemEvents() {
        const form = document.getElementById('new-inventory-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('item-name').value;
            const category = document.getElementById('item-category').value;
            const price = parseFloat(document.getElementById('item-price').value);
            
            const sizes = {};
            document.querySelectorAll('[data-size-input]').forEach(input => {
                const size = input.dataset.size;
                const quantity = parseInt(input.value) || 0;
                if (quantity > 0) {
                    sizes[size] = quantity;
                }
            });
            
            if (Object.keys(sizes).length === 0) {
                alert('Veuillez définir au moins une taille avec une quantité');
                return;
            }
            
            const newItem = {
                id: Date.now(),
                name,
                category,
                price,
                sizes
            };
            
            this.db.data.inventory.push(newItem);
            this.db.save();
            
            alert('Article ajouté avec succès!');
            this.navigateTo('inventoryManagement');
        });
    }

    // Méthodes utilitaires
    copyLink(url) {
        copyLink(url);
    }

    updateSizeFields(type) {
        updateSizeFields(type);
    }

    addCustomSize() {
        addCustomSize();
    }

    downloadEmployeeReport() {
        downloadEmployeeReport(this.db);
    }

    downloadInventoryReport() {
        downloadInventoryReport(this.db);
    }

    downloadMovementsReport() {
        downloadMovementsReport(this.db);
    }
}

// Initialiser l'application
new XGuardApp();
