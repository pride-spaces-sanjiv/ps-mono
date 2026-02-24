import { Router } from "express";
import { AuthRouter } from "./auth.js";
import { AdminRouter } from "./admin.js";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Admin } from "@/database/models/user.js";

const router = Router();

router.use("/auth", AuthRouter);

// Authorized routes
// @ts-ignore
router.use(RequestMiddleware.authenticateUser(Admin, "admin"));
router.use("/admins", AdminRouter);

export { router as AdminRouter };
