import {
  isAxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import * as yup from "yup";
import { queryToString } from "./query";

type HandleParams<
  T extends yup.AnyObject | FormData = yup.AnyObject,
  Q extends Parameters<typeof queryToString>[0] = {}
> = {
  query?: Q | null | undefined;
  body?: T | null | undefined;
};

export const APIBodyValidationWrapper = <
  R extends any = any,
  T extends yup.AnyObject | FormData = yup.AnyObject,
  Q extends Parameters<typeof queryToString>[0] = {}
>(params: {
  schema?: yup.ObjectSchema<T>;
  handle: (
    param?: HandleParams<T, Q>,
    config?: Partial<AxiosRequestConfig>
  ) => Promise<AxiosResponse<R>>;
}) => {
  const handler: typeof params.handle = (param, config) => {
    if (params.schema) {
      params.schema.validateSync(param?.body);
    }
    return params.handle(param, config);
  };

  return handler;
};

export const mutateAxiosWrapper = async <R extends any>(
  func: Promise<AxiosResponse<R>>
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
