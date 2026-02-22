import { Conn } from "@/database/mongoose.js";
import { ModelDocumentKeys } from "@/types/mongoose/document.js";
import {
  getFieldsOfModel,
  appendGeneralFields,
} from "@/utils/mongoose/fields.js";

const OrganisationSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    location: { type: String },
  },
  { _id: false },
);

const UserSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isGoogleAcc: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    phone: {
      type: String,
    },
    organisation: { type: OrganisationSchema },
  },
  { timestamps: true },
);
UserSchema.index({ username: 1, email: 1, name: 1 });

export const adminLevels = ["super-admin", "admin", "support"] as const;
export type AdminLevel = (typeof adminLevels)[number];
const AdminSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isGoogleAcc: { type: Boolean, default: false },
    level: {
      type: String,
      enum: adminLevels,
      required: true,
      default: "support",
    },
    phone: {
      type: String,
    },
  },
  { timestamps: true },
);
AdminSchema.index({ username: 1, email: 1, name: 1 });

// Model Instances
export const User = Conn.model("User", UserSchema, "users");
export const Admin = Conn.model("Admin", AdminSchema, "admins");

// Field names
// user
export const userFields = getFieldsOfModel(User, {
  timestamps: false,
});
export const userNonPassFields = userFields.filter((f) => f !== "password");
export const allUserFieldsEnabled = appendGeneralFields(userFields);
export const allUserNonPassFieldsEnabled =
  appendGeneralFields(userNonPassFields);
// admin
export const adminFields = getFieldsOfModel(Admin, {
  timestamps: false,
});
export const adminNonPassFields = adminFields.filter((f) => f !== "password");
export const allAdminFieldsEnabled = appendGeneralFields(adminFields);
export const allAdminNonPassFieldsEnabled =
  appendGeneralFields(adminNonPassFields);
