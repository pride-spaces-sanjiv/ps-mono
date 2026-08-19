import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";
import { getStates, getState } from "@/controllers/general/states/data.js";

const router = Router();

router.get("/", getStates);

//  GET SINGLE
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getState,
);

export { router as DataRouter };
