import type { AxiosInstance } from "axios";

export function isAxiosInstance(value: unknown): value is AxiosInstance {
  return (
    typeof value === "function" &&
    value !== null &&
    typeof (value as AxiosInstance).request === "function" &&
    typeof (value as AxiosInstance).get === "function" &&
    typeof (value as AxiosInstance).post === "function" &&
    typeof (value as AxiosInstance).interceptors === "object"
  );
}
