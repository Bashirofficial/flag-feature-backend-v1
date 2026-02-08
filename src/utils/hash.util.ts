import bcrypt from "bcrypt";

// Password hashing (bcrypt)
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// API Key hashing (SHA-256 for fast lookups)
export const hashApiKey = async (apiKey: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

// Extract prefix from API key for display
export const getApiKeyPrefix = (apiKey: string): string => {
  // Returns first 12 characters (e.g., "ff_prod_x7k2")
  return apiKey.substring(0, 12);
};