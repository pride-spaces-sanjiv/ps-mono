import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  TooltipContent,
  Tooltip,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchIcon, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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

  const selectedAmenities = useMemo(() => {
    return checked
      .map(
        (id) =>
          amenitiesData.find((dt) => dt.id === id) || {
            id,
            name: id,
            icon: null,
          },
      )
      .filter(Boolean);
  }, [amenitiesData, checked]);

  const handleToggle = (id: string) => {
    const nextChecked = checked.includes(id)
      ? checked.filter((item) => item !== id)
      : [...checked, id];
    setChecked(nextChecked);
    onSelect?.(
      amenitiesData.filter((dt) => nextChecked.includes(dt.id as string)),
    );
  };

  const handleRemove = (id: string) => {
    const nextChecked = checked.filter((item) => item !== id);
    setChecked(nextChecked);
    onSelect?.(
      amenitiesData.filter((dt) => nextChecked.includes(dt.id as string)),
    );
  };

  const handleClearAll = () => {
    setChecked([]);
    onSelect?.([]);
  };

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
        className: cn(
          "max-h-[85dvh] sm:max-w-xl flex flex-col gap-3",
          dialogProps?.contentProps?.className,
        ),
      }}
      onOpenChange={(open) => {
        // reset states on closed
        if (!open) {
          setSearch("");
        }
        dialogProps?.onOpenChange?.(open);
      }}
    >
      {/* Search Input at the Top */}
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

      {/* Selected Amenities as Chips directly below Search */}
      {selectedAmenities.length > 0 && (
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Selected Amenities ({selectedAmenities.length})</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            {selectedAmenities.map((dt) => {
              const Icon =
                dt.icon &&
                (mappedIcons.find((icon) => icon.key === dt.icon)
                  ?.icon as LucideIconComponent);
              return (
                <Badge
                  key={`selected-chip-${dt.id}`}
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1 px-2.5 text-xs font-normal border border-border/60 bg-background/80 shadow-xs"
                >
                  {Icon && <Icon className="size-3 text-primary shrink-0" />}
                  <span className="truncate max-w-[140px]">{dt.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(dt.id as string);
                    }}
                    className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-0.5"
                    aria-label={`Remove ${dt.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Render elements in two columns */}
      {!!searchedAmenities.length && (
        <>
          <div
            key={`amenities-checked-key-${checked.length}`}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 self-stretch overflow-y-auto max-h-[380px] p-0.5"
          >
            {searchedAmenities
              .filter((_, i) => i < 20 * (itemsOffset + 1))
              .map((dt, i) => {
                const Icon =
                  dt.icon &&
                  (mappedIcons.find((icon) => icon.key === dt.icon)
                    ?.icon as LucideIconComponent);
                const isSelected = checked.includes(dt.id as string);
                return (
                  <div
                    key={`amenity-${dt.id}-${i}`}
                    onClick={() => handleToggle(dt.id as string)}
                    className={cn(
                      "flex gap-2.5 items-center p-2 rounded-lg border transition-colors cursor-pointer select-none",
                      isSelected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/60 hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(dt.id as string)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-lg p-1.5 bg-primary/10 border border-primary/20 text-primary shrink-0"
                          key={`icon-${i}`}
                        >
                          {Icon ? <Icon className="size-4" /> : "None"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{dt.icon}</TooltipContent>
                    </Tooltip>
                    <span
                      className="text-sm font-medium leading-none truncate"
                      title={dt.name}
                    >
                      {dt.name || "No Name"}
                    </span>
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
