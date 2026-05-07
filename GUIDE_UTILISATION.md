# Guide d’utilisation — STB (Système de Gestion des Crédits Bancaires)

Ce document explique **ce que fait l’application**, **comment l’installer**, **comment la lancer** et **comment tester** les parcours (client, agent, scoring, chatbot).

---

## 1. Prérequis

| Outil | Rôle |
|--------|------|
| **Node.js 20+** | Backend Express + frontend Vite |
| **MongoDB** (local ou Docker) | Base de données |
| **Python 3.10+** (optionnel mais recommandé) | Service de scoring FastAPI |
| **Navigateur moderne** | Interface React |

Sur Windows, installez Node depuis [nodejs.org](https://nodejs.org). Pour MongoDB, utilisez [MongoDB Community](https://www.mongodb.com/try/download/community) ou Docker :

```bash
docker run -d -p 27017:27017 --name mongo-stb mongo:7
```

---

## 2. Structure du dépôt

```
sahebt fedi/
├── backend/           # API Node.js (Express, JWT, workflow crédit)
├── frontend/          # Interface React (Vite, Tailwind)
├── scoring-service/   # Microservice Python (FastAPI) — scoring interprétable
├── GUIDE_UTILISATION.md
└── README.md
```

---

## 3. Configuration du backend

1. Ouvrez un terminal dans le dossier `backend`.

2. Copiez le fichier d’exemple :

   ```bash
   copy .env.example .env
   ```

   (Sous PowerShell / CMD Windows ; sous Linux/macOS : `cp .env.example .env`.)

3. Éditez **`.env`** :

   | Variable | Description |
   |----------|-------------|
   | `PORT` | Port HTTP de l’API (défaut **4000**) |
   | `MONGODB_URI` | URI MongoDB (ex. `mongodb://127.0.0.1:27017/stb_credit`) |
   | `JWT_SECRET` | Clé secrète pour signer les jetons (à changer en production, **≥ 32 caractères**) |
   | `JWT_EXPIRES_IN` | Durée de vie du JWT (ex. `7d`) |
   | `SCORING_SERVICE_URL` | URL du service Python (ex. `http://127.0.0.1:5001`) |
   | `UPLOAD_DIR` | Dossier racine des fichiers uploadés (vide = `./uploads` sous le backend) |
   | `SMTP_*` | Optionnel : envoi d’e-mails (notifications). Si vide, les mails sont ignorés / logués. |

4. Installez les dépendances et **initialisez les comptes de démonstration** :

   ```bash
   npm install
   npm run seed
   ```

   Le script crée (s’ils n’existent pas) les comptes suivants :

   | Adresse (e-mail) | Mot de passe | Rôle |
   |------------------|--------------|------|
   | `client@stb.local` | `ClientSTB!2026` | CLIENT (profil financier de démo) |
   | `agent@stb.local` | `AgentSTB!2026` | AGENT_BANCAIRE |
   | `chef@stb.local` | `ChefSTB!2026` | CHEF_AGENCE |
   | `comite@stb.local` | `ComiteSTB!2026` | COMITE_CREDIT |
   | `admin@stb.local` | `AdminSTB!2026` | ADMIN |
   | `admin.test.2026@stb.local` | `AdminTest!8nQ4` | ADMIN |

   Le premier admin peut être surchargé avec `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` avant d’exécuter le seed.

5. Démarrez l’API :

   ```bash
   npm run dev
   ```

   Vérifiez : [http://127.0.0.1:4000/api/health](http://127.0.0.1:4000/api/health) doit renvoyer `{"ok":true,...}`.

Les fichiers justificatifs sont stockés sous `backend/uploads/credits/` (ou `UPLOAD_DIR`).

---

## 4. Service de scoring (Python)

1. Terminal dans `scoring-service` :

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Lancer le service (port **5001** pour coller à `SCORING_SERVICE_URL` par défaut) :

   ```bash
   uvicorn main:app --host 127.0.0.1 --port 5001
   ```

3. Si Python n’est pas démarré, **le backend utilise un moteur de repli** avec les mêmes règles (voir `backend/src/utils/scoringClient.js`).

Le scoring renvoie un **score /100**, une **décision indicative** (seuils projet : ≥80 favorable, 50–79 à analyser, &lt;50 défavorable), des **facteurs** et des **recommandations** expliquables.

---

## 5. Frontend React

1. Terminal dans `frontend` :

   ```bash
   npm install
   npm run dev
   ```

2. Par défaut Vite écoute sur **5173** et **proxy** les requêtes `/api` vers `http://127.0.0.1:4000`.

3. Ouvrez [http://127.0.0.1:5173](http://127.0.0.1:5173).

La page d’accueil redirige vers **Simulation** (accès sans compte possible pour le calculateur et le chat).

Build de production :

```bash
npm run build
npm run preview
```

---

## 6. Parcours fonctionnels

### 6.1 Simulation (sans connexion)

- Menu **Simulation** : mensualité, intérêts, endettement après prêt, niveau de risque simplifié.

### 6.2 Client

1. **Inscription** ou connexion avec `client@stb.local`.
2. **Demande crédit** : crée un dossier **BROUILLON**.
3. **Mes dossiers** : ouvrir le dossier, **commentaire obligatoire** pour changer le statut (ex. BROUILLON → SOUMIS).
4. **Documents** : déposer des fichiers sur la fiche dossier ; télécharger le **PDF d’amortissement**.

### 6.3 Agent / Chef / Comité

Se connecter avec `agent@stb.local`, `chef@stb.local` ou `comite@stb.local`.  
Transitions possibles selon le rôle (voir workflow dans le code : `backend/src/config/workflow.js`).  
En passage à **EN_ANALYSE**, le **scoring** est calculé et stocké sur le dossier.

### 6.4 Administrateur

- Connexion `admin@stb.local`.
- Page **Administration** : modifier les **rôles** des utilisateurs.
- Journal d’audit : API `GET /api/audit` (liste réservée admin ; utilisable avec Postman + jeton admin).

### 6.5 Chatbot (Assistant)

- Bouton **🤖** : envoi vers `POST /api/chat/message`.
- Si vous écrivez une phrase avec **montant**, **durée** et **revenus** (ex.  
  `crédit de 20000 sur 5 ans revenus 3200 charges 900`), le backend enchaîne **simulation + scoring** et répond en langage naturel.
- Si vous êtes **connecté**, le profil client (revenus, charges, etc.) peut compléter automatiquement les données manquantes selon les routes.

---

## 7. Dépannage rapide

| Problème | Piste |
|----------|--------|
| `ECONNREFUSED` MongoDB | Démarrer MongoDB ou vérifier `MONGODB_URI`. |
| Frontend sans données | Vérifier que le backend tourne sur le port 4000 et que le proxy Vite est actif. |
| Scoring toujours en « repli » | Vérifier que FastAPI tourne sur le port configuré dans `SCORING_SERVICE_URL`. |
| Upload document échoue | Vérifier les droits d’écriture sur `uploads/` ; taille max ~10 Mo par fichier. |
| JWT invalide | Se reconnecter ; vérifier que `JWT_SECRET` n’a pas changé entre deux sessions. |

---

## 8. Sécurité (rappel projet)

- Ne **commitez pas** le fichier `.env`.
- En production : **HTTPS**, secrets forts, restriction CORS (`CORS_ORIGIN`), sauvegardes MongoDB.

---

## 9. Résumé des commandes (développement)

**Terminal 1 — MongoDB** (si installé en service, inutile de le lancer à la main.)

**Terminal 2 — Backend**

```bash
cd backend
npm install
npm run seed
npm run dev
```

**Terminal 3 — Scoring (optionnel)**

```bash
cd scoring-service
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 5001
```

**Terminal 4 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Vous pouvez alors utiliser l’application comme décrit aux sections 5 et 6.
