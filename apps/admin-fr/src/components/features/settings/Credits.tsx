import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { userStore } from "@/services/store/user";
import { cashfree } from "@/services/payments/instance";
import { createOrder, checkOrder } from "@/services/apis/orders";
import {
  createOrderSchema,
  type CheckOrderSchema,
  type CreateOrderSchema,
} from "@/utils/schemas/order";
import { validateNumber } from "@/utils/number";
import { sleep } from "@/utils/time/sleep";
import { queryKeys } from "@/utils/query-keys";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import {
  type CheckoutOptions,
  type CheckoutResult,
} from "@cashfreepayments/cashfree-js";

// Res success
const ex = {
  success: {
    paymentDetails: {
      paymentMessage: "Payment finished. Check status.",
    },
  },
  error: {},
};

const CreditsBillingTab = () => {
  const userStoreState = userStore((state) => state);
  const userData = userStoreState.value;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ resolver: yupResolver(createOrderSchema) });

  const availableCredits = validateNumber(userData?.credits, {
    invalidValue: 0,
  });

  const {
    isPending,
    data: orderRes,
    error: orderError,
    mutateAsync: orderMutater,
  } = useMutation({
    mutationKey: [queryKeys.CREDITS, userData?.id],
    mutationFn: (body: CreateOrderSchema) => createOrder({ body: body }),
  });
  const {
    isPending: checking,
    data: checkRes,
    error: checkError,
    mutateAsync: checkMutater,
  } = useMutation({
    mutationKey: [queryKeys.CREDITS, "check", userData?.id],
    mutationFn: (body: CheckOrderSchema) => checkOrder({ body: body }),
    retryDelay: 2000,
    retry: (times) => times < 10,
  });

  // const credits = watch("credits");

  const handleTopUp = async (body: CreateOrderSchema) => {
    try {
      const res = await orderMutater(body);
      const data = res.data?.data;
      if (
        res.status === 200 &&
        data?.sessionId?.trim() &&
        data?.orderId?.trim()
      ) {
        const checkoutOptions: CheckoutOptions = {
          paymentSessionId: data.sessionId,
          redirectTarget: "_modal",
        };
        const checkoutRes = await cashfree.checkout(checkoutOptions);
        console.log("Checkout data", checkoutRes);

        // Post check
        for (let i = 0; i < 10; i++) {
          try {
            const checkRes = await checkMutater({
              amount: body.credits * 1,
              sessionId: data.sessionId,
              orderId: data.orderId,
            });
            if (
              checkRes.status === 200 &&
              checkRes.data?.data.paymentStatus === "PAID"
            ) {
              userStoreState.setter({
                ...userStoreState.value,
                credits: availableCredits + body.credits,
              } as typeof userStoreState.value);
              toast.success("Payment successful");
              return;
            }
          } catch (err) {}
          await sleep(1);
        }
      }
    } catch (err) {
      console.error("Payment error :", err);
      toast.error("Payment Failed");
    }
  };

  return (
    <TabsContent value="credits" className="mt-0 w-full">
      <Card>
        <CardHeader>
          <CardTitle>Credits & Billing</CardTitle>
          <CardDescription>
            Manage your credits and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="border-2 border-primary w-max">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {availableCredits.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
            </CardContent>
          </Card>

          <Separator />

          <form className="space-y-4" onSubmit={handleSubmit(handleTopUp)}>
            <FormField
              label={
                <>
                  Top Up Amount <span className="text-gray-500">(min 10)</span>
                </>
              }
              required
              placeholder="Enter amount to top up"
              type="number"
              min={10}
              max={2000}
              inputMode="numeric"
              className="max-w-[200px]"
              {...register("credits")}
              error={errors.credits}
            />

            <ActionButton
              type="submit"
              className="w-fit"
              loading={isPending || checking}
            >
              {"Proceed to Pay"}
            </ActionButton>
          </form>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default CreditsBillingTab;
