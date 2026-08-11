import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, type DeepPartial, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import moment from "moment";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
import {
  keepPreviousData,
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type GlobalFilterTableState,
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  FormInput,
  MoreHorizontal,
  Plus,
  Trash,
} from "lucide-react";
import { useUser } from "@/services/hooks/use-user";
import { useAutoMediaDataFetch } from "@/services/hooks/useAutoMediaData";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { getCommonChannels, updateChannel } from "@/services/apis/common";
import { parsePlaylist } from "@/services/apis/admin-playlist";
import {
  channelSchema,
  keyTypes,
  streamTypes,
  type ChannelSchema,
} from "@/utils/schemas/channel";
import {
  parsePlaylistSchema,
  type ParsePlaylistSchema,
} from "@/utils/schemas/playlist";
import { handleAxiosErrorCases } from "@/utils/axios/error";
import { validateNumber } from "@/utils/number";
import { datifyObjectValues } from "@/utils/object/datify";
import { cn } from "@/utils/className";
import { queryKeys } from "@/utils/query-keys";
import GroupsSelectPicker from "@/components/groups-selector";
import { DialogModal } from "@/components/dialog";
import { SelectPicker } from "@/components/select";
// import LazyPrismEditor from "@/components/lazy-prism-editor";
import AddChannelDialog from "@/components/dialogs/add-channel";
import HeaderList from "@/components/list/header-list";
import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import type {
  DatifiedChannel,
  Channel,
  DatifiedGroup,
  DatifiedProvider,
} from "@/types/data/media";

