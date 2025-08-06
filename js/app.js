// js/app.js
import { Database } from './database.js';
import { renderHome } from './views/home.js';
import { renderEmployeesList, renderEmployeeDetails, renderNewEmployee, renderSelectEmployee } from './views/employees.js';
import { renderTransaction, renderTransactionsList } from './views/transactions.js';
import { renderInventory, renderInventoryManagement, renderNewInventoryItem } from './views/inventory.js';
import { renderSignature } from './views/signature.js';
import { renderPendingSignatures, renderLowStock, renderError } from './views/common.js';
import { attachNewEmployeeEvents, attachSignatureEvents, attachNewInventoryItemEvents } from './handlers/events.js';

export class XGuardApp {
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

        // IMPORTANT : Gestion de l'historique
        this.initializeHistory();
        
        this.render();
    }

    initializeHistory() {
        // Écouter les changements d'historique
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                this.currentView = event.state.view || 'home';
                this.currentEmployee = event.state.employee || null;
                this.transactionType = event.state.transactionType || 'attribution';
                this.render();
            }
        });
        
        // Sauvegarder l'état initial
        const initialState = {
            view: this.currentView,
            employee: this.currentEmployee,
            transactionType: this.transactionType
        };
        
        // Remplacer l'état actuel sans changer l'URL
        window.history.replaceState(initialState, '', window.location.href);
    }

    navigateTo(view, params = {}) {
        // Mettre à jour l'état
        this.currentView = view;
        
        if (params.employee !== undefined) {
            this.currentEmployee = params.employee;
        }
        if (params.transactionType !== undefined) {
            this.transactionType = params.transactionType;
        }
        
        // Créer l'objet d'état
        const state = {
            view: this.currentView,
            employee: this.currentEmployee,
            transactionType: this.transactionType
        };
        
        // Ajouter à l'historique
        window.history.pushState(state, '', window.location.href);
        
        // Re-render
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
                attachNewEmployeeEvents(this);
                break;
            case 'selectEmployee':
                app.innerHTML = renderSelectEmployee(this);
                this.attachSelectEmployeeEvents();
                break;
            case 'transaction':
                app.innerHTML = renderTransaction(this);
                break;
            case 'signature':
                app.innerHTML = renderSignature(this);
                attachSignatureEvents(this);
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
                attachNewInventoryItemEvents(this);
                break;
        }
    }

    // ... reste des méthodes (startTransaction, selectEmployee, etc.)
}
