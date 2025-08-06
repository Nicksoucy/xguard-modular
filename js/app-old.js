// ==================== BASE DE DONNÉES ====================
class Database {
    constructor() {
        this.data = this.load() || {
            employees: [],
            transactions: [],
            inventory: this.getDefaultInventory(),
            links: [],
            movements: []
        };
        this.initSampleData();
    }

    getDefaultInventory() {
        return [
            { id: 1, name: 'Chemise ML', sizes: { S: 50, M: 100, L: 75, XL: 40, XXL: 20, '3XL': 10 }, price: 30, category: 'Hauts' },
            { id: 2, name: 'Chemise MC', sizes: { S: 60, M: 120, L: 80, XL: 45, XXL: 25, '3XL': 10 }, price: 30, category: 'Hauts' },
            { id: 3, name: 'Col rond', sizes: { S: 40, M: 80, L: 60, XL: 30, XXL: 15 }, price: 20, category: 'Hauts' },
            { id: 4, name: 'Polo', sizes: { S: 40, M: 80, L: 60, XL: 30, XXL: 15 }, price: 15, category: 'Hauts' },
            { id: 5, name: 'Tuque', sizes: { Unique: 60 }, price: 8, category: 'Accessoires' },
            { id: 6, name: 'Casquette', sizes: { Unique: 80 }, price: 8, category: 'Accessoires' },
            { id: 7, name: 'Ceinture', sizes: { Unique: 100 }, price: 10, category: 'Accessoires' },
            { id: 8, name: 'Pantalon', sizes: { S: 30, M: 70, L: 50, XL: 25, XXL: 10, '3XL': 5 }, price: 27, category: 'Bas' },
            { id: 9, name: 'Coupe-vent', sizes: { S: 25, M: 50, L: 40, XL: 20, XXL: 15 }, price: 50, category: 'Manteaux' },
            { id: 10, name: 'Manteau 3 en 1', sizes: { S: 20, M: 40, L: 30, XL: 15, XXL: 10 }, price: 150, category: 'Manteaux' },
            { id: 11, name: 'Dossard', sizes: { M: 50, L: 50, XL: 50 }, price: 15, category: 'Accessoires' },
            { id: 12, name: 'Casque-chantier', sizes: { Unique: 40 }, price: 25, category: 'Sécurité' },
            { id: 13, name: 'Épaulettes', sizes: { Unique: 100 }, price: 5, category: 'Accessoires' }
        ];
    }

    initSampleData() {
        if (this.data.employees.length === 0) {
            this.data.employees = [
                { id: 'EMP001', name: 'Frank Etoa', phone: '+1 514 123 4567', active: true, createdAt: new Date().toISOString() },
                { id: 'EMP002', name: 'Marie Dubois', phone: '+1 514 234 5678', active: true, createdAt: new Date().toISOString() },
                { id: 'EMP003', name: 'Jean Martin', phone: '+1 514 345 6789', active: true, createdAt: new Date().toISOString() }
            ];
            this.save();
        }
    }

    save() {
        try {
            localStorage.setItem('xguard_reception_data', JSON.stringify(this.data));
        } catch (e) {
            console.error('Erreur de sauvegarde:', e);
        }
    }

    load() {
        try {
            const saved = localStorage.getItem('xguard_reception_data');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Erreur de chargement:', e);
            return null;
        }
    }

    addEmployee(employee) {
        employee.id = this.generateEmployeeId();
        employee.active = true;
        employee.createdAt = new Date().toISOString();
        this.data.employees.push(employee);
        this.save();
        return employee;
    }

    updateEmployee(id, updates) {
        const index = this.data.employees.findIndex(e => e.id === id);
        if (index !== -1) {
            this.data.employees[index] = { ...this.data.employees[index], ...updates };
            this.save();
        }
    }

    getEmployee(id) {
        return this.data.employees.find(e => e.id === id);
    }

    searchEmployees(query) {
        const q = query.toLowerCase();
        return this.data.employees.filter(e => 
            e.active && (
                e.name.toLowerCase().includes(q) || 
                e.id.toLowerCase().includes(q) ||
                e.phone.includes(q)
            )
        );
    }

