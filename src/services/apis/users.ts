import { BASE } from "./config";
// import {
//   loginSchema,
//   resetPasswordSchema,
//   refreshTokenSchema,
//   userSchema,
//   createUserSchema,
// } from "@/utils/schemas/user";
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
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.get<UsersRes>(url, config);
    return res;
  },
});

export const getUserData = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.get<GeneralResponseWithError<User>>(url, config);
    return res;
  },
});

export const createUser = APIBodyValidationWrapper({
  // schema: createUserSchema,
  handle: async (param, config) => {
    const url = "/no-route";
    const res = await BASE.post<GeneralResponseWithError<User>>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

export const updateUser = APIBodyValidationWrapper({
  // schema: userSchema.omit(["underUser", "username", "email", "verified"]),
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.put<GeneralResponseWithError<User>>(
      url,
      param?.body,
      config,
    );
    return res;
  },
});

export const deleteUser = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.delete<GeneralResponseWithError<Pick<User, "id">>>(
      url,
      config,
    );
    return res;
  },
});

export const generateShortLinkForUser = APIBodyValidationWrapper({
  handle: async (param, config) => {
    const url = "/no-route" + queryToString(param?.query);
    const res = await BASE.get<
      GeneralResponseWithError<Partial<{ link: string }>>
    >(url, config);
    return res;
  },
});
