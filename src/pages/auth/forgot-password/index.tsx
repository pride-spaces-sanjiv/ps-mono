// import React from "react";
import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { useMutation } from "@tanstack/react-query";
import * as yup from "yup";
import { toast } from "sonner";
import { DialogClose } from "@/components/ui/dialog";
import { resetPasswordRequest } from "@/services/apis/auth";
import { loginSchema, type LoginSchema } from "@/utils/schemas/user";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { delayPromise } from "@/utils/promise";
import { DialogModal } from "@/components/dialog";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";

export default function ForgotPasswordModal({
  className,
  ...props
}: JSX.IntrinsicElements["div"]) {
  const {
    data: reqData,
    mutateAsync: mutated,
    isPending: loading,
    isError: errored,
    error: reqError,
    isSuccess: reqFinished,
  } = useMutation({
    mutationKey: ["reset-req"],
    mutationFn: (body: Pick<LoginSchema, "email">) =>
      delayPromise(resetPasswordRequest({ body: body }), 1),
  });

  const [email, setEmail] = useState("");
  const emailError = useMemo(() => {
    try {
      loginSchema.pick(["email"]).validateSync({ email: email });
      return null;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const obj = { message: err.message };
        return obj;
      }
      return null;
    }
  }, [email]);
  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const handleResetReq = async (body: Pick<LoginSchema, "email">) => {
    try {
      const res = await mutated(body);
      const data = res.data?.data;

      if (res.status === 200 && res.data?.success) {
        dialogRef.current?.click();
        setEmail("");
        toast.success("Reset request has been sent. Check your email!");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof resetPasswordRequest>>["data"]
      >(err, [
        {
          status: 400,
          handler: (res) => {
            // console.log("Error login parsed :", res?.data);
            toast.error(`Failed to request`);
            if (res?.data?.errorType?.toLowerCase().match(/(incorrect)/)) {
              console.log("Something is incorrect");
            }
          },
        },
        {
          status: 404,
          handler: (res) => {
            toast.error(`Email doesn't exists`);
            // console.log("Error login parsed :", res?.data);
          },
        },
      ]);

      if (!handled) {
        toast.error(`Failed to request`);
        // console.error("Unhandled login error :", err);
      }
    }
  };

  return (
    <DialogModal
      triggerProps={{
        children: (
          <ActionButton
            variant={"link"}
            className="text-accent-foreground text-sm"
          >
            Forgot your password?
          </ActionButton>
        ),
      }}
      titleProps={{ children: "Request password change" }}
      descriptionProps={{
        children: "We will send an email to you to change your password",
      }}
      footerProps={{ children: <DialogClose ref={dialogRef} /> }}
    >
      <div className="flex flex-col gap-6">
        <FormField
          label="Email"
          placeholder="username@mail.com"
          required
          // @ts-ignore
          error={emailError}
          onChange={(e) => {
            setEmail(e.currentTarget.value?.trim().toLowerCase());
          }}
        />
        <div className="flex flex-col gap-3">
          <ActionButton
            type="button"
            className="w-full"
            loading={loading}
            onClick={() => {
              if (!emailError) {
                handleResetReq({ email: email });
                return;
              }
              setEmail(email);
            }}
          >
            Send Request
          </ActionButton>
        </div>
      </div>
    </DialogModal>
  );
}
