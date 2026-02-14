import { Conn } from "@/database/mongoose.js";
import { ModelDocumentKeys } from "@/types/mongoose/document.js";
import { allGeneralFieldsEnabled } from "@/utils/mongoose/fields.js";

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
      type: Number,
    },
    organisation: { type: OrganisationSchema },
  },
  { timestamps: true },
);
UserSchema.index({ username: 1, email: 1, name: 1 });

const ProviderSchema = new Conn.Schema(
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
    verified: { type: Boolean, default: false },
    phone: {
      type: Number,
    },
    organisation: { type: OrganisationSchema },
  },
  { timestamps: true },
);
ProviderSchema.index({ username: 1, email: 1, name: 1 });

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
      type: Number,
    },
  },
  { timestamps: true },
);
AdminSchema.index({ username: 1, email: 1, name: 1 });

// Model Instances
export const User = Conn.model("User", UserSchema, "users");
export const Provider = Conn.model("Provider", ProviderSchema, "providers");
export const Admin = Conn.model("Admin", AdminSchema, "admins");

// Field names
export const userFields = Object.keys(UserSchema.paths).filter(
  (k) => k !== "createdAt" && k !== "updatedAt",
) as ModelDocumentKeys<typeof User>[];
export const providerFields = Object.keys(ProviderSchema.paths).filter(
  (k) => k !== "createdAt" && k !== "updatedAt",
) as ModelDocumentKeys<typeof User>[];
export const adminFields = Object.keys(AdminSchema.paths).filter(
  (k) => k !== "createdAt" && k !== "updatedAt",
) as ModelDocumentKeys<typeof User>[];

export const allUserFieldsEnabled = {
  ...(Object.fromEntries(userFields.map((f) => [f, 1])) as {
    [K in Exclude<ModelDocumentKeys<typeof User>, "id">]: 1;
  }),
  ...allGeneralFieldsEnabled,
};
export const allProviderFieldsEnabled = {
  ...(Object.fromEntries(providerFields.map((f) => [f, 1])) as {
    [K in Exclude<ModelDocumentKeys<typeof User>, "id">]: 1;
  }),
  ...allGeneralFieldsEnabled,
};
export const allAdminFieldsEnabled = {
  ...(Object.fromEntries(adminFields.map((f) => [f, 1])) as {
    [K in Exclude<ModelDocumentKeys<typeof User>, "id">]: 1;
  }),
  ...allGeneralFieldsEnabled,
};
