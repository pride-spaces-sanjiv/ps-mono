import React, { type ComponentProps } from "react";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
// @ts-ignore
import GoogleLogo from "../../../assets/images/svgs/google-logo.svg?react";
import ActionButton from "../action-btn";
import type {
  CodeResponse,
  TokenResponse,
  CredentialResponse,
  GoogleLoginProps,
} from "@react-oauth/google";
import { type IconBaseProps } from "react-icons";
import { cn } from "@/utils/cn";

type Props<T extends "auth-code" | "implicit" | undefined> = {
  template?: T;
  text?: React.ReactNode;
  iconProps?: IconBaseProps & { size?: string | number };
  onSuccess?: (
    response: T extends "auth-code"
      ? Omit<CodeResponse, "error" | "error_description" | "error_uri">
      : Omit<TokenResponse, "error" | "error_description" | "error_uri">
  ) => any | Promise<any>;
  onError?: (
    err: T extends "auth-code"
      ? Pick<CodeResponse, "error" | "error_description" | "error_uri">
      : Pick<TokenResponse, "error" | "error_description" | "error_uri"> | Error
  ) => any | Promise<any>;
};

const getUserData = async (token = "") => {
  try {
    if (!token.trim()) {
      throw new Error("invalid token");
    }
    const res = await axios.get<{ [k: string]: any }>(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    console.log(res.data);
    return res.data;
  } catch (err: any) {
    console.error("Error google login :", err.message);
    return null;
  }
};

export default function GoogleButton<
  T extends "auth-code" | "implicit" = "auth-code"
>({
  template = "auth-code" as T,
  text,
  iconProps = {},
  onSuccess = undefined,
  onError = undefined,
  ...props
}: Props<T> & ComponentProps<typeof ActionButton>) {
  const login = useGoogleLogin({
    onSuccess: async (response) => {
      // const data = await getUserData(response.access_token);
      // @ts-ignore
      onSuccess?.(response);
      // !data && onError?.(new Error("User Data error"));
    },
    onError: (err) => {
      onError?.(err);
    },
    flow: "auth-code",
  });

  return (
    <ActionButton
      {...props}
      variant={props?.variant || "outline"}
      className={cn(
        `mt-[6px] font-normal gap-2 items-center rounded-md flex`,
        props?.className || ""
      )}
      onClick={() => login()}
    >
      <div className="flex gap-2 items-center">
        {props?.children || text || "Sign In with Google"}
        <GoogleLogo
          {...iconProps}
          height={iconProps?.height || iconProps?.size || 20}
          width={iconProps?.width || iconProps?.size || 20}
        />
      </div>
    </ActionButton>
  );
}
