# Retain API foundation

This folder contains the Day 2 API: signed sessions, password hashing, user-owned expense CRUD, category reads, monthly budget persistence, pagination, filtering, and sorting. Local development uses a durable JSON repository so the entire flow can be run without a hosted database; `db/schema.sql` remains the PostgreSQL deployment contract.

## Run the foundation

```bash
npm run start
```

Then open `http://localhost:4000/api/health`.

Demo admin credentials: `maya@retain.app` / `password`.

The schema is designed around ownership: expenses and budgets belong to a user, categories are referenced with a restrictive delete rule, and the system `Uncategorized` category is available for the Day 3 reassignment flow. The JSON store is ignored by Git and is created at `server/data/retain.json` on first run.
