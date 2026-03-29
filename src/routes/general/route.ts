import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Admin } from "@/database/models/user.js";
// Routers
// import { AuthRouter } from "./auth.js";
// import { AdminRouter } from "./admin.js";
// import { OperatorRouter } from "./operator.js";
// import { UserRouter } from "./user.js";
// import { SpaceRouter } from "./space.js";
// import { BranchRouter } from "./branch.js";
// import { AmenityRouter } from "./amenity.js";
// import { DataRouter } from "./data.js";
// import { DumpRouter } from "./dump.js";

const router = Router();

// router.use("/auth", AuthRouter);
// // Authorized routes
// // @ts-ignore
// router.use(RequestMiddleware.authenticateUser(Admin, "admin"));
// router.use("/", DataRouter);
// router.use("/admins", AdminRouter);
// router.use("/operators", OperatorRouter);
// router.use("/users", UserRouter);
// router.use("/spaces", SpaceRouter);
// router.use("/branches", BranchRouter);
// router.use("/amenities", AmenityRouter);
// router.use("/dumps", DumpRouter);

export { router as GeneralRouter };
