# Retain

Retain is a personal expense and monthly budget manager built with React, TypeScript, Vite, Redux Toolkit, and a REST API.

## What’s included

- Real sign-up, sign-in, sign-out, session persistence, and protected routes
- User-owned expense CRUD with validation and destructive-action confirmation
- Redux-managed search, category/payment filters, sorting, and pagination
- Monthly budget read/update flow with live progress calculations
- Responsive finance dashboard and mobile expense workflow
- Admin-only platform insights, category CRUD, and safe category reassignment
- Date-range filtering alongside search, category, payment, sorting, and pagination
- Production configuration examples, payload limits, cache headers, and CI quality checks
- Repeatable isolated API smoke test covering auth, ownership, budgets, and admin workflows
- Durable local development repository under `server/data/` when `DATABASE_URL` is absent
- PostgreSQL-backed production repository with schema initialization, seeded demo data, ownership constraints, and indexes
- Reduced-motion support, accessible focus states, 44px interaction targets, and mobile navigation

The API keeps the JSON repository as a deterministic local fallback, and automatically uses PostgreSQL whenever `DATABASE_URL` is present. This keeps smoke tests and local onboarding simple without allowing the hosted deployment to silently fall back to a file on an ephemeral filesystem.

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
emmanuel@retain.app
12345678
```

For hosted API configuration, provide `DATABASE_URL`, a strong `JWT_SECRET`, and `CORS_ORIGIN` set to the deployed frontend origin. Railway supplies the PostgreSQL connection string to the API service through a private reference variable. The API initializes the schema on startup and seeds the demo admin only when it is missing.

### Deployment shape

- Railway: API service rooted at `server/`, backed by the managed PostgreSQL service in the `Retain` project.
- GitHub repository: https://github.com/DphenomenalALU/retain-app
- Vercel project: `retain-app` — Vite frontend with `VITE_API_URL=https://<railway-api-domain>/api` and an SPA fallback for `/expenses`, `/budgets`, and `/admin`.
- Live frontend: https://retain-app-green.vercel.app
- Live API health check: https://retain-api-production.up.railway.app/api/health

Deployment environment examples live in [`.env.example`](./.env.example) and [`server/.env.example`](./server/.env.example). Never commit real secrets. On Railway, `DATABASE_URL` is linked to the Postgres service, `JWT_SECRET` is generated privately, and `CORS_ORIGIN` is locked to the Vercel production URL. On Vercel, `VITE_API_URL` is set to the Railway API URL including `/api` for production, preview, and development targets.

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
