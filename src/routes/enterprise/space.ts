import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { checkUserExistenceByBodyValue } from "@/middlewares/checkUser.js";
import { Space } from "@/database/models/space.js";
import { spaceSchema } from "@/database/schemas/space.js";
// Controllers
import {
  getSpace,
  getSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
} from "@/controllers/operator/space.js";
import { getIdSchema } from "@/database/schemas/string.js";

const router = Router();

const getListSchema = z.object({
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
  RequestMiddleware.bodyValidator(spaceSchema.omit({ enterprise: true }), {
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
  RequestMiddleware.bodyValidator(
    spaceSchema.omit({ branch: true, enterprise: true }),
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
