import { Router } from "express";
import { getAnalyticsData } from "@/controllers/admin/analytics.js";

const router = Router();

router.get("/", getAnalyticsData);

export { router as AnalyticsRouter };
