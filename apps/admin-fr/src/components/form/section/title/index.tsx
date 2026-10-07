import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/className";

type Props = {
  wrapperProps: React.ComponentProps<"div">;
  linerProps: React.ComponentProps<"div">;
  collapsible?: boolean;
  isOpen?: boolean;
  hasError?: boolean;
  arrowProps?: React.ComponentProps<"svg">;
  rightElement?: React.ReactNode;
};

export default function FormSectionTitle({
  wrapperProps,
  linerProps,
  collapsible,
  isOpen,
  hasError,
  arrowProps,
  rightElement,
  ...props
}: Partial<Props & Omit<React.ComponentProps<"h2">, keyof Props>>) {
  return (
    <div
      {...wrapperProps}
      className={cn(
        "col-span-full py-6 flex items-center gap-3",
        collapsible && "cursor-pointer select-none group",
        wrapperProps?.className,
      )}
    >
      <div className="flex items-center gap-2">
        <h2
          className={cn(
            "flex items-center text-lg font-semibold italic text-foreground/90 tracking-wide",
            collapsible && "group-hover:text-foreground transition-colors",
            hasError && "text-destructive font-bold",
            props?.className,
          )}
        >
          {props?.children || "Title"}
        </h2>
        {hasError && (
          <span
            title="Section contains errors"
            className="size-2 rounded-full bg-destructive animate-pulse"
          />
        )}
      </div>
      <div
        {...linerProps}
        className={cn(
          "flex-1 border-t border-muted-foreground/20",
          collapsible &&
            "group-hover:border-muted-foreground/40 transition-colors",
          hasError && "border-destructive/40",
          linerProps?.className,
        )}
      />
      {rightElement}
      {collapsible && (
        <div className="p-1 rounded-sm text-muted-foreground group-hover:text-foreground transition-colors">
          <ChevronDown
            {...(arrowProps as any)}
            className={cn(
              "size-5 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180",
              arrowProps?.className,
            )}
          />
        </div>
      )}
    </div>
  );
}
