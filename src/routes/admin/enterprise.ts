import { Router } from "express";
import { Admin } from "@/database/models/user.js";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  allowAdminLevelByBody,
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
import { adminSchema } from "@/database/schemas/user.js";
import { enterpriseSchema } from "@/database/schemas/enterprise.js";
// Controllers
import {
  createEnterprise,
  getEnterprise,
  getEnterprises,
  updateEnterprise,
} from "@/controllers/admin/enterprise.js";
import { getIdSchema } from "@/database/schemas/string.js";
import { Enterprise } from "@/database/models/enterprise.js";

const router = Router();

router.get("/", getEnterprises);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  // authorizeAdminDetailsByParam(),
  getEnterprise,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(enterpriseSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  checkUserExistenceByBodyValue(Enterprise, "email"),
  // allowAdminLevelByBody({ field: "level" }),
  createEnterprise,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  authorizeAdminDetailsByParam(),
  RequestMiddleware.bodyValidator(enterpriseSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  // allowAdminLevelByBody({ field: "level" }),
  updateEnterprise,
);

export { router as EnterpriseRouter };
