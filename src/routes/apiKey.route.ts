import { Router } from "express";
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
} from "../controllers/apiKey.controller";
import {
  apiKeyIdParamSchema,
  createApiKeySchema,
} from "../validators/apiKey.validator";
import { requirePermission } from "../middlewares/rbac.middleware";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router
  .route("/")
  .get(requirePermission("api-keys:read"), getApiKeys)
  .post(
    requirePermission("api-keys:write"),
    validateRequest(createApiKeySchema),
    createApiKey,
  );
router
  .route("/:id/revoke")
  .patch(
    requirePermission("api-keys:revoke"),
    validateRequest(apiKeyIdParamSchema),
    revokeApiKey,
  );
router
  .route("/:id")
  .delete(
    requirePermission("api-keys:delete"),
    validateRequest(apiKeyIdParamSchema),
    deleteApiKey,
  );

export default router;
