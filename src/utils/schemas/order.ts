import * as yup from "yup";

export const createOrderSchema = yup.object().shape({
  credits: yup
    .number()
    .required("Credits is required")
    .min(10, "Select atleast 10 credits")
    .max(2000, "Maximum of 2000 credits allowed"),
});

export const checkOrderSchema = yup.object().shape({
  amount: yup.number().required("Amount is required").min(1, "Minimum Rs. 1"),
  sessionId: yup
    .string()
    .required("Session ID is required")
    .trim("Session ID is empty"),
  orderId: yup
    .string()
    .required("Order ID is required")
    .trim("Order ID is empty"),
});

export type CreateOrderSchema = yup.InferType<typeof createOrderSchema>;
export type CheckOrderSchema = yup.InferType<typeof checkOrderSchema>;
