import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
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
import { keepPreviousData, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { getSpaces, updateSpace } from "@/services/apis/admin/spaces";
import { datifyObjectValues } from "@/utils/object/datify";
import { formatOpenDays } from "@/utils/data/days";
import { queryKeys } from "@/utils/query-keys";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import type { Space } from "@/types/data/spaces";
import { cn } from "@/utils/className";
import { SelectPicker } from "@/components/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import TablePaginationFooter from "@/components/table/pagination";

type Props = {
  id: string | null;
  operatorId: string | null;
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

const SpacesTabledResults = ({
  id,
  operatorId,
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
}: Partial<Props>) => {
  const navigate = useNavigate();

  // Catch operator id from location state
  const { state: locState } = useLocation();

  const [search, setSearch] = useState({ field: "Name", value: "" });
  const debouncedSearch = useDebouncer(search, 500);

  const {
    data: res,
    isFetching,
    page,
    setPage,
    refetch,
    limit,
    setLimit,
  } = usePaginatedQuery({
    limit: 20,
    queryKey: [
      queryKeys.SPACES,
      debouncedSearch.field,
      debouncedSearch.value,
      operatorId,
    ],
    queryFn: (page, limit) =>
      getSpaces({
        query: {
          page: page + 1,
          limit: limit,
          withOperator: true,
          ...((operatorId && { operator: operatorId || "" }) || null),
          [`s${debouncedSearch.field}`]: debouncedSearch.value,
          sortBy: "name",
          sortOrder: "asc",
        },
      }),
    placeholderData: keepPreviousData,
  });

  // Update Active status mutater
  const { mutateAsync: updateMutater, isPending: isUpdating } = useMutation({
    mutationFn: updateSpace,
  });

  const spaces = useMemo(
    () =>
      ((res?.data?.data?.results ?? []) as Space[])
        .map((dt) =>
          datifyObjectValues(dt, [
            "createdAt",
            "updatedAt",
            "openTime",
            "closeTime",
          ]),
        )
        .filter(Boolean),
    [res?.data?.data],
  );

  // const spaces = res?.data?.data?.results || [];
  //         const spaces = [
  //   {
  //     id: "1",
  //     branch: "BR001",
  //     enterprise: "ENT001",
  //     name: "Awfis – Cyber Hub",
  //     email: "cyberhub@awfis.com",
  //     location: {
  //       address: "DLF Cyber Hub",
  //       city: "Gurgaon",
  //       state: "Haryana",
  //       postalCode: "122002",
  //       country: "India",
  //       lat: 28.4959,
  //       lng: 77.089,
  //     },
  //     description: "Premium coworking space.",
  //     openTime: "09:00",
  //     closeTime: "20:00",
  //     openDays: 5,
  //     isVerified: true,
  //     isActive: true,
  //     rating: 4.6,
  //     reviews: 210,
  //     createdAt: "2026-02-28T10:00:00.000Z",
  //     updatedAt: "2026-02-28T10:00:00.000Z",
  //   },
  // ];
  console.log("spaces", spaces);
  //  const spaceId = spaces
  // Columns definition
  const columns: ColumnDef<Space>[] = useMemo(
    () => [
      {
        accessorKey: "serialNo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Serial No
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
        cell: ({ row }) => <div>{page * 10 + (row.index + 1) || "-"}</div>,
      },
      {
        accessorKey: "operator",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Operator
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
          <div>
            {(row.original?.operator &&
              res?.data?.data?.references?.operators?.results?.find(
                (op) => op.id === row.original?.operator,
              )?.name) ||
              "-"}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Name
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
        cell: ({ row }) => <div>{row.original?.name || "-"}</div>,
      },
      {
        accessorKey: "email",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Email
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
        cell: ({ row }) => <div>{row.original?.person?.email || "-"}</div>,
      },
      {
        accessorKey: "location",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Location
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
        cell: ({ row }) => {
          const location = row.original.location;

          return (
            <div>
              {location?.city}, {location?.state}
            </div>
          );
        },
      },
      {
        accessorKey: "active",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Active Status
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
          <div className="flex justify-center">
            <Switch
              key={row.original?.isActive ? "active" : "inactive"}
              className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
              defaultChecked={!!row.original?.isActive}
              disabled={isUpdating}
              onCheckedChange={async (checked) => {
                try {
                  const res = await updateMutater({
                    url: row.original.id,
                    body: { isActive: checked },
                  });
                  if (res.status === 200) {
                    toast.success("Space state changed");
                    refetch();
                    return;
                  }
                  throw new Error("Invalid response");
                } catch (err) {
                  toast.error("Failed to update space");
                }
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "openTime",
        header: "Open Time",
        cell: ({ row }) => {
          const time = row.original.openTime;
          if (!time) return "-";

          return new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
      {
        accessorKey: "closeTime",
        header: "Close Time",
        cell: ({ row }) => {
          const time = row.original.closeTime;
          if (!time) return "-";

          return new Date(time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
      {
        accessorKey: "openDays",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Open Days
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
        cell: ({ row }) => {
          const openDays = row.original.openDays;
          return <div>{formatOpenDays(openDays)}</div>;
        },
      },
    ],
    [res?.data],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: spaces,
    // @ts-ignore
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
              pageSize: res?.data?.data?.metrics?.count || 10,
            })
          : updater;
      setPage(newState.pageIndex);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: page,
        pageSize: res?.data?.data?.metrics?.count || 10,
      },
    },
    manualPagination: true,
    rowCount: res?.data?.data?.metrics?.total || 1,
  });

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  return (
    <div {...props} className={cn("", className)}>
      {/* Search */}
      <div className={cn("flex items-center py-4 gap-2")}>
        <Input
          placeholder={`Search by ${search.field.toLowerCase()}...`}
          // value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          {...inputProps}
          onChange={(e) => {
            // table.getColumn("name")?.setFilterValue(e.target.value);
            setSearch((prev) => ({
              ...prev,
              value: e.currentTarget.value
                .trim()
                .toLowerCase()
                .replace(/ +/g, " "),
            }));
            inputProps?.onChange?.(e);
          }}
          className={cn("max-w-sm", inputProps?.className)}
        />
        <SelectPicker
          valueProps={{ defaultValue: "Name", placeholder: "Select a field" }}
          wrapperProps={{
            onValueChange(value) {
              setSearch({ value: "", field: value });
            },
          }}
          items={["Name", "City", "State"].map((s) => ({ label: s, value: s }))}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
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
      <div className="rounded-md border max-w-full overflow-x-auto w-auto admin-table-frame">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isFetching ? (
              Array(5)
                .fill(null)
                .map((_, i) => (
                  <TableRow key={i}>
                    {table.getAllLeafColumns().map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="w-full rounded-sm" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onDoubleClick={() => navigate(`/spaces/${row.original?.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-normal">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-4 font-medium"
                >
                  No spaces found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePaginationFooter
        table={table}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        loading={isFetching}
      />
    </div>
  );
};

export default SpacesTabledResults;
