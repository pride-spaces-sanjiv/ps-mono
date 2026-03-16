import React from "react";
// import PhoneInput from "react-phone-number-input";
// import "react-phone-number-input/style.css";
import { Input, PasswordInput, TextArea } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/className";
import {
  SelectPicker,
  type Props as SelectPickerProps,
  type MainProps as SelectPickerMainProps,
} from "@/components/select";
import { type FieldError } from "react-hook-form";

type InputType = "default" | "textarea" | "password" | "select" | "phone";
type Props<
  T extends InputType = "default",
  V extends any = any,
> = (T extends "password"
  ? Omit<Parameters<typeof PasswordInput>[0], "wrapperProps"> & {
      fieldWrapperProps?: Parameters<typeof PasswordInput>[0]["wrapperProps"];
    }
  : T extends "phone"
    ? React.ComponentProps<typeof PhoneInput>
    : T extends "select"
      ? Partial<
          SelectPickerMainProps &
            Pick<SelectPickerProps<V>, "items"> & {
              pickerProps: Partial<Omit<SelectPickerProps<V>, "items">>;
            }
        >
      : React.ComponentProps<T extends "textarea" ? "textarea" : "input">) &
  Partial<{
    labelPosition: "out" | "embedded";
    labelProps: Parameters<typeof Label>[0];
    errorProps: React.JSX.IntrinsicElements["p"];
    wrapperProps: React.JSX.IntrinsicElements["p"];
    inputType: T;
    type: React.ComponentProps<"input">["type"];
    error: FieldError | null;
    label: React.ReactNode;
    showRequired: boolean;
    required: boolean;
  }>;

export default function FormField<
  T extends InputType = "default",
  V extends any = any,
>({
  className,
  type = "text" as Props<"default">["type"],
  inputType = "default" as T,
  labelPosition = "out",
  labelProps,
  label,
  errorProps,
  wrapperProps,
  error = null,
  showRequired = true,
  ...props
}: Props<T, V>) {
  return (
    <div
      {...wrapperProps}
      className={cn("flex flex-col gap-2", wrapperProps?.className)}
    >
      <div
        className={cn(
          "",
          labelPosition === "out"
            ? "flex flex-col gap-2"
            : "flex items-center gap-1 rounded-md border border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        )}
      >
        <Label
          {...labelProps}
          className={cn(
            "text-base shrink-0",
            labelPosition === "embedded" ? "px-2 h-full bg-accent" : "",
            labelProps?.className,
          )}
        >
          {labelProps?.children || label}{" "}
          {!!showRequired && !!props?.required && (
            <span className="text-destructive">*</span>
          )}
        </Label>

        {props?.children ||
          (inputType === "select" ? (
            // @ts-ignore
            <SelectPicker
              {...{
                ...{ ...(props as Props<"select", V>), pickerProps: undefined },
                ...(props as Props<"select", V>)?.pickerProps,
              }}
              items={(props as Props<"select", V>)?.items}
              className={cn(
                labelPosition === "out"
                  ? ""
                  : "border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent",
                className,
              )}
            />
          ) : inputType === "phone" ? (
            <PhoneInput
              defaultCountry="IN"
              {...(props as Props<"phone">)}
              countrySelectProps={{
                triggerButtonProps: { className: "border-0" },
              }}
              className={cn(
                "min-h-[40px] h-auto",
                labelPosition === "out"
                  ? ""
                  : "border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent",
                className,
              )}
            />
          ) : inputType === "password" ? (
            <PasswordInput
              {...(props as Props<"password">)}
              wrapperProps={{
                ...(props as Props<"password">)?.fieldWrapperProps,
                className: cn(
                  "min-h-[40px]",
                  (props as Props<"password">)?.fieldWrapperProps?.className,
                ),
              }}
              className={cn(
                labelPosition === "out"
                  ? ""
                  : "border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent",
                className,
              )}
              type={type}
            />
          ) : inputType === "textarea" ? (
            <TextArea
              {...(props as Props<"textarea">)}
              className={cn(
                "min-h-[40px] h-auto",
                labelPosition === "out"
                  ? ""
                  : "border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent",
                className,
              )}
            />
          ) : (
            <Input
              {...(props as Props<"default">)}
              type={type}
              className={cn(
                "min-h-[40px] h-auto",
                labelPosition === "out"
                  ? ""
                  : "border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent",
                className,
              )}
            />
          ))}
      </div>
      {error?.message && (
        <p className={cn("text-destructive text-sm")}>{error.message}</p>
      )}
    </div>
  );
}
