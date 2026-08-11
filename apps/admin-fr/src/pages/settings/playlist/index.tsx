import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import moment from "moment";
import { ValidationError } from "yup";
import { TabsContent } from "@/components/ui/tabs";
import {
  CardHeader,
  Card,
  CardDescription,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Link, ExternalLink, CircleDollarSign } from "lucide-react";
import { useUser } from "@/services/hooks/use-user";
import { cashfree } from "@/services/payments/instance";
import { updateAccountData, generateShortLink } from "@/services/apis/account";
import { checkOrder, createOrderUser } from "@/services/apis/orders";
import {
  extendUserPlaylistSchema,
  userSchema,
  type UserSchema,
} from "@/utils/schemas/user";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { validateNumber } from "@/utils/number";
import { pickFields } from "@/utils/object/field";
import { cn } from "@/utils/cn";
import { delayPromise } from "@/utils/promise";
import { sleep } from "@/utils/time/sleep";
import { queryKeys } from "@/utils/query-keys";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import { DialogModal } from "@/components/dialog";
import PaymentProcessingLoader from "@/components/loaders/payment";
// types
import type {
  CheckOrderSchema,
  CreateOrderSchema,
} from "@/utils/schemas/order";
import type { DatifiedUser } from "@/types/data/user";
import type { AxiosError } from "axios";
import type { CheckoutOptions } from "@cashfreepayments/cashfree-js";

type ExtendPlaylistFormProps = {
  userData: DatifiedUser | null;
  userStoreState: ReturnType<typeof useUser>["userStoreState"];
  onCheck: (res: Awaited<ReturnType<typeof checkOrder>>) => any;
  onCheckStart: () => any;
  onCheckEnd: () => any;
  onCheckFailed: (res: Error | AxiosError) => any;
  onLoadingAPIs: (
    state: Record<"creating" | "checking" | "processed", boolean>
  ) => any;
  onProcessComplete: (success: boolean) => any;
  onProcessStateReset: () => any;
};

const ExtendPlaylistForm = ({
  userData,
  userStoreState,
  onLoadingAPIs,
  onProcessComplete,
  onProcessStateReset,
  onCheckStart,
  onCheckEnd,
}: Partial<ExtendPlaylistFormProps>) => {
  const [months, setMonths] = useState(1);
  const [err, setErr] = useState("");
  const [processed, setProcessed] = useState(false);

  const { isPending: creating, mutateAsync: orderMutater } = useMutation({
    mutationKey: [queryKeys.USERDATA, "expiry-order-create", userData?.id],
    mutationFn: (body: CreateOrderSchema) => createOrderUser({ body: body }),
  });
  const { isPending: checking, mutateAsync: checkMutater } = useMutation({
    mutationKey: [queryKeys.USERDATA, "expiry-order-check", userData?.id],
    mutationFn: (body: CheckOrderSchema) => checkOrder({ body: body }),
    retryDelay: 2000,
    retry: (times) => times < 10,
  });

  const handleExtend = async () => {
    let status: "success" | "failed" = "failed";
    try {
      if (err) {
        throw new Error(err, { cause: "validation-error" });
      }
      const res = await orderMutater({ credits: months });
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
        onCheckStart?.();
        for (let i = 0; i < 10; i++) {
          try {
            const checkRes = await checkMutater({
              amount: months * 1,
              sessionId: data.sessionId,
              orderId: data.orderId,
            });
            if (
              checkRes.status === 200 &&
              checkRes.data?.data.paymentStatus === "PAID"
            ) {
              userStoreState?.setter({
                ...userStoreState?.value,
                expiry: moment(
                  new Date(
                    Math.max(userData?.expiry?.getTime() || 0, Date.now())
                  )
                )
                  .add(months, "months")
                  .toDate(),
              } as typeof userStoreState.value);
              status = "success";
              toast.success("Payment successful");
              return;
            }
          } catch (err) {
            toast.error("Payment failed");
            console.error("Error payment status for extending playlist :", err);
          }
          await sleep(1);
        }
        onCheckEnd?.();
        return;
      }
      throw new Error("Response error");
    } catch (err: any) {
      toast.error("Something failed. Try again");
      console.error("Error extending playlist :", err);
    } finally {
      setProcessed(true);
      onProcessComplete?.(status === "success");
      await sleep(5);
      setProcessed(false);
      onProcessStateReset?.();
    }
  };

  useEffect(() => {
    try {
      extendUserPlaylistSchema.validateSync({ credits: months });
      setErr("");
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setErr(err.inner.find((er) => er.message)?.message || err.message);
      }
      setErr("");
    }
  }, [months]);

  useEffect(() => {
    onLoadingAPIs?.({ creating, checking, processed });
  }, [creating, checking, processed]);

  return (
    <div className="flex flex-col gap-3">
      <FormField
        label={"Select No of Months"}
        type="number"
        defaultValue={1}
        min={1}
        max={24}
        onChange={(e) => {
          const val = Number(e.currentTarget.value);
          setMonths(val);
        }}
        error={{ message: err, type: "validate" }}
      />
      <ActionButton
        type="button"
        className="w-fit"
        onClick={() => handleExtend()}
        loading={checking || creating}
      >
        <div className="flex gap-2 items-center">
          Proceed to Pay
          <CircleDollarSign />
        </div>
      </ActionButton>
    </div>
  );
};

