import { Router } from "express";
import { Admin } from "@/database/models/user.js";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  allowAdminLevelByBody,
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
import { adminSchema } from "@/database/schemas/user.js";
// Controllers
import {
  createAdmin,
  getAdmin,
  getAdmins,
  updateAdmin,
} from "@/controllers/admin/admin.js";
import { getIdSchema } from "@/database/schemas/string.js";

const router = Router();

router.get("/", getAdmins);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  authorizeAdminDetailsByParam(),
  getAdmin,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(adminSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  checkUserExistenceByBodyValue(Admin, "email"),
  allowAdminLevelByBody({ field: "level" }),
  createAdmin,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  authorizeAdminDetailsByParam(),
  RequestMiddleware.bodyValidator(adminSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  allowAdminLevelByBody({ field: "level" }),
  updateAdmin,
);

export { router as AdminRouter };
