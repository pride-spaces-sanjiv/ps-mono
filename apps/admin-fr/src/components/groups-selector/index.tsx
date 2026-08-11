import React, { useState } from "react";
import { GroupedSearchSelect } from "../search-select";
import { useAutoMediaDataFetch } from "@/services/hooks/useAutoMediaData";
import { cn } from "@/utils/className";
import { Input } from "../ui/input";
import ActionButton from "../buttons/action-btn";

type Props = {
  onSelect: (groups: string[]) => any;
  defaultItems: string[];
  placeholder: string;
  useSelfGroups: boolean;
  buttonProps: React.ComponentProps<typeof ActionButton>;
};

export default function GroupsSelectPicker({
  onSelect,
  defaultItems,
  placeholder,
  useSelfGroups = true,
  buttonProps = {},
}: Partial<Props>) {
  const { providersState, groupsState, commonGroupsState } =
    useAutoMediaDataFetch();
  const [groups, setGroups] = useState<string[]>(defaultItems || []);

  const spaceSelectedGroups = () => {
    if (groups.length) {
      const providers = commonGroupsState.value
        .filter((gr) => groups.includes(gr.id))
        .reduce((prev, curr, i) => {
          if (prev.includes(curr.provider)) {
            return prev;
          }
          return [...prev, curr.provider];
        }, [] as number[]);
      return `${groups.length} groups, ${providers.length} providers`;
    }
    return placeholder || "Select";
  };

  const getNameOfGroup = (id: string) => {
    const group = commonGroupsState.value.find((gr) => gr.id === id);
    if (group) {
      const provider = providersState.value.find(
        (prv) => prv.aliasId === group?.provider
      )?.name;
      const name = provider
        ? `(${provider}) - ${group.name || ""}`
        : group.name || "";
      return name;
    }
    return "Unknown";
  };

  return (
    <GroupedSearchSelect
      key={`providers-${providersState.value?.length}|groups-${groupsState.value?.length}|common_groups-${commonGroupsState.value?.length}`}
      type="multiple"
      defaultSelected={defaultItems}
      items={[
        ...commonGroupsState.value.map((dt) => ({
          label: dt.name,
          value: dt.id,
          group: dt.provider.toString(),
          searchValue: dt.name.toLowerCase(),
        })),
        ...(useSelfGroups
          ? groupsState.value.map((dt) => ({
              label: dt.name,
              group: "mine",
              value: dt.id,
              searchValue: dt.name.toLowerCase(),
            }))
          : []),
      ]}
      groups={[
        ...providersState.value.map((dt) => ({
          label: dt.name,
          value: dt.aliasId.toString(),
        })),
        { label: "My groups", value: "mine" },
      ]}
      triggerProps={{
        children: (
          <ActionButton
            type="button"
            variant={"secondary"}
            {...buttonProps}
            className={cn("min-h-[40px]", buttonProps?.className)}
          >
            {spaceSelectedGroups()}
          </ActionButton>
        ),
      }}
      contentProps={{ className: "max-h-[300px]" }}
      onSelect={(items) => {
        onSelect?.(items);
        setGroups(items);
      }}
    />
  );
}
