import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
// import { getOperators } from "@/services/apis/admin/operators";
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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/utils/query-keys";
import { datifyObjectValues } from "@/utils/object/datify";
import { formatOpenDays } from "@/utils/data/days";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
// import { operators } from "./operator";
import type { Operator } from "@/types/data/operators";
import { getOperators } from "@/services/apis/admin/operators";

const OperatorsTabledResults = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebouncer(search, 500);

const {
  data: res,
  isFetching,
} = usePaginatedQuery({
  limit: 10,
  queryKey: [queryKeys.OPERATORS],
  queryFn: () => getOperators(),
  placeholderData: keepPreviousData,
});

const operators: Operator[] = useMemo(
  () =>
    ((res?.data?.data?.results ?? []) as Operator[]).filter(Boolean),
  [res?.data?.data?.results]
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
        cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
      },
{
  accessorKey: "headquarter.address",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Headquarter
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
    <div>{row.original.headquarter?.address || "-"}</div>
  ),
},
{
  accessorKey: "person.name",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Person Name
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
    <div>{row.original.person?.name || "-"}</div>
  ),
},
{
  accessorKey: "person.email",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Person Email
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
    <div>{row.original.person?.email || "-"}</div>
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
                  onClick={() => navigate(`/operators/${row.original.id}`)}
                >
                  Show details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Delete Operator
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [navigate]
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
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
  });

  return (
    <div

      className=
      "rounded-md border max-w-full overflow-x-auto w-auto"
    >
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
                      header.getContext()
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
                  <TableCell key={cell.id} className="whitespace-normal">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
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
  );
};

export default OperatorsTabledResults;