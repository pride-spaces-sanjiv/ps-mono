// import React from "react";
import { useEffect, useMemo, type JSX } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as secureStorage from "@secure-storage/common";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { tokenStore, userStore } from "@/services/store/user";
// import { loginAPI, googleAuthAPI } from "@/services/apis/auth";
import {
  getSelfData as getAdminData,
  loginAdmin,
} from "@/services/apis/admin/auth";
import {
  getSelfData as getOperatorData,
  loginOperator,
} from "@/services/apis/operator/auth";
import {
  adminSchema,
  type AdminSchema,
  // loginSchema,
  // type GoogleAuthSchema,
  // type LoginSchema,
} from "@/utils/schemas/user";
import { operatorSchema, type OperatorSchema } from "@/utils/schemas/operators";
import { reConfigureAuthToken } from "@/utils/axios/configure";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { datifyObjectValues } from "@/utils/object/datify";
import { delayPromise } from "@/utils/promise";
import { queryKeys } from "@/utils/query-keys";
// import ForgotPasswordModal from "../forgot-password";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import GoogleButton from "@/components/buttons/google-btn";
import AuthCard from "@/containers/auth-card";
import { getTokenInfo } from "@/services/apis/general/token";

type LoginSchema = Pick<AdminSchema, "email" | "password">;
const validLoginTypes = ["admin", "operator", "builder"] as const;
const loginTypeAPIsMap = {
  admin: { login: loginAdmin, getSelfData: getAdminData },
  operator: { login: loginOperator, getSelfData: getOperatorData },
  builder: { login: loginOperator, getSelfData: getOperatorData },
} as const;

