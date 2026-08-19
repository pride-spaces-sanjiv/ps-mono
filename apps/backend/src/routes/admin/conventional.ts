import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { conventionalPropertySchema } from "@pride-spaces/backend/database/schemas/conventional.js";
// Controllers
import {
  getConventionals,
  getConventional,
  createConventional,
  updateConventional,
  deleteConventional,
} from "@/controllers/admin/conventional.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";

const router = Router();

router.get("/", getConventionals);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  // authorizeAdminDetailsByParam(),
  getConventional,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(conventionalPropertySchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  // allowAdminLevelByBody({ field: "level" }),
  createConventional,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.bodyValidator(
    conventionalPropertySchema.omit({ slug: true }).partial(),
    {
      allowEmpty: true,
      validateOnlyPresent: true,
      overridePostValidation: true,
      extractOnlyRequiredFields: true,
    },
  ),
  updateConventional,
);
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteConventional,
);

export { router as ConventionalRouter };
