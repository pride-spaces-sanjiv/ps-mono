import { Router } from "express";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  seedLeads,
} from "@/controllers/crm/lead.controller.js";

const router = Router();

router.post("/leads/seed", seedLeads);
router.post("/leads", createLead);
router.get("/leads", getLeads);
router.get("/leads/:id", getLeadById);
router.put("/leads/:id", updateLead);
router.patch("/leads/:id", updateLead);

export { router as CRMRouter };
