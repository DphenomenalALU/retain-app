# Retain

Retain is a personal expense and monthly budget manager built with React, TypeScript, Vite, Redux Toolkit, and a REST API.

## Technologies used

- **Frontend:** React 18, TypeScript, Vite, React Router, Redux Toolkit, and React Context
- **Backend:** Node.js with the native HTTP server, JSON Web Tokens, and bcrypt password hashing
- **Database:** PostgreSQL in production, with a durable JSON repository for local development
- **Deployment:** Vercel for the frontend, Railway for the API and PostgreSQL, and GitHub Actions for quality checks

## What’s included

- Real sign-up, sign-in, sign-out, session persistence, and protected routes
- User-owned expense CRUD with validation and destructive-action confirmation
- Redux-managed search, category/payment/amount filters, sorting, and pagination
- Monthly budget read/update flow with live progress calculations and clear on-track, approaching-limit, on-target, and over-budget states
- Responsive finance dashboard and mobile expense workflow
- Admin-only platform insights, category CRUD, and safe category reassignment
- Date-range filtering alongside search, category, payment, sorting, and pagination
- Production configuration examples, payload limits, cache headers, and CI quality checks
- Repeatable isolated API smoke test covering auth, ownership, budgets, and admin workflows
- Durable local development repository under `server/data/` when `DATABASE_URL` is absent
- PostgreSQL-backed production repository with schema initialization, seeded demo data, ownership constraints, and indexes
- Reduced-motion support, accessible focus states, 44px interaction targets, and mobile navigation

The API keeps the JSON repository as a deterministic local fallback, and automatically uses PostgreSQL whenever `DATABASE_URL` is present. This keeps smoke tests and local onboarding simple without allowing the hosted deployment to silently fall back to a file on an ephemeral filesystem.

## Run Retain locally

Requirements: Node.js 20+ and npm.

Install dependencies once from the repository root and API folder:

```bash
npm install
cd server
npm install
cd ..
```

Run both services in separate terminals:

```bash
# Terminal 1 — API
cd server
npm run dev
```

```bash
# Terminal 2 — Vite frontend
VITE_API_URL=http://localhost:4000/api npm run dev
```

Open `http://localhost:5173`. The API should report `json` storage locally and be reachable at `http://localhost:4000/api/health`.

If you prefer a production-style frontend preview, build first and then run:

```bash
npm run build
npm run preview
```

To run the isolated API verification suite:

```bash
npm run test:smoke
```

## Run the API only

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

These credentials are for assessment/demo use only. Do not reuse them for personal financial data or treat them as a production administrator account.

For hosted API configuration, provide `DATABASE_URL`, a strong `JWT_SECRET`, and `CORS_ORIGIN` set to one or more exact frontend origins. The API requires all three values in production, initializes the PostgreSQL schema on startup, upserts the demo admin identity, and seeds sample financial data only when the database is empty.

## Deploying Retain

Retain is deployed as three connected pieces:

1. **Vercel** serves the Vite frontend.
2. **Railway** runs the Node API from `server/`.
3. **Railway PostgreSQL** stores users, expenses, budgets, and categories.

The GitHub `main` branch is the source of truth. A push to `main` should trigger a frontend deployment on Vercel and an API deployment on Railway when both services are connected to the repository.

### Current hosted project

