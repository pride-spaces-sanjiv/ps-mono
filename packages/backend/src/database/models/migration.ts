import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { Conn } from "../mongoose.js";
import { dumpCollectionNames } from "@pride-spaces/common/utils/data/dump.js";

// --- Schema ---

const StatsSchema = new Conn.Schema(
  {
    total: { type: Number, default: 0, required: true },
    processed: { type: Number, default: 0, required: true },
    success: { type: Number, default: 0, required: true },
    failed: { type: Number, default: 0, required: true },
    parts: { type: Number, default: 0, required: true },
    uploadedParts: { type: Number, default: 0, required: true },
  },
  { _id: false },
);

const MigrationSchema = new Conn.Schema(
  {
    collection: {
      type: String,
      enum: Object.values(dumpCollectionNames),
      required: true,
    },
    fileId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    uploadedFileName: {
      type: String,
    },
    stats: {
      type: StatsSchema,
      required: true,
      default: {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        parts: 0,
        uploadedParts: 0,
      },
    },
  },
  { timestamps: true },
);

// Model Instances
export const Migration = Conn.model(
  "Migration",
  MigrationSchema,
  "data-migrations",
);
Migration.syncIndexes();

// Field Names
export const migrationFields = getFieldsOfModel(Migration);
export const allMigrationFieldsEnabled = appendGeneralFields(migrationFields);
