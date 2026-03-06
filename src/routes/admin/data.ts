import { Router } from "express";
import { Admin } from "@/database/models/user.js";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  allowAdminLevelByBody,
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
// Controllers
import { getAdmin, updateAdmin } from "@/controllers/admin/data.js";
import { adminSchema } from "@/database/schemas/user.js";
import { getIdSchema } from "@/database/schemas/string.js";

const router = Router();

router.get("/", getAdmin);
router.put(
  "/",
  RequestMiddleware.bodyValidator(adminSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  allowAdminLevelByBody({ field: "level" }),
  updateAdmin,
);

export { router as DataRouter };
