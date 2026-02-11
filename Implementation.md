# Calendarium – Implementation Log

> **Project vision, requirements, and future architecture plans are in [REQUIREMENTS.md](./REQUIREMENTS.md).**

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

### Note on Date-Only Fields (`birthday`)

Prisma does not natively support a `Date`-only type (without time). The `DateTime` type maps to PostgreSQL's `TIMESTAMP(3)`, which stores date + time with millisecond precision.

For fields like `birthday`, where only `YYYY-MM-DD` is semantically meaningful:

- **In the database:** stored as `TIMESTAMP(3)` with time set to `00:00:00.000Z`
- **In the API/frontend:** formatted to date-only with `date.toISOString().split("T")[0]`
- **Why not `String`:** loses DB-level date validation (invalid dates like `2000-02-31` would be accepted), prevents range queries (`WHERE birthday BETWEEN ...`), and breaks type-safety
- **Why not PostgreSQL `DATE` type directly:** Prisma's schema language doesn't expose a pure `Date` type for PostgreSQL. Using `@db.Date` would still return a JavaScript `Date` object with a zeroed time component — no practical benefit over `DateTime`

This is a known Prisma limitation. If date-only precision becomes critical (e.g., timezone-sensitive logic across date boundaries), a raw query or Drizzle ORM would be considered.

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

| Decision           | Reasoning                                                                           |
| ------------------ | ----------------------------------------------------------------------------------- |
| `--src-dir`        | Separates source code from config files at the root                                 |
| `--app`            | Uses App Router (modern Next.js paradigm) over Pages Router                         |
| Tailwind CSS       | Industry standard for utility-first CSS, fast prototyping                           |
| React Compiler: No | Still maturing, MVP doesn't need auto-optimization, better to learn manual patterns |
| npm over yarn/pnpm | Consistency, widely supported, no specific need for alternatives                    |

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
# → calendarium-db running, port 5433 mapped to internal 5432

# Install Prisma CLI and dependencies
npm install prisma@6 --save-dev
npm install @prisma/client@6
npm install dotenv --save-dev
npm install pg --save-dev  # Used for debugging TCP connection

# Initialize Prisma
npx prisma init

# Validate schema
npx prisma validate
# → The schema is valid 🚀

# Run first migration
unset DATABASE_URL && npx prisma migrate dev --name init
# → Migration 20260211182853_init applied
# → Prisma Client generated (v6.19.2)

