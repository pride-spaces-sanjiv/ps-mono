import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Enterprise } from "@/database/models/enterprise.js";
import { enterpriseSchema } from "@/database/schemas/enterprise.js";
// Controllers
import { login } from "@/controllers/general/auth.js";

const router = Router();

router.post(
  "/login",
  RequestMiddleware.bodyValidator(
    enterpriseSchema.pick({ email: true, password: true }),
  ),
  login(Enterprise, { keyName: "enterprise", level: "enterprise" }),
);

export { router as AuthRouter };
