import { BASE } from "./config";
// import {
//   loginSchema,
//   resetPasswordSchema,
//   refreshTokenSchema,
//   googleAuthSchema,
// } from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { GeneralResponseWithError } from "@/types/axios/response";
import type { TokenData } from "../store/user";

type LoginRes = GeneralResponseWithError<Partial<TokenData> | null>;
type LogoutRes = GeneralResponseWithError<Partial<{ id: string }> | null>;

export const loginAPI = APIBodyValidationWrapper({
  // schema: loginSchema,
  handle: async (param, config) => {
    const res = await BASE.post<LoginRes>("/no-route", param?.body, config);
    return res;
  },
});

export const refreshTokenAPI = APIBodyValidationWrapper({
  // schema: refreshTokenSchema,
  handle: async (param, config) => {
    const res = await BASE.post<
      GeneralResponseWithError<Partial<Omit<TokenData, "refreshToken">>>
    >("/no-route", param?.body, config);
    return res;
  },
});

export const googleAuthAPI = APIBodyValidationWrapper({
  // schema: googleAuthSchema,
  handle: async (param, config) => {
    const res = await BASE.post<LoginRes>("/no-route", param?.body, config);
    return res;
  },
});

export const logoutAPI = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await BASE.get<LogoutRes>("/no-route", config);
    return res;
  },
});

export const resetPasswordRequest = APIBodyValidationWrapper({
  // schema: loginSchema.pick(["email"]),
  handle: async (param, config) => {
    const res = await BASE.post<GeneralResponseWithError<any>>(
      "/no-route",
      param?.body,
      config,
    );
    return res;
  },
});
// async (
//   payload: Pick<LoginSchema, "email">,
//   config?: Partial<AxiosRequestConfig>
// ) => {
//   const res = await AUTH.post<LoginRes>(
//     "/reset-password-email",
//     payload,
//     config
//   );
//   return res;
// };

export const verifyResetPasswordToken = APIBodyValidationWrapper({
  // schema: resetPasswordSchema.pick(["token"]),
  handle: async (param, config) => {
    const res = await BASE.post<GeneralResponseWithError<any>>(
      "/no-route",
      param?.body,
      config,
    );
    return res;
  },
});

export const resetPassword = APIBodyValidationWrapper({
  // schema: resetPasswordSchema,
  handle: async (param, config) => {
    const res = await BASE.post<GeneralResponseWithError<any>>(
      "/no-route",
      param?.body,
      config,
    );
    return res;
  },
});
