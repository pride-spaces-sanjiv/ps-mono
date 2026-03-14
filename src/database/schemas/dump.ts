import { z } from "zod";
import {
  getEmailSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
  getSlugSchema,
} from "./string.js";
import { dumpCollectionNames } from "@/utils/data/dump.js";
import { userTypes } from "@/utils/data/userTypes.js";

export const approvalSchema = z.object({
  name: getNameSchema(),
  level: z.enum(userTypes),
  lastRequested: z.date(),
});

export const dumpSchema = z.object({
  collection: z.enum(Object.values(dumpCollectionNames)),
  data: z.any(),
});

export type DumpSchema = z.infer<typeof dumpSchema>;
export type ApprovalSchema = z.infer<typeof approvalSchema>;
