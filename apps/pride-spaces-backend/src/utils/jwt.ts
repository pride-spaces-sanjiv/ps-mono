import jwt from "jsonwebtoken";
import { encodeCrypto, decodeCrypto, defaultOptions } from "./crypto.js";
import { OverrideObject } from "@/types/object-override.js";
// import { ENV } from "./env.js";

const jwtOptions = {
  sign: { algorithm: "HS512" } as Partial<jwt.SignOptions>,
  decode: {} as Partial<jwt.DecodeOptions>,
  verify: {} as Partial<jwt.VerifyOptions>,
};

const testSecret = "kh435346bkl5bwHF8493HRnfi";
// process.env.JWT_SECRET = testSecret;

export const signJWT = (
  payload = {},
  options?: Partial<typeof jwtOptions.sign>,
) => {
  try {
    const allOptions = { ...jwtOptions.sign, ...options };
    const token = jwt.sign(
      payload || {},
      process.env.JWT_SECRET || testSecret,
      allOptions,
    );
    return token;
  } catch (err) {
    return "";
  }
};

export const signJWTwithCrypto = (
  payload = {},
  options?: Partial<typeof jwtOptions.sign>,
  cryptoOptions?: Partial<typeof defaultOptions>,
) => {
  try {
    const allOptions = { ...jwtOptions.sign, ...options };
    const token = jwt.sign(
      payload || {},
      process.env.JWT_SECRET || testSecret,
      allOptions,
    );
    if (!token?.trim()) {
      throw new Error("invalid token");
    }
    const encoded = encodeCrypto(token, cryptoOptions);
    return encoded;
  } catch (err) {
    return "";
  }
};

export const decodeJWT = <T extends { [k: string]: any }>(
  token = "",
  options?: Partial<typeof jwtOptions.verify>,
) => {
  try {
    const allOptions = { ...jwtOptions.verify, ...options };
    const data = jwt.verify(
      token,
      process.env.JWT_SECRET || testSecret,
      allOptions,
    ) as OverrideObject<jwt.JwtPayload, T> | null;
    if (typeof data !== "object" || Array.isArray(data)) {
      throw new Error("invalid data type");
    }
    const info = {
      /** @description Expiry time of jwt in ms */
      /** @description Issue time of jwt in ms */
      expiry: (data?.exp || 0) * 1000,
      issuedAt: (data?.iat || 0) * 1000,
      data: data || null,
    };
    return info;
  } catch (err) {
    return null;
  }
};

export const decodeJWTwithCrypto = <T extends { [k: string]: any }>(
  token = "",
  options?: Partial<typeof jwtOptions.verify>,
  cryptoOptions?: Partial<typeof defaultOptions>,
) => {
  try {
    const decoded = decodeCrypto(token, cryptoOptions);
    if (!decoded?.trim()) {
      throw new Error("decoding failed");
    }
    const data = decodeJWT<T>(decoded, options);
    return data;
  } catch (err) {
    return null;
  }
};

// // test
// const tk = signJWT({ id: "eer" });
// console.log(tk, decodeJWT(tk), process.env.JWT_SECRET);
// const tk =
//   "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOTJlZGM5LWI4MjUtN2NjZS1hYTRiLWEyNzRmMjgwNjhlYiIsImlhdCI6MTczMDU2NjI3M30.d8whmfnjONDBTioa5W2QHCAHLQ_Zb04v8N3OVkgb_KIERe9wBH_nBZ8DSyP0OuV18iHrrBAVnOeG44RA2BYVnw";
// console.log(decodeJWT(tk));
