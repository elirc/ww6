import { describe, expect, it } from "vitest";
import { assertPermission } from "@/lib/middleware/withRole";
import { ForbiddenError } from "@/lib/http/errors";

describe("RBAC enforcement for allocation runs", () => {
  it("rejects VIEWER from triggering allocation", () => {
    // This test catches policy regressions where read-only users accidentally gain write permissions.
    expect(() => assertPermission("VIEWER", "runAllocation")).toThrowError(ForbiddenError);
  });
});
