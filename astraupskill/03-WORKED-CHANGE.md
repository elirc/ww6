# Worked runtime addition

## What was added

The reviewed source already had a focused transition guard, but no compact dependency-free regression lab covering all policy edges. The addition loads the production `assertValidRunTransition` through the real service module (`tests/runtime-allocation-state-lab.test.mjs:7-11`) with the repository, engine and queue modules stubbed. Four tests verify:

- both PENDING targets (`:12`),
- both RUNNING targets (`:13`),
- COMPLETED and FAILED refusing RUNNING, plus PENDING refusing a direct jump to COMPLETED, each with `statusCode === 422` and `code === 'VALIDATION_ERROR'` (`:14`),
- the error message naming both states (`:15`).

The test does not recreate the transition map; it calls the exported guard and checks the real `ValidationError` from `src/lib/http/errors.ts:31-35`.

## The production fix that made it possible

The original `src/lib/http/errors.ts` header comment contained the route glob `` `src/app/api/**/route.ts` `` inside a `/** ... */` block. The characters `**/` include `*/`, which closes the block comment early, so the TypeScript parser hit stray text. Bundled builds may tolerate this differently, but the VM loader failed. The [original error module](snapshots/errors.ts.original.txt) preserves the exact before bytes; the current file words the comment as "the src/app/api route tree" (`src/lib/http/errors.ts:3`). Runtime behaviour of the classes is unchanged.

The general lesson: loading the real module instead of an error double surfaced a real defect that a mock would have hidden.

## A second worked change you can do on paper: an atomic claim

The goal is to make step 5 of the pipeline safe under duplicate delivery.

1. Add a repository function next to `updateAllocationRunStatus` (`src/repositories/allocationRunRepository.ts:66-81`) whose `where` is `{ id, tenantId, status: expectedFrom }` and which returns the `count`.
2. In `transitionRunStatus` (`src/services/allocationRunService.ts:35-61`), keep `assertValidRunTransition` for the error message, but write through the conditional function and throw `ConflictError` (`src/lib/http/errors.ts:43-47`) when `count === 0`.
3. In the worker catch (`:102-113`), only write FAILED with `expectedFrom: "RUNNING"` (or PENDING), so a duplicate job can no longer downgrade a COMPLETED run.
4. Tests: the existing lab still passes because the guard is unchanged; a new lab case stubs the conditional update returning 0 and asserts `computeAllocationResults` is never called.

## Exercises

**Goal:** confirm the comment bug from the snapshot.
**Check:** you find `**/route.ts` inside the opening block comment of `snapshots/errors.ts.original.txt` and can explain why the block ends at `**/`.

**Goal:** write the four-step claim change as a diff outline.
**Check:** your outline touches exactly `allocationRunRepository.ts`, `allocationRunService.ts`, and a test file, and no route.
