# Trace lab

## Transition table

| Current | Next | Policy | Worker step in code | Lab line |
|---|---|---|---|---|
| PENDING | RUNNING | allowed | read then update (`allocationRunService.ts:90-92`) | `tests/runtime-allocation-state-lab.test.mjs:12` |
| PENDING | FAILED | allowed | catch writes failure (`:106-112`) | `:12` |
| RUNNING | COMPLETED | allowed | replace results then complete (`:96-101`) | `:13` |
| RUNNING | FAILED | allowed | catch writes failure | `:13` |
| COMPLETED | RUNNING | rejected | — but the catch then writes FAILED | `:14` |
| FAILED | RUNNING | rejected | — catch rewrites FAILED | `:14`, `:15` |
| PENDING | COMPLETED | rejected | never requested by the worker | `:14` |

An allowed PENDING→RUNNING transition does not create an atomic claim. An allowed RUNNING→COMPLETED transition still depends on successful aggregation and result replacement.

## Full trace: happy path

```
POST /api/allocation-runs {"monthStart":"2026-03-01T00:00:00.000Z"}  x-user-id: <admin>
 withRole("runAllocation")                      withRole.ts:24-33
  withAuth -> requireSession                    withAuth.ts:21, session.ts:12-32
  assertPermission(PLATFORM_ADMIN)              withRole.ts:15-22, roles.ts:10
 createAllocationRunSchema.parse                allocationSchemas.ts:25-27
 createRunAndQueue                              allocationRunService.ts:63
  createAllocationRun -> PENDING row            allocationRunRepository.ts:36-43
  enqueueAllocationRun -> setTimeout(5ms)       allocationQueue.ts:19-29
 202 { item: run, message }                     route.ts:22-28
--- ~5 ms later, same process ---
processQueuedAllocationRun                      allocationRunService.ts:84
 transitionRunStatus(RUNNING, startedAt)        :90-92 -> :41, :47, :52
 computeAllocationResults                       allocationEngineService.ts:27
  toUtcMonthWindow                              month.ts:10-22
  listAllCostLineItemsByMonth + listActiveAllocationRules  :33-36
  per item: tagsMatch / weight guard / fallback / rule rows  :43-93
 replaceAllocationResults ($transaction)        allocationRunRepository.ts:88-102
 transitionRunStatus(COMPLETED, summaryJson)    allocationRunService.ts:98-101
```

## Full trace: rule overflow

```
items: one EC2 item tags {team:"core"}
rules: R1 team=core 70%, R2 team=core 40%  (each passes schema: >0, <=100)
engine: weightSum 110 > 100.0001                allocationEngineService.ts:47-49
 throw ConflictError                             :51-53
worker catch -> FAILED, failureReason "Allocation rule configuration exceeds 100% for cost item <id>"
results table: unchanged (replace never ran)
```

The schema validates each rule's weight independently (`allocationSchemas.ts:14`), so the conflict can only surface at run time.

## Full trace: report

```
GET /api/reports/chargeback?monthStart=2026-03-01T00:00:00.000Z
 withRole("readReports")  (VIEWER allowed, roles.ts:14)
 getChargebackReport                            reportService.ts:16
  findLatestCompletedRunForMonth(monthStart ==) reportRepository.ts:9-19
  aggregateCostByService, listBudgetsByMonth    in parallel :19-23
  no run -> runStatus NO_COMPLETED_RUN          :25-35
  else group results by team and by project     :37-50
```

## Exercises

**Goal:** annotate the happy-path trace with what is lost if the process restarts at the `---` line.
**Check:** the run row stays PENDING; no code path resumes it.

**Goal:** extend the rule-overflow trace for a second item that matches nothing and has no `projectId`.
**Check:** it increments `unmatchedLineItems` and produces no result row (`allocationEngineService.ts:58-75`), but the run never gets that far because the first item threw.

This trace is inspected source, not executed worker evidence.
