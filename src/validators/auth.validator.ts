import { z } from "zod";

const required = (name: string) => ({
  error: (issue: any) =>
    issue.input === undefined
      ? `${name} is required`
      : `Invalid ${name.toLowerCase()}`,
});

export const registerSchema = z.object({
  body: z.object({
    email: z.email(required("Email")),
    password: z
      .string(required("Password"))
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    organizationName: z
      .string(required("Organization name"))
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name must be at most 100 characters"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(required("Email")),
    password: z.string(required("Password")),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(required("Refresh token")),
  }),
});
