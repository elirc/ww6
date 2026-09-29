import { describe, expect, it } from "vitest";
import { ingestCostPayloadSchema } from "@/lib/validation/costSchemas";

describe("Cost ingestion validation boundary", () => {
  it("rejects line items with non-positive amount", () => {
    // This test prevents malformed vendor exports from silently entering financial tables.
    const payload = {
      source: "aws-cur",
      lineItems: [
        {
          cloudProvider: "aws",
          externalResourceId: "i-1",
          service: "EC2",
          usageDate: "2026-03-02T00:00:00.000Z",
          amount: 0,
          currency: "USD",
          tags: { team: "core" }
        }
      ]
    };

    expect(() => ingestCostPayloadSchema.parse(payload)).toThrow();
  });
});
