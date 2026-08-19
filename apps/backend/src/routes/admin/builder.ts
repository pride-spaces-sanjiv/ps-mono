import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import {
  allowAdminLevelsToPass,
  authorizeAdminDetailsByParam,
  checkUserExistenceByBodyValue,
} from "@/middlewares/checkUser.js";
import { Builder } from "@pride-spaces/backend/database/models/builder.js";
import { builderSchema } from "@pride-spaces/backend/database/schemas/builder.js";
// Controllers
import {
  createBuilder,
  deleteBuilder,
  getBuilder,
  getBuilders,
  getPassword,
  updateBuilder,
  updatePassword,
} from "@/controllers/admin/builder.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";
import { adminLevels } from "@pride-spaces/common/utils/data/admin.js";

const router = Router();

router.get("/", getBuilders);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  // authorizeAdminDetailsByParam(),
  getBuilder,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(builderSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  checkUserExistenceByBodyValue(Builder, "email"),
  // allowAdminLevelByBody({ field: "level" }),
  createBuilder,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.bodyValidator(builderSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateBuilder,
);
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteBuilder,
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
  RequestMiddleware.bodyValidator(builderSchema.pick({ password: true }), {
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updatePassword,
);

export { router as BuilderRouter };
