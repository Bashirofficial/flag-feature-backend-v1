import { z } from 'zod';

// Validate snake_case format
const snakeCaseRegex = /^[a-z0-9_]+$/;

export const createFlagSchema = z.object({
  body: z.object({
    key: z
      .string({ required_error: 'Flag key is required' })
      .min(2, 'Flag key must be at least 2 characters')
      .max(100, 'Flag key must be at most 100 characters')
      .regex(
        snakeCaseRegex,
        'Flag key must be in snake_case (lowercase letters, numbers, and underscores only)'
      ),
    name: z.string().optional(),
    description: z
      .string({ required_error: 'Description is required' })
      .min(1, 'Description is required')
      .max(500, 'Description must be at most 500 characters'),
    type: z.enum(['BOOLEAN', 'STRING', 'NUMBER', 'JSON']).default('BOOLEAN'),
    defaultValue: z.any().optional(),
  }),
});

export const updateFlagSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateFlagValueSchema = z.object({
  body: z.object({
    value: z.any({ required_error: 'Value is required' }),
  }),
});
