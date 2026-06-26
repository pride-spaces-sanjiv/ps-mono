import { Conn } from "@/database/mongoose.js";
import { ApprovalSchema } from "./dump.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";

const HeadQuarterPersonSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNo: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false },
);

const HeadQuarterSchema = new Conn.Schema(
  {
    address: { type: String, required: true },
    contactNo: { type: String, required: true, default: "" },
  },
  { _id: false },
);

export const BranchSchema = new Conn.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    gstNo: {
      type: String,
    },
    person: {
      type: HeadQuarterPersonSchema.eachPath((path, sType) =>
        sType.required(false),
      ),
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const OperatorSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brandName: { type: String },
    headquarter: {
      type: HeadQuarterSchema.eachPath((path, sType) => sType.required(false)),
    },
    person: { type: HeadQuarterPersonSchema, required: true },
    gstNo: { type: String },
    cinNo: { type: String },
    approval: { type: ApprovalSchema },
    branches: { type: [BranchSchema] },
    establishedOn: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
indexFieldsFromSchema(OperatorSchema, {
  singleFields: ["name", "person.name", "person.email", "brandName"],
});

// Model Instances
export const Operator = Conn.model("Operator", OperatorSchema, "operators");

// Field names
export const operatorFields = getFieldsOfModel(Operator, {
  timestamps: false,
});
export const operatorNonPassFields = operatorFields.filter(
  (f) => f !== "password",
);
export const allOperatorFieldsEnabled = appendGeneralFields(operatorFields);
export const allOperatorNonPassFieldsEnabled = appendGeneralFields(
  operatorNonPassFields,
);
