import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/utils/className";

type Props = {
  wrapperProps: React.ComponentProps<"div">;
  headerProps: React.ComponentProps<"div">;
  titleProps: React.ComponentProps<"div">;
  descriptionProps: React.ComponentProps<"div">;
  cardProps: React.ComponentProps<"div">;
} & React.ComponentProps<"div">;

export default function AuthCard({
  wrapperProps,
  cardProps,
  headerProps,
  titleProps,
  descriptionProps,
  className,
  children,
  ...props
}: Partial<Props>) {
  return (
    <Card
      {...cardProps}
      className={cn(
        "max-w-[500px] w-full",
        "max-[768px]:border-none max-[768px]:shadow-none max-[768px]:h-full max-[768px]:max-w-[initial] max-[768px]:justify-center",
        cardProps?.className
      )}
    >
      <CardHeader {...headerProps} className={cn("", headerProps?.className)}>
        {headerProps?.children || (
          <>
            <CardTitle
              {...titleProps}
              className={cn("text-xl font-bold", titleProps?.className)}
            >
              {titleProps?.children || "Title"}
            </CardTitle>
            <CardDescription
              {...descriptionProps}
              className={cn("", descriptionProps?.className)}
            >
              {descriptionProps?.children || "Description"}
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent {...props} className={cn("", className)}>
        {children}
      </CardContent>
    </Card>
  );
}
