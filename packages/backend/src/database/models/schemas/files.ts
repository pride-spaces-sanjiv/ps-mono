import { Conn } from "@/database/mongoose.js";

export const FilesSchema = new Conn.Schema(
  {
    images: { type: [String], default: [] },
    layouts: { type: [String], default: [] },
  },
  { _id: false },
);
