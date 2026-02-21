import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { cn } from "@/utils/className";

export type Props<V extends any> = {
  wrapperProps: Parameters<typeof Select>[0];
  groupProps: Parameters<typeof SelectGroup>[0];
  contentProps: Parameters<typeof SelectContent>[0];
  itemProps: Parameters<typeof SelectItem>[0];
  valueProps: Parameters<typeof SelectValue>[0];
  labelProps: Parameters<typeof SelectLabel>[0];
  separatorProps: Parameters<typeof SelectSeparator>[0];
  showSeparator: boolean;
  showLabel: boolean;
  items: { label?: React.ReactNode; value: V }[];
};
export type MainProps = Omit<
  Parameters<typeof SelectTrigger>[0],
  keyof Props<any>
>;

export function SelectPicker<V extends any>({
  className,
  wrapperProps,
  groupProps,
  contentProps,
  itemProps,
  valueProps,
  labelProps,
  separatorProps,
  showSeparator = true,
  showLabel = true,
  items = [],
  ...props
}: Partial<MainProps & Props<V>>) {
  return (
    <Select {...wrapperProps}>
      <SelectTrigger {...props} className={cn("w-[180px]", className)}>
        <SelectValue
          {...valueProps}
          placeholder={valueProps?.placeholder || "Select"}
        />
      </SelectTrigger>
      <SelectContent
        {...contentProps}
        className={cn("", contentProps?.className)}
      >
        <SelectGroup {...groupProps} className={cn("", groupProps?.className)}>
          {!!showLabel && (
            <SelectLabel
              {...labelProps}
              className={cn("", labelProps?.className)}
            >
              {labelProps?.children}
            </SelectLabel>
          )}
          {!!showSeparator && <SelectSeparator />}
          {!!items?.length &&
            items.map((item, i) => (
              <SelectItem
                {...itemProps}
                className={cn("", itemProps?.className)}
                value={String(item.value)}
                key={`select-item-${i}`}
              >
                {item.label || String(item.value)}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
