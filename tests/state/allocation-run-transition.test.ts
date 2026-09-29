import { describe, expect, it } from "vitest";
import { assertValidRunTransition } from "@/services/allocationRunService";

describe("Allocation run state transitions", () => {
  it("rejects COMPLETED -> RUNNING transition", () => {
    // This test protects audit trails from illegal status rewinds after completion.
    expect(() =>
      assertValidRunTransition({
        from: "COMPLETED",
        to: "RUNNING"
      })
    ).toThrow();
  });
});
