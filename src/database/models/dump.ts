import { Conn } from "@/database/mongoose.js";
import { Schema } from "mongoose";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { userTypes } from "@/utils/data/userTypes.js";
import {
  dumpActions,
  dumpCollectionNames,
  dumpStatuses,
} from "@/utils/data/dump.js";
// import { User } from "@/database/models/user.js";
import { adminLevels } from "@/utils/data/admin.js";

export const ApprovalSchema = new Conn.Schema(
  {
    id: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    userType: { type: String, enum: userTypes, required: true },
    lastRequested: { type: Date, required: true },
  },
  { _id: false },
);

const UserSchema = new Conn.Schema(
  {
    id: { type: String, required: true },
    name: String,
    email: String,
    userType: {
      type: String,
      enum: adminLevels,
      required: true,
    },
  },
  { _id: false },
);

const DumpSchema = new Conn.Schema(
  {
    collection: {
      type: String,
      enum: Object.values(dumpCollectionNames),
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(dumpActions),
      required: true,
    },
    metadata: { id: { type: String, required: true }, name: String },
    data: { type: Schema.Types.Mixed },
    from: { type: UserSchema },
    to: { type: UserSchema },
    status: {
      type: String,
      enum: Object.values(dumpStatuses),
      default: dumpStatuses.PENDING,
    },
    comment: { type: String },
  },
  { timestamps: true },
);

// Model Instances
export const Dump = Conn.model("Dump", DumpSchema, "dumps");
indexFieldsFromSchema(DumpSchema, {
  singleFields: [
    "collection",
    "from.id",
    "from.email",
    "from.name",
    "to.id",
    "to.email",
    "to.name",
  ],
});

// Field names
export const dumpFields = getFieldsOfModel(Dump, {
  timestamps: false,
});
export const allDumpFieldsEnabled = appendGeneralFields(dumpFields);
