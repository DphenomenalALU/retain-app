# Retain API foundation

This folder contains the Day 1 backend contract: a small health endpoint, the PostgreSQL schema, indexes, and safe seed data. Expense CRUD, authentication, authorization, and dashboard queries are intentionally scheduled for Days 2–3.

## Run the foundation

```bash
npm run start
```

Then open `http://localhost:4000/api/health`.

The schema is designed around ownership: expenses and budgets belong to a user, categories are referenced with a restrictive delete rule, and the system `Uncategorized` category is available for the Day 3 reassignment flow.
