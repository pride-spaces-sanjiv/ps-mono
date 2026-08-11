import {
  appendGeneralFields,
  getFieldsOfModel,
} from "@/utils/mongoose/fields.js";
import { Conn } from "../mongoose.js";
import { indexFieldsFromSchema } from "@/utils/mongoose/indexing.js";
import { mediaStatuses, mediaTypes } from "@/utils/data/media.js";

// --- Schema ---
const MediaTempSchema = new Conn.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expectedDeletion: { type: Date },
    mediaType: {
      type: String,
      enum: Object.values(mediaTypes),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(mediaStatuses),
      required: true,
    },
  },
  { timestamps: true },
);

// Model Instances
export const MediaTemp = Conn.model("MediaTemp", MediaTempSchema, "media-temp");
MediaTemp.syncIndexes();

// Field Names
export const mediaTempFields = getFieldsOfModel(MediaTemp);
export const allMediaTempFieldsEnabled = appendGeneralFields(mediaTempFields);
