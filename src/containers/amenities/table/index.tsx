import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { getAmenities, updateAmenity } from "@/services/apis/admin/amenity";
import { datifyObjectValues } from "@/utils/object/datify";
import { cn } from "@/utils/className";
import { formatOpenDays } from "@/utils/data/days";
import { queryKeys } from "@/utils/query-keys";
import {
  mappedIcons,
  type LucideIconComponent,
} from "@/components/amenity/selector";
import { SelectPicker } from "@/components/select";
// types
import type { Space } from "@/types/data/spaces";
import type { Amenity } from "@/types/data/amenity";
import moment from "moment";
import TablePaginationFooter from "@/components/table/pagination";

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

const AmenitiesTable = ({
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
}: Partial<Props>) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState({ field: "Name", value: "" });
  const debouncedSearch = useDebouncer(search, 500);

  const {
    data: res,
    isFetching,
    page,
    setPage,
    limit,
    setLimit,
    refetch,
  } = usePaginatedQuery({
    limit: 20,
    queryKey: [
      queryKeys.AMENITIES,
      debouncedSearch.field,
      debouncedSearch.value,
    ],
    queryFn: (page, limit) =>
      getAmenities({
        query: {
          page: page + 1,
          limit: limit,
          [`s${debouncedSearch.field}`]: debouncedSearch.value,
          sortBy: "name",
          sortOrder: "asc",
        },
      }),
    placeholderData: keepPreviousData,
  });

  // Update Active status mutater
  const { mutateAsync: updateMutater, isPending: isUpdating } = useMutation({
    mutationFn: updateAmenity,
  });

  const amenities = useMemo(
    () =>
      ((res?.data?.data?.results ?? []) as Amenity[])
        .map((dt) => datifyObjectValues(dt, ["createdAt", "updatedAt"]))
        .filter((val) => !!val),
    [res?.data?.data],
  );

  // Columns definition
  const columns: ColumnDef<Amenity>[] = useMemo(
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
        cell: ({ row }) => <div>{page * limit + (row.index + 1) || "-"}</div>,
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
        accessorKey: "icon",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Icon
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
          const Icon = mappedIcons.find(
            (icon) => icon.key === row.original?.icon,
          )?.icon as LucideIconComponent | undefined;
          return (
            <div className="flex justify-center">
              <div className="bg-secondary w-fit h-fit rounded-lg px-2 py-2">
                {Icon ? <Icon className="size-[18px] text-white" /> : "-"}
              </div>
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
                    toast.success("Amenity status changed");
                    refetch();
                    return;
                  }
                  throw new Error("Invalid response");
                } catch (err) {
                  toast.error("Failed to update amenity");
                }
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "lastUpdated",
        header: "Last Updated",
        cell: ({ row }) => {
          const time = row.original?.updatedAt;
          if (!time) return "-";

          return moment(time).format("DD MMM YYYY hh:mm A");
        },
      },
    ],
    [navigate, page, limit],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: amenities,
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
          items={["Name", "Icon"].map((s) => ({ label: s, value: s }))}
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
      <div className="rounded-md border max-w-full overflow-x-auto w-auto max-h-[calc(100dvh-300px)]">
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
                  onDoubleClick={() =>
                    navigate(`/amenities/${row.original.id}`)
                  }
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
                  No amenities found
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

export default AmenitiesTable;
