import { Router } from "express";
import { RequestMiddleware } from "@/middlewares/request.js";
import { checkUserExistenceByBodyValue } from "@/middlewares/checkUser.js";
import { User } from "@/database/models/user.js";
import { userSchema } from "@/database/schemas/user.js";
// Controllers
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "@/controllers/admin/user.js";
import { getIdSchema } from "@/database/schemas/string.js";

const router = Router();

router.get("/", getUsers);
router.get(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  getUser,
);
router.post(
  "/",
  RequestMiddleware.bodyValidator(userSchema, {
    validateOnlyPresent: false,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  checkUserExistenceByBodyValue(User, "email"),
  createUser,
);
router.put(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.bodyValidator(userSchema.omit({ password: true }), {
    allowEmpty: true,
    validateOnlyPresent: true,
    overridePostValidation: true,
    extractOnlyRequiredFields: true,
  }),
  updateUser,
);
router.delete(
  "/:id",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  deleteUser,
);

// Booking for user
router.get(
  "/:id/bookings",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
);
router.put(
  "/:id/bookings/:bookingId",
  RequestMiddleware.paramValidator(getIdSchema(), "id"),
  RequestMiddleware.paramValidator(
    getIdSchema({ keyName: "Booking Id" }),
    "bookingId",
  ),
);

export { router as UserRouter };
