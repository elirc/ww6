# Testing Rationale

## Test: `rejects VIEWER from triggering allocation`
File: `tests/permissions/allocation-run-permission.test.ts`

Why this matters in production:
- This verifies that read-only roles cannot trigger mutating, high-impact workflows (`runAllocation`).
- It directly protects against privilege escalation bugs introduced during policy refactors.

What a fuller production suite would add:
- Route-level integration tests for `POST /api/allocation-runs` returning 403 with real middleware wiring.
- Matrix tests over every permission in `ROLE_MATRIX` to detect accidental access broadening.

## Test: `rejects line items with non-positive amount`
File: `tests/validation/cost-schema.test.ts`

Why this matters in production:
- Financial systems are only as trustworthy as ingress validation.
- Rejecting invalid amounts catches malformed vendor exports before they contaminate historical reports.

What a fuller production suite would add:
- Boundary tests for max payload size, malformed date strings, and missing nested tags.
- Contract tests for API responses (422 payload shape and error details).

## Test: `rejects COMPLETED -> RUNNING transition`
File: `tests/state/allocation-run-transition.test.ts`

Why this matters in production:
- Allocation runs are audit records; illegal state rewinds break operational and financial trust.
- This test guards the state machine from accidental transition-map regressions.

What a fuller production suite would add:
- Transition table tests covering all valid and invalid edges.
- Integration tests ensuring failed worker executions always end in terminal `FAILED` status.

## Test: `always applies tenantId filter in monthly list query`
File: `tests/isolation/cost-repository-isolation.test.ts`

Why this matters in production:
- Cross-tenant data leakage is a critical security failure for finance data.
- This test ensures repository code keeps tenant isolation in place even after query refactors.

What a fuller production suite would add:
- End-to-end tests with two seeded tenants proving one tenant cannot read another tenant's cost/report records.
- Static analysis or shared repository helper tests to enforce tenant scoping conventions project-wide.
