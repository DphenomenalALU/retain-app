# Retain API foundation

This folder contains the Retain API: signed sessions, password hashing, user-owned expense CRUD, monthly budget persistence, pagination, search/filtering/sorting, admin insights, category management, production configuration, and an isolated smoke test. Local development uses a durable JSON repository when no database URL is configured. Railway deployments use the PostgreSQL repository automatically.

## Run the foundation

```bash
npm run start
```

Then open `http://localhost:4000/api/health`.

Demo admin credentials: `emmanuel@retain.app` / `12345678`. These are assessment/demo credentials only; do not reuse them for real financial data.

Production API: `https://retain-api-production.up.railway.app`.

Run `npm run test:smoke` from this folder to start a temporary isolated API store and verify authentication, admin authorization, ownership boundaries, budgets, month/date filtering, amount-range validation, and category reassignment. No local `server/data/retain.json` is modified by the test.

The schema is designed around ownership: expenses and budgets belong to a user, categories are referenced with a restrictive delete rule, and the system `Uncategorized` category receives expenses when an admin deletes a category. Admin insight routes and category mutations return `403` to authenticated non-admin users. In production, provide `DATABASE_URL`, `JWT_SECRET`, and one or more exact comma-separated `CORS_ORIGIN` values; the API refuses to start when any required production variable is missing, caps JSON request bodies at 1 MB, and marks responses as non-cacheable. The PostgreSQL store initializes the tables and indexes on startup. The checked-in `db/schema.sql` and `db/seed.sql` files document the same database contract for manual inspection; normal Railway startup uses the runtime store initializer. The JSON store is ignored by Git and is created at `server/data/retain.json` only for local development and the smoke test.
