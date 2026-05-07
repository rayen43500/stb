# STB — Système de Gestion des Crédits Bancaires

Application web **React + Node.js + MongoDB**, avec **scoring** exposé en **Python (FastAPI)** et **chatbot** branché sur l’API (simulation + scoring + FAQ).

## Démarrage rapide

1. **MongoDB** en marche (port 27017 par défaut).
2. **Backend** : `cd backend` → copier `.env.example` vers `.env` → `npm install` → `npm run seed` → `npm run dev` (port **4000**).
3. **Scoring** (recommandé) : `cd scoring-service` → environnement Python → `pip install -r requirements.txt` → `uvicorn main:app --host 127.0.0.1 --port 5001`.
4. **Frontend** : `cd frontend` → `npm install` → `npm run dev` → navigateur [http://127.0.0.1:5173](http://127.0.0.1:5173).

## Comptes de démonstration

Créés par `npm run seed` dans le dossier `backend` (ignorés s’ils existent déjà).

| Adresse (e-mail) | Mot de passe | Rôle |
|------------------|--------------|------|
| `client@stb.local` | `ClientSTB!2026` | CLIENT |
| `agent@stb.local` | `AgentSTB!2026` | AGENT_BANCAIRE |
| `chef@stb.local` | `ChefSTB!2026` | CHEF_AGENCE |
| `comite@stb.local` | `ComiteSTB!2026` | COMITE_CREDIT |
| `admin@stb.local` | `AdminSTB!2026` | ADMIN |
| `admin.test.2026@stb.local` | `AdminTest!8nQ4` | ADMIN |

L’admin peut aussi être défini via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` dans l’environnement avant le seed.

## Documentation détaillée

Consultez **[GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md)** pour :

- les prérequis et la structure du projet ;
- la configuration des variables d’environnement ;
- les comptes de démonstration ;
- les parcours client / agent / admin ;
- le chatbot et le dépannage.

## Stack principale

- **Frontend** : React, Vite, Tailwind CSS, Axios, React Router, Chart.js  
- **Backend** : Express, JWT, Mongoose, Multer (documents), PDFKit (amortissement)  
- **Scoring** : FastAPI, règles interprétables (score /100 + décision + recommandations)

## Licence / usage

Projet type **PFE / démonstration** — adapter secrets, CORS et HTTPS avant toute mise en production.
🤖 👉 2. Chatbot = NLP léger + règles + API



cree des utilisateur et amelorer le style 🔵 1. Couleur principale (Banque / confiance)
Bleu profond : #1E3A8A
Bleu STB moderne : #1D4ED8

👉 utilisé pour :

navbar
boutons principaux
titres
⚪ 2. Couleurs secondaires (propre / interface)
Blanc : #FFFFFF
Gris très clair : #F3F4F6
Gris texte : #6B7280

👉 utilisé pour :

background
cards
tableaux
🟢 3. Couleurs succès (accepté crédit)
Vert : #10B981
Vert clair : #34D399

👉 utilisé pour :

APPROUVÉ
succès scoring
validation
🟡 4. Couleurs warning (analyse)
Orange : #F59E0B
Jaune : #FBBF24

👉 utilisé pour :

A_ANALYSER
alertes modérées
🔴 5. Couleurs danger (refus)
Rouge : #EF4444
Rouge foncé : #B91C1C

👉 utilisé pour :

REFUS
risque élevé
erreurs
🧠 🎯 Design UI conseillé (STB pro)
🧩 Style global :
fond clair
cards arrondies
ombres légères
style “dashboard bancaire”
📊 Exemple structure UI
Navbar bleu foncé
Sidebar gris clair
Dashboard blanc
Statut coloré (vert / orange / rouge)
💡 Exemple usage logique
Statut	Couleur
APPROUVÉ	🟢 vert
A_ANALYSER	🟡 orange
REFUSÉ	🔴 rouge
🔥 BONUS (niveau PFE pro)

Si tu veux un style encore plus moderne :

👉 ajoute une couleur accent :

Cyan moderne : #06B6D4
🎯 Résumé final

👉 STB palette idéale :

🔵 #1D4ED8 (principal)
⚪ #FFFFFF (fond)
⚫ #111827 (texte foncé)
🟢 #10B981 (succès)
🟡 #F59E0B (warning)
🔴 #EF4444 (danger)

et utiliser le logo image.png dans public 

et cree des utilisateur et donner dans la base de donner et assurer que tous les interface complet 
Adresse (e-mail)	Mot de passe	Rôle
client@stb.local
ClientSTB!2026
CLIENT
agent@stb.local
AgentSTB!2026
AGENT_BANCAIRE
chef@stb.local
ChefSTB!2026
CHEF_AGENCE
comite@stb.local
ComiteSTB!2026
COMITE_CREDIT
admin@stb.local
AdminSTB!2026
ADMIN
admin.test.2026@stb.local
AdminTest!8nQ4
ADMIN
Le premier admin peut aussi être fixé avec SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD avant le seed. La page Connexion du frontend affiche encore la même liste dans le bloc repliable.