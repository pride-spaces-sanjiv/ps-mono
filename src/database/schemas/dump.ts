import { z } from "zod";
import {
  getEmailSchema,
  getIdSchema,
  getNameSchema,
  getPasswordSchema,
  getPhoneSchema,
  getSlugSchema,
} from "./string.js";
import {
  dumpActions,
  dumpCollectionNames,
  dumpStatuses,
} from "@/utils/data/dump.js";
import { adminSchema } from "./user.js";
import { userTypes } from "@/utils/data/userTypes.js";

export const approvalSchema = z.object({
  name: getNameSchema(),
  level: z.enum(userTypes),
  lastRequested: z.date(),
});

const userSchema = adminSchema.pick({ name: true, email: true }).and(
  z.object({
    id: getIdSchema({ keyName: "From user Id" }),
    userType: z.enum(userTypes),
  }),
);

export const dumpSchema = z.object({
  collection: z.enum(Object.values(dumpCollectionNames)),
  action: z.enum(Object.values(dumpActions)),
  metadata: z.object({
    id: getIdSchema({ keyName: "Meta Id" }),
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  data: z.any(),
  from: userSchema.optional(),
  to: userSchema.optional(),
  status: z.enum(Object.values(dumpStatuses)),
  comment: z.string("Comment must be a string").optional(),
});

export type DumpSchema = z.infer<typeof dumpSchema>;
export type ApprovalSchema = z.infer<typeof approvalSchema>;
