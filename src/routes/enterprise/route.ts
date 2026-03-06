import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
// Routers
import { AuthRouter } from "./auth.js";
import { EnterpriseRouter } from "./enterprise.js";
// import { UserRouter } from "./user.js";
import { SpaceRouter } from "./space.js";
import { BranchRouter } from "./branch.js";
import { DataRouter } from "./data.js";

const router = Router();

router.use("/auth", AuthRouter);

// Authorized routes
// @ts-ignore
router.use(RequestMiddleware.authenticateUser(EnterpriseRouter, "enterprise"));
router.use("/", EnterpriseRouter);
// router.use("/users", UserRouter);
router.use("/spaces", SpaceRouter);
router.use("/branches", BranchRouter);
router.use("/data", DataRouter);

export { router as EnterpriseRouter };
