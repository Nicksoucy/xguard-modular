// Ajoute cette méthode dans la classe XGuardApp
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
