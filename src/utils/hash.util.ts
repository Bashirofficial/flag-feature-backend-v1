import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

// Password hashing (bcrypt for slow, secure hashing)
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// API Key hashing (SHA-256 for fast lookups)
export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

// Extract prefix from API key for display
export const getApiKeyPrefix = (apiKey: string): string => {
  // Returns first 12 characters (e.g., "sk_prod_x7k2")
  return apiKey.substring(0, 12);
};
