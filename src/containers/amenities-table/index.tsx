import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { getOperators } from "@/services/apis/admin/operators";
import { keepPreviousData } from "@tanstack/react-query";
import type { Operator } from "@/types/data/operators";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type ColumnFiltersState, type SortingState, type VisibilityState } from "@tanstack/react-table";
import React from "react";
import { cn } from "@/utils/className";
import { SelectPicker } from "@/components/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, MoreHorizontal, Table } from "lucide-react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/utils/query-keys";

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



const AmenitiesTabledResults = ({
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
  const [search, setSearch] = useState({ field: "Name", value: "" });

  const debouncedSearch = useDebouncer(search, 500);
    const {
    data: res,
    isFetching,
    page,
    setPage,
  } = usePaginatedQuery({
    limit: 10,
    queryKey: [
      queryKeys.OPERATORS,
      debouncedSearch.field,
      debouncedSearch.value,
    ],
    queryFn: (page, limit) =>
      getOperators({
        query: {
          page: page + 1,
          limit: limit,
          withOperator: true,
          ...((operatorId && { operator: operatorId || "" }) || null),
          [`s${debouncedSearch.field}`]: debouncedSearch.value,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const operators: Operator[] = useMemo(
    () => ((res?.data?.data?.results ?? []) as Operator[]).filter(Boolean),
    [res?.data?.data?.results],
  );
  console.log("operators", operators);

  // Columns definition
  const columns: ColumnDef<Operator>[] = useMemo(
    () => [
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
        cell: ({ row }) => <div>{row.getValue("name") || "-"}</div>,
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
        cell: ({ row }) => <div>{row.getValue("icon") || "-"}</div>,
      },
      {
        accessorKey: "type",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Type
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
          <div>{row.getValue("type") || "-"}</div>
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
              Created At
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
        cell: ({ row }) => <div>{row.getValue("createdAt") || "-"}</div>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Status
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
        cell: ({ row }) => <div>{row.getValue("status") || "-"}</div>,
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigate(`/operators/${row.original.id}`)}
                >
                  Show details
                </DropdownMenuItem>
                {/* <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Delete Operator
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [navigate],
  );
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const table = useReactTable({
    data: operators,
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


    return(
    <div {...props} className={cn("", className)}>
      {/* Search  */}
      <div className={cn("admin-table-toolbar")}>
        <Input
          placeholder={`Search by ${search.field.toLowerCase()}...`}
          {...inputProps}
          onChange={(e) => {
            setSearch((prev) => ({
              ...prev,
              value: e.currentTarget.value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " "),
            }));
            inputProps?.onChange?.(e);
          }}
          className={cn("admin-search-input", inputProps?.className)}
        />

        <SelectPicker
          className="admin-filter-select"
          valueProps={{ defaultValue: "Name", placeholder: "Select a field" }}
          wrapperProps={{
            onValueChange(value) {
              setSearch({ value: "", field: value });
            },
          }}
          items={["Name", "Headquarter", "Person Name"].map((s) => ({
            label: s,
            value: s,
          }))}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="admin-columns-btn">
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
      <div className="admin-table-frame">
        <Table className="admin-data-table min-w-[1120px]">
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  No operators found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        {/* <div className="text-muted-foreground text-sm">
                {table.getFilteredSelectedRowModel().rows?.length} of{" "}
                {Math.min(table.getFilteredRowModel().rows?.length)} row(s) selected.
              </div> */}
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
        
    )
}


export default AmenitiesTabledResults;