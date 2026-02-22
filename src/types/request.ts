import { Request, RequestHandler, Response } from "express";
import { ParsedQs } from "qs";
import { OverrideObject } from "./object-override.js";

export type ManagedRequestHandler<
  B extends any = any,
  Q = ParsedQs,
  L extends Record<string, any> = Record<string, any>,
> = RequestHandler<any, any, B, Q, L>;

export type ManagedRequest<
  B extends any = any,
  Q = ParsedQs,
  L extends Record<string, any> = Record<string, any>,
> = Request<any, any, B, Q, L>;

export type ManagedResponse<
  B extends any = any,
  L extends Record<string, any> = Record<string, any>,
> = Response<B, L>;

export type ManagedResponseWithLocalUrl<
  B extends any = any,
  L extends Record<string, any> = Record<string, any>,
  P extends boolean = false,
> = ManagedResponse<
  B,
  // @ts-ignore
  OverrideObject<
    L,
    // @ts-ignore
    (P extends true ? Partial<{ url: string }> : { url: string }) & {
      cacheUser?: string;
    }
  >
>;

export type ManagedResponseWithLocalUrlIP<
  B extends any = any,
  L extends Record<string, any> = Record<string, any>,
  P extends boolean = false,
> = ManagedResponse<
  B,
  // @ts-ignore
  OverrideObject<
    L,
    // @ts-ignore
    (P extends true ? Partial<{ url: string }> : { url: string }) & {
      cacheUser?: string;
      cacheIP?: string;
    }
  >
>;
