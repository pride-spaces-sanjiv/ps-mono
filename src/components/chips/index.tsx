import React from "react";
import { Badge } from "../ui/badge";
import { cn } from "@/utils/className";

const themes = {
  green: "bg-green-400",
  blue: "bg-blue-400",
  red: "bg-red-400",
  yellow: "bg-yellow-400 text-black",
  white: "bg-white text-black",
};

type Props = {
  elements: React.ReactNode[];
  chipBadgeProps: React.ComponentProps<typeof Badge>;
  theme: keyof typeof themes;
};
export default function ChippedElements({
  elements = [],
  chipBadgeProps,
  theme = "white",
  ...props
}: Partial<Props & Omit<React.ComponentProps<"div">, keyof Props>>) {
  return elements.length ? (
    <div {...props} className={cn("flex gap-2", props?.className)}>
      {elements.map((element, i) => (
        <Badge
          key={`badge-${i}`}
          variant={"secondary"}
          {...chipBadgeProps}
          className={cn("", themes[theme], chipBadgeProps?.className)}
        >
          {element}
        </Badge>
      ))}
    </div>
  ) : (
    ""
  );
}
