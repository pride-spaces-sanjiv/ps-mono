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

const OperatorSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    headquarter: { type: HeadQuarterSchema, required: true },
    person: { type: HeadQuarterPersonSchema, required: true },
    approval: { type: ApprovalSchema },
  },
  { timestamps: true },
);
indexFieldsFromSchema(OperatorSchema, {
  singleFields: ["name", "slug", "person.name", "person.email"],
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
