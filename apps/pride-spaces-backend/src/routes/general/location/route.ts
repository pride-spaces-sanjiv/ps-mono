import { Router } from "express";
import { MapsUrlRouter } from "./maps-url.js";

const router = Router();
router.use("/maps-url", MapsUrlRouter);

export { router as LocationRouter };
