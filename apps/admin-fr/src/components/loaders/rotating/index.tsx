import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/className";

const variants = cva(
  "animate-spin inline-block border-3 border-current border-t-transparent rounded-full",
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        outline: "text-accent-foreground",
        secondary: "text-secondary-foreground",
        ghost: "text-accent-foreground",
        link: "text-primary",
      },
      size: {
        default: "size-6",
        sm: "size-4",
        lg: "size-6",
        xl: "size-8",
        "2xl": "size-10",
        "3xl": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type Props = React.JSX.IntrinsicElements["div"] & {
  visible: boolean;
} & VariantProps<typeof variants>;
export default function RotatingLoader({
  className,
  visible = true,
  variant,
  size,
  ...props
}: Partial<Props>) {
  return (
    <div
      role="status"
      aria-label="loading"
      {...props}
      className={cn(
        variants({
          variant,
          size,
          className: cn(
            visible ? "opacity-100" : "opacity-0 absolute size-0",
            className,
          ),
        }),
      )}
    >
      <span className="sr-only">{"Loading........"}</span>
      {props?.children}
    </div>
  );
}
