import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Admin } from "@pride-spaces/backend/database/models/user.js";
import { LocationRouter } from "@/routes/general/location/route.js";
import { OperatorRouter } from "@/routes/public/operator.js";
import { SpaceRouter } from "@/routes/public/space.js";
import { AmenityRouter } from "@/routes/public/amenity.js";

const router = Router();
router.use("/location", LocationRouter);
router.use("/spaces", SpaceRouter);
router.use("/operators", OperatorRouter);
router.use("/amenities", AmenityRouter);

export { router as GeneralRouter };
