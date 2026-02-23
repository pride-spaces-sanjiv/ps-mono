import { Router } from "express";

const router = Router();

router.use("/auth");

// Authorized routes
router.use("/users");

export { router as AdminRouter };
