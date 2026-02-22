import { Router } from "express";
import {
  getAllFlags,
  getFlag,
  createFlag,
  updateFlag,
  deleteFlag,
  updateFlagEnvironmentValue,
} from "../controllers/flag.controller";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/rbac.middleware";
import {
  createFlagSchema,
  updateFlagSchema,
  updateFlagValueSchema,
} from "../validators/flag.validator";

const router = Router();
router.use(authenticate); // All routes need authentication

router
  .route("/")
  .get(requirePermission("flags:read"), getAllFlags)
  .post(
    requirePermission("flags:write"),
    validateRequest(createFlagSchema),
    createFlag,
  );

router
  .route("/:id")
  .get(requirePermission("flags:read"), getFlag)
  .patch(
    requirePermission("flags:write"),
    validateRequest(updateFlagSchema),
    updateFlag,
  )
  .delete(requirePermission("flags:delete"), deleteFlag);

router
  .route("/:id/environments/:envId")
  .put(
    requirePermission("flags:write"),
    validateRequest(updateFlagValueSchema),
    updateFlagEnvironmentValue,
  );

export default router;
