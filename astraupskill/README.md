# WW6 allocation-run state lab

This course studies allocation run transitions in [allocationRunService.ts](../src/services/allocationRunService.ts) and its explicit `assertValidRunTransition` policy (`src/services/allocationRunService.ts:20-33`). The service creates and queues runs, attempts a RUNNING transition, computes results, replaces allocation result rows, and records terminal outcomes. The reviewed path already has a clear PENDING/RUNNING/COMPLETED/FAILED state machine, so the staged improvement is a production-source policy lab plus one comment syntax repair in the real error module. [runtime-allocation-state-lab.test.mjs](../tests/runtime-allocation-state-lab.test.mjs) executes the actual service module's transition guard.

## The app in one paragraph

A multi-tenant FinOps API on Next.js 16 (`package.json:36`) and Prisma/PostgreSQL (`prisma/schema.prisma:10-13`). Cost line items are ingested per tenant; tag-matching allocation rules split each item across teams and projects; an asynchronous allocation run materialises `AllocationResult` rows; a chargeback report aggregates the latest COMPLETED run for a month. Budgets, anomaly detection and a naive forecast hang off the same month windows. Four roles (`prisma/schema.prisma:15-20`) are mapped to seven named permissions in `src/lib/auth/roles.ts:9-17`.

## Request shape

```
route.ts  -> withRole(permission)        src/lib/middleware/withRole.ts:24-33
           -> withAuth -> requireSession  src/lib/middleware/withAuth.ts:18-28, src/lib/auth/session.ts:12-32
           -> Zod schema .parse           src/lib/validation/*.ts
           -> service                     src/services/*.ts
           -> repository (tenantId in every where)  src/repositories/*.ts
errors    -> toErrorResponse              src/lib/http/response.ts:11-47
```

## Chapters

1. [Codebase map](01-CODEBASE-MAP.md) — the run pipeline end to end, with line numbers.
2. [Concepts](02-CONCEPTS.md) — lifecycle policy vs atomic claim, tenant scope, month windows, header auth.
3. [Worked change](03-WORKED-CHANGE.md) — what the lab added and a second worked example you can do.
4. [Testing and debugging](04-TESTING-AND-DEBUGGING.md) — two runners, failure signatures, debugging a stuck run.
5. [Practice](05-PRACTICE.md) — graduated exercises with **Check** criteria.
6. [Solutions and review](06-SOLUTIONS-AND-REVIEW.md) — answers and a senior review with file:line findings.
7. [Trace lab](07-TRACE-LAB.md) — transition table plus full request and worker traces.
8. [Verification](VERIFICATION.md) — what executed and what did not.

The lab covers PENDING to RUNNING or FAILED, RUNNING to COMPLETED or FAILED, terminal refusal, and skipping directly to COMPLETED. The VM run does not open Prisma, execute aggregation, or prove worker failure recovery. Those boundaries are explicit so a junior engineer does not mistake a state table check for full queue correctness.
