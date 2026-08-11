import React from "react";
import { cn } from "@/utils/className";

type Props = {
  wrapperProps: React.ComponentProps<"div">;
  linerProps: React.ComponentProps<"div">;
};
export default function FormSectionTitle({
  wrapperProps,
  linerProps,
  ...props
}: Partial<Props & Omit<React.ComponentProps<"h2">, keyof Props>>) {
  return (
    <div
      {...wrapperProps}
      className={cn(
        "col-span-full py-6 flex items-center gap-3",
        wrapperProps?.className,
      )}
    >
      <h2 className="flex items-center text-lg font-semibold  italic text-foreground/90 tracking-wide ">
        {props?.children || "Title"}
      </h2>
      <div
        {...linerProps}
        className={cn(
          "flex-1 border-t border-muted-foreground/20",
          linerProps?.className,
        )}
      ></div>
    </div>
  );
}
