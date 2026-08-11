import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
import { keepPreviousData, useMutation } from "@tanstack/react-query";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { DialogClose } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { useUser } from "@/services/hooks/use-user";
import { useAutoMediaDataFetch } from "@/services/hooks/useAutoMediaData";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { getCommonChannels, updateChannel } from "@/services/apis/common";
import {
  channelSchema,
  addChannelSchema,
  keyTypes,
  streamTypes,
  type ChannelSchema,
  type AddChannelSchema,
} from "@/utils/schemas/channel";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { validateNumber } from "@/utils/number";
import { datifyObjectValues } from "@/utils/object/datify";
import { cn } from "@/utils/className";
import { queryKeys } from "@/utils/query-keys";
import GroupsSelectPicker from "@/components/groups-selector";
import { DialogModal } from "@/components/dialog";
import { SelectPicker } from "@/components/select";
import AddChannelDialog from "@/components/dialogs/add-channel";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import type {
  DatifiedChannel,
  Channel,
  DatifiedGroup,
  DatifiedProvider,
} from "@/types/data/media";
import { testChannelStream } from "@/services/apis/admin-channel";

function ChannelForm({
  data,
  groups,
  provider,
  providersData = [],
  onUpdateSuccess,
  userLevel = 0,
}: Partial<{
  data: DatifiedChannel;
  groups: DatifiedGroup[];
  provider: DatifiedProvider;
  providersData: DatifiedProvider[];
  onUpdateSuccess: (data: DatifiedChannel, groupId: string) => any;
  userLevel: number;
}>) {
  const {
    reset,
    formState: { defaultValues, errors },
    setValue,
    register,
    handleSubmit,
    watch,
  } = useForm({
    resolver: yupResolver(
      addChannelSchema.pick([
        "groupId",
        "enabled",
        "name",
        "keyType",
        "streamType",
        "streamUrl",
      ]),
    ),
    defaultValues: {
      name: data?.name || "",
      groupId: data?.groupId || "",
      enabled: data?.enabled !== false,
      keyType: data?.keyType || undefined,
      streamType: data?.streamType || undefined,
      streamUrl: data?.streamUrl,
    },
  });

  const formData = useMemo(() => watch(), [watch()]);

  console.log("User Level :", userLevel);

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const { mutateAsync: mutater, isPending: loading } = useMutation({
    mutationKey: [queryKeys.COMMONCHANNELS],
    mutationFn: (
      body: Pick<
        AddChannelSchema,
        "groupId" | "enabled" | "name" | "streamType" | "keyType" | "streamUrl"
      >,
      // @ts-ignore
    ) => updateChannel({ query: { id: data?.id }, body: body }),
  });
  const {
    mutateAsync: testStreamMutater,
    isPending: testStreamLoading,
    data: testRes,
  } = useMutation({
    mutationKey: [queryKeys.COMMONCHANNELS, "test-channel", data?.id],
    mutationFn: (
      body: NonNullable<Parameters<typeof testChannelStream>[0]>["body"],
    ) => testChannelStream({ body: body }),
  });
  const testResult = useMemo(
    () =>
      testRes?.data.data
        ? {
            ...testRes?.data.data,
            matchedProviderData:
              providersData.find(
                (pr) => pr.aliasId === testRes?.data.data?.matchedProvider,
              ) || null,
          }
        : null,
    [testRes, providersData, data?.provider],
  );

  const updateData = async (
    body: Pick<
      AddChannelSchema,
      "groupId" | "enabled" | "name" | "keyType" | "streamType" | "streamUrl"
    >,
  ) => {
    try {
      const res = await mutater(body);
      if (res.status === 200) {
        toast.success("Channel updated successfully");
        reset({ groupId: body.groupId });
        dialogRef.current?.click();
        onUpdateSuccess?.(data as DatifiedChannel, body.groupId);
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error updating channel:", err);
      const handled = handleAxiosErrorCases<
        Awaited<ReturnType<typeof updateChannel>>["data"]
      >(err, [
        {
          status: 404,
          handler: (res) => {
            if (res?.data?.errorType?.includes("group-not-found")) {
              toast.error("Group not found. Select something else");
              return;
            }
            toast.error("Failed to update channel");
          },
        },
      ]);
      if (!handled) {
        toast.error("Failed to update channel");
      }
    }
  };

  const handleChannelTest = async () => {
    try {
      const res = await testStreamMutater({
        provider: data?.provider as number,
        streamUrl: formData.streamUrl,
      });
      if (res.status === 200) {
        const data = res.data.data;
        if (!data.isValidToProvider) {
          const provider = providersData.find(
            (pr) => pr.aliasId === data.matchedProvider,
          );
          if (provider) {
            toast.warning(`Stream seems to be for ${provider.name}`);
          }
          toast.warning("Stream seems to be not of for the selected provider");
        }
        toast.success("Stream tested successfully");
        return;
      }
      throw new Error("Invalid response");
    } catch (err) {
      console.error("Error testing stream:", err);
      toast.error("Failed to test stream");
    }
  };

  return (
    <form className="auto-form-grid pt-4" onSubmit={handleSubmit(updateData)}>
      <DialogClose type="button" className="size-0 opacity-0" ref={dialogRef} />
      <FormField
        label={"Name"}
        disabled={userLevel < 3}
        readOnly={userLevel < 3}
        {...register("name")}
      />
      <FormField label={"Group"} required error={errors.groupId}>
        <SelectPicker
          // key={`groups-${groups?.length}`}
          wrapperProps={{
            defaultValue: data?.groupId,
            onValueChange: (val) =>
              setValue("groupId", val, { shouldValidate: true }),
          }}
          className="w-full"
          items={groups?.map((gr) => ({ label: gr.name, value: gr.id }))}
          defaultValue={data?.groupId}
        />
      </FormField>
      <FormField
        label={"Provider"}
        disabled
        readOnly
        value={provider?.name || "No provider"}
      />

      {userLevel >= 3 && (
        <>
          <FormField label={"Key Type"} error={errors.keyType}>
            <SelectPicker
              wrapperProps={{
                defaultValue: data?.keyType,
                onValueChange: (val) =>
                  setValue(
                    "keyType",
                    val === String(undefined)
                      ? undefined
                      : (val as NonNullable<typeof data>["keyType"]),
                    {
                      shouldValidate: true,
                    },
                  ),
              }}
              className="w-full"
              items={keyTypes
                .map((state) => ({
                  label: state[0].toUpperCase() + state.slice(1).toLowerCase(),
                  value: state as typeof state | undefined,
                }))
                .concat({ label: "None", value: undefined })}
              defaultValue={data?.keyType}
            />
          </FormField>
          <FormField label={"Stream Type"} error={errors.streamType}>
            <SelectPicker
              wrapperProps={{
                defaultValue: data?.streamType,
                onValueChange: (val) =>
                  setValue(
                    "streamType",
                    val === String(undefined)
                      ? undefined
                      : (val as NonNullable<typeof data>["streamType"]),
                    {
                      shouldValidate: true,
                    },
                  ),
              }}
              className="w-full"
              items={streamTypes
                .map((state) => ({
                  label: state.toUpperCase(),
                  value: state as typeof state | undefined,
                }))
                .concat({ label: "None", value: undefined })}
              defaultValue={data?.streamType}
            />
          </FormField>
        </>
      )}

      <FormField label={"Status"} required error={errors.enabled}>
        <SelectPicker
          // key={`groups-${groups?.length}`}
          wrapperProps={{
            defaultValue: data?.enabled === false ? "Inactive" : "Active",
            onValueChange: (val) =>
              setValue("enabled", val.toLowerCase() === "active", {
                shouldValidate: true,
              }),
          }}
          className="w-full"
          items={["Active", "Inactive"]?.map((state) => ({
            label: state,
            value: state,
          }))}
          defaultValue={data?.enabled === false ? "Inactive" : "Active"}
        />
      </FormField>

      {/* Stream url */}
      {userLevel >= 3 && (
        <FormField
          label={"Stream URL"}
          placeholder="https://domain.com/play.mpd"
          {...register("streamUrl")}
          error={errors.streamUrl}
          required
        />
      )}

      {!!testResult?.redirects.length && (
        <div className="flex flex-col gap-2">
          {testResult.redirects.map((dt, i) => (
            <div
              key={`test-result-${i}`}
              className="rounded-lg border border-secondary-foreground flex overflow-hidden"
            >
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={cn(
                      "py-2 px-3 border-r border-inherit h-full",
                      dt.status >= 400 ? "bg-red-500" : "bg-green-500",
                    )}
                  >
                    {dt.status}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{dt.statusText}</TooltipContent>
              </Tooltip>

              <div className={cn("bg-secondary py-2 px-3 w-full")}>
                {dt.url.href}
              </div>
            </div>
          ))}
          <ActionButton
            className="bg-green-500 hover:bg-green-700"
            onClick={() => {
              const result =
                testResult.redirects[testResult.redirects.length - 1];
              setValue(
                "streamUrl",
                result.url.domain.replace(/\/+$/, "") + result.url.pathname,
              );
            }}
          >
            Replace URL
          </ActionButton>
        </div>
      )}
      {testResult && (
        <div
          className={cn(
            "py-3 text-lg",
            testResult.isValidToProvider
              ? "text-green-500"
              : testResult.matchedProviderData
                ? "text-orange-300"
                : "text-red-500",
          )}
        >
          {testResult.isValidToProvider
            ? `Stream URL matched with  ${providersData.find(
                (pr) => pr.aliasId === data?.provider,
              )}`
            : testResult.matchedProviderData
              ? `Stream URL matched ${
                  testResult.matchedProviderData?.name
                } instead of ${
                  providersData.find((pr) => pr.aliasId === data?.provider)
                    ?.name || "none"
                }`
              : "Stream URL did not matched any provider"}
        </div>
      )}

      <div className="py-2 flex flex-wrap gap-2 justify-between">
        <ActionButton
          variant={"secondary"}
          loading={testStreamLoading}
          className="col-span-full w-fit"
          type="button"
          onClick={() => {
            handleChannelTest();
          }}
        >
          Test Stream
        </ActionButton>
        <ActionButton
          loading={loading}
          className="col-span-full w-fit"
          type="submit"
        >
          Save Changes
        </ActionButton>
      </div>
    </form>
  );
}

type Props = {
  id: string | null;
  tableWrapperProps: React.JSX.IntrinsicElements["div"];
  tableProps: React.ComponentProps<"table">;
  tableHeaderProps: React.ComponentProps<"thead">;
  tableBodyProps: React.ComponentProps<"tbody">;
  tableRowProps: React.ComponentProps<"tr">;
  tableHeadProps: React.ComponentProps<"th">;
  tableCellProps: React.ComponentProps<"td">;
  skeletonProps: Partial<SkeletonProps>;
  pagination: boolean;
  prevButtonProps: Parameters<typeof Button>[0];
  nextButtonProps: Parameters<typeof Button>[0];
  inputProps: Parameters<typeof Input>[0];
} & React.JSX.IntrinsicElements["div"];
export default function ChannelsTab({
  id,
  className,
  pagination = true,
  tableWrapperProps,
  tableProps,
  tableHeaderProps,
  tableBodyProps,
  tableRowProps,
  tableHeadProps,
  tableCellProps,
  prevButtonProps,
  nextButtonProps,
  inputProps,
  skeletonProps,
  ...props
}: Partial<Props>) {
  const navigate = useNavigate();
  const [query, setQuery] = useSearchParams();

  const { userStoreState, userLevel } = useUser({ promiseDelay: 1 });
  const userData = useMemo(() => userStoreState.value, [userStoreState.value]);

  const search = (query.get("search") || "").toLowerCase().trim();
  const debouncedSearch = useDebouncer(search, 500);

  const [groups, setGroups] = useState([] as string[]);

  const {
    data: res,
    isFetching,
    refetch,
    page,
    setPage,
  } = usePaginatedQuery({
    limit: 100,
    queryKey: [
      queryKeys.COMMONCHANNELS,
      `search=${debouncedSearch}`,
      `groups=${groups.join(",")}`,
    ],
    queryFn: (page, limit) =>
      getCommonChannels({
        query: {
          page: page + 1,
          limit: limit,
          onlyEnabledProviders: true,
          sortBy: "name",
          sortOrder: "asc",
          search: debouncedSearch,
          group: groups,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const { providersState, commonGroupsState, providersData, commonGroupsData } =
    useAutoMediaDataFetch();

  const enabledProviderIds = useMemo(
    () =>
      (providersState.value || [])
        .filter((dt) => dt.enabled)
        .map((dt) => dt.aliasId),
    [providersState.value],
  );

  const channels = useMemo(
    () =>
      (res?.data?.data?.results || [])
        .map(
          (dt) =>
            datifyObjectValues(dt, [
              "createdAt",
              "updatedAt",
            ]) as DatifiedChannel,
        )
        .filter(
          (dt) =>
            !!dt &&
            // !!dt.enabled &&
            !Number.isNaN(validateNumber(dt.provider)) &&
            enabledProviderIds.includes(dt.provider as number),
        ),
    [res?.data?.data, enabledProviderIds, commonGroupsState.value],
  );

  // Columns definition
  const columns: ColumnDef<(typeof channels)[number]>[] = useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div
            className={cn(
              "mx-auto w-[14px] aspect-square rounded-[50%]",
              row.original?.enabled === false ? "bg-red-500" : "bg-green-500",
            )}
          ></div>
        ),
      },
      {
        id: "logo",
        header: "Logo",
        cell: ({ row }) =>
          row.original.tvgLogo ? (
            <div className="w-[80px] aspect-video">
              <img
                className="object-contain size-full"
                src={row.original.tvgLogo}
                alt="No-logo"
              />
            </div>
          ) : (
            "No Logo"
          ),
      },
      {
        id: "provider",
        header: "Provider",
        cell: ({ row }) => (
          <Badge className={cn("capitalize")}>
            {providersState.value?.find?.(
              (pr) => pr.aliasId === row.original.provider,
            )?.name || "-"}
          </Badge>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div className="">{row.original.name}</div>,
      },
      {
        id: "groupName",
        header: "Group",
        cell: ({ row }) => (
          <div className="">
            {(row.original.groupId &&
              commonGroupsState.value?.find?.(
                (pr) => pr.id === row.original.groupId,
              )?.name) ||
              "-"}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Creation Date
              {column.getIsSorted() === "asc" ? (
                <ArrowDown />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowUp />
              ) : (
                <ArrowUpDown />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>{moment(row.original.createdAt).format("DD MMM YYYY")}</div>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          return (
            <DialogModal
              triggerProps={{
                children: (
                  <ActionButton variant={"ghost"}>Edit Details</ActionButton>
                ),
              }}
              contentProps={{ className: "max-h-[95dvh] overflow-y-auto" }}
              titleProps={{ children: "Edit Channel Details" }}
              descriptionProps={{
                children:
                  "Please make sure everything is correct before saving.",
              }}
            >
              <ChannelForm
                key={`providers-${providersState.value?.length}|groups-${commonGroupsState.value?.length}|id-${row.original.id}`}
                userLevel={userLevel}
                data={row.original}
                groups={
                  commonGroupsData
                    ?.filter((gr) => gr.provider === row.original.provider)
                    .sort((a, b) =>
                      a.name > b.name ? 1 : a.name < b.name ? -1 : 0,
                    ) || []
                }
                provider={providersData?.find(
                  (pr) => pr.aliasId === row.original.provider,
                )}
                onUpdateSuccess={() => {
                  refetch();
                }}
              />
            </DialogModal>
          );
          // return (
          //   <DropdownMenu>
          //     <DropdownMenuTrigger asChild>
          //       <Button variant="ghost" className="h-8 w-8 p-0">
          //         <span className="sr-only">Open menu</span>
          //         <MoreHorizontal />
          //       </Button>
          //     </DropdownMenuTrigger>
          //     <DropdownMenuContent align="end">
          //       <DropdownMenuLabel>Actions</DropdownMenuLabel>
          //       <DropdownMenuItem
          //       //   onClick={() => navigate(`/users/${row.original.id}`)}
          //       >

          //       </DropdownMenuItem>
          //     </DropdownMenuContent>
          //   </DropdownMenu>
          // );
        },
      },
    ],
    [channels, commonGroupsState.value, providersState.value],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: channels,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({
              pageIndex: page,
              pageSize: res?.data?.data?.metrics?.count || 100,
            })
          : updater;
      console.log(
        "Pagination changed :",
        newState,
        table.getPageCount(),
        table.getRowCount(),
      );
      setPage(newState.pageIndex);
      const qPage = validateNumber(query.get("page"), { isInt: true });
      if (Number.isNaN(qPage) || qPage !== newState.pageIndex + 1) {
        setQuery((prev) => {
          prev.set("page", (newState.pageIndex + 1).toString());
          return prev;
        });
      }
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: page,
        pageSize: res?.data?.data?.metrics?.count || 100,
      },
    },
    manualPagination: true,
    rowCount: res?.data?.data?.metrics?.total || 1,
  });

  useEffect(() => {
    const qPage = validateNumber(query.get("page"), { isInt: true });
    const page = table.getState().pagination.pageIndex;
    console.log(qPage, page, table.getRowCount(), table.getPageCount());
    // if (Number.isNaN(qPage) || qPage < 1) {
    //   const newPage = table.getState().pagination.pageIndex + 1;
    //   setQuery((prev) => {
    //     prev.set("page", newPage.toString());
    //     return prev;
    //   });
    //   setPage(newPage - 1);
    //   return;
    // }
    if (!Number.isNaN(qPage) && qPage > 0 && qPage !== page + 1) {
      table.setPagination((prev) => ({ ...prev, pageIndex: qPage - 1 }));
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      table.setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedSearch]);

  useEffect(() => {
    console.log(
      "GROUPS :",
      commonGroupsState.value?.length,
      commonGroupsState.value,
    );
  }, [commonGroupsState.value]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channels</CardTitle>
        <CardDescription>View and Manage provider channels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div {...props} className={cn("", className)}>
          <div className="py-4 px-3">
            {userLevel >= 3 && (
              <AddChannelDialog
                key={`groups-${commonGroupsState.value.length}`}
                userLevel={userLevel}
              />
            )}
          </div>
          {/* Search and filters */}
          <div
            className={cn("flex gap-2 items-center py-4", "max-lg:flex-wrap")}
          >
            <Input
              placeholder="Search by name..."
              defaultValue={search}
              {...inputProps}
              onChange={(e) => {
                setQuery((prev) => {
                  prev.set(
                    "search",
                    e.target.value.trim().toLowerCase().replace(/ +/g, " "),
                  );
                  return prev;
                });
                inputProps?.onChange?.(e);
              }}
              className={cn("max-w-sm", inputProps?.className)}
            />
            <GroupsSelectPicker
              key={`groups-${commonGroupsState?.value?.length}`}
              placeholder="Filter by groups"
              defaultItems={[]}
              useSelfGroups={false}
              buttonProps={{ className: "min-h-auto max-w-sm w-auto" }}
              onSelect={(groups) => {
                setGroups(groups);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-md:ml-auto">
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div
            {...tableWrapperProps}
            className={cn(
              "rounded-md border max-w-full overflow-x-auto w-auto",
              tableWrapperProps?.className,
            )}
          >
            <Table
              {...tableProps}
              // key={`table-groups-${commonGroupsState.value.length}`}
              className={cn(
                "text-center max-w-full overflow-x-auto",
                tableProps?.className,
              )}
            >
              <TableHeader
                {...tableHeaderProps}
                className={cn("", tableHeaderProps?.className)}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    {...tableRowProps}
                    className={cn("", tableRowProps?.className)}
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          {...tableHeadProps}
                          className={cn(
                            "text-center",
                            tableHeadProps?.className,
                          )}
                          key={header.id}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody
                {...tableBodyProps}
                className={cn("", tableBodyProps?.className)}
              >
                {isFetching ? (
                  Array(5)
                    .fill(null)
                    .map((_, i) => (
                      <TableRow key={i}>
                        {table.getAllLeafColumns().map((col) => (
                          <TableCell
                            {...tableCellProps}
                            className={cn("", tableCellProps?.className)}
                            key={col.id}
                          >
                            <Skeleton
                              count={1}
                              {...skeletonProps}
                              className={cn(
                                "w-full rounded-sm",
                                skeletonProps?.className,
                              )}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      {...tableRowProps}
                      className={cn("", tableRowProps?.className)}
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          {...tableCellProps}
                          className={cn("", tableCellProps?.className)}
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow
                    {...tableRowProps}
                    className={cn("", tableRowProps?.className)}
                  >
                    <TableCell
                      colSpan={columns?.length ?? 0}
                      {...tableCellProps}
                      className={cn(
                        "py-2 text-center font-medium",
                        tableCellProps?.className,
                      )}
                    >
                      No channels found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-lg font-medium">Page : {page + 1}</p>
            {!!pagination && (
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanPreviousPage()}
                  {...prevButtonProps}
                  className={cn("", prevButtonProps?.className)}
                  onClick={(e) => {
                    table.previousPage();
                    prevButtonProps?.onClick?.(e);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanNextPage()}
                  {...nextButtonProps}
                  className={cn("", nextButtonProps?.className)}
                  onClick={(e) => {
                    table.nextPage();
                    nextButtonProps?.onClick?.(e);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
