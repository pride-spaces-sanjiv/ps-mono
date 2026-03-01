import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { enterpriseSchema } from "@/database/schemas/enterprise.js";
// Controllers
import { login } from "@/controllers/enterprise/auth.js";

const router = Router();

router.post(
  "/login",
  RequestMiddleware.bodyValidator(
    enterpriseSchema.pick({ email: true, password: true }),
  ),
  login,
);

export { router as AuthRouter };
