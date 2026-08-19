import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";
import {
  getAmenities,
  getAmenity,
  createAmenity,
  deleteAmenity,
  updateAmenity,
} from "@/controllers/admin/amenity.js";

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

export { router as AmenityRouter };