export default function LoginPage({
  className,
  loginAs = "admin",
  ...props
}: JSX.IntrinsicElements["div"] &
  Partial<{ loginAs: "admin" | "enterprise" }>) {
  const userStoreState = userStore((state) => state);
  const tokenStoreState = tokenStore((state) => state);

  const tokenData = tokenStore((state) => state.value);
  const setTokenData = tokenStore((state) => state.setter);
  const setUserData = userStore((state) => state.setter);
  const setUserLevel = userStore((state) => state.setLevel);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loginAsParam = useMemo(
    () =>
      validLoginTypes.includes(
        (searchParams.get("as")?.toLowerCase().trim() as any) || "admin",
      )
        ? (searchParams.get("as") as (typeof validLoginTypes)[number])
        : "admin",
    [searchParams],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminSchema.pick({ email: true, password: true })),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    data: logged,
    mutateAsync: mutatedLogin,
    isPending: loading,
    isError: errored,
    error: loginError,
    isSuccess: loginFinished,
  } = useMutation({
    mutationFn: (body: LoginSchema) =>
      delayPromise(loginTypeAPIsMap[loginAsParam].login?.({ body: body }), 1),
  });

  // const {
  //   data: googleAuthData,
  //   mutateAsync: mutatedGoogleAuth,
  //   isPending: googleLoading,
  //   isError: googleErrored,
  //   error: googleError,
  //   isSuccess: googleAuthFinished,
  // } = useMutation({
  //   mutationFn: (body: GoogleAuthSchema) =>
  //     delayPromise(googleAuthAPI({ body: body }), 1),
  // });

  const { mutateAsync: mutatedTokenInfo } = useMutation({
    mutationKey: ["token-info"],
    mutationFn: async () => {
      return getTokenInfo().finally(() =>
        userStoreState.increaseTokeInfoFetches(),
      );
    },
    retry: 3,
  });
  const { mutateAsync: mutatedUserData } = useMutation({
    mutationKey: [queryKeys.USERDATA, loginAsParam],
    mutationFn: () =>
      delayPromise(loginTypeAPIsMap[loginAsParam].getSelfData?.(), 0.3),
  });

  const login = async (body: LoginSchema) => {
    try {
      const res = await mutatedLogin(body);
      if (isAxiosError(res)) {
        throw res;
      }

      const data = res.data?.data;
      if (res.status === 200 && res.data?.success && data?.token) {
        const modified = datifyObjectValues(data, ["expiry"]);

        // Save token and reconfigure axios instances
        secureStorage.localStorage.setItem("__aT__", modified);
        const configured = reConfigureAuthToken(
          modified?.token as string,
          modified?.expiry as Date,
        );
        if (!configured) {
          throw new Error("Failed to reconfigure token");
        }
        setTokenData({ ...tokenData, ...modified } as typeof tokenData);

        // Get Token Info to save user level
        const tokenInfoRes = await mutatedTokenInfo();
        const tokenInfoLevel = tokenInfoRes?.data?.data?.level;
        if (tokenInfoRes.status === 200 && tokenInfoLevel) {
          setUserLevel(tokenInfoLevel);

          // Then update user data
          const userRes = await mutatedUserData();
          const userData = userRes.data?.data;
          if (userRes.status === 200 && res.data?.success && userData?.id) {
            const modified = datifyObjectValues(userData, [
              "createdAt",
              "updatedAt",
            ]);
            setUserData(modified);
            toast.success("Login Successful");
            navigate("/dashboard");
            return true;
          }
        }
      }
      throw new Error("Invalid response");
    } catch (err) {
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof loginAdmin>>["data"]
      >(err, [
        {
          status: 400,
          handler: (res) => {
            console.log("Error login parsed :", res?.data);
            if (res?.data?.errorType?.toLowerCase().match(/(incorrect)/)) {
              toast.error(`Incorrect Fields : ${res?.data?.message || ""}`);
              console.log("Something is incorrect");
            }
          },
        },
        {
          status: 404,
          handler: (res) => {
            toast.error(`User Doesn't Exists`);
            console.log("Error login parsed :", res?.data);
          },
        },
      ]);

      if (!handled) {
        toast.error(`Login Failed`);
        console.error("Unhandled login error :", err);
      }
    }
  };

  // const handleGoogleAuth = async (body: GoogleAuthSchema) => {
  //   try {
  //     const res = await mutatedGoogleAuth(body);
  //     if (isAxiosError(res)) {
  //       throw res;
  //     }

  //     const data = res.data?.data;
  //     if (res.status === 200 && res.data?.success && data?.token) {
  //       const modified = datifyObjectValues(data, ["expiry"]);

  //       // Save token and reconfigure axios instances
  //       secureStorage.localStorage.setItem("__aT__", modified);
  //       const configured = reConfigureAuthToken(
  //         modified?.token as string,
  //         modified?.expiry as Date,
  //       );
  //       if (!configured) {
  //         throw new Error("Failed to reconfigure token");
  //       }
  //       setTokenData({ ...tokenData, ...modified } as typeof tokenData);

  //       const userRes = await mutatedUserData();
  //       const userData = userRes.data?.data;
  //       if (userRes.status === 200 && res.data?.success && userData?.id) {
  //         const modified = datifyObjectValues(userData, [
  //           "createdAt",
  //           "updatedAt",
  //           "expiry",
  //           "testExpiry",
  //         ]);
  //         setUserData(modified);
  //         toast.success("Login Successful");
  //         navigate("/dashboard");
  //         return true;
  //       }
  //     }
  //     throw new Error("Invalid response");
  //   } catch (err) {
  //     const handled = handleAxiosErrorCases<
  //       Awaited<ReturnType<typeof loginAPI>>["data"]
  //     >(err, [
  //       {
  //         status: 400,
  //         handler: (res) => {
  //           console.log("Error login parsed :", res?.data);
  //           if (res?.data?.errorType?.toLowerCase().match(/(incorrect)/)) {
  //             toast.error(`Incorrect Fields : ${res?.data?.message || ""}`);
  //             console.log("Something is incorrect");
  //           }
  //         },
  //       },
  //       {
  //         status: 404,
  //         handler: (res) => {
  //           toast.error(`User Doesn't Exists`);
  //           console.log("Error login parsed :", res?.data);
  //         },
  //       },
  //     ]);

  //     if (!handled) {
  //       toast.error(`Login Failed`);
  //       console.error("Unhandled login error :", err);
  //     }
  //   }
  // };

  useEffect(() => {
    searchParams.get("as") &&
      !["admin", "enterprise"].includes(searchParams.get("as") as string) &&
      setSearchParams((prev) => ({ ...prev, as: "admin" }));
  }, [searchParams.toString()]);

  return (
    <AuthCard
      titleProps={{
        children: `Login to your ${loginAsParam === "admin" ? "admin" : "enterprise"} account`,
      }}
      descriptionProps={{
        children: `Enter your details below to login as ${loginAsParam === "admin" ? "admin or team support" : "enterprise"}`,
      }}
    >
      <form onSubmit={handleSubmit(login)}>
        <div className="flex flex-col gap-6">
          <FormField
            label="Email"
            placeholder="username@mail.com"
            required
            error={errors.email}
            {...register("email")}
          />
          <FormField
            inputType="password"
            label="Password"
            required
            error={errors.password}
            {...register("password")}
          />
          {/* <ForgotPasswordModal /> */}
          <div className="flex flex-col gap-3">
            <ActionButton type="submit" className="w-full" loading={loading}>
              Login
            </ActionButton>
            <ActionButton
              type="button"
              className="w-full hidden"
              onClick={() => {
                navigate(
                  "/login?as=" +
                    (loginAsParam === "admin" ? "enterprise" : "admin"),
                );
              }}
              // onError={(err)=>{
              //   console.error()
              // }}
            >
              Login as {loginAsParam === "admin" ? "Enterprise" : "Admin"}
            </ActionButton>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
