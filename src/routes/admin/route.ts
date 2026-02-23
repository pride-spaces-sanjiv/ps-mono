import { Router } from "express";
import { AuthRouter } from "./auth.js";
import { AdminRouter } from "./admin.js";

const router = Router();

router.use("/auth", AuthRouter);

// Authorized routes
router.use("/admin", AdminRouter);

export { router as AdminRouter };
