import crypto from "crypto";

/**
 * Generates a secure API key with format: sk_{env}_{random}
 * Example: sk_prod_x7k2m9p1q4r8w3v6b5n8
 */
export const generateApiKey = (environmentKey: string): string => {
  // Generates 20 random bytes and converts it to base58
  const randomBytes = crypto.randomBytes(20);
  const randomString = base58Encode(randomBytes);

  return `sk_${environmentKey}_${randomString}`;
};

/**
 * Base58 encoding (Bitcoin alphabet - no 0, O, I, l)
 */
const base58Encode = (buffer: Buffer): string => {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const BASE = BigInt(58);

  let num = BigInt("0x" + buffer.toString("hex"));
  let encoded = "";

  while (num > 0) {
    const remainder = Number(num % BASE);
    encoded = ALPHABET[remainder] + encoded;
    num = num / BASE;
  }

  // Adds leading '1's for leading zero bytes
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    encoded = "1" + encoded;
  }

  return encoded;
};

/**
 * Validates API key format
 */
export const isValidApiKeyFormat = (apiKey: string): boolean => {
  // Format: sk_{env}_[base58 chars]
  const pattern = /^sk_[a-z0-9_]+_[1-9A-HJ-NP-Za-km-z]{20,}$/;
  return pattern.test(apiKey);
};
