import { getLocationFromMapsURL } from "@/controllers/general/location/location.js";
import { locationSchema } from "@/database/schemas/location.js";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Router } from "express";

const router = Router();
router.post(
  "/position",
  RequestMiddleware.bodyValidator(
    locationSchema.pick({ url: true }).partial(),
    {
      extractOnlyRequiredFields: true,
      validateOnlyPresent: false,
      overridePostValidation: true,
      allowEmpty: false,
    },
  ),
  getLocationFromMapsURL,
);

export { router as MapsUrlRouter };
