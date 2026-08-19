import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Operator } from "@pride-spaces/backend/database/models/operator.js";
import { operatorSchema } from "@pride-spaces/backend/database/schemas/operator.js";
// Controllers
import { login } from "@/controllers/general/auth.js";

const router = Router();

router.post(
  "/login",
  RequestMiddleware.bodyValidator(
    operatorSchema.pick({ email: true, password: true }),
  ),
  login(Operator, { keyName: "operator", level: "operator" }),
);

export { router as AuthRouter };
