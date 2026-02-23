import { Router } from "express";
import { Admin } from "@/database/models/user.js";
import { RequestMiddleware } from "@/middlewares/request.js";
import { checkUserExistenceByBodyValue } from "@/middlewares/checkUser.js";
import { adminSchema } from "@/database/schemas/user.js";
// Controllers
import { createAdmin } from "@/controllers/admin/admin.js";

const router = Router();

router.post(
  "/admins",
  RequestMiddleware.bodyValidator(adminSchema),
  checkUserExistenceByBodyValue(Admin, "email"),
  createAdmin,
);

export { router as AdminRouter };
