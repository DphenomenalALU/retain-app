# Retain

Retain is a personal expense and monthly budget manager built with React, TypeScript, Vite, Redux Toolkit, and a planned PostgreSQL REST API.

## Day 1 foundation

The current checkpoint includes:

- Responsive Retain application shell and finance-focused dashboard
- Typed expense and budget domain models with seeded review data
- Redux Toolkit store with expense and UI slices
- React Context authentication boundary and protected routes
- User, budget, expense, and admin spaces ready for API integration
- PostgreSQL schema, indexes, and seed SQL under `server/db`
- Node API health endpoint under `server/src`
- Reduced-motion support, accessible focus states, 44px interaction targets, and mobile navigation

Day 1 uses local seed data so the UI can be reviewed before the Day 2 API integration. Authentication, expense CRUD, filters, budgets, and admin insights are the next implementation checkpoints.

## Run the frontend

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

To verify a production build:

```bash
npm run build
npm run preview
```

## Run the API foundation

```bash
cd server
npm run start
```

Check `http://localhost:4000/api/health`.

## Project structure

```text
src/
├── components/        Reusable layout and UI primitives
├── context/           React Context authentication boundary
├── data/              Typed Day 1 review data
├── lib/               API client boundary
├── pages/             Dashboard, expenses, budgets, and admin routes
├── store/             Redux Toolkit store and slices
└── types/             Shared finance domain types
server/
├── db/schema.sql      PostgreSQL schema and indexes
├── db/seed.sql        Safe initial categories, user, and budget
└── src/index.mjs      Day 1 health endpoint
```
