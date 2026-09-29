import { describe, expect, it, vi } from "vitest";
import { listCostLineItemsByMonth } from "@/repositories/costLineItemRepository";

describe("Tenant data isolation in cost repository", () => {
  it("always applies tenantId filter in monthly list query", async () => {
    // This test catches cross-tenant leak risk where repository queries forget tenant scoping.
    const findMany = vi.fn().mockResolvedValue([]);

    const fakeClient = {
      costLineItem: {
        findMany
      }
    } as any;

    await listCostLineItemsByMonth(
      "tenant_A",
      {
        monthStart: new Date("2026-03-01T00:00:00.000Z"),
        monthEnd: new Date("2026-04-01T00:00:00.000Z")
      },
      {},
      fakeClient
    );

    expect(findMany).toHaveBeenCalledOnce();
    expect(findMany.mock.calls[0][0].where.tenantId).toBe("tenant_A");
  });
});
