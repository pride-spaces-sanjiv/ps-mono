import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as Lucide from "lucide-react";
import axios from "axios";
import { isValidElementType } from "react-is";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { cn } from "@/utils/className";
import {
  dashToUpperCased,
  removeDashes,
  upperCasedToDash,
} from "@/utils/string/dashed";
import { embedInputClassName } from "@/components/form/field";
import { DialogModal } from "@/components/dialog";
import ActionButton from "@/components/buttons/action-btn";

export const mappedIcons = Object.keys(Lucide)
  .map((val) => ({
    key: upperCasedToDash(val.replace(/ +/g, "")),
    value: val,
    icon: Lucide[val as keyof typeof Lucide],
  }))
  .filter((data) => {
    try {
      return (
        isValidElementType(data.icon) &&
        typeof data.icon !== "function" &&
        data.value.trim()
      );
    } catch (err) {
      return false;
    }
  });
// console.log(mappedIcons);

export type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<Lucide.LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

type Props = {
  onSelect: (key: string) => any;
  inputProps: React.ComponentProps<typeof Input>;
  dialogProps: React.ComponentProps<typeof DialogModal>;
  defaultIconKey: string;
};
export default function AmenityIconSelector({
  onSelect,
  inputProps,
  dialogProps,
  defaultIconKey,
  ...props
}: Partial<Props> &
  Partial<Omit<React.ComponentProps<"button">, keyof Props>>) {
  const dialogClose = useRef<HTMLButtonElement | null>(null);
  const triggerBtn = useRef<HTMLButtonElement | null>(null);

  const [itemsOffset, setItemsOffset] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncer(search.trim().toLowerCase(), 500, () => {
    setItemsOffset(0);
  });
  const [Selected, setSelected] = useState<
    (typeof Lucide)["AArrowDown"] | null
  >(null);

  const { data: iconsData, isFetching: isLoading } = useQuery({
    queryKey: ["set-icons-data"],
    queryFn: async () => {
      try {
        const res = await axios.get("https://lucide.dev/api/tags");
        const iconsData: { key: string; tags: string[] }[] =
          (res.status === 200 &&
            res.data &&
            typeof res.data === "object" &&
            Object.entries(res.data).map(([key, tags]) => ({
              key: removeDashes(key).trim().toLowerCase(),
              tags,
            }))) ||
          [];
        if (iconsData.length >= 10) {
          return iconsData;
        }
        throw new Error("Invalid response");
      } catch (err) {
        return [];
      }
    },
    retryDelay: 5000,
    staleTime: 30000,
  });

  const iconsDataKeys = useMemo(
    () => iconsData?.map((dt) => dt.key) || [],
    [iconsData],
  );
  const searchedIcons = useMemo(() => {
    if (debouncedSearch.length >= 1 && iconsData) {
      return mappedIcons
        .filter((dt, i) =>
          iconsDataKeys.includes(dt.value.trim().toLowerCase()),
        )
        .filter(
          (dt) =>
            dt.value.toLowerCase().trim().includes(debouncedSearch) ||
            !!iconsData
              .find((icon) => icon.key === dt.value.trim().toLowerCase())
              ?.tags?.some((tag) => tag.includes(debouncedSearch)),
        );
    }
    return [];
  }, [debouncedSearch, iconsData, itemsOffset, iconsDataKeys]);

  useEffect(() => {
    const key =
      defaultIconKey &&
      iconsDataKeys.find((k) =>
        k.includes(removeDashes(defaultIconKey).toLowerCase().trim()),
      );
    // console.log("Selected from default icon", key);
    if (iconsDataKeys.length > 0 && defaultIconKey && key) {
      const Icon = mappedIcons.find(
        (dt) => dt.value.toLowerCase().trim() === key,
      )?.icon as LucideIconComponent | undefined;
      // console.log("Selected from default icon", defaultIconKey, Icon);
      // @ts-ignore
      Icon && setSelected((prev: LucideIconComponent) => prev || Icon);
    }
  }, [iconsDataKeys, defaultIconKey]);

  return (
    <DialogModal
      {...dialogProps}
      closeProps={{ ref: dialogClose, ...dialogProps?.closeProps }}
      triggerProps={{
        ...dialogProps?.triggerProps,
        children: (
          <ActionButton
            ref={triggerBtn}
            loading={isLoading}
            variant={"secondary"}
            {...props}
            className={cn("", props?.className)}
          >
            {Selected ? (
              <Selected className="text-foreground size-[18px]" />
            ) : (
              props?.children || "Select"
            )}
          </ActionButton>
        ),
      }}
      titleProps={{ children: "", ...dialogProps?.titleProps }}
      contentProps={{
        ...dialogProps?.contentProps,
        className: cn("max-h-[80dvh]", dialogProps?.contentProps?.className),
      }}
      onOpenChange={(open) => {
        // reset states on closed
        if (!open) {
          setSearch("");
        }
        dialogProps?.onOpenChange?.(open);
      }}
    >
      <div className="flex items-center gap-1 rounded-md border border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] px-2 py-1">
        <Lucide.SearchIcon />
        <Input
          placeholder="Search an Icon"
          {...inputProps}
          onChange={(e) => {
            const val = e.currentTarget.value.trim().toLowerCase();
            setSearch(val);
            inputProps?.onChange?.(e);
          }}
          className={cn(embedInputClassName, inputProps?.className)}
        />
      </div>
      {/* Render elements */}
      {!!searchedIcons.length && (
        <>
          <div className="flex gap-2 flex-wrap self-stretch overflow-y-auto">
            {searchedIcons
              .filter((_, i) => i < 20 * (itemsOffset + 1))
              .map((dt, i) => {
                const Icon = dt.icon as LucideIconComponent;
                return (
                  <Tooltip key={`icon-${i}`}>
                    <TooltipTrigger asChild>
                      <ActionButton
                        variant={"outline"}
                        className="rounded-lg p-2 bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
                        onClick={() => {
                          dialogClose?.current?.click?.();
                          onSelect?.(dt.key);
                          setSelected(Icon);
                        }}
                      >
                        <Icon className="size-[18px]" />
                      </ActionButton>
                    </TooltipTrigger>
                    <TooltipContent>{dt.key}</TooltipContent>
                  </Tooltip>
                );
              })}
          </div>
          {20 * (itemsOffset + 1) < searchedIcons.length && (
            <ActionButton
              variant={"secondary"}
              className="w-fit"
              onClick={() => {
                setItemsOffset((prev) => prev + 1);
              }}
            >
              View More
            </ActionButton>
          )}
        </>
      )}
    </DialogModal>
  );
}
