import { Router } from "express";
import { Enterprise } from "@/database/models/enterprise.js";
import { RequestMiddleware } from "@/middlewares/request.js";
// import { allowAdminLevelByBody } from "@/middlewares/checkUser.js";
import { enterpriseSchema } from "@/database/schemas/enterprise.js";
// Controllers
import { getData, updateData } from "@/controllers/general/data.js";

const router = Router();

router.get("/", getData(Enterprise, { keyName: "enterprise" }));
router.put(
  "/",
  RequestMiddleware.bodyValidator(enterpriseSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateData(Enterprise, { keyName: "enterprise" }),
);

export { router as DataRouter };
