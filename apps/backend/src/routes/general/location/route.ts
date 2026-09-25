import { Router } from "express";
import { MapsUrlRouter } from "./maps-url.js";
import { getNearbyPlaces } from "@/controllers/general/location/location.js";
import { nearbyPlacesSchema } from "@pride-spaces/common/utils/schemas/location.js";
import { RequestMiddleware } from "@pride-spaces/backend/middlewares/request.js";

const router = Router();
router.use("/maps-url", MapsUrlRouter);

router.post(
  "/nearby",
  RequestMiddleware.bodyValidator(nearbyPlacesSchema),
  getNearbyPlaces,
);
export { router as LocationRouter };
