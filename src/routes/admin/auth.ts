import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { adminSchema } from "@/database/schemas/user.js";
// Controllers
import { login } from "@/controllers/admin/auth.js";

const router = Router();

router.post(
  "/login",
  RequestMiddleware.bodyValidator(
    adminSchema.pick({ email: true, password: true }),
  ),
  login,
);

export { router as AuthRouter };
