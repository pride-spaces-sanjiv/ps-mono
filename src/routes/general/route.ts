import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Admin } from "@/database/models/user.js";
import { LocationRouter } from "@/routes/general/location/route.js";
import { SpaceRouter } from "@/routes/public/space.js";
import { AmenityRouter } from "@/routes/public/amenity.js";

const router = Router();
router.use("/location", LocationRouter);
router.use("/spaces", SpaceRouter);
router.use("/amenities", AmenityRouter);

export { router as GeneralRouter };
