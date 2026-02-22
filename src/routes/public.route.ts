import { Router } from "express";
import {
  getAllFlags,
  getFlagByKey,
  getBulkFlags,
  isFlagEnabled,
} from "../controllers/public.controller";
import { authenticateApiKey } from "../middlewares/apiKeyAuth.middleware";

const router = Router();
router.use(authenticateApiKey); // All public routes require API key authentication

router.route("/flags").get(getAllFlags);
router.route("/flags/:key").get(getFlagByKey);
router.route("/flags/bulk").post(getBulkFlags);
router.route("/flags/:key/enabled").get(isFlagEnabled);

export default router;
