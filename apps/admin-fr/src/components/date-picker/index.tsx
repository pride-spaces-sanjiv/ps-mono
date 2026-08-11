import * as React from "react";
import moment from "moment";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/className";
import type { PropsSingle } from "react-day-picker";

export type Props = PropsSingle & {
  className: string;
  format: string;
  wrapperProps: Parameters<typeof Popover>[0];
  triggerProps: Parameters<typeof PopoverTrigger>[0];
  buttonProps: Parameters<typeof Button>[0];
  contentProps: Parameters<typeof PopoverContent>[0];
};

export function DatePicker({
  className,
  format = "DD MMM YYYY",
  wrapperProps,
  triggerProps,
  buttonProps,
  contentProps,
  ...props
}: Partial<
  Props & Omit<React.ComponentProps<typeof Calendar>, keyof PropsSingle>
>) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined | null>(null);

  return (
    <Popover open={open} onOpenChange={setOpen} {...wrapperProps}>
      <PopoverTrigger
        {...triggerProps}
        className={cn("", triggerProps?.className)}
        asChild
      >
        <Button
          variant="outline"
          {...buttonProps}
          className={cn(
            "w-48 justify-between font-normal",
            buttonProps?.className
          )}
        >
          {date instanceof Date ? moment(date).format(format) : "Select date"}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        {...contentProps}
        className={cn("w-auto overflow-hidden p-0", contentProps?.className)}
      >
        <Calendar
          captionLayout="dropdown"
          {...props}
          mode={"single"}
          selected={date as Date | undefined}
          onSelect={(date, tDate, mods, e) => {
            setDate(date);
            setOpen(false);
            props?.onSelect?.(date, tDate, mods, e);
          }}
          className={cn("", className)}
        />
      </PopoverContent>
    </Popover>
  );
}
