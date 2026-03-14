import { Conn } from "@/database/mongoose.js";
import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { userTypes } from "@/utils/data/userTypes.js";
import { dumpCollectionNames } from "@/utils/data/dump.js";

export const ApprovalSchema = new Conn.Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: userTypes, required: true },
    lastRequested: { type: Date, required: true },
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
  },
  { timestamps: true },
);

// Model Instances
export const Dump = Conn.model("Dump", DumpSchema, "dumps");
Dump.syncIndexes();

// Field names
export const dumpFields = getFieldsOfModel(Dump, {
  timestamps: false,
});
export const allDumpFieldsEnabled = appendGeneralFields(dumpFields);
