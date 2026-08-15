import crypto from "crypto";

if (!process.env.CIPHER_KEY || !process.env.CIPHER_IV) {
  throw new Error("Cipher secrets invalid", {
    cause: "invalid-cipher-secrets",
  });
}

const keyBuffer = Buffer.from(process.env.CIPHER_KEY, "base64");
const ivBuffer = Buffer.from(process.env.CIPHER_IV, "base64");
// console.log(keyBuffer.length, process.env.CIPHER_KEY);
// console.log(keyBuffer.length, process.env.CIPHER_IV);

export const defaultOptions = {
  keyBuffer: keyBuffer,
  ivBuffer: ivBuffer,
  /** @default "[:]" */
  separator: "[:]",
  /** @default "aes-256-gcm" */
  algorithm: "aes-256-gcm" as crypto.CipherGCMTypes,
};

export const encodeCrypto = (
  data = "",
  options?: Partial<typeof defaultOptions>
) => {
  try {
    const allOptions = { ...defaultOptions, ...options };
    const { keyBuffer, ivBuffer, separator, algorithm } = allOptions;
    if (!data.trim()) {
      throw new Error("Data required");
    }
    if (!separator.trim()) {
      throw new Error("Separator required");
    }
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, ivBuffer);
    const encoded =
      cipher.update(data, "utf-8", "base64") + cipher.final("base64");
    const authTag = cipher.getAuthTag().toString("base64");
    const str = `${encoded}${separator}${authTag}`;
    return str;
  } catch (err) {
    console.log("Error encoding crypto :", err);
    return "";
  }
};

export const decodeCrypto = (
  data = "",
  options?: Partial<typeof defaultOptions>
) => {
  try {
    const allOptions = { ...defaultOptions, ...options };
    const { keyBuffer, ivBuffer, separator, algorithm } = allOptions;
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
    const [mainData, authTag] = data.split(separator);
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    const decoded =
      decipher.update(mainData, "base64", "utf-8") + decipher.final("utf-8");
    return decoded;
  } catch (err) {
    console.log("Error decoding crypto :", err);
    return "";
  }
};

export const compareCryptos = (
  enc1 = "",
  enc2 = "",
  options?: Parameters<typeof decodeCrypto>[1]
) => {
  try {
    if (!enc1.trim() || !enc2.trim()) {
      throw new Error("Encrypted cryptos required");
    }
    const dec1 = decodeCrypto(enc1, options);
    const dec2 = decodeCrypto(enc2, options);
    return dec1 === dec2;
  } catch (err) {
    console.log("Error comparing encrypted cryptos :", err);
    return false;
  }
};
