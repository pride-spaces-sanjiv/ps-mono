import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { checkUserExistenceByBodyValue } from "@/middlewares/checkUser.js";
import { Branch } from "@pride-spaces/backend/database/models/branch.js";
import { branchSchema } from "@pride-spaces/backend/database/schemas/branch.js";
// Controllers
import {
  getBranch,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/controllers/operator/branch.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";

const router = Router();

router.get("/", getBranches);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getBranch,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(branchSchema.omit({ operator: true }), {
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
  RequestMiddleware.bodyValidator(branchSchema.omit({ operator: true }), {
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
