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

const router = Router();

router
  .route("/refresh-token")
  .post(validateRequest(refreshSchema), refreshAccessToken);
router.route("/register").post(validateRequest(registerSchema), register);
router.route("/login").post(validateRequest(loginSchema), login);
router.route("/logout").post(authenticate, logout);

export default router;
