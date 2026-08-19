import { Router } from "express";
import { z } from "zod";
import { RequestMiddleware } from "@/middlewares/request.js";
// Controllers
import { getSpace, getSpaces } from "@/controllers/public/space.js";
import { getIdSchema } from "@pride-spaces/backend/database/schemas/string.js";

const router = Router();

const getListSchema = z.object({
  branch: getIdSchema({ keyName: "Branch ID" }),
});
router.get(
  "/",
  RequestMiddleware.queryValidator(getListSchema, {
    validateOnlyPresent: true,
    allowEmpty: true,
  }),
  getSpaces,
);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getSpace,
);

export { router as SpaceRouter };
