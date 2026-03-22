import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Amenity } from "@/database/models/amenities.js";
import {
  amenitySchema,
  type AmenitySchema,
} from "@/database/schemas/amenities.js";

import { getIdSchema } from "@/database/schemas/string.js";
import {
  getAmenities,
  getAmenity,
  createAmenity,
  deleteAmenity,
  updateAmenity,
} from "@/controllers/admin/amenity.js";
import { allowAdminLevelsToPass } from "@/middlewares/checkUser.js";

const router = Router();

//  GET LIST (with optional filters)
const getListSchema = z.object({
  category: z.string().optional(),
});

router.get(
  "/",
  RequestMiddleware.queryValidator(getListSchema, {
    validateOnlyPresent: true,
    allowEmpty: true,
  }),
  getAmenities,
);

//  GET SINGLE
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getAmenity,
);

//  CREATE
router.post(
  "/",
  RequestMiddleware.bodyValidator(amenitySchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  createAmenity,
);

//  UPDATE ( based on your Space module)
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.bodyValidator(amenitySchema, {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateAmenity,
);

//  DELETE
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteAmenity,
);

export { router as AmenityRouter };
