# Graduated practice

**Level 1:** List all legal targets from PENDING and RUNNING. Identify terminal statuses.

**Level 2:** Predict the error for PENDING to COMPLETED and explain why a worker must claim RUNNING first.

**Level 3:** Design a future conditional claim that returns count zero. Predict which operations it should prevent, and contrast it with the current read-then-update code.

**Level 4:** Computation fails after RUNNING. Predict the intended terminal state and the limits of the pure guard.

**Level 5:** Design an explicit retry policy for FAILED runs. Include tenant scope, authorization, audit action, idempotency, and provider-backed tests. Explain whether a retry creates a new run or reopens the old one. Attempt the exercises before reading answers and write the expected trace, not only the final status. Record actor, tenant, current status, requested status, and first forbidden side effect for each prediction.
 
 Use the same trace vocabulary when discussing API retries so reviewers can compare policy and persistence clearly.
