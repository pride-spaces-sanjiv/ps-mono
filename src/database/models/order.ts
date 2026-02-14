import { ModelDocumentKeys } from "@/types/mongoose/document.js";
import { Conn } from "@/database/mongoose.js";

const paymentStatuses = ["PAID", "CANCELLED", "UNPAID", "FAILED"] as const;
const OrderSchema = new Conn.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: paymentStatuses, default: "UNPAID" },
    forUser: { type: String, required: true },
  },
  { timestamps: true },
);

export const Order = Conn.model("Order", OrderSchema, "orders");
export const orderFields = Object.keys(OrderSchema.paths).filter(
  (k) => k !== "createdAt" && k !== "updatedAt",
) as ModelDocumentKeys<typeof Order>[];
