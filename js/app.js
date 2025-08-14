// app.js - Application principale XGuard
import { Database } from './database.js';
import { renderHome } from './views/home.js';
import { renderEmployeesList, renderEmployeeDetails, renderNewEmployee, renderSelectEmployee } from './views/employees.js';
import { renderTransaction, renderTransactionsList } from './views/transactions.js';
import { renderSignature } from './views/signature.js';
import { renderInventory, renderInventoryManagement, renderNewInventoryItem } from './views/inventory.js';
import { renderPendingSignatures } from './views/pending-signatures.js';
import { renderLowStock } from './views/low-stock.js';
import { renderError } from './views/error.js';
import { 
    downloadEmployeeReport, 
    downloadInventoryReport, 
    downloadMovementsReport, 
    downloadCSV,
    copyLink,
    updateSizeFields,
    addCustomSize,
    generateTransactionPDF
} from './utils/helpers.js';
import { EmployeeController } from './controllers/employee.controller.js';
import { TransactionController } from './controllers/transaction.controller.js';
import { InventoryController } from './controllers/inventory.controller.js';

class XGuardApp {
    constructor() {
        this.db = new Database();
        this.currentView = 'home';
        this.currentEmployee = null;
        this.selection = [];
        this.transactionType = 'attribution';
        this.showInactive = false;
        this.currentToken = null;
        
        // Controllers
        this.employeeController = new EmployeeController(this);
        this.transactionController = new TransactionController(this);
        this.inventoryController = new InventoryController(this);
        
        // Vérifier si on a un token de signature
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            this.currentToken = token;
            this.navigateTo('signature');
        } else {
            this.render();
        }
    }

    navigateTo(view, params = {}) {
        this.currentView = view;
        if (params.employee) this.currentEmployee = params.employee;
        if (params.transactionType) this.transactionType = params.transactionType;
        if (params.showInactive !== undefined) this.showInactive = params.showInactive;
        
        window.history.pushState({ view }, '', window.location.pathname);
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
                this.employeeController.attachNewEmployeeEvents();
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
                app.innerHTML = renderPendingSignatures(this);
                break;
            case 'lowStock':
                app.innerHTML = renderLowStock(this);
                break;
            case 'inventory':
                app.innerHTML = renderInventory(this);
                break;
            case 'inventoryManagement':
                app.innerHTML = renderInventoryManagement(this);
                break;
            case 'newInventoryItem':
                app.innerHTML = renderNewInventoryItem(this);
                this.inventoryController.attachNewInventoryItemEvents();
                break;
            default:
                app.innerHTML = renderError('Page non trouvée', 'Cette page n\'existe pas.');
        }
    }

    // === AJOUT : Annuler une signature spécifique (par token) ===
    cancelSignature(token) {
        this.db.removeSignature(token);
        this.render();
    }

    // === AJOUT : Annuler toutes les signatures en attente ===
    cancelAllSignatures() {
        this.db.removeAllSignatures();
        this.render();
    }

    // Méthodes de transaction
    startTransaction(type) {
        this.transactionController.startTransaction(type);
    }

    startTransactionForEmployee(type, employeeId) {
        this.transactionController.startTransactionForEmployee(type, employeeId);
    }

    selectEmployee(employeeId) {
        this.employeeController.selectEmployee(employeeId);
    }

    filterEmployees(query) {
        this.employeeController.filterEmployees(query);
    }

    filterEmployeesList(query) {
        const cards = document.querySelectorAll('.employee-card');
        const noResults = document.getElementById('no-results');
        const employeesList = document.getElementById('employees-list');
        let hasResults = false;
        
        const searchTerm = query.toLowerCase().trim();
        
        cards.forEach(card => {
            const name = card.dataset.name || '';
            const id = card.dataset.id || '';
            const phone = card.dataset.phone || '';
            const email = card.dataset.email || '';
            
            if (searchTerm === '' || 
                name.includes(searchTerm) || 
                id.includes(searchTerm) || 
                phone.includes(searchTerm) || 
                email.includes(searchTerm)) {
                card.style.display = '';
                hasResults = true;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Afficher/cacher le message "aucun résultat"
        if (!hasResults) {
            employeesList.style.display = 'none';
            noResults.classList.remove('hidden');
        } else {
            employeesList.style.display = '';
            noResults.classList.add('hidden');
        }
    }

    addToSelection(name, size, price, stock) {
        this.transactionController.addToSelection(name, size, price, stock);
    }

    updateReturnQuantity(name, size, price, quantity) {
        this.transactionController.updateReturnQuantity(name, size, price, quantity);
    }

    updateSelectionSummary() {
        this.transactionController.updateSelectionSummary();
    }

    validateTransaction() {
        this.transactionController.validateTransaction();
    }

    deactivateEmployee(employeeId) {
        this.employeeController.deactivateEmployee(employeeId);
    }

    reactivateEmployee(employeeId) {
        this.employeeController.reactivateEmployee(employeeId);
    }

    // Méthodes d'inventaire
    showPurchaseModal() {
        this.inventoryController.showPurchaseModal();
    }

    showAdjustmentModal() {
        this.inventoryController.showAdjustmentModal();
    }

    showAdjustStockModal(itemName, size) {
        this.inventoryController.showAdjustStockModal(itemName, size);
    }

    updateSizeFields(type) {
        updateSizeFields(type);
    }

    addCustomSize() {
        addCustomSize();
    }

    // Méthodes utilitaires
    copyLink(url) {
        copyLink(url);
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

    generatePDF(transactionId) {
        const transaction = this.db.data.transactions.find(t => t.id === transactionId);
        if (transaction) {
            const employee = this.db.getEmployee(transaction.employeeId);
            if (employee) {
                generateTransactionPDF(transaction, employee);
            }
        }
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
                                <div class="mt-6">
                                    <button onclick="app.generatePDF(\`${transaction.id}\`)" 
                                        class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-medium">
                                        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        Télécharger le reçu PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
        }
    }
}

// Initialiser l'application
window.app = new XGuardApp();

// Gérer le bouton retour du navigateur
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.view) {
        app.currentView = event.state.view;
        app.render();
    }
});
