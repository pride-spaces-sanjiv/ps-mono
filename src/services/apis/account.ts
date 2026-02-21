import { ACCOUNT } from "./config";
import {
  loginSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  userSchema,
} from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
import type { GeneralResponseWithError } from "@/types/axios/response";
import type { User } from "@/types/data/user";

export const getAccountData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/data" + queryToString(param?.query);
    const res = await ACCOUNT.get<GeneralResponseWithError<User>>(url, config);
    return res;
  },
});

export const updateAccountData = APIBodyValidationWrapper({
  schema: userSchema.pick(["name", "password", "phone"]),
  handle: async (param, config) => {
    const url = "/data" + queryToString(param?.query);
    const res = await ACCOUNT.put<GeneralResponseWithError<User>>(
      url,
      param?.body,
      config
    );
    return res;
  },
});

export const generateShortLink = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/generate-short-link" + queryToString(param?.query);
    const res = await ACCOUNT.get<
      GeneralResponseWithError<Partial<{ link: string }>>
    >(url, config);
    return res;
  },
});

export const generateTawkHash = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/generate-tawk-hash" + queryToString(param?.query);
    const res = await ACCOUNT.get<
      GeneralResponseWithError<{
        email: string;
        hash: {
          hex: string;
          base64: string;
        };
        id: string;
      }>
    >(url, config);
    return res;
  },
});
