import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";
import { getCities, getCity } from "@/controllers/general/states/cities.js";

const router = Router();

router.get("/", getCities);

//  GET SINGLE
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getCity,
);

export { router as CitiesRouter };
