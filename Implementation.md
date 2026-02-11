# Calendarium – Project Implementation

## Project Overview

**Name:** Calendarium
**Author:** Lucas Viera
**Start Date:** 2026-02-11
**Stack:** Next.js (App Router) · TypeScript · Prisma · PostgreSQL · Docker · bcrypt · Zod

---

## Architectural Decisions

- Monorepo using Next.js with App Router
- API Routes for backend logic
- Prisma as ORM with PostgreSQL
- Docker for local development environment
- Separation of concerns, security first, incremental implementation

### Note on ORM Choice

Prisma was chosen for this MVP due to its developer productivity, auto-generated TypeScript types, and declarative schema migrations. However, it abstracts raw SQL and adds a query engine layer that may introduce overhead at scale. For high-performance or complex query scenarios, alternatives like **Drizzle ORM** (thinner abstraction, closer to SQL) or **direct query builders** (e.g., Knex, pg) would be evaluated. This is a conscious trade-off: prioritizing type-safety and development speed for an MVP over fine-grained SQL control.

---

# Implementation Stages

---

## Stage 1 – Project Initialization

### Objective

Initialize the Next.js project with TypeScript, Tailwind CSS, and ESLint. Verify the dev server runs correctly.

### Commands Executed

```bash
# Create Next.js project in current directory
npx create-next-app@latest . --typescript --eslint --app --src-dir --import-alias "@/*" --use-npm

# Interactive prompts answered:
# - Tailwind CSS: Yes
# - React Compiler: No
# - Turbopack: Not asked (default behavior in this version)

# Verify dev server
npm run dev
# → http://localhost:3000 running successfully
```

### What Was Done

- Created Next.js project with App Router and TypeScript
- Enabled Tailwind CSS for styling
- ESLint configured out of the box
- Source code placed in `src/` directory for clean separation
- Import alias `@/*` configured for absolute imports from `src/`
- Git repository initialized automatically by create-next-app

### Project Structure After This Stage

```
calendarium/
├── src/
│   └── app/
│       ├── favicon.ico
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── public/
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

### Technical Decisions

| Decision | Reasoning |
|---|---|
| `--src-dir` | Separates source code from config files at the root |
| `--app` | Uses App Router (modern Next.js paradigm) over Pages Router |
| Tailwind CSS | Industry standard for utility-first CSS, fast prototyping |
| React Compiler: No | Still maturing, MVP doesn't need auto-optimization, better to learn manual patterns |
| npm over yarn/pnpm | Consistency, widely supported, no specific need for alternatives |

### Problems Encountered

None.

### Current System State

- Next.js dev server runs on `http://localhost:3000`
- Default landing page renders correctly
- 0 vulnerabilities in dependencies
- 356 packages installed

---

## Stage 2 – Docker & PostgreSQL Setup

### Objective

Create a local development environment using Docker Compose with a PostgreSQL container. Configure environment variables for database connection.

### Commands Executed

```bash
# Create and start PostgreSQL container in detached mode
docker compose up -d

# Verify container is running
docker ps
# → calendarium-db running, port 5432 mapped
```

### What Was Done

- Created `docker-compose.yml` with a PostgreSQL 16 (Alpine) service
- Configured database credentials via environment variables in the compose file
- Created `.env` with `DATABASE_URL` connection string for Prisma
- Verified `.gitignore` already covers `.env*` (line 34, added by create-next-app)
- PostgreSQL container started and verified via `docker ps` and Docker Desktop UI

### Files Created

| File | Purpose |
|---|---|
| `docker-compose.yml` | Defines PostgreSQL service, port mapping, and persistent volume |
| `.env` | Stores `DATABASE_URL` for Prisma database connection |

### Technical Decisions

| Decision | Reasoning |
|---|---|
| `postgres:16-alpine` | Lightweight image (~80MB vs ~400MB full), PostgreSQL 16 is latest stable |
| Only DB in Docker, not the app | Next.js runs better natively for dev (hot reload, debugging). DB in container for portability |
| Named volume (`pgdata`) | Persists data between container restarts. Without it, `docker compose down` would erase all data |
| `restart: unless-stopped` | Auto-recovers from crashes without manual intervention |
| Dev credentials in compose | Acceptable for local dev. Production would use secrets management |
| `.env` for `DATABASE_URL` | Standard 12-factor app pattern. Prisma reads it automatically |

### Problems Encountered

None.

### Current System State

- PostgreSQL 16 running in Docker container `calendarium-db`
- Port `5432` exposed to localhost
- Database `calendarium` created with user `calendarium`
- `.env` configured with connection string
- **Next step:** Install Prisma and initialize schema