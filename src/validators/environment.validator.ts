import { z } from "zod";

/**
 * Validates environment creation
 */
export const createEnvironmentSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Name is required" })
      .min(1, "Name must be at least 1 character")
      .max(100, "Name must be at most 100 characters"),

    key: z
      .string({ error: "Key is required" })
      .min(1, "Key must be at least 1 character")
      .max(50, "Key must be at most 50 characters")
      .regex(
        /^[a-z0-9_-]+$/,
        "Key must contain only lowercase letters, numbers, hyphens, and underscores",
      ),

    description: z
      .string({ error: "Description must be a string" })
      .max(500, "Description must be at most 500 characters")
      .optional(),

    sortOrder: z
      .number({ error: "Sort order must be a number" })
      .int("Sort order must be an integer")
      .min(0, "Sort order must be positive")
      .optional(),
  }),
});

/**
 * Validates environment update
 */
export const updateEnvironmentSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Name must be a string" })
      .min(1, "Name must be at least 1 character")
      .max(100, "Name must be at most 100 characters")
      .optional(),

    description: z
      .string({ error: "Description must be a string" })
      .max(500, "Description must be at most 500 characters")
      .optional(),

    sortOrder: z
      .number({ error: "Sort order must be a number" })
      .int("Sort order must be an integer")
      .min(0, "Sort order must be positive")
      .optional(),
  }),
});

/**
 * Validate :id param
 */
export const environmentIdParamSchema = z.object({
  params: z.object({
    id: z.uuid({
      error: "Invalid environment ID format",
    }),
  }),
});

/**
 * Export inferred types for controllers
 */
export type CreateEnvironmentInput = z.infer<
  typeof createEnvironmentSchema
>["body"];
export type UpdateEnvironmentInput = z.infer<
  typeof updateEnvironmentSchema
>["body"];
