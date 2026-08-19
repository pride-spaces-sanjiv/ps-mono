import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  allowAdminLevelsToPass,
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
import { operatorSchema } from "@pride-spaces/backend/database/schemas/operator.js";
// Controllers
import {
  createOperator,
  deleteOperator,
  getOperator,
  getOperators,
  getPassword,
  updateOperator,
  updatePassword,
} from "@/controllers/admin/operator.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";
import { Operator } from "@pride-spaces/backend/database/models/operator.js";
import { adminLevels } from "@pride-spaces/common/utils/data/admin.js";

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
  RequestMiddleware.bodyValidator(operatorSchema.omit({ password: true }), {
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

// Password routes
router.get(
  "/:id/password",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  allowAdminLevelsToPass({
    allowedLevels: adminLevels.filter((level) => level !== "support"),
  }),
  getPassword,
);
router.put(
  "/:id/password",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  allowAdminLevelsToPass({
    allowedLevels: adminLevels.filter((level) => level !== "support"),
  }),
  RequestMiddleware.bodyValidator(operatorSchema.pick({ password: true }), {
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updatePassword,
);

export { router as OperatorRouter };
