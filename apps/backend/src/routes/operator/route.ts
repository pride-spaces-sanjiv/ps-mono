import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Operator } from "@pride-spaces/backend/database/models/operator.js";
// Routers
import { AuthRouter } from "./auth.js";
// import { UserRouter } from "./user.js";
import { SpaceRouter } from "./space.js";
import { BranchRouter } from "./branch.js";
import { DataRouter } from "./data.js";
import { AmenityRouter } from "./amenity.js";
import { DumpRouter } from "./dump.js";

const router = Router();

router.use("/auth", AuthRouter);

// Authorized routes
// @ts-ignore
router.use(RequestMiddleware.authenticateUser(Operator, "operator"));
// router.use("/users", UserRouter);
router.use("/spaces", SpaceRouter);
router.use("/branches", BranchRouter);
router.use("/amenities", AmenityRouter);
router.use("/dumps", DumpRouter);
router.use("/", DataRouter);
router.get("/", (req, res) => {
  res.json({ message: "Welcome to the Operator API" });
});

export { router as OperatorRouter };