- Repository: [DphenomenalALU/retain-app](https://github.com/DphenomenalALU/retain-app)
- Vercel project: `retain-app`
- Frontend: [retain-app-green.vercel.app](https://retain-app-green.vercel.app)
- Railway API: [retain-api-production.up.railway.app](https://retain-api-production.up.railway.app)
- API health check: [retain-api-production.up.railway.app/api/health](https://retain-api-production.up.railway.app/api/health)

### Deploy the API on Railway

1. Create or open the `Retain` Railway project.
2. Add a PostgreSQL service.
3. Add the API service from the GitHub repository and set its **Root Directory** to `server/`.
4. Connect the service to the `main` branch. Railway should use `npm install` to install dependencies and `npm start` to run the API.
5. Add these variables to the API service:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Reference the PostgreSQL service’s `DATABASE_URL`. |
   | `JWT_SECRET` | A long, private random value. Never use the example value. |
   | `CORS_ORIGIN` | One or more exact Vercel origins, comma-separated if needed. For production use `https://retain-app-green.vercel.app`; add a specific preview origin only while testing that preview. Do not add trailing slashes. |
   | `NODE_ENV` | `production` |

   Railway provides `PORT` automatically. The API refuses to start in production unless `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` are present. It initializes the PostgreSQL schema and applies the demo seed/migration during startup, so there is no manual SQL step for a normal deploy.

6. Generate or confirm the Railway public domain, then verify it:

   ```bash
   curl https://your-railway-domain.up.railway.app/api/health
   ```

   A healthy response includes `"status":"ok"` and `"storage":"postgres"`.

### Deploy the frontend on Vercel

1. Import `DphenomenalALU/retain-app` into the Vercel team that owns the project.
2. Use the repository root (`./`) as the **Root Directory** and choose the **Vite** preset.
3. Set this environment variable for Production and Preview:

   ```text
   VITE_API_URL=https://retain-api-production.up.railway.app/api
   ```

4. Deploy. The checked-in [`vercel.json`](./vercel.json) already defines the Vite build, `dist` output, and SPA fallback needed for `/expenses`, `/budgets`, and `/admin`.
5. Open the deployment and test sign-in. The seeded admin account is:

   ```text
   emmanuel@retain.app
   12345678
   ```

   Vercel preview deployments use changing URLs. Before testing a preview against Railway, add that preview’s exact origin to Railway’s comma-separated `CORS_ORIGIN`, redeploy the API, and remove it afterward if it is no longer needed.

### Verify a release

Run these checks after a first deploy or infrastructure change:

```bash
# API is online and using PostgreSQL
curl https://retain-api-production.up.railway.app/api/health

# Frontend serves the SPA entry point
curl -I https://retain-app-green.vercel.app/sign-in

# Local API regression suite
npm run test:smoke

# Frontend typecheck and production build
npm run build
```

Then sign in through the hosted frontend, create an expense, update the monthly budget, and confirm the dashboard reflects the change after a refresh. For an admin check, open `/admin` with the seeded account and verify category and insight data load.

### Future deployments

For normal changes, commit and push to `main`. Vercel rebuilds the frontend and Railway rebuilds the API from the new commit. If Railway does not start a deployment, check that the API service is still connected to `DphenomenalALU/retain-app` on `main`; redeploying an old Railway build will not include new source changes.

Keep local and hosted configuration separate. The frontend uses [`.env.example`](./.env.example) as a template, while the API uses [`server/.env.example`](./server/.env.example). Never commit real secrets, database URLs, JWT keys, or exported production environment files.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| `Email or password is incorrect` locally | Restart the API after pulling the latest code so the local JSON seed migration runs. Confirm the API is listening on `http://localhost:4000`. |
| CORS error in the browser | Make `CORS_ORIGIN` exactly match the Vercel origin, including `https://` and excluding a trailing slash. Redeploy the API after changing it. |
| `/expenses`, `/budgets`, or `/admin` returns 404 after refresh | Confirm the deployment is using the committed [`vercel.json`](./vercel.json) SPA rewrite. |
| API reports file storage in production | `DATABASE_URL` is missing or invalid. Link the Railway PostgreSQL variable to the API service and redeploy. |
| Vercel shows an old UI | Confirm the deployment is building `main`, then inspect the latest deployment commit before changing environment variables. |

## Project structure

```text
src/
├── components/        Reusable layout, UI, and expense form components
├── context/           React Context authentication boundary
├── data/              Category palette and visual metadata
├── lib/               Authenticated API client boundary
├── pages/             Dashboard, expenses, budgets, and admin routes
├── store/             Redux Toolkit store, filters, expenses, and budgets
└── types/             Shared finance domain and admin insight types
server/
├── db/schema.sql      PostgreSQL schema and indexes (manual reference)
├── db/seed.sql        PostgreSQL demo seed (manual reference)
└── src/index.mjs      Authenticated REST API and admin endpoints
```

GitHub Actions runs the frontend build and the isolated API smoke test on pushes and pull requests through `.github/workflows/quality.yml`.

## API surface

The API is rooted at `/api`. JSON requests use `Content-Type: application/json`. Protected requests send the signed session returned by sign-in or sign-up as `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health, environment, and storage check. |
| `POST` | `/api/auth/signup` | Public | Create a user account and return a session. Passwords must be at least 8 characters. |
| `POST` | `/api/auth/signin` | Public | Authenticate a user and return a session. |
| `GET` | `/api/auth/me` | Authenticated | Resolve the current session user. |
| `POST` | `/api/auth/signout` | Client session | Acknowledge sign-out; the client removes its token. |
| `GET` | `/api/categories` | Authenticated | List categories; admins also receive usage counts. |
| `GET` / `POST` | `/api/expenses` | Authenticated | List or create expenses owned by the current user. |
| `PATCH` / `DELETE` | `/api/expenses/:id` | Authenticated owner | Update or delete only the current user’s expense. |
| `GET` / `PUT` | `/api/budgets/:month` | Authenticated owner | Read or update the current user’s `YYYY-MM` budget. |
| `GET` | `/api/admin/insights` | Admin only | Platform totals, category usage, recent expenses, and recent users. |
| `POST` | `/api/categories` | Admin only | Create an expense category with a supported icon and color. |
| `PATCH` / `DELETE` | `/api/categories/:id` | Admin only | Update or delete a category; deleted expenses move to `Uncategorized`. |
| `DELETE` | `/api/users/:id` | Admin only | Delete another user and their owned expenses/budgets. The current admin cannot delete itself. |

Expense list requests support `month`, `search`, `categoryId`, `paymentMethod`, `dateFrom`, `dateTo`, `minAmount`, `maxAmount`, `sortBy`, `sortDirection`, `page`, and `pageSize`. `minAmount` and `maxAmount` are inclusive non-negative amount filters; the API rejects a range where the minimum exceeds the maximum. List responses use an `items` array plus pagination metadata: `page`, `pageSize`, `total`, and `totalPages`.

The authorization model is intentionally split: React Context owns the client session, role, sign-in, sign-up, sign-out, and protected routes; the API verifies the JWT on every protected request, enforces user ownership for expenses and budgets, and applies admin checks to insights, category mutations, and user deletion. Redux owns expense search, filtering, sorting, pagination, and server-backed list state.
