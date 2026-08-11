import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { checkUserExistenceByBodyValue } from "@/middlewares/checkUser.js";
import { preParseDateFieldsFromBody } from "@/middlewares/parseDateFields.js";
import { Space } from "@/database/models/space.js";
import { spaceSchema, type SpaceSchema } from "@/database/schemas/space.js";
// Controllers
import {
  getSpace,
  getSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
} from "@/controllers/admin/space.js";
import { getIdSchema } from "@/database/schemas/string.js";

const router = Router();

const getListSchema = z.object({
  operator: getIdSchema({ keyName: "Operator ID" }),
  branch: getIdSchema({ keyName: "Branch ID" }),
});
router.get(
  "/",
  RequestMiddleware.queryValidator(getListSchema, {
    validateOnlyPresent: true,
    allowEmpty: true,
  }),
  getSpaces,
);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getSpace,
);
router.post(
  "/",
  preParseDateFieldsFromBody<SpaceSchema>({
    fields: ["timing.openTime", "timing.closeTime"],
  }),
  RequestMiddleware.bodyValidator(spaceSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  checkUserExistenceByBodyValue(Space, "email"),
  createSpace,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  preParseDateFieldsFromBody<SpaceSchema>({
    fields: ["timing.openTime", "timing.closeTime"],
  }),
  RequestMiddleware.bodyValidator(
    spaceSchema.omit({ branch: true, operator: true }),
    {
      allowEmpty: true,
      validateOnlyPresent: true,
      overridePostValidation: true,
      extractOnlyRequiredFields: true,
    },
  ),
  updateSpace,
);
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteSpace,
);

export { router as SpaceRouter };