export default function SettingsPlaylistInfo() {
  const { userData, userLevel, userStoreState } = useUser();

  const { mutateAsync: updateMutater, isPending: updateLoading } = useMutation({
    mutationKey: [queryKeys.USERDATA, "self", "update"],
    mutationFn: (
      body: NonNullable<
        NonNullable<Parameters<typeof updateAccountData>[0]>["body"]
      >
    ) =>
      delayPromise(
        updateAccountData({ query: { id: userData?.id }, body: body }),
        1
      ),
  });

  const { mutateAsync: shortLinkMutater, isPending: shortLinkLoading } =
    useMutation({
      mutationKey: ["short-link"],
      mutationFn: () => generateShortLink(),
    });

  const {
    reset,
    register,
    formState: { errors, defaultValues },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(userSchema),
  });

  const handleUpdate = async (body: UserSchema) => {
    try {
      const cleaned = pickFields({ ...body, phone: body.phone }, [
        "name",
        "password",
        "phone",
      ]);
      console.log("Body", cleaned);
      const res = await updateMutater(cleaned);
      if (res.status === 200 && res?.data?.data?.id === userData?.id) {
        reset({ ...defaultValues, ...cleaned });
        userStoreState.setter({
          ...userStoreState.value,
          ...cleaned,
        } as typeof userData);
        console.log("Updated user profile");
        toast.success("Updated profile");

        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases(err, []);
      console.error("Update profile failed:", err);
      toast.error("Failed to update");
    }
  };

  const shortLinkGeneration = async () => {
    try {
      const res = await shortLinkMutater();
      const data = res.data?.data;
      if (res.status === 200 && data?.link?.trim()) {
        // @ts-ignore
        userStoreState.setter({
          ...userStoreState.value,
          shortLink: data.link.trim(),
        });
        toast.success("Short Link generated");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof generateShortLink>>["data"]
      >(err, [
        {
          status: 400,
          handler: (res) => {
            toast.error("Failed to generate short link");
          },
        },
        {
          status: 404,
          handler: (res) => {
            toast.error("No such user exists");
          },
        },
        {
          status: 401,
          handler: (res) => {
            toast.error("You cannot generate short link");
          },
        },
      ]);
      console.error("Short link generation failed :", err);
      !handled && toast.error("Failed to generate short link");
    }
  };

  const [now, setNow] = useState(moment());
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed">();
  const [orderLoadState, setOrderLoadState] = useState<
    Parameters<ExtendPlaylistFormProps["onLoadingAPIs"]>[0]
  >({ checking: false, creating: false, processed: false });

  const expiry = useMemo(
    () =>
      moment(
        Math.max(
          ...[
            userData?.expiry?.getTime(),
            userData?.testExpiry?.getTime(),
            0,
          ].filter((v) => typeof v === "number")
        ) || moment().subtract(1, "h")
      ),
    [userData?.expiry]
  );
  const expiryDuration = useMemo(() => {
    const dur = moment.duration(expiry.diff(now));
    return {
      days: Math.max(Math.round(dur.asDays()), 0),
      hours: Math.max(Math.round(dur.hours()), 0),
      minutes: Math.max(Math.round(dur.minutes()), 0),
      seconds: Math.max(Math.round(dur.seconds()), 0),
    };
  }, [now, expiry]);

  const isTestPeriod = useMemo(
    () => (userData?.testExpiry?.getTime() || 0) >= Date.now(),
    [userData?.testExpiry]
  );
  const [testPulse, setTestPulse] = useState(false);

  useEffect(() => {
    reset?.({ ...userData });
  }, [userData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(moment());
    }, 1000);
    const pulseTimer = setInterval(() => {
      setTestPulse((prev) => !prev);
    }, 700);
    return () => {
      clearInterval(timer);
      clearInterval(pulseTimer);
    };
  }, []);

  return (
    <TabsContent value="playlist" className="mt-0">
      <Card>
        <div className="flex gap-3">
          <CardHeader className="w-full">
            <CardTitle>Playlist Settings</CardTitle>
            <CardDescription>
              Extend your playlist expiry, copy playlist link and generate short
              link.
            </CardDescription>
          </CardHeader>
          {isTestPeriod && (
            <div
              className={cn(
                "bg-amber-400 px-5 py-3 rounded-lg text-xl font-bold mr-5 h-fit transition-all ease-in-out duration-500",
                testPulse
                  ? "shadow-lg shadow-amber-400/50 scale-100"
                  : "scale-90"
              )}
            >
              Trial
            </div>
          )}
        </div>
        <CardContent className="space-y-6">
          {orderLoadState.checking ||
          orderLoadState.creating ||
          orderLoadState.processed ? (
            <PaymentProcessingLoader
              initialPaused
              status={{
                success: paymentStatus === "success",
                failed: paymentStatus === "failed",
              }}
              pause={!orderLoadState.checking && !orderLoadState.processed}
            />
          ) : (
            <form
              className="rounded-md border px-3 py-4 auto-form-grid"
              onSubmit={handleSubmit(handleUpdate)}
            >
              <FormField
                label={"Playlist Username"}
                disabled
                readOnly
                {...register("username")}
                error={errors.username}
              />

              <FormField
                required
                inputType="password"
                label={"Playlist Password"}
                placeholder="••••••••"
                {...register("password")}
                error={errors.password}
              />

              <FormField
                className={cn(
                  "max-w-[150px] shadow-lg/70",
                  userData?.isActive
                    ? "bg-green-500 shadow-green-500/50"
                    : "bg-red-500 shadow-red-500/50"
                )}
                label={"Account Status"}
                readOnly
                value={userData?.isActive ? "ACTIVE" : "INACTIVE"}
              />

              <FormField
                className={cn(
                  "",
                  expiry.diff(now, "days") <= 1
                    ? "border-transparent shadow-lg/70 bg-red-500 shadow-red-500/50"
                    : expiry.diff(now, "days") <= 10
                    ? "border-transparent shadow-lg/70 bg-orange-400 shadow-orange-400/50"
                    : ""
                )}
                label={`Playlist Will Expire In
                `}
                value={
                  expiry.diff(now, "seconds") >= 1
                    ? `${expiryDuration.days}D ${
                        expiryDuration.hours || ""
                      }HRS ${expiryDuration.minutes || ""}MIN ${
                        expiryDuration.seconds || ""
                      }SEC`
                    : "EXPIRED"
                }
                readOnly
              />

              {!!(userData?.username?.trim() && userData?.password?.trim()) && (
                <div className="col-span-full flex gap-2 flex-wrap items-center pt-3">
                  <DialogModal
                    triggerProps={{
                      children: (
                        <ActionButton variant={"secondary"}>
                          Extend Playlist
                        </ActionButton>
                      ),
                    }}
                    // contentProps={{
                    //   onInteractOutside: (e) => {
                    //     e.preventDefault();
                    //   },
                    //   onEscapeKeyDown: (e) => {
                    //     e.preventDefault();
                    //   },
                    // }}
                    titleProps={{ children: "Extend Playlist" }}
                    descriptionProps={{
                      children:
                        "You can extend your playlist by selecting months to expire.",
                    }}
                  >
                    <ExtendPlaylistForm
                      userData={userData}
                      userStoreState={userStoreState}
                      onLoadingAPIs={(state) => {
                        console.log("Payment State :", state);
                        setOrderLoadState(state);
                      }}
                      onProcessComplete={(success) => {
                        console.log("Process complete :", success);
                        setPaymentStatus(success ? "success" : "failed");
                      }}
                      onProcessStateReset={async () => {
                        await sleep(2);
                        console.log("Process state reset");
                        setOrderLoadState({
                          creating: false,
                          checking: false,
                          processed: false,
                        });
                        setPaymentStatus(undefined);
                      }}
                      onCheckStart={() => {
                        console.log("Payment check started");
                        setOrderLoadState((prev) => ({
                          ...prev,
                          checking: true,
                        }));
                      }}
                    />
                  </DialogModal>
                  <ActionButton
                    type="button"
                    className="w-fit bg-green-500 hover:bg-green-500 hover:opacity-90"
                    onClick={async () => {
                      try {
                        const url = `${
                          import.meta.env.VITE_PLAYLIST_BASE
                        }/playlist.m3u?user=${userData?.username?.trim()}&pass=${userData?.password?.trim()}`;
                        await navigator.clipboard.writeText(url);
                        toast.info("Copied Playlist Link");
                      } catch (err: any) {
                        toast.info("Copying Playlist Link failed");
                      }
                    }}
                  >
                    <div className="flex gap-2 items-center">
                      Copy Playlist
                      <Link />
                    </div>
                  </ActionButton>
                  {userData?.shortLink?.trim() && (
                    <ActionButton
                      type="button"
                      className="w-fit bg-green-500 hover:bg-green-500 hover:opacity-90"
                      onClick={async () => {
                        try {
                          const url = userData.shortLink as string;
                          await navigator.clipboard.writeText(url);
                          toast.info("Copied Short Link");
                        } catch (err: any) {
                          toast.info("Copying Short Link failed");
                        }
                      }}
                    >
                      <div className="flex gap-2 items-center">
                        Copy Short Link
                        <Link />
                      </div>
                    </ActionButton>
                  )}
                  <ActionButton
                    type="button"
                    className="w-fit bg-blue-500 hover:bg-blue-500 hover:opacity-90"
                    loading={shortLinkLoading}
                    onClick={shortLinkGeneration}
                  >
                    <div className="flex gap-2 items-center">
                      Generate Short Link
                      <ExternalLink />
                    </div>
                  </ActionButton>
                </div>
              )}

              <div className="flex gap-2 pt-4 col-span-full max-[500px]:flex-wrap">
                <ActionButton
                  type="submit"
                  loading={updateLoading}
                  className="w-fit max-[500px]:w-full"
                >
                  Save Changes
                </ActionButton>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
