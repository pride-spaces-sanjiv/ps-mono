import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as Lucide from "lucide-react";
import { isValidElementType } from "react-is";
import { Input } from "@/components/ui/input";
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
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const mappedIcons = Object.keys(Lucide)
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

type Props = {
  onSelect: (key: string) => any;
  inputProps: React.ComponentProps<typeof Input>;
  dialogProps: React.ComponentProps<typeof DialogModal>;
} & React.ComponentProps<"button">;
export default function AmenityIconSelector({
  onSelect,
  inputProps,
  dialogProps,
  ...props
}: Partial<Props>) {
  const dialogClose = useRef<HTMLButtonElement | null>(null);
  const triggerBtn = useRef<HTMLButtonElement | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncer(search.trim().toLowerCase(), 300);
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

  const searchedIcons = useMemo(() => {
    if (debouncedSearch.length >= 1 && iconsData) {
      const iconsDataKeys = iconsData.map((dt) => dt.key);
      return mappedIcons
        .filter((dt) => iconsDataKeys.includes(dt.value.trim().toLowerCase()))
        .filter(
          (dt) =>
            dt.value.toLowerCase().trim().includes(debouncedSearch) ||
            !!iconsData
              .find((icon) => icon.key === dt.value.trim().toLowerCase())
              ?.tags?.some((tag) => tag.includes(debouncedSearch)),
        );
    }
    return [];
  }, [debouncedSearch, iconsData]);

  return (
    <DialogModal
      closeProps={{ ref: dialogClose }}
      triggerProps={{
        children: (
          <ActionButton ref={triggerBtn} loading={isLoading}>
            {Selected ? (
              <Selected className="text-white size-[18px]" />
            ) : (
              "Select"
            )}
          </ActionButton>
        ),
      }}
      titleProps={{ children: "" }}
      {...dialogProps}
      contentProps={{
        ...dialogProps?.contentProps,
        className: cn("max-h-[80dvh]"),
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
        <div className="flex gap-2 flex-wrap h-full overflow-y-scroll">
          {searchedIcons.map((dt, i) => {
            const Icon = dt.icon as React.ForwardRefExoticComponent<
              Omit<Lucide.LucideProps, "ref"> &
                React.RefAttributes<SVGSVGElement>
            >;
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionButton
                    variant={"secondary"}
                    className="rounded-lg px-2 py-2 bg-secondary"
                    key={`icon-${i}`}
                    onClick={() => {
                      dialogClose?.current?.click?.();
                      onSelect?.(dt.key);
                      setSelected(Icon);
                    }}
                  >
                    <Icon className="size-[18px] text-white" />
                  </ActionButton>
                </TooltipTrigger>
                <TooltipContent>{dt.key}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
    </DialogModal>
  );
}
