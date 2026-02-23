import { z } from "zod";

export const createApiKeySchema = z.object({
  body: z.object({
    // Using the unified error parameter for both required and format checks
    environmentId: z.uuid({
      error: (issue) =>
        issue.input === undefined
          ? "Environment ID is required"
          : "Invalid environment ID format",
    }),

    name: z
      .string({ error: "Name must be a string" })
      .min(1, "Name must be at least 1 character")
      .max(100, "Name must be at most 100 characters")
      .optional(),
  }),
});
