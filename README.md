# XGuard - Système de Gestion des Uniformes (Version Modulaire)

## Structure des fichiers

- `index.html` : Point d'entrée principal
- `css/styles.css` : Tous les styles de l'application
- `js/app.js` : Logique principale et navigation
- `js/database.js` : Gestion de la base de données locale
- `js/views/` : Toutes les pages/vues
- `js/utils/` : Fonctions utilitaires

## Comment modifier l'application

### Modifier une vue existante
1. Ouvrez le fichier correspondant dans `js/views/`
2. Modifiez le HTML dans la fonction `render...`
3. Commitez vos changements

### Ajouter une nouvelle fonctionnalité
1. Créez une nouvelle fonction dans le fichier approprié
2. Ajoutez la navigation dans `app.js`
3. Testez et commitez

### Modifier les styles
Tout est dans `css/styles.css`

## Demandes de modifications avec Claude

Exemples de demandes simples :
- "Modifie employees.js pour ajouter un bouton d'export Excel"
- "Change la couleur du header dans styles.css"
- "Ajoute un champ 'département' dans le formulaire nouvel employé"

## Notes importantes

- Toujours tester après chaque modification
- Les données sont stockées dans le localStorage du navigateur
- L'application fonctionne 100% côté client
