// import React from "react";
import { useEffect, useState, type JSX } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import * as yup from "yup";
import { toast } from "sonner";
import { tokenStore } from "@/services/store/user";
import { verifyResetPasswordToken, resetPassword } from "@/services/apis/auth";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/utils/schemas/user";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { validateNumber } from "@/utils/number";
import { delayPromise } from "@/utils/promise";
import { deleteFields } from "@/utils/object/field";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import AuthCard from "@/containers/auth-card";
import RotatingLoader from "@/components/loaders/rotating";

export default function ResetPasswordPage({
  className,
  ...props
}: JSX.IntrinsicElements["div"]) {
  const tokenData = tokenStore((state) => state.value);

  const [params] = useSearchParams();
  const token = (params.get("tk") || "").trim();

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(
      resetPasswordSchema.concat(
        yup.object().shape({
          confirmPassword: yup
            .string()
            .required("Confirm Password is required")
            .oneOf([yup.ref("password")], "Confirm password must match"),
        })
      )
    ),
    defaultValues: {
      token: token,
      password: "",
      confirmPassword: "",
    },
  });

  const {
    mutateAsync: mutatedVerification,
    isPending: verifying,
    error: verificationErr,
    isError: verificationErrored,
  } = useMutation({
    mutationKey: ["reset-token-check"],
    mutationFn: (body: Pick<ResetPasswordSchema, "token">) =>
      delayPromise(verifyResetPasswordToken({ body: body }), 1),
  });
  const { mutateAsync: mutatedReset, isPending: loading } = useMutation({
    mutationKey: ["reset-token"],
    mutationFn: (body: ResetPasswordSchema) =>
      delayPromise(resetPassword({ body: body }), 1),
  });

  const [failedVerfRes, setFailVerfRes] = useState<Awaited<
    ReturnType<typeof resetPassword>
  > | null>();

  const handleReset = async (
    body: ResetPasswordSchema & { confirmPassword: string }
  ) => {
    try {
      const cleaned = deleteFields(body, ["confirmPassword"]);
      const res = await mutatedReset(cleaned);
      const data = res.data?.data;
      if (res.status === 200 && res.data?.success) {
        toast.success("Password was changed successfully");
        navigate("/dashboard");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof resetPassword>>["data"]
      >(err, [
        {
          status: 400,
          handler: (res) => {
            if (res?.data?.errorType?.match(/(same)/i)) {
              toast.error("Password matches old one");
              return;
            }
            toast.error(`Failed to reset`);
          },
        },
        {
          status: 404,
          handler: (res) => {
            toast.error(`Token doesn't exists`);
          },
        },
      ]);

      if (!handled) {
        toast.error(`Failed to reset`);
      }
    }
  };

  useEffect(() => {
    mutatedVerification({ token: token })
      .then((res) => {
        if (res.status === 200) {
          toast.success("Token validated");
        }
      })
      .catch((err) => {
        setFailVerfRes(null);
        if (err instanceof yup.ValidationError) {
          toast.error(err.message);
          return;
        }
        const handled = handleAxiosErrorCases<
          Awaited<ReturnType<typeof resetPassword>>["data"]
        >(err, [
          {
            status: 404,
            handler: (res) => {
              toast.error("Token doesn't exists");
              setFailVerfRes(res);
            },
          },
          {
            status: 400,
            handler: (res) => {
              setFailVerfRes(res);
              if (res?.data?.errorType?.match(/invalid/i)) {
                toast.error("Token invalid");
                return;
              }

              toast.error("Token verification failed");
            },
          },
        ]);
        if (!handled) {
          toast.error("Token verification failed");
        }
      });
    reset({ token: token, password: "" });
  }, [token]);

  return verifying ? (
    <div className="flex flex-col items-center justify-center">
      <RotatingLoader size={"2xl"} />
      <p className="text-muted-foreground text-lg font-medium py-3">
        Verifying......
      </p>
    </div>
  ) : verificationErrored ? (
    <div>
      <p className="text-accent-foreground text-lg font-medium py-4">
        {failedVerfRes?.data
          ? failedVerfRes?.data?.errorType?.match(/invalid/i)
            ? "Token was invalid. Please use the one given to you"
            : failedVerfRes?.status === 404
            ? "Token doesn't exists. Please use the one given to you"
            : "Token verification failed. Refresh again to retry or use another"
          : "Token verification failed. Refresh again to retry or use another"}
      </p>
      <ActionButton
        className="mx-auto"
        onClick={() => {
          navigate(
            `/${
              validateNumber(tokenData?.expiry, { invalidValue: 0 }) >
                Date.now() && tokenData?.token
                ? "dashboard"
                : "login"
            }`
          );
        }}
      >
        Go back to{" "}
        {validateNumber(tokenData?.expiry, { invalidValue: 0 }) > Date.now() &&
        tokenData?.token
          ? "Dashboard"
          : "Login"}
      </ActionButton>
    </div>
  ) : (
    <AuthCard
      titleProps={{ children: "Reset Password" }}
      descriptionProps={{
        children: "Enter new password below to change",
      }}
    >
      <form onSubmit={handleSubmit(handleReset)}>
        <div className="flex flex-col gap-6">
          <FormField
            inputType="password"
            label="New Password"
            placeholder="********"
            required
            error={errors.password}
            {...register("password")}
          />
          <FormField
            inputType="password"
            placeholder="********"
            label="Confirm New Password"
            required
            error={errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <div className="flex flex-col gap-3">
            <ActionButton type="submit" className="w-full" loading={loading}>
              Change Password
            </ActionButton>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