# Verify tables created
docker exec -it calendarium-db psql -U calendarium -d calendarium -c "\dt"
# → users table + _prisma_migrations table
```

### What Was Done

- Created `docker-compose.yml` with a PostgreSQL 16 (Alpine) service on port **5433** (to avoid conflict with local PostgreSQL)
- Configured database credentials via environment variables in the compose file
- Created `.env` with `DATABASE_URL` connection string pointing to port 5433
- Verified `.gitignore` already covers `.env*` (line 34, added by create-next-app)
- PostgreSQL container started and verified via `docker ps` and Docker Desktop UI
- Installed Prisma 6 (CLI + Client) and initialized schema
- Defined `User` model with UUID, email, password, role enum, and timestamps
- Ran first migration — `users` table created in PostgreSQL
- Prisma Client generated in `node_modules/@prisma/client`

### Files Created

| File                                                  | Purpose                                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| `docker-compose.yml`                                  | Defines PostgreSQL service, port mapping (5433→5432), and persistent volume |
| `.env`                                                | Stores `DATABASE_URL` for Prisma database connection                        |
| `prisma/schema.prisma`                                | Prisma schema with User model, Role enum, and PostgreSQL datasource         |
| `prisma/migrations/20260211182853_init/migration.sql` | Auto-generated SQL for initial migration                                    |

### Technical Decisions

| Decision                       | Reasoning                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `postgres:16-alpine`           | Lightweight image (~80MB vs ~400MB full), PostgreSQL 16 is latest stable                                                                         |
| Port `5433` (not `5432`)       | Avoids conflict with locally installed PostgreSQL (see Lessons Learned)                                                                          |
| Only DB in Docker, not the app | Next.js runs better natively for dev (hot reload, debugging). DB in container for portability                                                    |
| Named volume (`pgdata`)        | Persists data between container restarts. Without it, `docker compose down` would erase all data                                                 |
| `restart: unless-stopped`      | Auto-recovers from crashes without manual intervention                                                                                           |
| Dev credentials in compose     | Acceptable for local dev. Production would use secrets management                                                                                |
| `.env` for `DATABASE_URL`      | Standard 12-factor app pattern. Prisma reads it automatically                                                                                    |
| Prisma 6 instead of 7          | Prisma 7 has confirmed bugs on Windows ([#28756](https://github.com/prisma/prisma/issues/28756)). Prisma 6 is stable and sufficient for this MVP |

### Lessons Learned: Port Conflict Debugging

> **Root Cause:** A locally installed PostgreSQL on Windows was listening on port `5432`, the same default port as the Docker container. All connections from the host machine reached the **local** PostgreSQL (which didn't have the `calendarium` user) instead of the Docker container.
>
> **Why it was hard to find:**
>
> - `docker exec psql` connected from **inside** the container, bypassing the port conflict entirely — so it always worked
> - The Prisma error message (`credentials for (not available)`) was misleading — it hid the actual auth failure
> - We initially blamed Prisma 7's new `prisma.config.ts` architecture, then SCRAM-SHA-256, then Git Bash. All were red herrings.
>
> **How we found it:**
>
> 1. Installed `pg` npm package and tested TCP connection from Node.js directly → failed with "password authentication failed"
> 2. Confirmed the issue was NOT Prisma-specific
> 3. Ran `netstat -ano | findstr :5432` → found **two** processes (PIDs 14656 and 30540) listening on port 5432
> 4. Changed Docker mapping to `5433:5432` → connection succeeded immediately
>
> **Fix:** Map Docker container to port `5433` externally, keep `5432` internally.
>
> **Takeaways:**
>
> - Always check for port conflicts before blaming the tool (`netstat -ano | findstr :PORT`)
> - `docker exec` tests prove the container works, NOT that the host can reach it
> - When debugging connection issues, test with the simplest possible client first (raw `pg` package) before blaming ORMs
> - A stale `export DATABASE_URL=...` in a shell session overrides `.env` — always `unset` after debugging
>
> **Additional note:** Prisma 7 does have a confirmed Windows bug ([prisma/prisma#28756](https://github.com/prisma/prisma/issues/28756)), but it was NOT the cause of our issue. We kept Prisma 6 anyway as it is more stable and sufficient for this project.

### Problems Encountered

- Port conflict with locally installed PostgreSQL (see Lessons Learned above)
- Stale `export DATABASE_URL` in shell session overriding `.env` file

### Current System State

- PostgreSQL 16 running in Docker container `calendarium-db`
- Port `5433` exposed to host (mapped to internal `5432`)
- Database `calendarium` with `users` table and `_prisma_migrations` table
- Prisma 6.19.2 installed (CLI + Client)
- First migration applied (`20260211182853_init`)
- Prisma Client generated in `node_modules/@prisma/client`
- **Stage 2 complete.**

---

## Stage 3 – Prisma Client Singleton, Validation & Register API

### Objective

Create the Prisma Client singleton, install validation/hashing dependencies, and build the `/api/auth/register` route.

### Commands Executed

```bash
# (to be filled as we execute)
```

### What Was Done

- Created `src/lib/prisma.ts` — Prisma Client singleton

### Key Concept: Prisma Client Singleton Pattern

**Problem it solves:**

In development, Next.js performs **hot module replacement (HMR)** on every file save. If `new PrismaClient()` is called inside an API route or server component, each HMR cycle creates a **new database connection**. After a few minutes of active development, this leads to:

```
Error: Too many clients already
```

PostgreSQL has a default limit of 100 connections. Without the singleton, you can exhaust this limit in minutes.

**How the singleton works:**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Mechanism:**

| Environment     | Behavior                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Development** | The instance is stored on `globalThis` (Node.js global object). `globalThis` survives HMR, so the same PrismaClient is reused across hot reloads. Only one connection is ever opened. |
| **Production**  | The module is loaded once (no HMR). The `if` block doesn't execute, but it doesn't matter — there's only one instance anyway.                                                         |

**Why `globalThis` and not a module-level variable?**

Module-level variables (`const prisma = new PrismaClient()`) are re-evaluated on every HMR cycle because Node.js re-imports the module. `globalThis` is the only object that persists across module re-evaluations in Next.js dev mode.

### Technical Decisions

| Decision                   | Reasoning                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `src/lib/prisma.ts`        | Convention for shared utilities. `lib/` signals "infrastructure code, not business logic" |
| Singleton via `globalThis` | Official Prisma + Next.js recommended pattern to prevent connection exhaustion            |
| `?? new PrismaClient()`    | Nullish coalescing — creates a new instance only if one doesn't exist                     |

### Dependencies Installed

```bash
npm install bcryptjs zod
npm install @types/bcryptjs --save-dev
npm install pg --save-dev  # Used during Stage 2 debugging, kept for potential direct queries
```

| Package           | Type          | Purpose                                                  |
| ----------------- | ------------- | -------------------------------------------------------- |
| `zod`             | runtime       | Schema validation for user input                         |
| `bcryptjs`        | runtime       | Password hashing (pure JS, no native compilation needed) |
| `@types/bcryptjs` | devDependency | TypeScript type definitions for bcryptjs                 |

### Key Concept: Why `bcryptjs` instead of `bcrypt`

`bcrypt` is a native C++ addon that requires `node-gyp` to compile. On Windows this frequently fails due to missing build tools (Visual Studio, Python). `bcryptjs` is a pure JavaScript implementation with an identical API. The performance difference (~3x slower on hash operations) is irrelevant for an MVP — a hash still takes < 200ms vs < 70ms per operation. For production at scale, native `bcrypt` would be reconsidered.

### Key Concept: Zod Validation Schema

**File:** `src/lib/validators.ts`

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(32, "Password must be less than 32 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
```

