# Retain API foundation

This folder contains the Day 4 API: signed sessions, password hashing, user-owned expense CRUD, monthly budget persistence, pagination, search/filtering/sorting, admin insights, category management, production configuration, and an isolated smoke test. Local development uses a durable JSON repository so the entire flow can be run without a hosted database; `db/schema.sql` remains the PostgreSQL deployment contract.

## Run the foundation

```bash
npm run start
```

Then open `http://localhost:4000/api/health`.

Demo admin credentials: `maya@retain.app` / `password`.

Run `npm run test:smoke` from this folder to start a temporary isolated API store and verify authentication, admin authorization, ownership boundaries, budgets, month/date filtering, and category reassignment. No local `server/data/retain.json` is modified by the test.

The schema is designed around ownership: expenses and budgets belong to a user, categories are referenced with a restrictive delete rule, and the system `Uncategorized` category receives expenses when an admin deletes a category. Admin insight routes and category mutations return `403` to authenticated non-admin users. In production, provide `JWT_SECRET` and `CORS_ORIGIN`; the API rejects missing production secrets, caps JSON request bodies at 1 MB, and marks responses as non-cacheable. The JSON store is ignored by Git and is created at `server/data/retain.json` on first run.