    createTransaction(type, employeeId, items, notes = '') {
        const transaction = {
            id: this.generateId(),
            type,
            employeeId,
            items,
            notes,
            createdAt: new Date().toISOString(),
            createdBy: 'Réceptionniste',
            signature: null,
            linkToken: null,
            signed: false
        };

        if (type === 'attribution' || type === 'ajout') {
            transaction.linkToken = this.generateToken();
            this.data.links.push({
                token: transaction.linkToken,
                transactionId: transaction.id,
                used: false,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
        }

        this.updateInventoryForTransaction(type, items);
        this.data.transactions.push(transaction);
        this.save();
        return transaction;
    }

    updateInventoryForTransaction(type, items) {
        items.forEach(item => {
            const invItem = this.data.inventory.find(i => i.name === item.name);
            if (invItem && invItem.sizes[item.size] !== undefined) {
                if (type === 'attribution' || type === 'ajout') {
                    invItem.sizes[item.size] = Math.max(0, invItem.sizes[item.size] - item.quantity);
                } else if (type === 'retour') {
                    invItem.sizes[item.size] += item.quantity;
                }
            }
        });
        this.save();
    }

    signTransaction(token, signature) {
        const link = this.data.links.find(l => l.token === token);
        if (!link || link.used) return null;

        const transaction = this.data.transactions.find(t => t.id === link.transactionId);
        if (!transaction) return null;

        transaction.signature = signature;
        transaction.signed = true;
        transaction.signedAt = new Date().toISOString();
        link.used = true;

        this.save();
        return transaction;
    }

    getEmployeeTransactions(employeeId) {
        return this.data.transactions
            .filter(t => t.employeeId === employeeId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getEmployeeBalance(employeeId) {
        const transactions = this.getEmployeeTransactions(employeeId);
        const balance = {};
        
        transactions.forEach(t => {
            t.items.forEach(item => {
                const key = `${item.name}-${item.size}`;
                if (!balance[key]) {
                    balance[key] = { 
                        name: item.name, 
                        size: item.size, 
                        quantity: 0, 
                        price: item.price 
                    };
                }
                
                if (t.type === 'attribution' || t.type === 'ajout') {
                    balance[key].quantity += item.quantity;
                } else if (t.type === 'retour') {
                    balance[key].quantity -= item.quantity;
                }
            });
        });

        return Object.values(balance).filter(item => item.quantity > 0);
    }

    createInventoryMovement(type, item, size, quantity, details = {}) {
        if (!this.data.movements) {
            this.data.movements = [];
        }

        const movement = {
            id: this.generateId(),
            type,
            item,
            size,
            quantity,
            date: new Date().toISOString(),
            createdBy: 'Réceptionniste',
            ...details
        };

        this.data.movements.push(movement);
        
        const invItem = this.data.inventory.find(i => i.name === item);
        if (invItem && invItem.sizes[size] !== undefined) {
            if (type === 'purchase' || type === 'adjustment') {
                invItem.sizes[size] = Math.max(0, invItem.sizes[size] + quantity);
            }
        }

        this.save();
        return movement;
    }

    recordPurchase(item, size, quantity, cost, supplier, notes) {
        return this.createInventoryMovement('purchase', item, size, quantity, {
            cost,
            supplier,
            notes
        });
    }

    recordAdjustment(item, size, quantity, reason, notes) {
        return this.createInventoryMovement('adjustment', item, size, quantity, {
            reason,
            notes
        });
    }

    getInventoryMovements(limit = 50) {
        if (!this.data.movements) {
            this.data.movements = [];
        }
        return this.data.movements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    getItemHistory(itemName, size = null) {
        if (!this.data.movements) return [];
        
        return this.data.movements
            .filter(m => m.item === itemName && (!size || m.size === size))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getLowStockItems(threshold = 10) {
        const lowStock = [];
        this.data.inventory.forEach(item => {
            Object.entries(item.sizes).forEach(([size, qty]) => {
                if (qty < threshold) {
                    lowStock.push({
                        item: item.name,
                        size,
                        quantity: qty,
                        price: item.price
                    });
                }
            });
        });
        return lowStock;
    }

    generateEmployeeId() {
        const lastEmployee = this.data.employees
            .filter(e => e.id.startsWith('EMP'))
            .sort((a, b) => parseInt(b.id.substring(3)) - parseInt(a.id.substring(3)))[0];
        
        const lastNumber = lastEmployee ? parseInt(lastEmployee.id.substring(3)) : 0;
        return `EMP${String(lastNumber + 1).padStart(3, '0')}`;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    generateToken() {
        return Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `xguard_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// ==================== APPLICATION ====================
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
                this.render();
            }
        });
        
        // Sauvegarder l'état initial
        if (!window.history.state) {
            window.history.replaceState({
                view: this.currentView,
                employee: this.currentEmployee,
                transactionType: this.transactionType
            }, '', window.location.href);
        }

        this.render();
    }

    // Méthode de navigation centralisée
    navigateTo(view, params = {}) {
        // Mettre à jour l'état de l'application
        this.currentView = view;
        
        if (params.employee) {
            this.currentEmployee = params.employee;
        }
        if (params.transactionType) {
            this.transactionType = params.transactionType;
        }
        
        // Ajouter à l'historique du navigateur
        const state = {
            view: this.currentView,
            employee: this.currentEmployee,
            transactionType: this.transactionType
        };
        
        window.history.pushState(state, '', window.location.href);
        
        // Re-render
        this.render();
    }

    render() {
        const app = document.getElementById('app');
        
        switch(this.currentView) {
            case 'home':
                app.innerHTML = this.renderHome();
                this.attachHomeEvents();
                break;
            case 'newEmployee':
                app.innerHTML = this.renderNewEmployee();
                this.attachNewEmployeeEvents();
                break;
            case 'selectEmployee':
                app.innerHTML = this.renderSelectEmployee();
                this.attachSelectEmployeeEvents();
                break;
            case 'transaction':
                app.innerHTML = this.renderTransaction();
                this.attachTransactionEvents();
                break;
            case 'signature':
                app.innerHTML = this.renderSignature();
                this.attachSignatureEvents();
                break;
            case 'employeeDetails':
                app.innerHTML = this.renderEmployeeDetails();
                break;
            case 'employees':
                app.innerHTML = this.renderEmployeesList();
                break;
            case 'transactions':
                app.innerHTML = this.renderTransactionsList();
                break;
            case 'pendingSignatures':
                app.innerHTML = this.renderPendingSignatures();
                break;
            case 'lowStock':
                app.innerHTML = this.renderLowStock();
                break;
            case 'inventory':
                app.innerHTML = this.renderInventory();
                break;
            case 'inventoryManagement':
                app.innerHTML = this.renderInventoryManagement();
                this.attachInventoryManagementEvents();
                break;
            case 'newInventoryItem':
                app.innerHTML = this.renderNewInventoryItem();
                this.attachNewInventoryItemEvents();
                break;
        }
    }

    renderHome() {
        const stats = {
            totalEmployees: this.db.data.employees.filter(e => e.active).length,
            totalTransactions: this.db.data.transactions.length,
            pendingSignatures: this.db.data.links.filter(l => !l.used).length,
            lowStock: this.db.data.inventory.filter(item => 
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
                        <div onclick="app.navigateTo('employees')" 
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

                        <div onclick="app.navigateTo('transactions')" 
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

                        <div onclick="app.navigateTo('pendingSignatures')" 
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

                        <div onclick="app.navigateTo('lowStock')" 
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
                        <button onclick="app.navigateTo('selectEmployee')" 
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

                        <button onclick="app.navigateTo('inventory')" 
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

                        <button onclick="app.navigateTo('inventoryManagement')" 
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

    renderSelectEmployee() {
        return `
            <div class="min-h-screen gradient-bg">
                <!-- Header -->
                <div class="glass-effect shadow-lg">
                    <div class="max-w-4xl mx-auto p-4 flex justify-between items-center">
                        <h1 class="text-xl font-bold text-gray-800">
                            ${this.transactionType === 'attribution' ? 'Nouvelle attribution' : 
                              this.transactionType === 'retour' ? 'Retour d\'uniformes' : 
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
                            ${this.db.data.employees
                                .filter(e => e.active)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(emp => {
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
                                }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTransaction() {
        const employee = this.db.getEmployee(this.currentEmployee);
        if (!employee) {
            this.navigateTo('selectEmployee');
            return '';
        }
        
        const balance = this.db.getEmployeeBalance(this.currentEmployee);
        
        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <div class="gradient-bg text-white shadow-lg">
                    <div class="max-w-6xl mx-auto p-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <h1 class="text-xl font-bold">
                                    ${this.transactionType === 'attribution' ? 'Attribution d\'uniformes' : 
                                      this.transactionType === 'retour' ? 'Retour d\'uniformes' : 
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
                                    ${this.transactionType === 'retour' ? 'Articles à retourner' : 'Sélection des articles'}
                                </h2>
                                
                                ${this.transactionType === 'retour' ? `
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
                                        ${this.db.data.inventory.map(item => `
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
                                    ${this.transactionType === 'retour' ? 'Articles à retourner' : 'Articles sélectionnés'}
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
                                    ${this.transactionType === 'retour' ? 
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

    renderSignature() {
        const link = this.db.data.links.find(l => l.token === this.currentToken);
        if (!link || link.used) {
            return this.renderError('Lien invalide', 'Ce lien a déjà été utilisé ou n\'existe pas.');
        }

        const transaction = this.db.data.transactions.find(t => t.id === link.transactionId);
        if (!transaction) {
            return this.renderError('Transaction introuvable', 'La transaction associée n\'existe pas.');
        }

        const employee = this.db.getEmployee(transaction.employeeId);
        if (!employee) {
            return this.renderError('Employé introuvable', 'L\'employé associé n\'existe pas.');
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

    renderInventory() {
        return `
            <div class="min-h-screen gradient-bg">
                <!-- Header -->
                <div class="glass-effect shadow-lg">
                    <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                        <h1 class="text-xl font-bold text-gray-800">État de l'inventaire</h1>
                        <button onclick="app.navigateTo('home')" 
                            class="p-2 hover:bg-white/20 rounded-lg transition" title="Accueil">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="max-w-6xl mx-auto p-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        ${this.db.data.inventory.map(item => {
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

    renderNewEmployee() {
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
                            <button onclick="app.navigateTo('selectEmployee')" 
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

    renderEmployeesList() {
        const employees = this.db.data.employees.filter(e => e.active);
        const inactiveEmployees = this.db.data.employees.filter(e => !e.active);
        
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
                    <!-- Onglets actifs/inactifs -->
                    <div class="bg-white rounded-xl shadow-lg p-6 mb-4">
                        <div class="flex justify-between items-center mb-4">
                            <div class="flex gap-4">
                                <button onclick="app.showInactive = false; app.render()" 
                                    class="px-4 py-2 rounded-lg transition ${!this.showInactive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                                    <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    Actifs (${employees.length})
                                </button>
                                <button onclick="app.showInactive = true; app.render()" 
                                    class="px-4 py-2 rounded-lg transition ${this.showInactive ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
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

                    <div class="grid md:grid-cols-2 gap-6">
                        ${(this.showInactive ? inactiveEmployees : employees).map(emp => {
                            const balance = this.db.getEmployeeBalance(emp.id);
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
                                <div class="bg-white rounded-xl shadow-lg p-6 hover-lift animate-fade-in ${empClass}">
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
                </div>
            </div>
        `;
    }

    renderTransactionsList() {
        const transactions = this.db.data.transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
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
                            const employee = this.db.getEmployee(t.employeeId);
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
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

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

    renderEmployeeDetails() {
        const employee = this.db.getEmployee(this.currentEmployee);
        if (!employee) {
            return this.renderError('Employé introuvable', 'Cet employé n\'existe pas.');
        }

        const transactions = this.db.getEmployeeTransactions(this.currentEmployee);
        const balance = this.db.getEmployeeBalance(this.currentEmployee);
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
                                                        <span class="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                                            ✓ Signé
                                                        </span>
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

    renderInventoryManagement() {
        const movements = this.db.getInventoryMovements(20);
        
        return `
            <div class="min-h-screen gradient-bg">
                <!-- Header -->
                <div class="glass-effect shadow-lg">
                    <div class="max-w-6xl mx-auto p-4 flex justify-between items-center">
                        <h1 class="text-xl font-bold text-gray-800">Gestion d'inventaire</h1>
                        <button onclick="app.navigateTo('home')" 
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

                        <button onclick="app.navigateTo('newInventoryItem')" 
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
                                    ${this.db.data.inventory.map(item => 
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

    renderNewInventoryItem() {
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
                            <button onclick="app.navigateTo('inventoryManagement')" 
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
                                <button type="button" onclick="app.navigateTo('inventoryManagement')" 
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

    // Méthodes utilitaires
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
                <span class="font-medium">${item.price * item.quantity}</span>
            </div>
        `).join('');

        const total = this.selection.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalDiv.textContent = `${total}`;
    }

    copyLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            // Animation de confirmation
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copié!';
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-green-600');
            }, 2000);
        }).catch(() => {
            // Fallback
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copié!';
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-green-600');
            }, 2000);
        });
    }

    downloadEmployeeReport() {
        const employees = this.db.data.employees.filter(e => e.active);
        let csv = 'Code employé,Nom,Téléphone,Email,Statut,Article,Taille,Quantité,Prix unitaire,Valeur totale\n';
        
        employees.forEach(employee => {
            const balance = this.db.getEmployeeBalance(employee.id);
            const status = employee.active ? 'Actif' : 'Inactif';
            if (balance.length === 0) {
                csv += `"${employee.id}","${employee.name}","${employee.phone}","${employee.email || ''}","${status}","","","0","0","0"\n`;
            } else {
                balance.forEach(item => {
                    csv += `"${employee.id}","${employee.name}","${employee.phone}","${employee.email || ''}","${status}","${item.name}","${item.size}","${item.quantity}","${item.price}","${item.quantity * item.price}"\n`;
                });
            }
        });
        
        this.downloadCSV(csv, `xguard_employes_actifs_${new Date().toISOString().split('T')[0]}.csv`);
    }

    downloadInventoryReport() {
        let csv = 'Article,Catégorie,Taille,Stock actuel,Prix unitaire,Valeur totale,Statut\n';
        
        this.db.data.inventory.forEach(item => {
            Object.entries(item.sizes).forEach(([size, stock]) => {
                const status = stock === 0 ? 'Rupture' : stock < 10 ? 'Faible' : 'OK';
                csv += `"${item.name}","${item.category || 'Non catégorisé'}","${size}","${stock}","${item.price}","${stock * item.price}","${status}"\n`;
            });
        });
        
        this.downloadCSV(csv, `xguard_inventaire_${new Date().toISOString().split('T')[0]}.csv`);
    }

    downloadMovementsReport() {
        let csv = 'Date,Type,Article,Taille,Quantité,Raison,Fournisseur,Coût,Notes,Créé par\n';
        
        const movements = this.db.getInventoryMovements(999999);
        movements.forEach(m => {
            const typeText = m.type === 'purchase' ? 'Achat' : 
                           m.type === 'adjustment' ? 'Ajustement' : 
                           m.type === 'attribution' ? 'Attribution' : 
                           m.type === 'retour' ? 'Retour' : m.type;
            
            csv += `"${new Date(m.date).toLocaleDateString('fr-CA')}","${typeText}","${m.item}","${m.size}","${m.quantity}","${m.reason || ''}","${m.supplier || ''}","${m.cost || ''}","${m.notes || ''}","${m.createdBy}"\n`;
        });
        
        this.downloadCSV(csv, `xguard_mouvements_${new Date().toISOString().split('T')[0]}.csv`);
    }

    downloadCSV(csvContent, filename) {
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    }

    validateTransaction() {
        if (this.selection.length === 0) {
            alert('Veuillez sélectionner au moins un article');
            return;
        }

        const notes = document.getElementById('transaction-notes')?.value || '';
        
        // Créer la transaction
        const transaction = this.db.createTransaction(
            this.transactionType,
            this.currentEmployee,
            this.selection,
            notes
        );

        if (this.transactionType === 'retour') {
            // Pour un retour, pas besoin de signature
            alert('Retour enregistré avec succès!');
            this.navigateTo('home');
        } else {
            // Pour attribution/ajout, afficher le lien
            const employee = this.db.getEmployee(this.currentEmployee);
            const linkUrl = `${window.location.origin}${window.location.pathname}?token=${transaction.linkToken}`;
            
            // Créer le modal moderne
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

    // Méthodes d'interaction
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
        
        // Retirer de la sélection si 0
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

    updateSizeFields(type) {
        const container = document.getElementById('size-fields');
        if (!container) return;

        const sizePresets = {
            standard: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
            unique: ['Unique'],
            custom: []
        };

        if (type === 'custom') {
            container.innerHTML = `
                <label class="block text-sm font-medium text-gray-700 mb-2">Tailles personnalisées</label>
                <div id="custom-sizes-container" class="space-y-2">
                    <div class="flex gap-2">
                        <input type="text" id="custom-size-name" placeholder="Nom de la taille" class="flex-1 px-3 py-2 border rounded-lg">
                        <input type="number" id="custom-size-qty" placeholder="Quantité" min="0" class="w-24 px-3 py-2 border rounded-lg">
                        <button type="button" onclick="app.addCustomSize()" 
                            class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                            +
                        </button>
                    </div>
                </div>
                <div id="custom-sizes-list" class="mt-3 space-y-2"></div>
            `;
        } else {
            container.innerHTML = `
                <label class="block text-sm font-medium text-gray-700 mb-2">Quantités initiales</label>
                <div class="grid ${type === 'unique' ? 'grid-cols-1' : 'grid-cols-3 sm:grid-cols-4'} gap-3">
                    ${sizePresets[type].map(size => `
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">${size}</label>
                            <input type="number" 
                                data-size-input data-size="${size}"
                                min="0" value="0"
                                class="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-purple-500">
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    addCustomSize() {
        const nameInput = document.getElementById('custom-size-name');
        const qtyInput = document.getElementById('custom-size-qty');
        const listDiv = document.getElementById('custom-sizes-list');
        
        if (!nameInput || !qtyInput || !listDiv) return;
        
        const name = nameInput.value.trim();
        const qty = parseInt(qtyInput.value) || 0;
        
        if (name && qty >= 0) {
            const existingSize = listDiv.querySelector(`[data-custom-size="${name}"]`);
            if (existingSize) {
                alert('Cette taille existe déjà');
                return;
            }
            
            listDiv.innerHTML += `
                <div class="flex items-center gap-2 p-2 bg-gray-50 rounded" data-custom-size="${name}">
                    <span class="flex-1">${name}: ${qty}</span>
                    <input type="hidden" data-size-input data-size="${name}" value="${qty}">
                    <button type="button" onclick="this.parentElement.remove()" 
                        class="text-red-500 hover:text-red-700">×</button>
                </div>
            `;
            
            nameInput.value = '';
            qtyInput.value = '';
        }
    }

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

    // Event Handlers
    attachHomeEvents() {
        // Animation des cartes au hover est gérée par CSS
    }

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

    attachSelectEmployeeEvents() {
        const searchInput = document.getElementById('employee-search');
        if (searchInput) {
            searchInput.focus();
        }
    }

    attachTransactionEvents() {
        // Les events sont inline dans le HTML
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
                    
                    // Afficher le succès avec animation
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
                                    <p class="text-sm mb-2"><span class="text-gray-600">Articles:</span> <span class="font-medium">${transaction.items.length}</span></p>
                                    <p class="text-sm"><span class="text-gray-600">Date:</span> <span class="font-medium">${new Date().toLocaleString('fr-CA')}</span></p>
                                </div>
                                <p class="text-gray-600">La transaction a été enregistrée avec succès.</p>
                            </div>
                        </div>
                    `;
                }
            });
        }
    }

    attachInventoryManagementEvents() {
        // Les events sont déjà inline dans le HTML
    }

    attachNewInventoryItemEvents() {
        const form = document.getElementById('new-inventory-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('item-name').value;
            const category = document.getElementById('item-category').value;
            const price = parseFloat(document.getElementById('item-price').value);
            
            // Collecter les tailles et quantités
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
            
            // Ajouter l'article
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
}

// Initialiser l'application
window.app = new XGuardApp();
