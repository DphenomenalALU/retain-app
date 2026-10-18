# Retain

Retain is a personal expense and monthly budget manager built with React, TypeScript, Vite, Redux Toolkit, and a REST API.

## Current checkpoint: Day 4

- Real sign-up, sign-in, sign-out, session persistence, and protected routes
- User-owned expense CRUD with validation and destructive-action confirmation
- Redux-managed search, category/payment filters, sorting, and pagination
- Monthly budget read/update flow with live progress calculations
- Responsive finance dashboard and mobile expense workflow
- Admin-only platform insights, category CRUD, and safe category reassignment
- Date-range filtering alongside search, category, payment, sorting, and pagination
- Production configuration examples, payload limits, cache headers, and CI quality checks
- Repeatable isolated API smoke test covering auth, ownership, budgets, and admin workflows
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

To run the isolated API verification suite:

```bash
npm run test:smoke
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

For hosted API configuration, copy `server/.env.example` into the deployment environment. A production process must provide a strong `JWT_SECRET`; set `CORS_ORIGIN` to the deployed frontend origin. The local JSON repository is deterministic for development and smoke tests; the PostgreSQL schema in `server/db/schema.sql` remains the production database contract for Day 5 deployment.

## Project structure

```text
src/
├── components/        Reusable layout, UI, and expense form components
├── context/           React Context authentication boundary
├── data/              Day 1 reference data and categories
├── lib/               Authenticated API client boundary
├── pages/             Dashboard, expenses, budgets, and admin routes
├── store/             Redux Toolkit store, filters, expenses, and budgets
└── types/             Shared finance domain and admin insight types
server/
├── db/schema.sql      PostgreSQL schema and indexes
├── db/seed.sql        PostgreSQL seed contract
└── src/index.mjs      Authenticated REST API and admin endpoints
```

GitHub Actions runs the frontend build and the isolated API smoke test on pushes and pull requests through `.github/workflows/quality.yml`.

## API surface

Authenticated user routes include `GET /categories`, `GET/POST /expenses`, `PATCH/DELETE /expenses/:id`, and `GET/PUT /budgets/:month`. Expense lists accept `month`, `search`, `categoryId`, `paymentMethod`, `dateFrom`, `dateTo`, `sortBy`, `sortDirection`, `page`, and `pageSize`.

Admin-only routes include `GET /admin/insights`, plus `POST /categories`, `PATCH /categories/:id`, and `DELETE /categories/:id`. Deleting a category safely reassigns its expenses to the system `Uncategorized` category.
