export class InventoryController {
    constructor(app) {
        this.app = app;
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
                            ${this.app.db.data.inventory.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}
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
                const item = this.app.db.data.inventory.find(i => i.name === itemName);
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

            this.app.db.recordPurchase(item, size, quantity, cost, supplier, notes);
            alert('Achat enregistré avec succès!');
            document.body.removeChild(modal);
            this.app.render();
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
                            ${this.app.db.data.inventory.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}
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
                const item = this.app.db.data.inventory.find(i => i.name === itemName);
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

            const item = this.app.db.data.inventory.find(i => i.name === itemName);
            const currentStock = item.sizes[size];
            
            let adjustmentQty = 0;
            if (type === 'add') {
                adjustmentQty = quantity;
            } else if (type === 'remove') {
                adjustmentQty = -quantity;
            } else if (type === 'set') {
                adjustmentQty = quantity - currentStock;
            }

            this.app.db.recordAdjustment(itemName, size, adjustmentQty, reason, notes);
            alert('Ajustement enregistré avec succès!');
            document.body.removeChild(modal);
            this.app.render();
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
            
            this.app.db.data.inventory.push(newItem);
            this.app.db.save();
            
            alert('Article ajouté avec succès!');
            this.app.navigateTo('inventoryManagement');
        });
    }
}
