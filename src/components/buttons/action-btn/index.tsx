import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/className";

type Props = Parameters<typeof Button>[0] &
  Partial<{
    showLoader: boolean;
    loading: boolean;
    loaderProps: React.JSX.IntrinsicElements["div"];
  }>;

export default function ActionButton({
  className,
  showLoader = true,
  loading = false,
  loaderProps,
  children,
  ...props
}: Props) {
  return (
    <Button
      disabled={loading}
      {...props}
      className={cn(
        "relative flex gap-2 items-center cursor-pointer",
        "disabled:cursor-default",
        className,
      )}
    >
      {!!showLoader && (
        <div
          role="status"
          aria-label="loading"
          {...loaderProps}
          className={cn(
            "animate-spin inline-block size-6 border-3 border-current border-t-transparent text-primary-foreground rounded-full dark:text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            loading ? "opacity-100" : "opacity-0 size-0",
            props?.variant && props?.variant === "default"
              ? "text-foreground"
              : props?.variant === "destructive"
                ? "text-foreground"
                : props?.variant === "outline"
                  ? "text-card-foreground"
                  : "",
            loaderProps?.className,
          )}
        >
          <span className="sr-only">Loading...</span>
        </div>
      )}
      <div className={cn("max-w-full", loading ? "opacity-0" : "")}>
        {children}
      </div>
    </Button>
  );
}
