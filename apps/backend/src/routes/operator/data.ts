import { Router } from "express";
import { Operator } from "@pride-spaces/backend/database/models/operator.js";
import { RequestMiddleware } from "@/middlewares/request.js";
// import { allowAdminLevelByBody } from "@/middlewares/checkUser.js";
import { operatorSchema } from "@pride-spaces/backend/database/schemas/operator.js";
// Controllers
import { getData, updateData } from "@/controllers/general/data.js";

const router = Router();

router.get("/", getData(Operator, { keyName: "operator" }));
router.put(
  "/",
  RequestMiddleware.bodyValidator(operatorSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateData(Operator, { keyName: "operator" }),
);

export { router as DataRouter };
