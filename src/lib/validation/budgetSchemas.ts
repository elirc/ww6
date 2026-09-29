/**
 * What this file does: Validates budget creation payloads.
 * What calls it: `src/app/api/budgets/route.ts`.
 * What it calls: Zod.
 * Junior pitfall: Allowing both `teamId` and `projectId` to be empty, creating orphan budgets.
 */
import { z } from "zod";

export const createBudgetSchema = z
  .object({
    targetType: z.enum(["TEAM", "PROJECT"]),
    teamId: z.string().optional(),
    projectId: z.string().optional(),
    monthStart: z.string().datetime(),
    amount: z.number().positive(),
    alertThresholdPct: z.number().gt(0).lte(100)
  })
  .superRefine((value, ctx) => {
    // ⚠️ SENIOR NOTE: keeping targetType and targetId aligned prevents untraceable \"floating\" budget records.
    if (value.targetType === "TEAM" && !value.teamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "teamId is required for TEAM budget",
        path: ["teamId"]
      });
    }

    if (value.targetType === "PROJECT" && !value.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "projectId is required for PROJECT budget",
        path: ["projectId"]
      });
    }
  });

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
