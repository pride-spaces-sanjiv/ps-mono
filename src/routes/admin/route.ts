import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Admin } from "@/database/models/user.js";
// Routers
import { AuthRouter } from "./auth.js";
import { AdminRouter } from "./admin.js";
import { EnterpriseRouter } from "./enterprise.js";
import { UserRouter } from "./user.js";

const router = Router();

router.use("/auth", AuthRouter);

// Authorized routes
// @ts-ignore
router.use(RequestMiddleware.authenticateUser(Admin, "admin"));
router.use("/admins", AdminRouter);
router.use("/enterprises", EnterpriseRouter);
router.use("/users", UserRouter);

export { router as AdminRouter };