function PlaylistParseForm({
  data,
  groups,
  provider,
  onParseSuccess,
  onParseFailed,
  userLevel = 0,
  formReturns,
  mutationReturns,
}: Partial<{
  data: DatifiedChannel;
  groups: DatifiedGroup[];
  provider: DatifiedProvider;
  onParseSuccess: (res: Awaited<ReturnType<typeof parsePlaylist>>) => any;
  onParseFailed: (err: Error) => any;
  userLevel: number;
}> & {
  formReturns: UseFormReturn<
    Required<ParsePlaylistSchema>,
    unknown,
    ParsePlaylistSchema
  >;
  mutationReturns: UseMutationResult<
    Awaited<ReturnType<typeof parsePlaylist>>,
    Error,
    ParsePlaylistSchema
  >;
}) {
  // const formReturns = useForm({
  //   resolver: yupResolver(parsePlaylistSchema),
  // });

  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useMemo(() => formReturns, [formReturns]);

  console.log(errors);

  const headers = useMemo(() => watch("headers"), [watch()]);

  const dialogRef = useRef<HTMLButtonElement | null>(null);

  const [headersData, setHeadersData] = useState<
    { key: string; value: string }[]
  >([]);

  const {
    mutateAsync: parseAPI,
    isPending: parseLoading,
    data: parsedRes,
  } = useMemo(() => mutationReturns, [mutationReturns]);

  const updateData = async (body: ParsePlaylistSchema) => {
    try {
      const res = await parseAPI(body);
      if (res.status === 200) {
        toast.success("Parsed playlist info successfully");
        dialogRef.current?.click();

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

  return (
    <form
      className="auto-form-grid pt-4"
      onSubmit={formReturns.handleSubmit(updateData)}
    >
      <FormField
        label={"Playlist Url"}
        placeholder="https://playlist-domain.com/file.m3u"
        required
        error={errors.url}
        {...register("url")}
      />
      {/* @ts-ignore */}
      <FormField label={"Headers"} required error={errors.headers}>
        <HeaderList
          onChange={(items) => {
            const headers = Object.fromEntries(items);
            // console.log("New headers :", headers);
            setValue("headers", headers, { shouldValidate: true });
          }}
        />
        {/* <LazyPrismEditor
          className="w-full"
          // loaderProps={{}}
          textareaProps={{
            placeholder: `{"Header": "Value"}`,
            "aria-label": "JSON editor",
          }}
          onUpdate={(val) => {
            try {
              const parsed = JSON.parse(val);
              setValue("headers", parsed, { shouldValidate: true });
            } catch (err) {}
          }}
        />*/}
      </FormField>
      <div className="py-2"></div>
      <ActionButton
        loading={parseLoading}
        className="col-span-full w-fit"
        type="submit"
      >
        Parse
      </ActionButton>
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
export default function AdminPlaylistParse({
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

  const { userStoreState, userLevel, userData } = useUser({ promiseDelay: 1 });

  const search = (query.get("search") || "").toLowerCase().trim();
  const debouncedSearch = useDebouncer(search, 500);

  const [groups, setGroups] = useState([] as string[]);
  const [page, setPage] = useState(0);

  // const {
  //   // watch,
  //   // setValue,
  //   // register,
  //   // formState: { errors },
  //   PlaylistParseForm,
  //   // mutationReturns: {
  //   //   mutateAsync: parseAPI,
  //   //   isPending: parseLoading,
  //   //   data: parsedRes,
  //   // },
  // } = usePlaylistParseForm({ userLevel });
  // const PlaylistParseFormMem = useMemo(
  //   () => PlaylistParseForm,
  //   [PlaylistParseForm],
  // );

  const formReturns = useForm({
    resolver: yupResolver(parsePlaylistSchema),
  });
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = useMemo(() => formReturns, [formReturns]);
  const mutationReturns = useMutation({
    // @ts-ignore
    mutationFn: (body: ParsePlaylistSchema) => parsePlaylist({ body: body }),
    retry: 2,
  });
  const {
    mutateAsync: parseAPI,
    isPending: parseLoading,
    data: parsedRes,
  } = useMemo(() => mutationReturns, [mutationReturns]);

  const formData = watch();

  const { providersState, commonGroupsState } = useAutoMediaDataFetch();

  const enabledProviderIds = useMemo(
    () =>
      (providersState.value || [])
        .filter((dt) => dt.enabled)
        .map((dt) => dt.aliasId),
    [providersState.value],
  );

  const channels = useMemo(
    () => parsedRes?.data?.data?.channels || [],
    // .map(
    //   (dt) =>
    //     datifyObjectValues(dt, [
    //       "createdAt",
    //       "updatedAt",
    //     ]) as DatifiedChannel,
    // )
    // .filter(
    //   (dt) =>
    //     !!dt &&
    //     // !!dt.enabled &&
    //     !Number.isNaN(validateNumber(dt.provider)) &&
    //     enabledProviderIds.includes(dt.provider as number),
    // ),
    [parsedRes?.data?.data, enabledProviderIds, commonGroupsState.value],
  );

  // Columns definition
  const columns = useMemo<ColumnDef<(typeof channels)[number]>[]>(
    () => [
      // {
      //   id: "existing",
      //   header: "Existing",
      //   cell: ({ row }) => (
      //     <div
      //       className={cn(
      //         "mx-auto w-[14px] aspect-square rounded-[50%]",
      //         row.original === false ? "bg-red-500" : "bg-green-500",
      //       )}
      //     ></div>
      //   ),
      // },
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
        id: "keyType",
        header: "Key Type",
        cell: ({ row }) => (
          <Badge className={cn("capitalize")}>
            {row.original?.keyType?.trim() || "None"}
          </Badge>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <div className="">{row.original.name}</div>,
        // @ts-ignore
        filterFn: "searchName",
      },
      {
        id: "groupName",
        header: "Group",
        cell: ({ row }) => (
          <div className="">{row.original.groupTitle?.trim() || "-"}</div>
        ),
      },
      // {
      //   accessorKey: "createdAt",
      //   header: ({ column }) => {
      //     return (
      //       <Button
      //         variant="ghost"
      //         onClick={() =>
      //           column.toggleSorting(column.getIsSorted() === "asc")
      //         }
      //       >
      //         Creation Date
      //         {column.getIsSorted() === "asc" ? (
      //           <ArrowDown />
      //         ) : column.getIsSorted() === "desc" ? (
      //           <ArrowUp />
      //         ) : (
      //           <ArrowUpDown />
      //         )}
      //       </Button>
      //     );
      //   },
      //   cell: ({ row }) => (
      //     <div>{moment(row.original.createdAt).format("DD MMM YYYY")}</div>
      //   ),
      // },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          return useMemo(
            () => (
              // <DialogModal
              //   triggerProps={{
              //     children: (
              //       <ActionButton variant={"ghost"}>Edit Details</ActionButton>
              //     ),
              //   }}
              //   titleProps={{ children: "Edit Channel Details" }}
              //   descriptionProps={{
              //     children:
              //       "Please make sure everything is correct before saving.",
              //   }}
              // >
              //   <ChannelForm
              //     key={`providers-${providersState.value?.length}|groups-${commonGroupsState.value?.length}|id-${row.original.id}`}
              //     userLevel={userLevel}
              //     data={row.original}
              //     groups={
              //       commonGroupsState.value
              //         ?.filter((gr) => gr.provider === row.original.provider)
              //         .sort((a, b) =>
              //           a.name > b.name ? 1 : a.name < b.name ? -1 : 0,
              //         ) || []
              //     }
              //     provider={providersState.value?.find(
              //       (pr) => pr.aliasId === row.original.provider,
              //     )}
              //     onUpdateSuccess={() => {
              //       refetch();
              //     }}
              //   />
              // </DialogModal>
              <AddChannelDialog
                // @ts-ignore
                data={{ ...row.original, groupTitle: undefined }}
                userLevel={userLevel}
              />
            ),
            [
              row.original,
              userLevel,
              commonGroupsState.value,
              providersState.value,
            ],
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
    [channels],
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
    filterFns: {
      searchName: (row, colId, val) => {
        return row.original.name
          .replace(/ +/, " ")
          .toLowerCase()
          .includes(val.toLowerCase());
      },
    },
    // @ts-ignore
    // globalFilterFn: "searchName",
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({
              pageIndex: page,
              pageSize: 100,
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
        pageSize: 100,
      },
    },
    // manualPagination: true,
    rowCount: parsedRes?.data?.data?.channels?.length || 1,
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
    table.getColumn("name")?.setFilterValue(debouncedSearch.trim());
    if (debouncedSearch.trim()) {
      table.setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedSearch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parse Playlist</CardTitle>
        <CardDescription>
          Input a playlist to parse and get info.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div {...props} className={cn("", className)}>
          <PlaylistParseForm
            userLevel={userLevel}
            // @ts-ignore
            formReturns={formReturns}
            mutationReturns={mutationReturns}
          />

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
                {parseLoading ? (
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
