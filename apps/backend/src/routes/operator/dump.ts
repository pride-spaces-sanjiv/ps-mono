import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { type DumpSchema, dumpSchema } from "@pride-spaces/backend/database/schemas/dump.js";
// Controllers
import {
  getDumps,
  getDump,
  createDump,
  updateDump,
} from "@/controllers/general/dump.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";

const router = Router();

router.get("/", getDumps);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getDump,
);
// router.post(
//   "/",
//   RequestMiddleware.bodyValidator(dumpSchema, {
//     validateOnlyPresent: false,
//     overridePostValidation: true,
//     extractOnlyRequiredFields: true,
//   }),
//   createDump,
// );
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

export { router as DumpRouter };
