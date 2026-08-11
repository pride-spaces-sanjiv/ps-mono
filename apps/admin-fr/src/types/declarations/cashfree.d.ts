declare module "@cashfreepayments/cashfree-js" {
  export interface LoadOptions {
    mode: "production" | "sandbox";
  }

  export interface CheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_modal" | "_self" | "_blank";
  }

  export interface CheckoutResult {
    error?: {
      message: string;
      code?: string;
    };
    redirect?: boolean;
    paymentDetails?: {
      paymentMessage: string;
    };
  }

  export interface Cashfree {
    checkout: (options: CheckoutOptions) => Promise<CheckoutResult>;
  }

  export function load(options: LoadOptions): Promise<Cashfree>;
}
