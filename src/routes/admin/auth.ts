import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { adminSchema } from "@/database/schemas/user.js";
// Controllers
import { login } from "@/controllers/admin/auth.js";

const router = Router();

router.post(
  "/login",
  RequestMiddleware.bodyValidator(adminSchema.pick(["email", "password"])),
  login,
);

export { router as AuthRouter };
