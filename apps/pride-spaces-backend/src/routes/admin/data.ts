import { Router } from "express";
import { Admin } from "@/database/models/user.js";
import { RequestMiddleware } from "@/middlewares/request.js";
// import { allowAdminLevelByBody } from "@/middlewares/checkUser.js";
import { adminSchema } from "@/database/schemas/user.js";
// Controllers
import { getData, updateData } from "@/controllers/general/data.js";

const router = Router();

router.get("/", getData(Admin, { keyName: "admin" }));
router.put(
  "/",
  RequestMiddleware.bodyValidator(adminSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  // allowAdminLevelByBody({ field: "level" }),
  updateData(Admin, { keyName: "admin" }),
);

export { router as DataRouter };
