import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
import { enterpriseSchema } from "@/database/schemas/enterprise.js";
// Controllers
import {
  createEnterprise,
  deleteEnterprise,
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
  RequestMiddleware.bodyValidator(enterpriseSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateEnterprise,
);
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteEnterprise,
);
export { router as EnterpriseRouter };