**Why Zod and not manual validation?**

| Approach         | Problem                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Manual `if/else` | Verbose, error-prone, no type inference, hard to maintain                                  |
| Zod schema       | Declarative, auto-generates TypeScript types, composable, reusable on frontend and backend |

**Why the schema lives in `src/lib/validators.ts` (not in the route)?**

- **Reusability:** Same schema can be imported by the frontend form for client-side validation
- **Single source of truth:** Validation rules defined once, used everywhere
- **Testability:** Can be unit-tested independently from HTTP layer

**Design decisions in the schema:**

| Rule                                   | Reasoning                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `.email()`                             | Zod built-in email format validation                                                                                                   |
| `.transform(val => val.toLowerCase())` | Normalizes email to prevent duplicates (`User@Mail.com` vs `user@mail.com`)                                                            |
| `.min(8)`                              | Industry standard minimum password length                                                                                              |
| `.max(32)`                             | bcrypt silently truncates input at 72 bytes. 32 chars keeps well within this limit while being user-friendly                           |
| `.regex(/[A-Z]/)`                      | At least one uppercase letter — basic complexity requirement                                                                           |
| `.regex(/[0-9]/)`                      | At least one number — basic complexity requirement                                                                                     |
| `z.infer<typeof registerSchema>`       | Extracts the TypeScript type from the schema. Result: `{ email: string; password: string }` — but guaranteed to have passed validation |

### Key Concept: Password Utility Extraction (`src/lib/auth.ts`)

```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Why extract this?**

| Criterion                                                          | Applies? |
| ------------------------------------------------------------------ | -------- |
| Used in more than one place (register + login)                     | Yes      |
| Encapsulates implementation detail (salt rounds)                   | Yes      |
| If bcrypt is swapped for argon2, only one file changes             | Yes      |
| Improves readability (`hashPassword(pw)` vs `bcrypt.hash(pw, 12)`) | Yes      |

**Why NOT extract other things (yet)?**

- `findUnique` for user existence → one-liner, only used in register. YAGNI.
- Zod `safeParse` + 400 response → each route may have different schemas and error formats. The schema itself is already reusable.

**Rule of thumb:** Extract when the same logic appears in 2+ places, encapsulates a meaningful detail, or improves readability. Don't extract to "prepare for the future" — refactor when the need is real.

### Key Concept: Register API Route (`POST /api/auth/register`)

**File:** `src/app/api/auth/register/route.ts`

**Request flow:**

```
Client POST → Validate (Zod) → Check duplicate (Prisma) → Hash (bcrypt) → Create (Prisma) → Response
```

**HTTP status codes used:**

| Status                      | Meaning                   | When                                |
| --------------------------- | ------------------------- | ----------------------------------- |
| `201 Created`               | Success, resource created | User registered successfully        |
| `400 Bad Request`           | Client sent invalid data  | Zod validation failed               |
| `409 Conflict`              | Resource already exists   | Email already registered            |
| `500 Internal Server Error` | Unexpected failure        | Database error, unhandled exception |

**Security decisions in the route:**

| Decision                       | Reasoning                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `safeParse` instead of `parse` | Returns a result object instead of throwing. Gives control over error response without nested try/catch                |
| `flatten().fieldErrors`        | Formats errors per field so frontend can map each error to its input                                                   |
| `findUnique` before `create`   | Clean error message for duplicates. Alternative: catch Prisma's unique constraint error, but less readable             |
| `hashPassword(password)`       | Delegates to `lib/auth.ts`. Salt rounds (12) centralized. 12 is current industry standard (10 minimum, 12 recommended) |
| Response excludes `password`   | Never expose the hash, even in success responses. Explicit field selection instead of spread                           |
| `try/catch` wraps everything   | Prevents stack traces from leaking to the client                                                                       |

**Tested scenarios:**

```bash
# Test 1 — Successful registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234"}'
# → 201: { id, email, role: "USER", createdAt }

