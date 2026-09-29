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

## Key Docs
- Architecture: `docs/architecture/`
- Learning traces: `docs/learning/`
