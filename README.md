# STB — Système de Gestion des Crédits Bancaires

Application web **React + Node.js + MongoDB**, avec **scoring** exposé en **Python (FastAPI)** et **chatbot** branché sur l’API (simulation + scoring + FAQ).

## Démarrage rapide

1. **MongoDB** en marche (port 27017 par défaut) ou **MongoDB Atlas** via `MONGODB_URI`.
2. **Backend** : `cd backend` → copier `.env.example` vers `.env` → ajuster `MONGODB_URI` (local ou Atlas) → `npm install` → `npm run seed` → `npm run dev` (port **4000**).
3. **Scoring** (recommandé) : `cd scoring-service` → environnement Python → `pip install -r requirements.txt` → `uvicorn main:app --host 127.0.0.1 --port 5001`.
4. **Frontend** : `cd frontend` → `npm install` → `npm run dev` → navigateur [http://127.0.0.1:5173](http://127.0.0.1:5173).

### Exemple Atlas

Dans `backend/.env` :

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/stb_credit?retryWrites=true&w=majority
```

