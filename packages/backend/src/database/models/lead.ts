import { Conn } from "@/database/mongoose.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";

const ProgressNoteSchema = new Conn.Schema(
  {
    note: { type: String, required: true },
    followUpDate: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: true }
);

const ActivityLogSchema = new Conn.Schema(
  {
    activity: { type: String, required: true },
    author: { type: String, required: true, default: "System" },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { _id: true }
);

const WipLogSchema = new Conn.Schema(
  {
    log: { type: String, required: true },
    author: { type: String, default: "System" },
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { _id: true }
);

const LeadDocumentsSchema = new Conn.Schema(
  {
    loiSignedCopy: { type: String, default: "" },
    agreementSignedCopy: { type: String, default: "" },
    invoiceCopy: { type: String, default: "" },
    feeLetterCopy: { type: String, default: "" },
  },
  { _id: false }
);

const LeadSchema = new Conn.Schema(
  {
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    designation: { type: String, default: "" },
    mobileNumber: { type: String, required: true },
    alternateNumber: { type: String, default: "" },
    email: { type: String, required: true },
    spaceType: { type: String, default: "" },
    requirementSnapshot: { type: String, required: true },
    city: { type: String, required: true },
    industry: { type: String, default: "" },
    companyTeamSize: { type: String, default: "" },
    companyType: { type: String, default: "" },
    existingOffice: { type: String, default: "" },
    leadSource: { type: String, default: "" },
    assignedTo: { type: String, required: true },
    coManager: { type: String, required: true },
    qualifyStatus: {
      type: String,
      enum: ["Qualified", "Unqualified", "Invalid"],
      required: true,
      default: "Qualified",
    },
    unqualifiedReason: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["Cold", "Warm", "Hot"],
      default: "Warm",
    },
    dealValue: { type: Number, default: 0 },
    leadStatus: {
      type: String,
      enum: ["Active", "Won", "Lost", "Hold"],
      default: "Active",
    },
    subStatus: { type: String, default: "Contacted" },
    expectedClosureDate: { type: String, default: "" },
    followUpDate: { type: String, default: "" },
    assignedDate: { type: String, default: () => new Date().toISOString() },
    progressNotes: { type: [ProgressNoteSchema], default: [] },
    activityLogs: { type: [ActivityLogSchema], default: [] },
    wipLogs: { type: [WipLogSchema], default: [] },
    lockInEndDate: { type: String, default: "" },
    expansionPlan: { type: String, default: "" },
    documents: { type: LeadDocumentsSchema, default: {} },
  },
  { timestamps: true }
);

indexFieldsFromSchema(LeadSchema, {
  singleFields: [
    "companyName",
    "email",
    "city",
    "qualifyStatus",
    "priority",
    "leadStatus",
  ],
});

export const Lead = Conn.model("Lead", LeadSchema, "crm_leads");
