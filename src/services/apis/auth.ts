import { AUTH } from "./config";
import {
  loginSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  googleAuthSchema,
} from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import type { GeneralResponseWithError } from "@/types/axios/response";
import type { TokenData } from "../store/user";

type LoginRes = GeneralResponseWithError<Partial<TokenData> | null>;
type LogoutRes = GeneralResponseWithError<Partial<{ id: string }> | null>;

export const loginAPI = APIBodyValidationWrapper({
  schema: loginSchema,
  handle: async (param, config) => {
    const res = await AUTH.post<LoginRes>("/login", param?.body, config);
    return res;
  },
});

export const refreshTokenAPI = APIBodyValidationWrapper({
  schema: refreshTokenSchema,
  handle: async (param, config) => {
    const res = await AUTH.post<
      GeneralResponseWithError<Partial<Omit<TokenData, "refreshToken">>>
    >("/re-login", param?.body, config);
    return res;
  },
});

export const googleAuthAPI = APIBodyValidationWrapper({
  schema: googleAuthSchema,
  handle: async (param, config) => {
    const res = await AUTH.post<LoginRes>("/google-auth", param?.body, config);
    return res;
  },
});

export const logoutAPI = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const res = await AUTH.get<LogoutRes>("/logout", config);
    return res;
  },
});

export const resetPasswordRequest = APIBodyValidationWrapper({
  schema: loginSchema.pick(["email"]),
  handle: async (param, config) => {
    const res = await AUTH.post<GeneralResponseWithError<any>>(
      "/reset-password-email",
      param?.body,
      config
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
  schema: resetPasswordSchema.pick(["token"]),
  handle: async (param, config) => {
    const res = await AUTH.post<GeneralResponseWithError<any>>(
      "/validate-reset-password",
      param?.body,
      config
    );
    return res;
  },
});

export const resetPassword = APIBodyValidationWrapper({
  schema: resetPasswordSchema,
  handle: async (param, config) => {
    const res = await AUTH.post<GeneralResponseWithError<any>>(
      "/reset-password",
      param?.body,
      config
    );
    return res;
  },
});
