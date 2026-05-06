# TimeTrack BE

Système de pointage pour entreprise — monorepo NestJS + Expo + Next.js.

## Stack

- **API** : NestJS + Prisma + PostgreSQL
- **Mobile** : Expo (React Native) — iOS & Android
- **Web Admin** : Next.js + Tailwind CSS

## Prérequis

- Node.js 20+
- PostgreSQL 15+
- Expo Go (sur téléphone pour le mobile)

## Installation rapide

### 1. Cloner et installer

```bash
git clone <repo>
cd timetrack-be
```

### 2. Variables d'environnement

Crée `.env` à la racine :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/timetrack"
JWT_SECRET="supersecretjwt_changeme_prod"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. API

```bash
cd apps/api
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

### 4. Web Admin

```bash
cd apps/web
npm install
npm run dev -- -p 3001
```

Ouvre http://localhost:3001

### 5. Mobile

```bash
cd apps/mobile
npm install
npx expo start --clear
```

Scanne le QR code avec Expo Go.

## Comptes demo

| Email | Mot de passe | Rôle | Scope |
|-------|-------------|------|-------|
| admin@example.com | ChangeMe123! | SUPER_ADMIN | office |
| manager@example.com | ChangeMe123! | MANAGER | office |
| office@example.com | ChangeMe123! | EMPLOYEE | office |
| commercial@example.com | ChangeMe123! | EMPLOYEE | commercial |
| worker@example.com | ChangeMe123! | EMPLOYEE | worker |

## Docker

```bash
docker-compose up -d
```

## Tests

```bash
cd apps/api
npx jest          # tests unitaires
npx jest --config ./test/jest-e2e.json  # tests E2E
```

## Architecture
timetrack-be/
├── apps/
│   ├── api/        # NestJS REST API
│   ├── mobile/     # Expo React Native
│   └── web/        # Next.js Admin
└── packages/
└── shared/     # Types partagés

## Règles métier critiques

- **Auto-approbation interdite** — un employé ne peut pas approuver ses propres entrées
- **Correction XOR** — une correction cible soit une TimeEntry soit une WorkerTimeEntry, jamais les deux
- **Worker scope** — les workers utilisent WorkerTimeEntry uniquement
- **Heures worker** — incrément de 0.5 uniquement (7.0, 7.5, 8.0...)
- **Alertes** — créées automatiquement si le total hebdo dépasse le contrat
- **Audit log** — chaque mutation est tracée