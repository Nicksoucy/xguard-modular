import { Database } from './database.js';
import { renderHome } from './views/home.js';
import { renderEmployeesList, renderEmployeeDetails, renderNewEmployee, renderSelectEmployee } from './views/employees.js';
import { renderTransaction, renderTransactionsList } from './views/transactions.js';
import { renderInventory, renderInventoryManagement, renderNewInventoryItem } from './views/inventory.js';
import { renderSignature } from './views/signature.js';
import { renderPendingSignatures } from './views/pending-signatures.js';
import { renderLowStock } from './views/low-stock.js';
import { renderError } from './views/error.js';
import { TransactionController } from './controllers/transaction.controller.js';
import { EmployeeController } from './controllers/employee.controller.js';
import { InventoryController } from './controllers/inventory.controller.js';
import { 
    downloadEmployeeReport, 
    downloadInventoryReport, 
    downloadMovementsReport,
    copyLink,
    updateSizeFields,
    addCustomSize,
    generateTransactionPDF
} from './utils/helpers.js';

class XGuardApp {
    constructor() {
        // Exposer l'app globalement AVANT tout le reste
        window.app = this;
        
        this.db = new Database();
        this.currentView = 'home';
        this.currentEmployee = null;
        this.selection = [];
        this.transactionType = 'attribution';
        this.showInactive = false;
        
        // Initialiser les contrôleurs
        this.transactionController = new TransactionController(this);
        this.employeeController = new EmployeeController(this);
        this.inventoryController = new InventoryController(this);
        
        // Vérifier si on a un token de signature
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            this.currentToken = token;
            this.currentView = 'signature';
        }
        
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
                app.innerHTML = renderError('Page introuvable', 'Cette page n\'existe pas.');
        }
    }

    navigateTo(view, params = {}) {
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
        
        const state = {
            view: this.currentView,
            employee: this.currentEmployee,
            transactionType: this.transactionType,
            showInactive: this.showInactive
        };
        
        window.history.pushState(state, '', window.location.href);
        this.render();
    }

    // Déléguer aux contrôleurs
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

    deactivateEmployee(employeeId) {
        this.employeeController.deactivateEmployee(employeeId);
    }

    reactivateEmployee(employeeId) {
        this.employeeController.reactivateEmployee(employeeId);
    }

    addToSelection(name, size, price, stock) {
        this.transactionController.addToSelection(name, size, price, stock);
    }

    updateReturnQuantity(name, size, price, quantity) {
        this.transactionController.updateReturnQuantity(name, size, price, quantity);
    }

    validateTransaction() {
        this.transactionController.validateTransaction();
    }

    showPurchaseModal() {
        this.inventoryController.showPurchaseModal();
    }

    showAdjustmentModal() {
        this.inventoryController.showAdjustmentModal();
    }

    showAdjustStockModal(itemName, size) {
        this.inventoryController.showAdjustStockModal(itemName, size);
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
                    this.showSignatureSuccess(employee, transaction);
                }
            });
        }
    }

    showSignatureSuccess(employee, transaction) {
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
                    <p class="text-gray-600 mb-6">La transaction a été enregistrée avec succès.</p>
                    
                    <button onclick="app.downloadTransactionPDF('${transaction.id}')" 
                        class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition font-medium mb-3 flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Télécharger le PDF
                    </button>
                    
                    <p class="text-sm text-gray-500">Vous pouvez maintenant fermer cette fenêtre</p>
                </div>
            </div>
        `;
    }

    // Nouvelle méthode pour télécharger le PDF
    downloadTransactionPDF(transactionId) {
        const transaction = this.db.data.transactions.find(t => t.id === transactionId);
        if (!transaction) {
            alert('Transaction introuvable');
            return;
        }
        
        const employee = this.db.getEmployee(transaction.employeeId);
        if (!employee) {
            alert('Employé introuvable');
            return;
        }
        
        generateTransactionPDF(transaction, employee);
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
