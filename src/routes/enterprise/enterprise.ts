import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { enterpriseSchema } from "@/database/schemas/operator.js";
// Controllers
import {
  getEnterprise,
  updateEnterprise,
} from "@/controllers/operator/enterprise.js";

const router = Router();

router.get("/", getEnterprise);
router.put(
  "/",
  RequestMiddleware.bodyValidator(
    enterpriseSchema.omit({ password: true, email: true }),
    {
      allowEmpty: true,
      validateOnlyPresent: true,
      overridePostValidation: true,
      extractOnlyRequiredFields: true,
    },
  ),
  updateEnterprise,
);
export { router as EnterpriseRouter };
