import { Conn } from "@/database/mongoose.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";

const PersonSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNo: { type: String, required: true, default: "" },
    role: { type: String, required: true },
  },
  { _id: false },
);

const BranchSchema = new Conn.Schema(
  {
    enterprise: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    person: { type: PersonSchema, required: true },
    address: { type: String, required: true },
    website: { type: String },
  },
  { timestamps: true },
);
BranchSchema.index({ name: 1, email: 1, enterprise: 1 });

// Model Instances
export const Branch = Conn.model("Branch", BranchSchema, "branches");

// Field names
export const branchFields = getFieldsOfModel(Branch, {
  timestamps: false,
});
export const allBranchFieldsEnabled = appendGeneralFields(branchFields);
