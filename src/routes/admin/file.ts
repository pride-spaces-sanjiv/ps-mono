import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { validateFileUpload } from "@/middlewares/file.js";
import { getUUIdSchema } from "@/database/schemas/string.js";
import { getImageFile, getLayoutFile } from "@/controllers/general/file.js";
import { mediaTypes } from "@/utils/data/media.js";

const router = Router();

const uuidSchema = z.object({});

// File Getters
// Image
router.get(
  "/image/:id",
  RequestMiddleware.paramValidator(getUUIdSchema(), "id"),
  getImageFile,
);

// Layout
router.get(
  "/layout/:id",
  RequestMiddleware.paramValidator(getUUIdSchema(), "id"),
  getLayoutFile,
);

// Creates
router.post(
  "/image",
  validateFileUpload({ fileType: mediaTypes.IMAGE }),
  getImageFile,
);
router.post(
  "/layout",
  validateFileUpload({ fileType: mediaTypes.LAYOUT }),
  getLayoutFile,
);

export { router as FileRouter };
