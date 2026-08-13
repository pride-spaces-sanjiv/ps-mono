import { Request, Response } from "express";
import { Lead } from "@/database/models/lead.js";

const STL_DIGITAL_SAMPLE = {
  companyName: "STL Digital",
  contactPerson: "Tina",
  designation: "Admin Manager",
  mobileNumber: "88889999000",
  alternateNumber: "000 000 0000",
  email: "tina@gmail.com",
  requirementSnapshot: "70 ws and few cabin",
  city: "Bengaluru",
  industry: "IT",
  companyTeamSize: "200+",
  existingOffice:
    "Currently operating from a managed office space at Workshaala Legacy, Whitefield",
  leadSource: "BD",
  assignedTo: "Debasish",
  coManager: "Rehan",
  spaceType: "Managed",
  priority: "Hot",
  dealValue: 1250000,
  qualifyStatus: "Qualified",
  leadStatus: "Active",
  subStatus: "Site Visit Done",
  followUpDate: "2026-08-05",
  assignedDate: new Date().toISOString(),
  progressNotes: [
    {
      note: "Second site visit completed with the CEO. SpazeOne has been finalized, and the commercial discussion is scheduled as the next step",
      followUpDate: "2026-08-05",
      createdAt: new Date().toISOString(),
    },
  ],
  activityLogs: [
    {
      activity:
        "Automatically records every activity with the employee's name, date, and time. Activity logs are immutable and cannot be modified or deleted by any employee.",
      author: "Debasish",
      timestamp: new Date().toISOString(),
    },
  ],
  wipLogs: [
    {
      log: "Records the total time each team member spends working in the CRM. This helps monitor productivity, user engagement, and system usage.",
      author: "System Tracker",
      timestamp: new Date().toISOString(),
    },
  ],
};

export async function seedLeads(req: Request, res: Response) {
  try {
    const existingStl = await Lead.findOne({ companyName: "STL Digital" });
    let lead = existingStl;
    if (!existingStl) {
      lead = await Lead.create(STL_DIGITAL_SAMPLE);
    }
    return res.status(200).json({
      success: true,
      message: "Lead database seeded with STL Digital sample lead",
      data: lead,
    });
  } catch (err: any) {
    console.error("Error seeding leads:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to seed leads",
    });
  }
}

export async function createLead(req: Request, res: Response) {
  try {
    const payload = req.body;

    if (
      !payload.companyName ||
      !payload.contactPerson ||
      !payload.mobileNumber ||
      !payload.email ||
      !payload.requirementSnapshot ||
      !payload.city ||
      !payload.assignedTo ||
      !payload.coManager ||
      !payload.qualifyStatus
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const creationLog = {
      activity: `Lead created by ${payload.assignedTo || "User"}`,
      author: payload.assignedTo || "System",
      timestamp: new Date().toISOString(),
    };

    const initialWipLog = {
      log: "Work-in-progress session initialized for new lead",
      author: "System Tracker",
      timestamp: new Date().toISOString(),
    };

    const lead = await Lead.create({
      ...payload,
      assignedDate: payload.assignedDate || new Date().toISOString(),
      activityLogs: [creationLog],
      wipLogs: [initialWipLog],
    });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (err: any) {
    console.error("Error creating lead:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create lead",
    });
  }
}

export async function getLeads(req: Request, res: Response) {
  try {
    let leads = await Lead.find().sort({ createdAt: -1 });

    // Auto-seed if database is empty
    if (leads.length === 0) {
      const seeded = await Lead.create(STL_DIGITAL_SAMPLE);
      leads = [seeded];
    }

    return res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (err: any) {
    console.error("Error fetching leads:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch leads",
    });
  }
}

export async function getLeadById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (err: any) {
    console.error("Error fetching lead by ID:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch lead",
    });
  }
}

export async function updateLead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updatePayload = req.body;

    const existingLead = await Lead.findById(id);
    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Append immutable Activity Log entry for this update
    const updateActivityLog = {
      activity: `Lead updated (Status: ${updatePayload.leadStatus || existingLead.leadStatus}, Stage: ${updatePayload.subStatus || existingLead.subStatus})`,
      author: updatePayload.assignedTo || existingLead.assignedTo || "User",
      timestamp: new Date().toISOString(),
    };

    updatePayload.activityLogs = [
      ...(existingLead.activityLogs || []),
      updateActivityLog,
    ];

    // Handle adding a new progress note if provided
    if (updatePayload.newProgressNote && updatePayload.newFollowUpDate) {
      const updatedNotes = [
        ...(existingLead.progressNotes || []),
        {
          note: updatePayload.newProgressNote,
          followUpDate: updatePayload.newFollowUpDate,
          createdAt: new Date().toISOString(),
        },
      ];
      updatePayload.progressNotes = updatedNotes;
      updatePayload.followUpDate = updatePayload.newFollowUpDate;
      delete updatePayload.newProgressNote;
      delete updatePayload.newFollowUpDate;
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (err: any) {
    console.error("Error updating lead:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to update lead",
    });
  }
}
