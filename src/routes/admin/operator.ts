import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
import { operatorSchema } from "@/database/schemas/operator.js";
// Controllers
import {
  createOperator,
  deleteOperator,
  getOperator,
  getOperators,
  updateOperator,
} from "@/controllers/admin/operator.js";
import { getIdSchema } from "@/database/schemas/string.js";
import { Operator } from "@/database/models/operator.js";

const router = Router();

router.get("/", getOperators);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  // authorizeAdminDetailsByParam(),
  getOperator,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(operatorSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  checkUserExistenceByBodyValue(Operator, "email"),
  // allowAdminLevelByBody({ field: "level" }),
  createOperator,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.bodyValidator(operatorSchema, {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateOperator,
);
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteOperator,
);
export { router as OperatorRouter };
