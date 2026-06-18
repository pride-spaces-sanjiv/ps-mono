import { z } from "zod";
import {
  getEmailSchema,
  getIdSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
  getSlugSchema,
  getUUIdSchema,
} from "./string.js";
import {
  allowedExtensions,
  mediaStatuses,
  MediaType,
  mediaTypes,
} from "@/utils/data/media.js";

export const mediaTempSchema = z.object({
  fileId: z.string().min(1, "File Id is required"),
  expectedDeletion: z.date().optional(),
  mediaType: z.enum(Object.values(mediaTypes), "Invalid media type"),
  status: z.enum(Object.values(mediaStatuses), "Invalid media status"),
});

export type MediaTempSchema = z.infer<typeof mediaTempSchema>;

export const mediaQuerySchema = (fileType: MediaType = mediaTypes.IMAGE) =>
  z.object({
    id: getUUIdSchema({ keyName: "File ID" }),
    ext: z.enum(
      allowedExtensions[fileType] || [],
      `Invalid ${fileType} file extension`,
    ),
  });

export type MediaQuerySchema = z.infer<ReturnType<typeof mediaQuerySchema>>;

export const mediaDelSchema = (fileType = mediaTypes.IMAGE as MediaType) =>
  z.object({
    id: getUUIdSchema({ keyName: "File ID" }),
    ext: z.enum(
      allowedExtensions[fileType] || [],
      `Invalid ${fileType} file extension`,
    ),
  });

export type MediaDelSchema = z.infer<typeof mediaDelSchema>;
