import { Router } from "express";
import { Admin } from "@/database/models/user.js";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  allowAdminLevelByBody,
  allowAdminLevelsToPass,
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
// Controllers
import {
  createAdmin,
  getAdmin,
  getAdmins,
  updateAdmin,
} from "@/controllers/admin/admin.js";
import { changePassword, getPassword } from "@/controllers/general/password.js";
import { adminSchema } from "@/database/schemas/user.js";
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

// Password
const passwordSchema = adminSchema.pick({ password: true });
router.get(
  "/:id/password",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  allowAdminLevelsToPass({ allowedLevels: ["super-admin"] }),
  authorizeAdminDetailsByParam(),
  getPassword(Admin, { keyName: "admin" }),
);
router.put(
  "/:id/password/change",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  allowAdminLevelsToPass({ allowedLevels: ["super-admin"] }),
  RequestMiddleware.bodyValidator(passwordSchema, {
    allowEmpty: false,
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  authorizeAdminDetailsByParam(),
  changePassword(Admin, { keyName: "admin" }),
);

export { router as AdminRouter };
