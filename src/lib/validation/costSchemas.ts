/**
 * What this file does: Defines Zod validation for cost ingestion payloads.
 * What calls it: `src/app/api/cost-line-items/route.ts`.
 * What it calls: Zod.
 * Junior pitfall: Validating only top-level fields and letting invalid line-item data into persistence.
 */
import { z } from "zod";

export const costLineItemInputSchema = z.object({
  cloudProvider: z.enum(["aws", "azure", "gcp"]),
  externalResourceId: z.string().min(1),
  service: z.string().min(1),
  region: z.string().optional(),
  usageDate: z.string().datetime(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("USD"),
  tags: z.record(z.string().min(1), z.string().min(1)).default({}),
  projectId: z.string().optional()
});

export const ingestCostPayloadSchema = z.object({
  source: z.string().min(2),
  // ⚠️ SENIOR NOTE: cap payload size to avoid accidental memory pressure from huge CUR dumps in one request.
  lineItems: z.array(costLineItemInputSchema).min(1).max(5000)
});

export type IngestCostPayload = z.infer<typeof ingestCostPayloadSchema>;
