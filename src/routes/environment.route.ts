import { Router } from "express";
import {
  getAllEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from "../controllers/environment.controller";
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  environmentIdParamSchema,
} from "../validators/environment.validator";
import { requirePermission } from "../middlewares/rbac.middleware";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router
  .route("/")
  .get(requirePermission("environments:read"), getAllEnvironments)
  .post(
    requirePermission("environments:write"),
    validateRequest(createEnvironmentSchema),
    createEnvironment,
  );
router
  .route("/:id")
  .get(
    requirePermission("environments:read"),
    validateRequest(environmentIdParamSchema),
    getEnvironment,
  )
  .patch(
    requirePermission("environments:write"),
    validateRequest(environmentIdParamSchema),
    validateRequest(updateEnvironmentSchema),
    updateEnvironment,
  )
  .delete(
    requirePermission("environments:write"),
    validateRequest(environmentIdParamSchema),
    deleteEnvironment,
  );

export default router;
