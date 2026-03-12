import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLog.controller";
import { requirePermission } from "../middlewares/rbac.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router.route("/").get(requirePermission("audit-logs:read"), getAuditLogs);

export default router;
