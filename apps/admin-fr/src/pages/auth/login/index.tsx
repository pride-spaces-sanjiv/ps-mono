import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as secureStorage from "@secure-storage/common";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { tokenStore, userStore } from "@/services/store/user";
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
} from "@/utils/schemas/user";
import { reConfigureAuthToken } from "@/utils/axios/configure";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { datifyObjectValues } from "@/utils/object/datify";
import { delayPromise } from "@/utils/promise";
import { queryKeys } from "@/utils/query-keys";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import { getTokenInfo } from "@/services/apis/general/token";
import { cn } from "@/utils/className";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Globe,
  Building2,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

type LoginSchema = Pick<AdminSchema, "email" | "password">;

const validLoginTypes = [
  {
    value: "admin",
    label: "Pride Team",
    icon: ShieldCheck,
    description: "System administration",
    accentColor: "from-blue-600 to-indigo-600",
    themeClass: "theme-admin",
  },
  {
    value: "operator",
    label: "Space Partner",
    icon: Globe,
    description: "Space operators control panel",
    accentColor: "from-teal-600 to-emerald-600",
    themeClass: "theme-operator",
  },
  {
    value: "builder",
    label: "Conventional Partner",
    icon: Building2,
    description: "Conventional real-estate builders",
    accentColor: "from-orange-500 to-amber-600",
    themeClass: "theme-builder",
  },
  {
    value: "channel",
    label: "Channel Partner",
    icon: Sparkles,
    description: "Distributors and listing managers",
    accentColor: "from-violet-600 to-fuchsia-600",
    themeClass: "theme-channel",
  },
] as const;

const brandDetails: Record<
  string,
  { title: string; subtitle: string; highlight: string; features: string[] }
> = {
  admin: {
    title: "System Operations Dashboard",
    subtitle: "Enterprise-grade space operations control panel. Manage, monitor, and secure the Pride Spaces platform.",
    highlight: "Pride Team",
    features: [
      "Real-time cluster & node monitoring",
      "Global access & permissions management",
      "Security compliance & audit logs",
    ],
  },
  operator: {
    title: "Scale Your Co-Working Business",
    subtitle: "Empowering operators to publish, scale, and manage shared office spaces with ease.",
    highlight: "Space Partner",
    features: [
      "Automated reservation scheduling",
      "Visitor check-ins & workspace logs",
      "Real-time utilization analytics",
    ],
  },
  builder: {
    title: "Optimize Commercial Leasing",
    subtitle: "Streamlined solutions for conventional buildings, lease tracking, and commercial spaces.",
    highlight: "Conventional Partner",
    features: [
      "Interactive building floor plan viewer",
      "Tenant invoicing & contract workflows",
      "Yield-per-sqft optimization",
    ],
  },
  channel: {
    title: "Accelerate Brokerage Revenue",
    subtitle: "Distribute inventories to wider audiences, sync listing states, and maximize occupancy rates.",
    highlight: "Channel Partner",
    features: [
      "Dynamic pricing sync integration",
      "Automated lead referral tracking",
      "Instant commission status",
    ],
  },
};

const loginTypeAPIsMap = {
  admin: { login: loginAdmin, getSelfData: getAdminData },
  operator: { login: loginOperator, getSelfData: getOperatorData },
  builder: { login: loginOperator, getSelfData: getOperatorData },
  channel: { login: loginOperator, getSelfData: getOperatorData },
} as const;

