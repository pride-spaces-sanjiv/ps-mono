import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
import { keepPreviousData } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { getUsers, deleteUser } from "@/services/apis/users";
import { queryKeys } from "@/utils/query-keys";
import { datifyObjectValues } from "@/utils/object/datify";
import { cn } from "@/utils/className";
import type { DatifiedUser } from "@/types/data/user";

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

export default function UsersTabledResults({
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
  const params = useParams();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncer(search, 500);

  const userId = useMemo(
    () => (id || params?.id)?.trim() || undefined,
    [params?.id, id]
  );

  console.log("User", userId);

  const {
    data: res,
    isFetching,
    page,
    setPage,
  } = usePaginatedQuery({
    limit: 10,
    queryKey: [queryKeys.USERS, String(userId), `search=${debouncedSearch}`],
    queryFn: (page, limit) =>
      getUsers({
        query: {
          page: page + 1,
          limit: limit,
          id: userId,
          search: debouncedSearch,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const users = useMemo(
    () =>
      (res?.data?.data?.results || [])
        .map(
          (dt) =>
            datifyObjectValues(dt, [
              "createdAt",
              "updatedAt",
              "expiry",
              "testExpiry",
            ]) as DatifiedUser
        )
        .filter((dt) => !!dt),
    [res?.data?.data]
  );

  // Columns definition
  const columns: ColumnDef<(typeof users)[number]>[] = useMemo(
    () => [
      {
        id: "accountType",
        header: "Account Type",
        cell: ({ row }) => (
          <Badge
            className={cn(
              "capitalize",
              row.original.level === 0 && "bg-green-600",
              row.original.level === 1 && "bg-blue-600",
              row.original.level === 2 && "bg-purple-600"
            )}
          >
            {row.original.level === 0
              ? "Customer"
              : row.original.level === 1
              ? "Reseller"
              : "Admin"}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? "default" : "destructive"}
            className={cn(
              "capitalize",
              row.original.isActive && "bg-green-700",
              row.original.level !== 0 && "bg-transparent text-primary"
            )}
          >
            {row.original.level === 0
              ? row.original.isActive
                ? "active"
                : "inactive"
              : "-"}
          </Badge>
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
        cell: ({ row }) => <div>{row.getValue("name") || "-"}</div>,
      },
      {
        accessorKey: "credits",
        header: () => <div className="text-right">Credits</div>,
        cell: ({ row }) => {
          const credits =
            Number(row.original.level ?? 0) >= 1
              ? String(row.original.credits ?? 0)
              : "-";
          return <div className="font-medium">{credits}</div>;
        },
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
        id: "expiry",
        accessorKey: "expiry",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Expires On
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
            {row.original.level === 0
              ? moment(row.original.expiry).format("DD MMM YYYY")
              : "-"}
          </div>
        ),
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
                  onClick={() => navigate(`/users/${row.original.id}`)}
                >
                  Show details
                </DropdownMenuItem>
                {/* <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Delete User
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [users]
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: users,
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
  }, [userId, debouncedSearch]);

  return (
    <div {...props} className={cn("", className)}>
      <div className={cn("flex items-center py-4")}>
        <Input
          placeholder="Search by name..."
          // value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          {...inputProps}
          onChange={(e) => {
            // table.getColumn("name")?.setFilterValue(e.target.value);
            setSearch(e.target.value.trim().toLowerCase());
            inputProps?.onChange?.(e);
          }}
          className={cn("max-w-sm", inputProps?.className)}
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

      <div
        {...tableWrapperProps}
        className={cn(
          "rounded-md border max-w-full overflow-x-auto w-auto",
          tableWrapperProps?.className
        )}
      >
        <Table
          {...tableProps}
          className={cn(
            "text-center max-w-full overflow-x-auto",
            tableProps?.className
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
                      className={cn("text-center", tableHeadProps?.className)}
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                            skeletonProps?.className
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
                        cell.getContext()
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
                    tableCellProps?.className
                  )}
                >
                  No users found
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
  );
}
