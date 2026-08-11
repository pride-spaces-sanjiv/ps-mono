import { load } from "@cashfreepayments/cashfree-js";

// Initiate
export const cashfree = await load({
  mode: import.meta.env.VITE_CASHFREE_MODE,
});
