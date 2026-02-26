import { Conn } from "@/database/mongoose.js";
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

const EnterpriseSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    headquarter: { type: HeadQuarterSchema, required: true },
    person: { type: HeadQuarterPersonSchema, required: true },
  },
  { timestamps: true },
);
indexFieldsFromSchema(EnterpriseSchema, { singleFields: ["name"] });

// Model Instances
export const Enterprise = Conn.model(
  "Enterprise",
  EnterpriseSchema,
  "enterprises",
);

// Field names
export const enterpriseFields = getFieldsOfModel(Enterprise, {
  timestamps: false,
});
export const enterpriseNonPassFields = enterpriseFields.filter(
  (f) => f !== "password",
);
export const allEnterpriseFieldsEnabled = appendGeneralFields(enterpriseFields);
export const allEnterpriseNonPassFieldsEnabled = appendGeneralFields(
  enterpriseNonPassFields,
);
