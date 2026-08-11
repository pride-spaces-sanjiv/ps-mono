import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
// Controllers
import { getOperator, getOperators } from "@/controllers/public/operator.js";
import { getIdSchema } from "@/database/schemas/string.js";

const router = Router();

router.get("/", getOperators);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  // authorizeAdminDetailsByParam(),
  getOperator,
);

export { router as OperatorRouter };
