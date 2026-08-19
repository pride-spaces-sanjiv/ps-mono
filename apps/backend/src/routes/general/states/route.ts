import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { Admin } from "@pride-spaces/backend/database/models/user.js";
// Routers
import { DataRouter } from "./data.js";
import { CitiesRouter } from "./cities.js";

const router = Router();

// Authorized routes
// @ts-ignore
// router.use(RequestMiddleware.authenticateUser(Admin, "admin"));
router.use(
  RequestMiddleware.updateCacheOptions({
    expiration: { type: "EX", value: 5 * 60 },
  }),
);
router.use("/cities", CitiesRouter);
router.use("/", DataRouter);

export { router as StatesRouter };
