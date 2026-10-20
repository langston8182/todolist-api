# Todolist API

API REST CRUD serverless (AWS Lambda + API Gateway) pour gérer des **listes** (`lists`) et des **todos** (`todos`) rattachés à une liste, persistés sur **MongoDB Atlas**.

## Stack

- Node.js 20 + TypeScript
- [Serverless Framework](https://www.serverless.com/) (`serverless-esbuild`, `serverless-offline`, `serverless-dotenv-plugin`)
- MongoDB Atlas via Mongoose
- Jest (tests unitaires + tests d'intégration via `mongodb-memory-server`)

## Structure

```
src/
  config/db.ts          # Connexion MongoDB (avec cache pour les warm starts Lambda)
  models/                # Schémas Mongoose (List, Todo)
  handlers/lists/        # create, getAll, getById, update, remove
  handlers/todos/        # create, getAll, getById, update, remove
  utils/                 # Réponses HTTP, validations
tests/
  unit/                  # Tests unitaires (mocks des modèles Mongoose)
  integration/           # Tests d'intégration (MongoDB en mémoire)
serverless.yml           # Définition des fonctions Lambda + routes HTTP API
```

## Modèle de données

**List**
- `name` (string, requis)
- `description` (string, optionnel)
- `createdAt` / `updatedAt`

**Todo**
- `listId` (ObjectId, requis, référence une `List`)
- `title` (string, requis)
- `description` (string, optionnel)
- `completed` (boolean, défaut `false`)
- `dueDate` (date, optionnel)
- `createdAt` / `updatedAt`

> Supprimer une liste supprime en cascade tous ses todos associés.

## Installation

```bash
npm install
cp .env.example .env
# Renseigner MONGODB_URI avec la chaîne de connexion de ton cluster Atlas (todolist-preprod)
```

## Variables d'environnement

| Variable          | Description                                  |
|-------------------|-----------------------------------------------|
| `MONGODB_URI`      | URI de connexion MongoDB Atlas                |
| `MONGODB_DB_NAME`  | Nom de la base (`todolist` par défaut)        |

## Développement local

```bash
npm run dev
```

Lance `serverless-offline` et expose l'API localement (connectée à ton cluster Atlas via `MONGODB_URI`).

## Routes disponibles

| Méthode | Route            | Description                              |
|---------|-------------------|-------------------------------------------|
| POST    | `/lists`          | Créer une liste                           |
| GET     | `/lists`          | Lister toutes les listes                  |
| GET     | `/lists/{id}`     | Récupérer une liste                       |
| PUT     | `/lists/{id}`     | Mettre à jour une liste                   |
| DELETE  | `/lists/{id}`     | Supprimer une liste (+ ses todos)         |
| POST    | `/todos`          | Créer un todo (`listId` requis)           |
| GET     | `/todos`          | Lister les todos (`?listId=` optionnel)   |
| GET     | `/todos/{id}`     | Récupérer un todo                         |
| PUT     | `/todos/{id}`     | Mettre à jour un todo                     |
| DELETE  | `/todos/{id}`     | Supprimer un todo                         |

## Tests

```bash
npm run test:unit         # Tests unitaires (mocks)
npm run test:integration  # Tests d'intégration (mongodb-memory-server)
npm test                  # Les deux suites
```

Les tests d'intégration démarrent un MongoDB en mémoire (aucune connexion à Atlas n'est nécessaire).

## Déploiement

```bash
npm run deploy          # stage dev
npm run deploy:prod     # stage prod
```

Assure-toi que `MONGODB_URI` est disponible dans l'environnement (ou dans `.env`) au moment du déploiement : la valeur est injectée en variable d'environnement Lambda.
