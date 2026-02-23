import { z } from "zod";

/**
 * Validates API creation
 */
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

/**
 * Validate :id param
 */
export const apiKeyIdParamSchema = z.object({
  params: z.object({
    id: z.uuid({
      error: "Invalid API key ID format",
    }),
  }),
});

/**
 * Export inferred types for controllers
 */
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>["body"];
export type ApiKeyIdParamInput = z.infer<typeof apiKeyIdParamSchema>["params"];
