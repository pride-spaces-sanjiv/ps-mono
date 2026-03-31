import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/utils/className";

type Item<T extends any> = {
  label?: React.ReactNode;
  value: T;
  group?: string;
  searchValue?: string;
};

type SelectMode = "multiple" | "single";

type Props<T extends any, M extends SelectMode = "single"> = {
  items: Item<T>[];
  groups: { label?: React.ReactNode; value: string }[];
  defaultSelected: M extends "multiple" ? T[] : Item<T>;
  onSelect: (item: M extends "multiple" ? T[] : Item<T>) => any;
  renderItem?: (item: Item<T>) => React.ReactNode;
  labelProps: React.ComponentProps<typeof DropdownMenuLabel>;
  groupLabelProps: React.ComponentProps<typeof DropdownMenuLabel>;
  groupProps: React.ComponentProps<typeof DropdownMenuGroup>;
  itemProps: React.ComponentProps<typeof DropdownMenuItem>;
  contentProps: React.ComponentProps<typeof DropdownMenuContent>;
  triggerProps: React.ComponentProps<typeof DropdownMenuTrigger>;
  inputProps: React.ComponentProps<typeof Input>;
  type: M;
  showSearch: boolean;
} & React.ComponentProps<typeof DropdownMenu>;

export function GroupedSearchSelect<
  T extends any = any,
  M extends SelectMode = "single",
>({
  onSelect,
  renderItem,
  items = [],
  groups = [],
  defaultSelected,
  labelProps,
  groupLabelProps,
  groupProps,
  contentProps,
  triggerProps,
  itemProps,
  inputProps,
  // @ts-ignore
  type = "single",
  showSearch = true,
  ...props
}: Partial<Props<T, M>>) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<T[]>(
    (defaultSelected &&
      (type === "multiple"
        ? (defaultSelected as T[])
        : [(defaultSelected as Item<T>).value])) ||
      [],
  );

  const filtered = useMemo(
    () =>
      (items || []).filter(
        (dt) =>
          String(dt.searchValue || "")
            .toLowerCase()
            .trim()
            .includes(search) ||
          String(dt.value).toLowerCase().trim().includes(search),
      ),
    [items, search],
  );

  const groupedItems = useMemo(
    () => ({
      general: filtered.filter(
        (dt) => !groups.find((gr) => gr.value === dt.group),
      ),
      ...(Object.fromEntries(
        groups.map((gr) => [
          gr.value,
          filtered.filter((dt) => dt.group === gr.value),
        ]),
      ) as Record<string, Props<T>["items"]>),
    }),
    [filtered, groups],
  );

  // console.log(filtered, groupedItems);

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger
        {...triggerProps}
        className={cn("", triggerProps?.className)}
        asChild
      >
        {triggerProps?.children || <Button variant="outline">Open</Button>}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        {...contentProps}
        className={cn("w-56", contentProps?.className)}
      >
        {!!labelProps?.children && (
          <DropdownMenuLabel
            {...labelProps}
            className={cn("", labelProps?.className)}
          >
            {labelProps?.children}
          </DropdownMenuLabel>
        )}
        <div className="pt-1" />
        {/* Search input */}
        {showSearch && (
          <Input
            type="text"
            placeholder="Search group..."
            {...inputProps}
            className={cn("", inputProps?.className)}
            onChange={(e) => {
              setSearch(e.currentTarget.value?.trim().toLowerCase() || "");
              inputProps?.onChange?.(e);
            }}
          />
        )}
        <div className="pb-3" />
        {Object.entries(groupedItems).map(
          (pair, i) =>
            !!pair[1].length && (
              <>
                <DropdownMenuGroup
                  key={`menu-grp-${i}`}
                  {...groupProps}
                  className={cn("", groupProps?.className)}
                >
                  {pair[0] !== "general" && (
                    <>
                      <DropdownMenuLabel
                        {...groupLabelProps}
                        className={cn("", groupLabelProps?.className)}
                      >
                        {groups.find((gr) => gr.value === pair[0])?.label}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {pair[1].map((item, j) => (
                    <DropdownMenuItem
                      key={`menu-item-${i}-${j}`}
                      {...itemProps}
                      className={cn("", itemProps?.className)}
                      onSelect={(e) => {
                        type === "multiple" && e.preventDefault?.();
                        onSelect?.(
                          // @ts-ignore
                          type === "multiple"
                            ? selected.includes(item.value)
                              ? selected.filter((v) => v !== item.value)
                              : [...selected, item.value]
                            : item,
                        );
                        itemProps?.onSelect?.(e);
                        setSelected((prev) =>
                          type === "multiple"
                            ? prev.includes(item.value)
                              ? prev.filter((v) => v !== item.value)
                              : [...prev, item.value]
                            : [item.value],
                        );
                      }}
                    >
                      {renderItem?.(item) ?? (
                        <div className={cn("flex gap-2 justify-between")}>
                          <Checkbox checked={selected.includes(item.value)} />
                          {item.label || String(item.value)}
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            ),
        )}
        {/* <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
