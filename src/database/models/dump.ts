import { Conn } from "@/database/mongoose.js";
import { Schema } from "mongoose";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { userTypes } from "@/utils/data/userTypes.js";
import { dumpActions, dumpCollectionNames } from "@/utils/data/dump.js";
import { User } from "@/database/models/user.js";
import { adminLevels } from "@/utils/data/admin.js";

export const ApprovalSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: userTypes, required: true },
    lastRequested: { type: Date, required: true },
  },
  { _id: false },
);

const UserSchema = new Conn.Schema(
  {
    id: { type: String, required: true },
    name: String,
    email: String,
    level: {
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
    data: { type: Schema.Types.Mixed },
    user: { type: UserSchema, required: true },
  },
  { timestamps: true },
);

// Model Instances
export const Dump = Conn.model("Dump", DumpSchema, "dumps");
indexFieldsFromSchema(DumpSchema, {
  singleFields: ["collection", "user.id", "user.email", "user.name"],
});

// Field names
export const dumpFields = getFieldsOfModel(Dump, {
  timestamps: false,
});
export const allDumpFieldsEnabled = appendGeneralFields(dumpFields);
