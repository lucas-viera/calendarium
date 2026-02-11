# Calendarium – Requirements & Architecture

> **Implementation details, commands, and debugging logs are in [IMPLEMENTATION.md](./IMPLEMENTATION.md).**

## Project Overview

**Project Name:** Calendarium

**Author:** Lucas Viera

**Start Date:** 2026-02-11

## Vision

This project is being built as a SaaS-ready web platform with future subscription tiers and usage-based feature limitations.

The architecture is designed from the beginning to:

- Scale internationally
- Support multiple subscription tiers
- Track business metrics
- Maintain proper observability
- Avoid structural refactors in later phases

---

## Technology Stack

- Next.js (App Router)
- TypeScript (Strict Mode)
- Prisma ORM
- PostgreSQL
- Docker (local development)
- bcryptjs (password hashing)
- Zod (validation)
- Pino (structured logging – planned)

---

## Architectural Principles

1. Separation of concerns
2. UTC as canonical time reference
3. Structured logging
4. Business metrics separated from technical logs
5. SaaS-oriented modeling
6. Incremental implementation
7. Security-first mindset

---

# Functional Requirements by Phase

---

## Phase 1 – MVP (Current)

- Landing page with Login and Register options
- User registration with email and password
- Password requirements: min 8 chars, max 32, 1 uppercase, 1 number
- Password hashing with bcrypt
- Persistence in PostgreSQL
- UUID as primary key
- Automatic createdAt and updatedAt
- Role enum (ADMIN, USER)
- Login endpoint
- Single repository

## Phase 2+ (Planned)

- JWT/session management for persistent authentication (stateless tokens, refresh flow)
- User profile completion (name, surname, birthday, city, country)
- Calendar / event features
- Dashboard with profile completion indicator
- (Add new requirements here as they arise)

---

# Database Design Strategy

## User Model

- UUID as primary key
- Unique email (normalized to lowercase)
- Hashed password (bcrypt, 12 salt rounds)
- Role enum (ADMIN / USER), default USER
- Profile fields: name, surname, birthday, city, country (all nullable)
- createdAt, updatedAt (automatic, UTC)

## UsageEvent Model (Planned)

- id (UUID)
- userId (nullable)
- type (enum)
- endpoint (nullable)
- metadata (JSON)
- createdAt (UTC)

### Example UsageEvent Types

- REGISTER
- LOGIN_SUCCESS
- LOGIN_FAILURE
- EVENT_CREATED
- EVENT_DELETED
- LIMIT_REACHED
- PLAN_UPGRADED

---

# Future Architectural Requirements

These requirements are defined early to avoid architectural refactors.

---

## 1. Timezone & Timestamp Strategy

### Requirement

The system must:

- Store all timestamps in UTC.
- Use timezone-aware fields (`timestamptz` in PostgreSQL).
- Convert timestamps to user's local timezone on display.
- Support future calendar/event features.

### Architectural Decision

- Database stores only UTC.
- Conversion happens at application/presentation layer.
- Avoid storing local times without timezone context.

### Future Considerations

- Store user preferred timezone in User model.
- Event model may include explicit timezone field.
- Use libraries such as `date-fns-tz` or `luxon`.

---

## 2. Internationalization (i18n)

### Requirement

- Detect browser language automatically.
- Support:
  - English (en)
  - Spanish (es)
- Default to English if unsupported.

### Architectural Decision

- Use Next.js i18n capabilities.
- Detect via `Accept-Language` header.
- Avoid hardcoded strings in components.
- Use translation files structured by namespace.

### Future Considerations

- Persist user-selected language.
- Add manual language switcher.
- Prepare for additional languages.

---

## 3. Logging & Observability Strategy

### Requirement

All backend interactions must be logged for:

- Debugging
- Monitoring
- Security auditing
- Performance analysis

### Logging Scope

Each request should log:

- UTC timestamp
- HTTP method
- Endpoint
- Status code
- Execution time
- User ID (if authenticated)
- IP (optional)
- User-Agent (optional)

### Architectural Decision

- Use structured logging (JSON).
- Implement centralized middleware.
- Use `pino` as logging library.
- Logs output to console in development.
- Designed for future integration with:
  - DataDog
  - Logtail
  - Sentry

### Rationale

- Enables observability.
- Prepares system for SaaS-grade monitoring.
- Avoids debugging blind spots.

---

## 4. Usage Tracking & Business Metrics Strategy

### Requirement

Track user activity for:

- Subscription enforcement
- Tier-based feature limits
- Business analytics
- Abuse detection

### Separation of Concerns

1. Structured Logs → Technical observability
2. Usage Events → Business metrics

These must not be mixed.

### Rationale

- Enables SaaS monetization logic.
- Enables tier enforcement.
- Enables analytics.
- Keeps logs clean and purpose-driven.

### Future Considerations

- Monthly usage aggregation queries.
- Tier-based validation before action execution.
- Dashboard for usage analytics.
- Integration with billing provider (e.g., Stripe).

---

# SaaS Monetization Vision (Planned)

Future subscription tiers may include:

- FREE
- PRO
- ENTERPRISE

Possible enforcement strategies:

- Monthly action limits
- Feature-based restrictions
- Rate limiting per plan

The architecture is being prepared to support:

- Counting user activity per month
- Blocking actions when limits are reached
- Logging limit violations
- Tracking plan upgrades

---

# Security Strategy (Phase 1)

- Password hashing with bcrypt (12 salt rounds)
- Backend validation with Zod
- Unique email constraint at database level
- No password exposure in API responses
- Generic error messages on login
- Max password length (32) to stay within bcrypt's 72-byte limit

---

# Production Considerations (Future)

- External PostgreSQL hosting
- Environment variable security
- HTTPS enforcement
- Rate limiting
- Monitoring integration
- Log aggregation
- CI/CD pipeline
- Backups strategy

---

# Architectural Philosophy

This project is intentionally designed beyond MVP simplicity.

Even though the first phase only implements:

- Landing page
- Register
- Login

The system is structured from the beginning to:

- Scale globally
- Support subscriptions
- Track business metrics
- Maintain observability
- Avoid future structural refactoring
