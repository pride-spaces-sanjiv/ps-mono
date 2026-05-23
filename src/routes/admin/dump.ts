import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { allowAdminLevelsToPass } from "@/middlewares/checkUser.js";
import { type DumpSchema, dumpSchema } from "@/database/schemas/dump.js";
// Controllers
import {
  getDumps,
  getDump,
  createDump,
  updateDump,
  approveDump,
} from "@/controllers/general/dump.js";
import { getIdSchema } from "@/database/schemas/string.js";
import { adminLevels } from "@/utils/data/admin.js";

const router = Router();

router.get("/", getDumps);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getDump,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(dumpSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  createDump,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.bodyValidator(dumpSchema, {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateDump,
);
router.get(
  "/approve/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  allowAdminLevelsToPass({
    allowedLevels: adminLevels.filter((lv) => lv !== "support"),
  }),
  approveDump,
);

export { router as DumpRouter };
