# Verification and limits

## The lab command

```text
node --experimental-vm-modules --test tests/runtime-allocation-state-lab.test.mjs
```

This is separate from `npm test`; Vitest collects only `tests/**/*.test.ts` (`vitest.config.ts:13`).

The four policy cases are: PENDING legal targets (`tests/runtime-allocation-state-lab.test.mjs:12`), RUNNING legal targets (`:13`), terminal and skipped-phase refusal with status 422 and code `VALIDATION_ERROR` (`:14`), and invalid-transition error detail (`:15`). The actual production transition guard and the actual `ValidationError` are loaded through the VM helper; the repository, engine and queue modules are stubbed (`:7-11`) so that importing the service does not register a real worker.

## Recorded evidence

[`evidence/results.json`](evidence/results.json) records this command as executed during the improvement pass and lists its own limits: no Prisma worker, claim, aggregation, rollup, audit, failure recovery or retry execution, and the note that the worker catch writes FAILED without the transition guard. The TAP log it references (`crud-b07-astra-runtime2.log`) is not committed to this repository, so only the JSON summary can be inspected here. These docs did not re-run the command.

## The one production change

Only the malformed header comment in `src/lib/http/errors.ts` was changed: the original contained `**/` inside a block comment, which terminated the comment early and broke parsing of the real module (see [the snapshot](snapshots/errors.ts.original.txt)). Runtime behaviour of the error classes is unchanged. Loading the real module rather than an error double is what exposed the problem.

## What is not verified

- Prisma queries, tenant predicates, the result-replacement transaction.
- Worker claiming, duplicate delivery, crash recovery, retry policy.
- The engine's arithmetic, rounding and the >100% guard.
- Any route, `withRole`/`withAuth` wiring, or `toErrorResponse` mapping.
- That terminal records cannot be downgraded — they can, by inspection of `src/services/allocationRunService.ts:102-113`.

This evidence supports the pure run-state contract only. Those limits are material and require provider-backed tests before release.

## Verify it yourself

**Goal:** reproduce the lab result.
**Check:** after installing dependencies, the node test runner reports 4 passing and 0 failing for the file above.

**Goal:** confirm the comment fix matters.
**Check:** temporarily restoring the snapshot's header (locally, not committed) makes the lab fail at module load rather than at an assertion.