export default function LoginPage() {
  const userStoreState = userStore((state) => state);
  const tokenStoreState = tokenStore((state) => state);

  const tokenData = tokenStore((state) => state.value);
  const setTokenData = tokenStore((state) => state.setter);
  const setUserData = userStore((state) => state.setter);
  const setUserLevel = userStore((state) => state.setLevel);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const loginAsParam = useMemo(() => {
    const value = searchParams.get("as")?.toLowerCase().trim() || "admin";
    return (
      validLoginTypes.find((item) => item.value === value)?.value || "admin"
    );
  }, [searchParams]);

  const activeThemeClass = useMemo(() => {
    return (
      validLoginTypes.find((t) => t.value === loginAsParam)?.themeClass ||
      "theme-admin"
    );
  }, [loginAsParam]);

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
    mutateAsync: mutatedLogin,
    isPending: loading,
  } = useMutation({
    mutationFn: (body: LoginSchema) =>
      delayPromise(loginTypeAPIsMap[loginAsParam].login?.({ body: body }), 1),
  });

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

        secureStorage.localStorage.setItem("__aT__", modified);
        const configured = reConfigureAuthToken(
          modified?.token as string,
          modified?.expiry as Date,
        );
        if (!configured) {
          throw new Error("Failed to reconfigure token");
        }
        setTokenData({ ...tokenData, ...modified } as typeof tokenData);

        const tokenInfoRes = await mutatedTokenInfo();
        const tokenInfoLevel = tokenInfoRes?.data?.data?.level;
        if (tokenInfoRes.status === 200 && tokenInfoLevel) {
          setUserLevel(tokenInfoLevel);

          const userRes = await mutatedUserData();
          const userData = userRes.data?.data;
          if (userRes.status === 200 && res.data?.success && userData?.id) {
            const modified = datifyObjectValues(userData, [
              "createdAt",
              "updatedAt",
            ]);

            setUserData(modified);
            toast.success("Login Successful");
            navigate(loginAsParam === "operator" ? "/partner" : "/dashboard");
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
            if (res?.data?.errorType?.toLowerCase().match(/(incorrect)/)) {
              toast.error(`Incorrect Fields : ${res?.data?.message || ""}`);
            }
          },
        },
        {
          status: 404,
          handler: () => {
            toast.error(`User Doesn't Exists`);
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
  const brand = brandDetails[loginAsParam] || brandDetails.admin;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-500">
      
      {/* Background glowing gradients changing with themes */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-50">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full blur-[160px] transition-colors duration-1000",
            loginAsParam === "admin" && "bg-blue-500/20",
            loginAsParam === "operator" && "bg-teal-400/20",
            loginAsParam === "builder" && "bg-amber-500/10",
            loginAsParam === "channel" && "bg-violet-500/20"
          )}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute -bottom-40 right-10 h-[500px] w-[500px] rounded-full blur-[140px] transition-colors duration-1000",
            loginAsParam === "admin" && "bg-indigo-500/20",
            loginAsParam === "operator" && "bg-emerald-400/25",
            loginAsParam === "builder" && "bg-orange-500/15",
            loginAsParam === "channel" && "bg-fuchsia-500/20"
          )}
        />
      </div>

      {/* Grid container */}
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Brand visual panel (Left side) */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-12 border-r border-border/40 overflow-hidden bg-card/10 backdrop-blur-[4px]">
          
          {/* Logo or Title */}
          <div className="z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <span className="text-xl font-black">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Pride Spaces</span>
          </div>

          {/* Dynamic Brand Content */}
          <div className="z-10 my-auto max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={loginAsParam}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary capitalize">
                    {loginAsParam === "admin" && <ShieldCheck className="size-3.5" />}
                    {loginAsParam === "operator" && <Globe className="size-3.5" />}
                    {loginAsParam === "builder" && <Building2 className="size-3.5" />}
                    {loginAsParam === "channel" && <Sparkles className="size-3.5" />}
                    {brand.highlight}
                  </span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-card-foreground">
                  {brand.title}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {brand.subtitle}
                </p>

                {/* Bullet Points */}
                <div className="mt-4 flex flex-col gap-3.5">
                  {brand.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-card-foreground/80">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ArrowRight className="size-3" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer inside Brand Column */}
          <div className="z-10 flex justify-between text-xs text-muted-foreground/60">
            <span>© 2026 Pride Spaces Inc.</span>
            <div className="flex gap-4">
              <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
              <a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</a>
            </div>
          </div>
        </div>

        {/* Login credentials panel (Right side) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 overflow-y-auto">
          
          {/* Logo visible only on mobile/tablet */}
          <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <span className="text-lg font-bold">P</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Pride Spaces</span>
          </div>

          <div className="w-full max-w-[460px] flex flex-col gap-8">
            
            {/* Header text */}
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-extrabold tracking-tight">
                Sign In
              </h2>
              <p className="text-sm text-muted-foreground">
                Select your account portal below to access the panel.
              </p>
            </div>

            {/* Custom Modern Category Tabs */}
            <div className="flex flex-col gap-3">
              {/* Parent Category Tabs (Box Tiles) */}
              <div className="grid grid-cols-3 gap-3 bg-muted/40 p-1.5 rounded-2xl border border-border/20">
                {/* Pride Team */}
                <button
                  type="button"
                  onClick={() => setSearchParams({ as: "admin" })}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 rounded-xl p-3 text-center transition-all cursor-pointer",
                    loginAsParam === "admin"
                      ? "bg-card text-card-foreground shadow-md border border-border/30 font-semibold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      "size-5 transition-transform duration-300",
                      loginAsParam === "admin" ? "text-primary scale-110" : ""
                    )}
                  />
                  <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
                    Pride Team
                  </span>
                  {loginAsParam === "admin" && (
                    <motion.div
                      layoutId="activeTopTabGlow"
                      className="absolute -bottom-1 left-1/4 right-1/4 h-[2px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>

                {/* Spaces (Parent Category) */}
                <button
                  type="button"
                  onClick={() => {
                    if (loginAsParam !== "operator" && loginAsParam !== "builder") {
                      setSearchParams({ as: "operator" });
                    }
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 rounded-xl p-3 text-center transition-all cursor-pointer",
                    (loginAsParam === "operator" || loginAsParam === "builder")
                      ? "bg-card text-card-foreground shadow-md border border-border/30 font-semibold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  <Building2
                    className={cn(
                      "size-5 transition-transform duration-300",
                      (loginAsParam === "operator" || loginAsParam === "builder")
                        ? "text-primary scale-110"
                        : ""
                    )}
                  />
                  <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
                    Spaces
                  </span>
                  {(loginAsParam === "operator" || loginAsParam === "builder") && (
                    <motion.div
                      layoutId="activeTopTabGlow"
                      className="absolute -bottom-1 left-1/4 right-1/4 h-[2px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>

                {/* Channel Partner */}
                <button
                  type="button"
                  onClick={() => setSearchParams({ as: "channel" })}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 rounded-xl p-3 text-center transition-all cursor-pointer",
                    loginAsParam === "channel"
                      ? "bg-card text-card-foreground shadow-md border border-border/30 font-semibold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  <Sparkles
                    className={cn(
                      "size-5 transition-transform duration-300",
                      loginAsParam === "channel" ? "text-primary scale-110" : ""
                    )}
                  />
                  <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
                    Channel Partner
                  </span>
                  {loginAsParam === "channel" && (
                    <motion.div
                      layoutId="activeTopTabGlow"
                      className="absolute -bottom-1 left-1/4 right-1/4 h-[2px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* Sub-tab Toggler for Spaces (Covers full form width) */}
              <AnimatePresence mode="wait">
                {(loginAsParam === "operator" || loginAsParam === "builder") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full overflow-hidden"
                  >
                    <div className="w-full grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-muted/60 border border-border/30">
                      <button
                        type="button"
                        onClick={() => setSearchParams({ as: "operator" })}
                        className={cn(
                          "relative flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all cursor-pointer w-full text-center",
                          loginAsParam === "operator"
                            ? "bg-background text-foreground shadow-sm font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Globe className={cn("size-3.5", loginAsParam === "operator" && "text-primary")} />
                        <span>Space Partner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSearchParams({ as: "builder" })}
                        className={cn(
                          "relative flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-all cursor-pointer w-full text-center",
                          loginAsParam === "builder"
                            ? "bg-background text-foreground shadow-sm font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Building2 className={cn("size-3.5", loginAsParam === "builder" && "text-primary")} />
                        <span>Conventional Partner</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(login)} className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-5">
                <div className="relative">
                  <FormField
                    label="Business Email"
                    placeholder="name@pridespaces.com"
                    required
                    error={errors.email}
                    {...register("email")}
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-[41px] size-4.5 text-muted-foreground" />
                </div>

                <div className="relative">
                  <FormField
                    inputType="password"
                    label="Password"
                    placeholder="••••••••••••"
                    required
                    error={errors.password}
                    {...register("password")}
                    className="pl-10"
                  />
                  <Lock className="absolute left-3 top-[41px] size-4.5 text-muted-foreground" />
                </div>
              </div>

              {/* Submit Action */}
              <ActionButton
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-md bg-primary text-primary-foreground hover:opacity-95 transition-all mt-2"
                loading={loading}
              >
                {loginAsParam === "operator" ? "Register Operator" : "Sign In"}
              </ActionButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
