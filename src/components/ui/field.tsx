import * as React from "react";
import { cn } from "@/utils/cn";

export function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("grid gap-4", className)} {...props} />
  );
}

export function Field({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props} />
  );
}