import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { validateFileUpload } from "@/middlewares/file.js";
import {
  getImageFile,
  getLayoutFile,
  uploadImageFiles,
  uploadLayoutFiles,
  uploadMigrationFile,
} from "@/controllers/general/file.js";
import { mediaTypes } from "@pride-spaces/common/utils/data/media.js";
import { mediaQuerySchema } from "@pride-spaces/backend/database/schemas/media.js";
import { dumpSchema } from "@pride-spaces/backend/database/schemas/dump.js";

const router = Router();

const uuidSchema = z.object({});

// File Getters
// Image
router.get(
  "/image",
  RequestMiddleware.queryValidator(mediaQuerySchema(mediaTypes.IMAGE), {
    validateOnlyPresent: false,
    allowEmpty: false,
  }),
  getImageFile,
);

// Layout
router.get(
  "/layout",
  RequestMiddleware.queryValidator(mediaQuerySchema(mediaTypes.LAYOUT), {
    validateOnlyPresent: false,
    allowEmpty: false,
  }),
  getLayoutFile,
);

// Creates
router.post(
  "/image",
  validateFileUpload({ fileType: mediaTypes.IMAGE }),
  uploadImageFiles,
);
router.post(
  "/layout",
  validateFileUpload({ fileType: mediaTypes.LAYOUT }),
  uploadLayoutFiles,
);

const migrationQuerySchema = z.object({
  for: dumpSchema.shape.collection.default("spaces").optional(),
});
router.post(
  "/migration",
  RequestMiddleware.queryValidator(migrationQuerySchema.partial(), {
    validateOnlyPresent: true,
    allowEmpty: true,
  }),
  validateFileUpload({ fileType: mediaTypes.MIGRATIONFILE }),
  uploadMigrationFile,
);

export { router as FileRouter };