# Test 2 — Duplicate email
# (same curl again)
# → 409: { error: "Email already registered" }

# Test 3 — Validation failure
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "short"}'
# → 400: { error: "Validation failed", details: { email: [...], password: [...] } }
```

### Files Created in This Stage

| File                                 | Purpose                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| `src/lib/prisma.ts`                  | Prisma Client singleton (prevents connection exhaustion in dev)   |
| `src/lib/validators.ts`              | Zod validation schemas (reusable on frontend and backend)         |
| `src/lib/auth.ts`                    | Password hashing/comparison utilities (centralizes bcrypt config) |
| `src/app/api/auth/register/route.ts` | `POST /api/auth/register` endpoint                                |

### Project Structure After This Stage

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── register/
│   │           └── route.ts       ← Register endpoint
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── lib/
    ├── auth.ts                    ← Password utilities
    ├── prisma.ts                  ← DB client singleton
    └── validators.ts              ← Zod schemas
```

### Problems Encountered

None.

### Current System State

- `POST /api/auth/register` — fully functional with validation, duplicate check, hashing
- Prisma Client singleton preventing connection exhaustion
- Password utilities ready for login (comparePassword already implemented)
- Zod schemas ready for frontend reuse
- **Stage 3 complete.**

---

## Stage 4 – Login API

### Objective

Create the `POST /api/auth/login` endpoint with email/password validation, credential verification, and secure error handling.

### Commands Executed

```bash
# Test 1 — Successful login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234"}'
# → 200: { id, email, role, createdAt }

# Test 2 — Wrong password
# → 401: { error: "Invalid email or password" }

# Test 3 — Non-existent email
# → 401: { error: "Invalid email or password" }
```

### What Was Done

- Created `loginSchema` in `src/lib/validators.ts` (separate from registerSchema)
- Created `src/app/api/auth/login/route.ts`
- Reused `comparePassword` from `src/lib/auth.ts` (justifies the earlier extraction)
- All three test scenarios pass correctly

### Files Created

| File                              | Purpose                         |
| --------------------------------- | ------------------------------- |
| `src/app/api/auth/login/route.ts` | `POST /api/auth/login` endpoint |

### Key Concept: Why Login Validation Differs from Register

| Schema           | Password rules                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `registerSchema` | `.min(8).max(32).regex(/[A-Z]/).regex(/[0-9]/)` — enforces complexity because we're creating a new password |
| `loginSchema`    | `.min(1)` — only checks non-empty. If we reject by format, we leak password policy info to attackers        |

### Key Concept: User Enumeration Prevention

Both "email not found" and "wrong password" return the **same response**:

```json
{ "error": "Invalid email or password" } // 401
```

**Why identical responses?** If the API returned different messages ("email not registered" vs "incorrect password"), an attacker could probe thousands of emails to build a list of valid users. This enables:

- Credential stuffing (trying leaked passwords from other breaches)
- Targeted phishing ("We're Calendarium, your account needs verification...")
- Social engineering attacks

**Exception:** The register endpoint DOES say "Email already registered" (409) — this is necessary for UX. But login never reveals which credential failed.

**Advanced note (timing attacks):** When the email doesn't exist, the response is slightly faster (no bcrypt compare). An attacker measuring response times could infer email existence. The mitigation is a dummy `bcrypt.compare` on miss. Not implemented in this MVP, but documented for future hardening.

### Technical Decisions

| Decision                                     | Reasoning                                                       |
| -------------------------------------------- | --------------------------------------------------------------- |
| Separate `loginSchema` from `registerSchema` | Different validation rules for different security contexts      |
| Generic 401 for all auth failures            | Prevents user enumeration attacks                               |
| HTTP 200 (not 201) for login                 | No resource was created; this is a verification, not a creation |
| Reuse `comparePassword` from `lib/auth`      | Validates the earlier extraction decision                       |

### Project Structure After This Stage

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/
│   │       │   └── route.ts       ← Login endpoint
│   │       └── register/
│   │           └── route.ts       ← Register endpoint
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── lib/
    ├── auth.ts                    ← hashPassword + comparePassword
    ├── prisma.ts                  ← DB client singleton
    └── validators.ts              ← registerSchema + loginSchema
```

### Problems Encountered

None.

### Current System State

- `POST /api/auth/register` — functional (validation, duplicate check, hashing)
- `POST /api/auth/login` — functional (validation, credential check, secure errors)
- Full auth cycle works: register a user, then login with same credentials
- No session/JWT yet — login only verifies credentials and returns user data
- **Stage 4 complete.** Next: add session management or build the Landing Page UI
