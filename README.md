# Cloud Cost Allocation and Chargeback Platform

Production-style learning project for backend-oriented full-stack engineering.

## Stack
- Next.js + React + TypeScript
- PostgreSQL + Prisma
- Tailwind
- Zod
- React Query
- REST APIs

## Core Features
- Cloud cost line-item ingestion (`POST /api/cost-line-items`)
- Tenant-scoped allocation rules and async allocation runs
- Chargeback report snapshots
- Budget tracking
- Anomaly detection (refresh-on-demand)
- Forecast generation (placeholder model)

## Quick Start
1. Install dependencies:
```bash
npm install
```
2. Copy env file:
```bash
cp .env.example .env
```
3. Run Prisma setup:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
4. Set frontend demo user header id (from seed output) in `.env`:
```bash
NEXT_PUBLIC_DEMO_USER_ID="<seeded-admin-user-id>"
```
5. Start app:
```bash
npm run dev
```

## Tests
- `npm test` runs the four Vitest files under `tests/**` (`vitest.config.ts` includes only `tests/**/*.test.ts`).
- The allocation-run state lab is separate: `node --experimental-vm-modules --test tests/runtime-allocation-state-lab.test.mjs`. See `astraupskill/VERIFICATION.md` for what it does and does not cover.

## Known limitations (by design for a learning project)
- Auth is a bare `x-user-id` header resolved in `src/lib/auth/session.ts`; it is not a real session.
- Allocation runs use an in-process `setTimeout` queue (`src/lib/queue/allocationQueue.ts`); a restart loses queued work and leaves runs PENDING.
- Send `monthStart` as the first instant of a UTC month (e.g. `2026-03-01T00:00:00.000Z`). Runs store the value as given, and the chargeback report looks runs up by exact `monthStart` equality.

## Key Docs
- Architecture: `docs/architecture/`
- Learning traces: `docs/learning/`
- Allocation-run workshop with exercises and a senior review: `astraupskill/`
