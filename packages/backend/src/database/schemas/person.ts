import { z } from "zod";
import { getNameSchema, getEmailSchema, getPhoneSchema } from "./string.js";

// Person Schema
export const personSchema = z.object({
  name: getNameSchema({
    keyName: "Person Name",
    alphaRegexp: /^[A-Za-z0-9, ]+$/,
    alphaRegexpMsg: "must only contain alpha numeric characters",
  }),
  email: getEmailSchema({ keyName: "Person Email" }),
  contactNo: getPhoneSchema({ keyName: "Person Contact Number" }),
  role: z.string().trim().min(1, "Role is required"),
});
