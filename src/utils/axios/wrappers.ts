import {
  isAxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import * as yup from "yup";
import { z } from "zod";
import { queryToString } from "./query";

type HandleParams<
  T extends Record<string, any> | FormData = Record<string, any>,
  Q extends Parameters<typeof queryToString>[0] = {},
> = {
  query?: Q | null | undefined;
  // @ts-ignore
  body?: z.infer<z.ZodObject<T>> | null | undefined;
  url?: string;
};

export const APIBodyValidationWrapper = <
  R extends any = any,
  T extends Record<string, any> | FormData = Record<string, any>,
  Q extends Parameters<typeof queryToString>[0] = {},
>(params: {
  // @ts-ignore
  schema?: z.ZodObject<T>;
  handle: (
    param?: HandleParams<T, Q>,
    config?: Partial<AxiosRequestConfig>,
  ) => Promise<AxiosResponse<R>>;
}) => {
  const handler: typeof params.handle = (param, config) => {
    if (params.schema) {
      params.schema.parse(param?.body);
    }
    return params.handle(param, config);
  };

  return handler;
};

export const mutateAxiosWrapper = async <R extends any>(
  func: Promise<AxiosResponse<R>>,
) => {
  try {
    const res = await func;
    return res;
  } catch (err) {
    if (isAxiosError(err)) {
      return err;
    }
    throw err;
  }
};
