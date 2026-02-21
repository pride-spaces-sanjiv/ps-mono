export type GeneralResponse<T extends any = any> = {
  success: boolean;
  message: string;
  data: T;
};
export type GeneralResponseWithError<
  T extends any = any,
  E = string
> = GeneralResponse<T> & {
  errorType?: E;
};

export type PaginatedResponse<T extends any = any> = T &
  Partial<{
    page: number;
    metrics: Record<"count" | "total" | "next", number>;
  }>;
