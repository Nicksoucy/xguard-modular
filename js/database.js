// database.js - Gestion de la base de données
export class Database {
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

    // Gestion des employés
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

    // Gestion des transactions
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

    // Gestion d'inventaire
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

    // === AJOUT pour annuler une signature spécifique ===
    removeSignature(token) {
        this.data.links = this.data.links.filter(link => link.token !== token);
        this.save();
    }

    // === AJOUT pour annuler toutes les signatures en attente ===
    removeAllSignatures() {
        this.data.links = [];
        this.save();
    }
}
