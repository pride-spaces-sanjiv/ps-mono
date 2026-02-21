import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import { toast } from "sonner";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DialogClose, type Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DeleteIcon, PlusIcon, Trash2 } from "lucide-react";
import { useAutoMediaDataFetch } from "@/services/hooks/useAutoMediaData";
import { createGroup, deleteGroup } from "@/services/apis/groups";
import { groupSchema, type GroupSchema } from "@/utils/schemas/group";
import { datifyObjectValues } from "@/utils/object/datify";
import { deleteFields } from "@/utils/object/field";
import { delayPromise } from "@/utils/promise";
import { queryKeys } from "@/utils/query-keys";
import { DialogModal } from "@/components/dialog";
import { GroupedSearchSelect } from "@/components/search-select";
import RotatingLoader from "@/components/loaders/rotating";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import type { DatifiedUserGroup, UserGroup } from "@/types/data/media";

export default function SettingsGroups() {
  // const providersState = providersStore();
  // const commonGroupsState = commonGroupsStore();
  // const groupsState = userGroupsStore();

  const {
    providersState,
    commonGroupsState,
    groupsState,
    providersQueryState: { isFetching: providersLoading },
    commonGroupsQueryState: { isFetching: commonGroupsLoading },
    userGroupsQueryState: { isFetching: groupsLoading, refetch },
  } = useAutoMediaDataFetch();

  const { isPending: loading, mutateAsync: createGroupMutater } = useMutation({
    mutationKey: [queryKeys.GROUPS, "create"],
    mutationFn: (body: GroupSchema) =>
      delayPromise(createGroup({ body: body }), 1),
  });

  const { isPending: deleteLoading, mutateAsync: deleteGroupMutater } =
    useMutation({
      mutationKey: [queryKeys.GROUPS, "delete"],
      mutationFn: (id: string) =>
        delayPromise(deleteGroup({ query: { id: id } }), 1),
    });

  const {
    register,
    reset,
    formState: { errors },
    watch,
    handleSubmit,
    setValue,
  } = useForm({ resolver: yupResolver(groupSchema) });

  const handleCreate = async (body: GroupSchema) => {
    try {
      console.log(body);
      const res = await createGroupMutater(body);
      const data = res.data?.data;
      if ((res.status === 200 || res.status === 201) && data?.id) {
        dialogRef.current?.click();
        groupsState.setter([
          ...groupsState.value,
          datifyObjectValues(
            deleteFields(data, ["createdBy", "channels"]) as UserGroup,
            ["createdAt", "updatedAt"]
          ) as DatifiedUserGroup,
        ]);
        toast.success("Created group");
        reset();
        refetch();
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.log(err);
      toast.error("Failed to create group");
    }
  };

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteGroupMutater(id);
      if (res.status === 200) {
        dialogRef.current?.click();
        groupsState.setter(groupsState.value.filter((data) => data.id !== id));
        toast.success("Deleted group");
        refetch();
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete group");
    }
  };

  const displaySelectedGroup = () => {
    const group = commonGroupsState.value.find(
      (gr) => gr.id === watch("referenceGroup")
    );
    if (group) {
      const provider = providersState.value.find(
        (prv) => prv.aliasId === group?.provider
      )?.name;
      const name = provider
        ? `(${provider}) - ${group.name || ""}`
        : group.name || "";
      return name;
    }
    return "Select";
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

  // useEffect(() => {
  //   if (commonGroupsRes?.data?.data?.results?.length) {
  //     commonGroupsState.setter(
  //       commonGroupsRes?.data?.data?.results
  //         .map((dt) => datifyObjectValues(dt, ["createdAt", "updatedAt"]))
  //         .filter((dt) => typeof dt === "object" && !!dt)
  //     );
  //   }
  // }, [commonGroupsRes?.data?.data]);
  // useEffect(() => {
  //   if (groupsRes?.data?.data?.results?.length) {
  //     groupsState.setter(
  //       groupsRes?.data?.data?.results
  //         .map((dt) => datifyObjectValues(dt, ["createdAt", "updatedAt"]))
  //         .filter((dt) => typeof dt === "object" && !!dt)
  //     );
  //   }
  // }, [groupsRes?.data?.data]);
  // useEffect(() => {
  //   if (providersRes?.data?.data?.results?.length) {
  //     providersState.setter(
  //       providersRes?.data?.data?.results
  //         .map((dt) => datifyObjectValues(dt, ["createdAt", "updatedAt"]))
  //         .filter((dt) => typeof dt === "object" && !!dt)
  //     );
  //   }
  // }, [providersRes?.data?.data]);

  return (
    <TabsContent value="groups" className="mt-0">
      <Card>
        <CardHeader>
          <CardTitle>Groups Management</CardTitle>
          <CardDescription>Manage your groups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {commonGroupsLoading || providersLoading ? (
            <div className="flex flex-col items-center py-2 gap-2">
              <RotatingLoader variant={"default"}></RotatingLoader>
              <p className="text-muted-foreground">Fetching.....</p>
            </div>
          ) : (
            <>
              <h4 className="text-lg font-medium">Your groups</h4>
              <div className="auto-form-grid">
                {groupsLoading ? (
                  Array(6).fill(
                    <Skeleton count={1} className="rounded-xl h-[100px]" />
                  )
                ) : groupsState.value.length ? (
                  groupsState.value.map((dt, i) => (
                    <Card key={`user-grp-${i}`} className="">
                      <CardHeader>
                        <CardTitle>{dt.name}</CardTitle>
                        <CardDescription className="flex gap-3 items-center justify-between">
                          Original : {getNameOfGroup(dt.referenceGroup || "")}
                          <DialogModal
                            triggerProps={{
                              children: (
                                <ActionButton
                                  variant={"destructive"}
                                  loading={deleteLoading}
                                >
                                  <Trash2 />
                                </ActionButton>
                              ),
                            }}
                            titleProps={{
                              children: "Delete group confirmation",
                            }}
                            descriptionProps={{
                              children:
                                "Are you sure to delete your group? It will also be removed from your users playlists",
                            }}
                            footerProps={{
                              children: (
                                <>
                                  <ActionButton
                                    variant={"destructive"}
                                    onClick={() => {
                                      handleDelete(dt.id);
                                    }}
                                    loading={deleteLoading}
                                  >
                                    <div className="flex gap-2 items-center">
                                      Delete <Trash2 />
                                    </div>
                                  </ActionButton>
                                  <DialogClose ref={dialogRef} />
                                </>
                              ),
                            }}
                          />
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    No groups you have. Create some !
                  </p>
                )}
              </div>

              {/* Form modal */}
              <DialogModal
                showClose={false}
                footerProps={{
                  children: (
                    <>
                      <DialogClose ref={dialogRef} />
                    </>
                  ),
                }}
                triggerProps={{
                  children: (
                    <ActionButton>
                      <div className="flex gap-2 items-center">
                        <PlusIcon /> Create New
                      </div>
                    </ActionButton>
                  ),
                }}
              >
                <form
                  className="flex flex-col gap-3"
                  onSubmit={handleSubmit(handleCreate)}
                >
                  <FormField
                    label={"Group Name"}
                    required
                    {...register("name")}
                    error={errors.name}
                  />
                  <FormField
                    label={"Reference Group"}
                    required
                    error={errors.referenceGroup}
                  >
                    <GroupedSearchSelect
                      items={commonGroupsState.value.map((dt) => ({
                        label: dt.name,
                        value: dt.id,
                        group: dt.provider.toString(),
                        searchValue: dt.name.toLowerCase(),
                      }))}
                      groups={providersState.value.map((dt) => ({
                        label: dt.name,
                        value: dt.aliasId.toString(),
                      }))}
                      triggerProps={{
                        children: (
                          <Input
                            className="min-h-[40px]"
                            type="button"
                            value={displaySelectedGroup()}
                          />
                        ),
                      }}
                      contentProps={{ className: "max-h-[300px]" }}
                      onSelect={(item) => {
                        // console.log(item);
                        setValue("referenceGroup", item.value, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </FormField>
                  <div className="py-2"></div>
                  <ActionButton type="submit" loading={loading}>
                    Create
                  </ActionButton>
                </form>
              </DialogModal>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
