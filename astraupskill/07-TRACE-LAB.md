# Trace lab

| Current | Next | Policy | Required worker step |
|---|---|---|---|
| PENDING | RUNNING | allowed | current worker reads then updates |
| PENDING | FAILED | allowed | terminal failure record |
| RUNNING | COMPLETED | allowed | replace results then complete |
| RUNNING | FAILED | allowed | catch directly writes failure |
| COMPLETED | RUNNING | rejected | none |
| FAILED | RUNNING | rejected | none |
| PENDING | COMPLETED | rejected | none |

The table shows why policy and persistence are separate. An allowed PENDING-to-RUNNING transition does not create an atomic claim; the current worker uses a separate read and update. An allowed RUNNING-to-COMPLETED transition still depends on successful aggregation and allocation result replacement. Run [the lab](../tests/runtime-allocation-state-lab.test.mjs) and compare assertions to the table. The trace does not include real database rows, tenants, or audits; those are follow-up worker checks. A provider trace would add row counts and transaction rollback observations, which this lab deliberately leaves open.

Read the catch separately: it records a failure message and writes FAILED without calling assertValidRunTransition. Successful failure recording is swallowed by the worker; a failure of that write can escape. This trace is inspected source, not executed worker evidence.
