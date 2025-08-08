// helpers.js - Fonctions utilitaires

export function downloadEmployeeReport(db) {
    const employees = db.data.employees.filter(e => e.active);
    let csv = 'Code employé,Nom,Téléphone,Email,Statut,Article,Taille,Quantité,Prix unitaire,Valeur totale\n';
    
    employees.forEach(employee => {
        const balance = db.getEmployeeBalance(employee.id);
        const status = employee.active ? 'Actif' : 'Inactif';
        if (balance.length === 0) {
            csv += `"${employee.id}","${employee.name}","${employee.phone}","${employee.email || ''}","${status}","","","0","0","0"\n`;
        } else {
            balance.forEach(item => {
                csv += `"${employee.id}","${employee.name}","${employee.phone}","${employee.email || ''}","${status}","${item.name}","${item.size}","${item.quantity}","${item.price}","${item.quantity * item.price}"\n`;
            });
        }
    });
    
    downloadCSV(csv, `xguard_employes_actifs_${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadInventoryReport(db) {
    let csv = 'Article,Catégorie,Taille,Stock actuel,Prix unitaire,Valeur totale,Statut\n';
    
    db.data.inventory.forEach(item => {
        Object.entries(item.sizes).forEach(([size, stock]) => {
            const status = stock === 0 ? 'Rupture' : stock < 10 ? 'Faible' : 'OK';
            csv += `"${item.name}","${item.category || 'Non catégorisé'}","${size}","${stock}","${item.price}","${stock * item.price}","${status}"\n`;
        });
    });
    
    downloadCSV(csv, `xguard_inventaire_${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadMovementsReport(db) {
    let csv = 'Date,Type,Article,Taille,Quantité,Raison,Fournisseur,Coût,Notes,Créé par\n';
    
    const movements = db.getInventoryMovements(999999);
    movements.forEach(m => {
        const typeText = m.type === 'purchase' ? 'Achat' : 
                       m.type === 'adjustment' ? 'Ajustement' : 
                       m.type === 'attribution' ? 'Attribution' : 
                       m.type === 'retour' ? 'Retour' : m.type;
        
        csv += `"${new Date(m.date).toLocaleDateString('fr-CA')}","${typeText}","${m.item}","${m.size}","${m.quantity}","${m.reason || ''}","${m.supplier || ''}","${m.cost || ''}","${m.notes || ''}","${m.createdBy}"\n`;
    });
    
    downloadCSV(csv, `xguard_mouvements_${new Date().toISOString().split('T')[0]}.csv`);
}

export function downloadCSV(csvContent, filename) {
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

export function copyLink(url) {
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

export function updateSizeFields(type) {
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

export function addCustomSize() {
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

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-CA');
}

export function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('fr-CA');
}

export function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Nouvelle fonction pour générer le PDF
export function generateTransactionPDF(transaction, employee) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Marges
    const leftMargin = 20;
    const rightMargin = 20;
    const topMargin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    let yPosition = topMargin;
    
    // En-tête
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('XGuard', leftMargin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Système de Gestion des Uniformes', leftMargin, yPosition);
    yPosition += 15;
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 10;
    
    // Type de transaction
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    const transactionType = transaction.type === 'attribution' ? 'ATTRIBUTION D\'UNIFORMES' : 'AJOUT D\'ÉQUIPEMENT';
    doc.text(transactionType, leftMargin, yPosition);
    yPosition += 15;
    
    // Informations de l'employé
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('EMPLOYÉ', leftMargin, yPosition);
    yPosition += 7;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Nom: ${employee.name}`, leftMargin, yPosition);
    yPosition += 6;
    doc.text(`Code: ${employee.id}`, leftMargin, yPosition);
    yPosition += 6;
    doc.text(`Téléphone: ${employee.phone}`, leftMargin, yPosition);
    if (employee.email) {
        yPosition += 6;
        doc.text(`Email: ${employee.email}`, leftMargin, yPosition);
    }
    yPosition += 15;
    
    // Date
    const signedDate = new Date(transaction.signedAt || transaction.createdAt);
    doc.text(`Date: ${signedDate.toLocaleDateString('fr-CA')} à ${signedDate.toLocaleTimeString('fr-CA')}`, leftMargin, yPosition);
    yPosition += 15;
    
    // Articles
    doc.setFont(undefined, 'bold');
    doc.text('ARTICLES', leftMargin, yPosition);
    yPosition += 7;
    
    // Tableau des articles
    doc.setFont(undefined, 'normal');
    const tableStartY = yPosition;
    
    // En-tête du tableau
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, yPosition - 5, contentWidth, 8, 'F');
    doc.text('Article', leftMargin + 2, yPosition);
    doc.text('Taille', leftMargin + 80, yPosition);
    doc.text('Qté', leftMargin + 110, yPosition);
    doc.text('Prix unit.', leftMargin + 130, yPosition);
    doc.text('Total', leftMargin + 160, yPosition);
    yPosition += 8;
    
    // Lignes du tableau
    let totalAmount = 0;
    transaction.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        doc.text(item.name, leftMargin + 2, yPosition);
        doc.text(item.size, leftMargin + 80, yPosition);
        doc.text(item.quantity.toString(), leftMargin + 110, yPosition);
        doc.text(`$${item.price}`, leftMargin + 130, yPosition);
        doc.text(`$${itemTotal}`, leftMargin + 160, yPosition);
        yPosition += 6;
    });
    
    // Total
    doc.setFont(undefined, 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, yPosition - 5, contentWidth, 8, 'F');
    doc.text('TOTAL:', leftMargin + 130, yPosition);
    doc.text(`$${totalAmount}`, leftMargin + 160, yPosition);
    yPosition += 15;
    
    // Conditions
    doc.setFont(undefined, 'bold');
    doc.text('CONDITIONS', leftMargin, yPosition);
    yPosition += 7;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const conditions = [
        '• Je confirme avoir reçu les uniformes listés ci-dessus',
        '• En cas de démission ou renvoi, je dois retourner les uniformes dans les 5 jours ouvrables',
        `• Si je ne retourne pas les uniformes, le montant de $${totalAmount} sera déduit de ma dernière paie`,
        '• Les uniformes restent la propriété de XGuard'
    ];
    
    conditions.forEach(condition => {
        const lines = doc.splitTextToSize(condition, contentWidth);
        lines.forEach(line => {
            doc.text(line, leftMargin, yPosition);
            yPosition += 5;
        });
    });
    yPosition += 10;
    
    // Signature
    if (transaction.signature && transaction.signature.data) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('SIGNATURE', leftMargin, yPosition);
        yPosition += 5;
        
        // Ajouter l'image de la signature
        try {
            doc.addImage(transaction.signature.data, 'PNG', leftMargin, yPosition, 80, 40);
            yPosition += 45;
        } catch (e) {
            console.error('Erreur lors de l\'ajout de la signature:', e);
            yPosition += 45;
        }
        
        // Date de signature
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`Signé le: ${new Date(transaction.signature.timestamp).toLocaleString('fr-CA')}`, leftMargin, yPosition);
    }
    
    // Générer le nom du fichier
    const date = signedDate.toISOString().split('T')[0];
    const employeeName = employee.name.replace(/[^a-z0-9]/gi, '');
    const filename = `XGuard_${transaction.type === 'attribution' ? 'Attribution' : 'Ajout'}_${employeeName}_${date}.pdf`;
    
    // Sauvegarder le PDF
    doc.save(filename);
}
