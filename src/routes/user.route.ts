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

const router = Router();
router.use(userRateLimit);

router
  .route("/refresh-token")
  .post(validateRequest(refreshSchema), refreshAccessToken);
router.route("/register").post(validateRequest(registerSchema), register);
router.route("/login").post(validateRequest(loginSchema), login);
router.route("/logout").post(authenticate, logout);

//Temporarily added for testing purpose, will be removed later ----------------------------
router.get("/ping", (req, res) => {
  res.json({
    ok: true,
  });
});

router.get("/redis-test", async (_req, res) => {
  console.time("Redis SET");

  await cache.getInstance().set("benchmark:test", "Hello Railway", 60);

  console.timeEnd("Redis SET");

  console.time("Redis GET");

  const value = await cache.getInstance().get("benchmark:test");

  console.timeEnd("Redis GET");

  res.status(200).json({
    success: true,
    value,
  });
});

router.get("/db-test", async (_req, res) => {
  console.time("Prisma SELECT 1");

  const result = await prisma.$queryRaw`SELECT 1`;

  console.timeEnd("Prisma SELECT 1");

  res.status(200).json({
    success: true,
    result,
  });
});

export default router;
