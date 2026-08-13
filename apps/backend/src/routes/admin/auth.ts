import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Admin } from "@/database/models/user.js";
import { adminSchema } from "@/database/schemas/user.js";
// Controllers
import { login } from "@/controllers/general/auth.js";

const router = Router();

router.post(
  "/login",
  RequestMiddleware.bodyValidator(
    adminSchema.pick({ email: true, password: true }),
  ),
  login(Admin, { keyName: "admin" }),
);

export { router as AuthRouter };
