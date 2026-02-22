import { Conn } from "@/database/mongoose.js";
import { amenities } from "@/types/data/amenities.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";

const WorkspaceUnitSchema = new Conn.Schema(
  {
    space: { type: String, required: true },
    name: { type: String },
    type: { type: String, required: true },
    capacity: { type: Number, required: true, default: 0 },
    features: { type: Object },
    isAvailable: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);
WorkspaceUnitSchema.index({ name: 1, space: 1, type: 1 });

export const billingCycles = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof billingCycles)[number];

const PlanSchema = new Conn.Schema(
  {
    unit: { type: String, required: true },
    name: { type: String },
    duration: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true, default: 0 },
    billCycle: {
      type: String,
      required: true,
      default: "monthly",
      enum: billingCycles,
    },
    minBookingMonths: { type: Number, required: true, default: 1 },
    terms: { type: String },
    amenities: {
      type: [{ type: String, enum: amenities }],
      required: true,
      default: [],
    },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);
PlanSchema.index({ name: 1, unit: 1 });

// Model Instances
export const WorkspaceUnit = Conn.model(
  "WorkspaceUnit",
  WorkspaceUnitSchema,
  "workspace-units",
);
export const Plan = Conn.model("WorkspacePlan", PlanSchema, "workspace-plans");

// Field names
export const workspaceUnitFields = getFieldsOfModel(WorkspaceUnit, {
  timestamps: false,
});
export const workspacePlanFields = getFieldsOfModel(Plan, {
  timestamps: false,
});
export const allWorkspaceUnitFieldsEnabled =
  appendGeneralFields(workspaceUnitFields);
export const allWorkspacePlanFieldsEnabled =
  appendGeneralFields(workspacePlanFields);
