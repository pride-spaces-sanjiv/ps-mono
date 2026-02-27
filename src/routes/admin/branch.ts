import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { checkUserExistenceByBodyValue } from "@/middlewares/checkUser.js";
import { Branch } from "@/database/models/branch.js";
import { branchSchema } from "@/database/schemas/branch.js";
// Controllers
import {
  getBranch,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/controllers/admin/branch.js";
import { getIdSchema } from "@/database/schemas/string.js";

const router = Router();

const getListSchema = z.object({
  enterprise: getIdSchema({ keyName: "Enterprise ID" }),
});
router.get(
  "/",
  RequestMiddleware.queryValidator(getListSchema, {
    validateOnlyPresent: true,
    allowEmpty: true,
  }),
  getBranches,
);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getBranch,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(branchSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  checkUserExistenceByBodyValue(Branch, "email"),
  createBranch,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.bodyValidator(branchSchema.omit({ enterprise: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateBranch,
);
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteBranch,
);

export { router as BranchRouter };
