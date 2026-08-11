import { Router } from "express";
import { getMigration, getMigrations } from "@/controllers/admin/migration.js";

const router = Router();

router.get("/", getMigrations);

router.get("/:id", getMigration);

export { router as MigrationRouter };
