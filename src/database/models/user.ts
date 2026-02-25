import { Conn } from "@/database/mongoose.js";
import {
  getFieldsOfModel,
  appendGeneralFields,
} from "@/utils/mongoose/fields.js";
import { adminLevels, type AdminLevel } from "@/utils/data/admin.js";
import {
  getRedisObject,
  setRedisObject,
} from "@/utils/services/redis/convert.js";
import { cachePlugin } from "@/utils/mongoose/cachePlugin.js";

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

// Cache Plugin
UserSchema.plugin(cachePlugin);
AdminSchema.plugin(cachePlugin);

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
