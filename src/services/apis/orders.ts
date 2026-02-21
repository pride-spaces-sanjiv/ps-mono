import { ACCOUNT } from "./config";
import { checkOrderSchema, createOrderSchema } from "@/utils/schemas/order";
import { extendUserPlaylistSchema } from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { GeneralResponseWithError } from "@/types/axios/response";

export type CreateOrderRes = GeneralResponseWithError<
  Partial<{ sessionId: string; orderId: string }>
>;
export type PaymentStatus = "PAID" | "CANCELLED" | "UNPAID" | "TERMINATED";
export type CheckOrderRes = GeneralResponseWithError<
  Partial<{ sessionId: string; orderId: string; paymentStatus: PaymentStatus }>
>;

export const createOrder = APIBodyValidationWrapper({
  schema: createOrderSchema,
  handle: async (param, config) => {
    const url = "/create-order";
    const res = await ACCOUNT.post<CreateOrderRes>(url, param?.body, config);
    return res;
  },
});
export const createOrderUser = APIBodyValidationWrapper({
  schema: extendUserPlaylistSchema,
  handle: async (param, config) => {
    const url = "/create-order";
    const res = await ACCOUNT.post<CreateOrderRes>(url, param?.body, config);
    return res;
  },
});

export const checkOrder = APIBodyValidationWrapper({
  schema: checkOrderSchema,
  handle: async (param, config) => {
    const url = "/check-order";
    const res = await ACCOUNT.post<CheckOrderRes>(url, param?.body, config);
    return res;
  },
});
