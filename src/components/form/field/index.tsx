import React from "react";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/className";
import {
  SelectPicker,
  type Props as SelectPickerProps,
  type MainProps as SelectPickerMainProps,
} from "@/components/select";
import { type FieldError } from "react-hook-form";

type InputType = "default" | "textarea" | "password" | "select";
type Props<
  T extends InputType = "default",
  V extends any = any
> = (T extends "password"
  ? Omit<Parameters<typeof PasswordInput>[0], "wrapperProps"> & {
      fieldWrapperProps?: Parameters<typeof PasswordInput>[0]["wrapperProps"];
    }
  : T extends "select"
  ? Partial<
      SelectPickerMainProps &
        Pick<SelectPickerProps<V>, "items"> & {
          pickerProps: Partial<Omit<SelectPickerProps<V>, "items">>;
        }
    >
  : React.ComponentProps<T extends "textarea" ? "textarea" : "input">) &
  Partial<{
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
  V extends any = any
>({
  className,
  type = "text" as Props<"default">["type"],
  inputType = "default" as T,
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
      <Label {...labelProps} className={cn("text-base", labelProps?.className)}>
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
            className={className}
          />
        ) : inputType === "password" ? (
          <PasswordInput
            {...(props as Props<"password">)}
            wrapperProps={{
              ...(props as Props<"password">)?.fieldWrapperProps,
              className: cn(
                "min-h-[40px]",
                (props as Props<"password">)?.fieldWrapperProps?.className
              ),
            }}
            className={className}
            type={type}
          />
        ) : inputType === "textarea" ? (
          <textarea
            {...(props as Props<"textarea">)}
            className={cn("min-h-[40px] h-auto", className)}
          />
        ) : (
          <Input
            {...(props as Props<"default">)}
            type={type}
            className={cn("min-h-[40px] h-auto", className)}
          />
        ))}
      {error?.message && (
        <p className={cn("text-destructive text-sm")}>{error.message}</p>
      )}
    </div>
  );
}
