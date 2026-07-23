import { Router } from "express";
import {
  refreshAccessToken,
  register,
  login,
  logout,
} from "../controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../validators/auth.validator";
import { authenticate } from "../middlewares/auth.middleware";
import { userRateLimit } from "../middlewares/rateLimit.middleware";

import cache from "../utils/cache.util"; //Temporarily added for testing purpose, will be removed later
import prisma from "../db"; //Temporarily added for testing purpose, will be removed later
import { AsyncHandler } from "../utils/AsyncHandler";

const router = Router();
router.use(userRateLimit);

router
  .route("/refresh-token")
  .post(validateRequest(refreshSchema), refreshAccessToken);
router.route("/register").post(validateRequest(registerSchema), register);
router.route("/login").post(validateRequest(loginSchema), login);
router.route("/logout").post(authenticate, logout);

//Temporarily added for testing purpose, will be removed later ----------------------------
// 1. Express only (No Redis, No Prisma)
router.get("/ping", (_req, res) => {
  res.status(200).json({
    success: true,
    timestamp: Date.now(),
    message: "Pong!",
  });
});

// 2. Redis Benchmark
router.get(
  "/redis-test",
  AsyncHandler(async (_req, res) => {
    const payload = {
      timestamp: Date.now(),
      message: "Hello Railway",
    };

    console.time("Redis SET");

    await cache.getInstance().set(
      "benchmark:test",
      JSON.stringify(payload),
      60, // TTL: 60 seconds
    );

    console.timeEnd("Redis SET");

    console.time("Redis GET");

    const value = await cache.getInstance().get("benchmark:test");

    console.timeEnd("Redis GET");

    console.time("JSON Parse");

    const parsedValue = value ? JSON.parse(value) : null;

    console.timeEnd("JSON Parse");

    res.status(200).json({
      success: true,
      data: parsedValue,
    });
  }),
);

// 3. Prisma Benchmark
router.get(
  "/db-test",
  AsyncHandler(async (_req, res) => {
    console.time("Prisma SELECT 1");

    const result = await prisma.$queryRaw`SELECT 1`;

    console.timeEnd("Prisma SELECT 1");

    res.status(200).json({
      success: true,
      result,
    });
  }),
);

export default router;
