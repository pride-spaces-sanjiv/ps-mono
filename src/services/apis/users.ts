import { USERS } from "./config";
import {
  loginSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  userSchema,
  createUserSchema,
} from "@/utils/schemas/user";
import { APIBodyValidationWrapper } from "@/utils/axios/wrappers";
import { queryToString } from "@/utils/axios/query";
import type {
  GeneralResponseWithError,
  PaginatedResponse,
} from "@/types/axios/response";
import type { User } from "@/types/data/user";

type UsersRes = GeneralResponseWithError<
  PaginatedResponse<Partial<{ results: User[] }>>
>;

export const getUsers = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/list" + queryToString(param?.query);
    const res = await USERS.get<UsersRes>(url, config);
    return res;
  },
});

export const getUserData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/data" + queryToString(param?.query);
    const res = await USERS.get<GeneralResponseWithError<User>>(url, config);
    return res;
  },
});

export const createUser = APIBodyValidationWrapper({
  schema: createUserSchema,
  handle: async (param, config) => {
    const url = "/data";
    const res = await USERS.post<GeneralResponseWithError<User>>(
      url,
      param?.body,
      config
    );
    return res;
  },
});

export const updateUser = APIBodyValidationWrapper({
  schema: userSchema.omit(["underUser", "username", "email", "verified"]),
  handle: async (param, config) => {
    const url = "/data" + queryToString(param?.query);
    const res = await USERS.put<GeneralResponseWithError<User>>(
      url,
      param?.body,
      config
    );
    return res;
  },
});

export const deleteUser = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/data" + queryToString(param?.query);
    const res = await USERS.delete<GeneralResponseWithError<Pick<User, "id">>>(
      url,
      config
    );
    return res;
  },
});

export const generateShortLinkForUser = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/generate-short-link" + queryToString(param?.query);
    const res = await USERS.get<
      GeneralResponseWithError<Partial<{ link: string }>>
    >(url, config);
    return res;
  },
});
