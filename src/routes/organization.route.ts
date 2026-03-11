import { Router } from "express";
import {
  getOrganization,
  getStats,
} from "../controllers/organization.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/rbac.middleware";

const router = Router();
router.use(authenticate); // All routes need authentication

router.route("/").get(requirePermission("organization:read"), getOrganization);
router.route("/stats").get(requirePermission("organization:read"), getStats);

export default router;
