import { rateLimit as baseRateLimit, Options } from "express-rate-limit";
import { ApiError } from "../utils/ApiError";

// Rate limiter middleware which allow 100 requests per 15 minutes
export const createRateLimiter = (options?: Partial<Options>) => {
  return baseRateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100, // Note: 'max' is deprecated in newer versions for 'limit'
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false }, //This will stop the validation error on local/vercel
    /**
     * Temporarily for vercel - real user IP from Vercel's header is being fetched
     * #TODO: Use Redis rate limit to over come the below limitation
     * Current Limitation
        - End of Window A: A user sends 100 requests in the last 10 seconds of the window.
        - Window Resets: The clock hits the 15-minute mark, and the counter drops to 0.
        - Start of Window B: The same user sends another 100 requests in the first 10 seconds of the new window.
        - Result: The user successfully sent 200 requests in 20 seconds, even though your "limit" is 100 per 15 minutes. 
    */
    keyGenerator: (req) => {
      const xRealIp = req.get("x-real-ip");
      const xForwardedFor = req.get("x-forwarded-for");

      // If x-forwarded-for is a list, take the first IP
      const firstForwardedIp = xForwardedFor?.split(",")[0].trim();

      return xRealIp || firstForwardedIp || req.ip || "unknown";
    },
    handler: (req, res, next) => {
      next(new ApiError(429, "Too many requests, please try again later"));
    },
    ...options,
  });
};

export const userRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
});
