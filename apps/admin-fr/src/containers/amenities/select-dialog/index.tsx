import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  TooltipContent,
  Tooltip,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchIcon } from "lucide-react";
import { useAmenities } from "@/services/hooks/useAmenities";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { cn } from "@/utils/className";
import {
  mappedIcons,
  type LucideIconComponent,
} from "@/components/amenity/selector";
import { embedInputClassName } from "@/components/form/field";
import { DialogClose } from "@/components/ui/dialog";
import { DialogModal } from "@/components/dialog";
import ActionButton from "@/components/buttons/action-btn";
import type { DatifiedAmenity } from "@/types/data/amenity";

type Props = {
  onSelect: (amenities: DatifiedAmenity[]) => any;
  inputProps: React.ComponentProps<typeof Input>;
  dialogProps: React.ComponentProps<typeof DialogModal>;
  defaultAmenities: string[];
};

export default function SelectAmenities({
  dialogProps,
  inputProps,
  onSelect,
  defaultAmenities,
  ...props
}: Partial<Props> &
  Partial<Omit<React.ComponentProps<"button">, keyof Props>>) {
  const { amenitiesData, isFetching } = useAmenities();

  const dialogClose = useRef<HTMLButtonElement | null>(null);
  const triggerBtn = useRef<HTMLButtonElement | null>(null);

  const [itemsOffset, setItemsOffset] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncer(search.trim().toLowerCase(), 500, () => {
    setItemsOffset(0);
  });

  const [checked, setChecked] = useState<string[]>(defaultAmenities || []);

  const searchedAmenities = useMemo(() => {
    if (debouncedSearch.length >= 1) {
      return amenitiesData.filter(
        (dt) =>
          dt.name && dt.name.trim().toLowerCase().includes(debouncedSearch),
      );
    }
    return amenitiesData;
  }, [debouncedSearch, amenitiesData, itemsOffset]);

  useEffect(() => {
    if (defaultAmenities) {
      const currentJoined = (checked || []).slice().sort().join(",");
      const nextJoined = (defaultAmenities || []).slice().sort().join(",");
      if (currentJoined !== nextJoined) {
        setChecked(defaultAmenities);
      }
    }
  }, [defaultAmenities]);

  return (
    <DialogModal
      showClose={false}
      {...dialogProps}
      closeProps={{ ref: dialogClose, ...dialogProps?.closeProps }}
      triggerProps={{
        ...dialogProps?.triggerProps,
        children: (
          <ActionButton
            ref={triggerBtn}
            variant={"outline"}
            loading={isFetching}
            {...props}
            className={cn(embedInputClassName, props?.className)}
          >
            {props?.children || "Select Amenities"}
          </ActionButton>
        ),
      }}
      titleProps={{ children: "Select Amenities", ...dialogProps?.titleProps }}
      footerProps={{
        children: (
          <DialogClose asChild>
            <ActionButton type="button">Done</ActionButton>
          </DialogClose>
        ),
        ...dialogProps?.footerProps,
      }}
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
        <SearchIcon />
        <Input
          placeholder="Search amenity"
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
      {!!searchedAmenities.length && (
        <>
          <div
            key={`amenities-checked-key-${checked.length}`}
            className="flex flex-col gap-2 self-stretch overflow-y-auto"
          >
            {searchedAmenities
              .filter((_, i) => i < 20 * (itemsOffset + 1))
              .map((dt, i) => {
                const Icon =
                  dt.icon &&
                  (mappedIcons.find((icon) => icon.key === dt.icon)
                    ?.icon as LucideIconComponent);
                return (
                  <div
                    key={`amenity-${dt.id}-${i}`}
                    className="flex gap-2 items-center"
                  >
                    <Checkbox
                      checked={checked.includes(dt.id as string)}
                      onCheckedChange={(isCheck) => {
                        const nextChecked = isCheck
                          ? [...new Set([...checked, dt.id as string])]
                          : checked.filter((id) => id !== dt.id);
                        setChecked(nextChecked);
                        onSelect?.(
                          amenitiesData.filter((dt) =>
                            nextChecked.includes(dt.id),
                          ),
                        );
                      }}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-lg px-2 py-2 bg-secondary text-white"
                          key={`icon-${i}`}
                        >
                          {Icon ? <Icon className="size-[18px]" /> : "None"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{dt.icon}</TooltipContent>
                    </Tooltip>
                    <div>{dt.name || "No Name"}</div>
                  </div>
                );
              })}
          </div>
          {20 * (itemsOffset + 1) < searchedAmenities.length && (
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
