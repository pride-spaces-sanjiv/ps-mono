import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { validateFileUpload } from "@/middlewares/file.js";
import {
  getImageFile,
  getLayoutFile,
  uploadImageFiles,
  uploadLayoutFiles,
} from "@/controllers/general/file.js";
import { mediaTypes } from "@/utils/data/media.js";
import { mediaQuerySchema } from "@/database/schemas/media.js";

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

export { router as FileRouter };
