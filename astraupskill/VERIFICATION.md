# Verification and limits

Executed from the staged `ww6` project:

```text
node --experimental-vm-modules --test tests/runtime-allocation-state-lab.test.mjs
```

Four policy cases passed: PENDING legal targets, RUNNING legal targets with terminal refusal, direct PENDING-to-COMPLETED refusal, and invalid-transition error detail. The actual production transition guard was loaded through the VM helper. Results are in [evidence/results.json](evidence/results.json), with the TAP log at [evidence/crud-b07-astra-runtime2.log](evidence/crud-b07-astra-runtime2.log).

Only the malformed route-reference comment in the real error module was corrected; runtime error behavior is unchanged. The lab does not execute Prisma, worker claiming, aggregation, allocation result replacement, audit persistence, failure recovery, or retry policy. Those limits are material and require provider-backed tests before release. This evidence supports the pure run-state contract only. The handoff records the exact command and count so policy execution is not confused with full queue verification. This distinction keeps the review honest about what actually executed.
 
 The exact command and result count make this boundary reviewable for junior and senior readers alike.

The actual ValidationError exposes statusCode422 and code VALIDATION_ERROR. Queue registration is adapted to prevent import-time worker scheduling. The worker catch writes FAILED directly, even after a transition error; therefore the helper tests do not prove terminal records cannot be downgraded by the worker. That behavior requires a separate guarded-failure design and runtime tests.

The initial real-error run failed during TypeScript parsing because a route glob inside the block comment contained a closing-comment token. Rewording that comment made the actual module parse; this is why replacing error doubles matters. Earlier failed evidence remains preserved in the workspace.

## Astra execution evidence

The captured focused production-source suite executed 4 tests: all passed, zero failed and zero skipped. Read the [captured output](evidence/crud-b07-astra-runtime2.log) and [exact command and limits](evidence/results.json). Earlier check records remain preserved in the workspace.
