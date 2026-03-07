import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
// Routers
import { AuthRouter } from "./auth.js";
// import { UserRouter } from "./user.js";
import { SpaceRouter } from "./space.js";
import { BranchRouter } from "./branch.js";
import { DataRouter } from "./data.js";
import { Operator } from "@/database/models/operator.js";

const router = Router();

router.use("/auth", AuthRouter);

// Authorized routes
// @ts-ignore
router.use(RequestMiddleware.authenticateUser(Operator, "operator"));
router.use("/", DataRouter);
// router.use("/users", UserRouter);
router.use("/spaces", SpaceRouter);
router.use("/branches", BranchRouter);

export { router as OperatorRouter };
