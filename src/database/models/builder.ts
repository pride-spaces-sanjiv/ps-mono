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

const BuilderSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brandName: { type: String },
    headquarter: {
      type: HeadQuarterSchema.eachPath((path, sType) => sType.required(false)),
    },
    gstNo: { type: String },
    cinNo: { type: String },
    approval: { type: ApprovalSchema },
    isActive: { type: Boolean, default: true },
    branches: { type: [BranchSchema] },
  },
  { timestamps: true },
);
indexFieldsFromSchema(BuilderSchema, {
  singleFields: ["name", "brandName"],
});

// Model Instances
export const Builder = Conn.model("Builder", BuilderSchema, "builders");

// Field names
export const builderFields = getFieldsOfModel(Builder, {
  timestamps: false,
});
export const builderNonPassFields = builderFields.filter(
  (f) => f !== "password",
);
export const allBuilderFieldsEnabled = appendGeneralFields(builderFields);
export const allBuilderNonPassFieldsEnabled =
  appendGeneralFields(builderNonPassFields);
