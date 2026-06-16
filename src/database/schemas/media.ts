import { z } from "zod";
import {
  getEmailSchema,
  getIdSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
  getSlugSchema,
} from "./string.js";
import { mediaStatuses, mediaTypes } from "@/utils/data/media.js";

export const mediaTempSchema = z.object({
  fileId: z.string().min(1, "File Id is required"),
  expectedDeletion: z.date().optional(),
  mediaType: z.enum(Object.values(mediaTypes), "Invalid media type"),
  status: z.enum(Object.values(mediaStatuses), "Invalid media status"),
});

export type MediaTempSchema = z.infer<typeof mediaTempSchema>;
