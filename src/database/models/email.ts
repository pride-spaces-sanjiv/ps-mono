import moment from "moment";
import { Conn } from "@/database/mongoose.js";
import { allGeneralFieldsEnabled } from "@/utils/mongoose/fields.js";
import { ModelDocumentKeys } from "@/types/mongoose/document.js";

export const emailTokenTypes = ["verification", "reset-password"] as const;
export type EmailTokenType = (typeof emailTokenTypes)[number];

export const emailTokenUserTypes = ["user", "provider", "admin"] as const;
export type EmailTokenUserType = (typeof emailTokenUserTypes)[number];

const exp = moment.duration(5, "days").asSeconds();
const EmailTokenSchema = new Conn.Schema(
  {
    token: { type: String, required: true, unique: true },
    user: { type: String, required: true },
    userType: {
      type: String,
      required: true,
      enum: emailTokenUserTypes,
      default: "user",
    },
    for: {
      type: String,
      enum: emailTokenTypes,
      default: "verification",
      required: true,
    },
  },
  { timestamps: true, expireAfterSeconds: exp },
);

EmailTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: exp });

// Model Instances
export const EmailToken = Conn.model(
  "EmailToken",
  EmailTokenSchema,
  "email_tokens",
);

// Field names
export const emailTokenFields = Object.keys(EmailTokenSchema.paths).filter(
  (k) => k !== "createdAt" && k !== "updatedAt",
) as ModelDocumentKeys<typeof EmailToken>[];

export const allEmailTokenFieldsEnabled = {
  ...(Object.fromEntries(emailTokenFields.map((f) => [f, 1])) as {
    [K in Exclude<ModelDocumentKeys<typeof EmailToken>, "id">]: 1;
  }),
  ...allGeneralFieldsEnabled,
};
