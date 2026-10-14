# Retain

Retain is a personal expense and monthly budget manager built with React, TypeScript, Vite, Redux Toolkit, and a REST API.

## Current checkpoint: Day 2

- Real sign-up, sign-in, sign-out, session persistence, and protected routes
- User-owned expense CRUD with validation and destructive-action confirmation
- Redux-managed search, category/payment filters, sorting, and pagination
- Monthly budget read/update flow with live progress calculations
- Responsive finance dashboard and mobile expense workflow
- Durable local development repository under `server/data/`
- PostgreSQL schema and indexes under `server/db/` for the deployment migration
- Reduced-motion support, accessible focus states, 44px interaction targets, and mobile navigation

The local API uses a JSON repository for deterministic development without hosted database credentials. The PostgreSQL schema is kept as the production data contract and will be used during the deployment hardening pass.

## Run the frontend

Requirements: Node.js 20+ and npm.

```bash
npm install
VITE_API_URL=http://localhost:4000/api npm run dev
```

To verify a production build:

```bash
npm run build
npm run preview
```

## Run the API

```bash
cd server
npm install
npm run start
```

Check `http://localhost:4000/api/health`.

Demo admin credentials:

```text
maya@retain.app
password
```

## Project structure

```text
src/
├── components/        Reusable layout, UI, and expense form components
├── context/           React Context authentication boundary
├── data/              Day 1 reference data and categories
├── lib/               Authenticated API client boundary
├── pages/             Dashboard, expenses, budgets, and admin routes
├── store/             Redux Toolkit store, filters, expenses, and budgets
└── types/             Shared finance domain types
server/
├── db/schema.sql      PostgreSQL schema and indexes
├── db/seed.sql        PostgreSQL seed contract
└── src/index.mjs      Day 2 authenticated REST API
```
