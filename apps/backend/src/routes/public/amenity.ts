import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
// Controllers
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";
import { getAmenities, getAmenity } from "@/controllers/public/amenity.js";

const router = Router();

router.get("/", getAmenities);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getAmenity,
);

export { router as AmenityRouter };
