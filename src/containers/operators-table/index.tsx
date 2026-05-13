import React, { useEffect, useMemo, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/className";
import { queryKeys } from "@/utils/query-keys";
import { datifyObjectValues } from "@/utils/object/datify";
import { formatOpenDays } from "@/utils/data/days";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
// import { operators } from "./operator";
import type { Operator } from "@/types/data/operators";
import { getOperators } from "@/services/apis/admin/operators";
import { SelectPicker } from "@/components/select";
import LimitSelector from "@/components/table/limit-selector";

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

const OperatorsTabledResults = ({
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
    setLimit,
    limit,
  } = usePaginatedQuery({
    limit: 20,
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
          sortBy: "name",
          sortOrder: "asc",
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
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Operator Registered Name
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
          <div
            className="cursor-pointer rounded-sm border border-transparent px-2 py-1 text-white font-semibold transition duration-150 hover:border-slate-300"
            onClick={() => navigate(`/operators/${row.original.id}`)}
          >
            {row.getValue("name") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "gstNo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              GST
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
        cell: ({ row }) => <div>{row.getValue("gstNo") || "-"}</div>,
      },
      {
        accessorKey: "brandName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Operator Brand Name
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
        cell: ({ row }) => <div>{row.getValue("brandName") || "-"}</div>,
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
              Operator HQ Address
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
        accessorKey: "branches[0].name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              State
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
          <div>{row.original.branches?.[0]?.name || "-"}</div>
        ),
      },
      {
        accessorKey: "branches[0].city",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              City
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
          <div>{row.original.branches?.[0]?.city || "-"}</div>
        ),
      },
      {
        accessorKey: "branches[0].postalCode",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Zip/Pin Code
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
          <div>{row.original.branches?.[0]?.postalCode || "-"}</div>
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
              HQ POC Name
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
        cell: ({ row }) => <div>{row.original.person?.name || "-"}</div>,
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
              HQ POC Email
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
        cell: ({ row }) => <div>{row.original.person?.email || "-"}</div>,
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
              Company Email (For Admin User Login)
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
        accessorKey: "person.contactNo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              HQ POC Mobile No
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
        cell: ({ row }) => <div>{row.original.person?.contactNo || "-"}</div>,
      },
      {
        accessorKey: "headquarter.contactNo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              HQ Landline/Customer Care No
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
          <div>{row.original.headquarter?.contactNo || "-"}</div>
        ),
      },
      {
        accessorKey: "person.role",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              HQ POC Designation
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
        cell: ({ row }) => <div>{row.original.person?.role || "-"}</div>,
      },
      {
        accessorKey: "cinNo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              CIN/LLPIN
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
        cell: ({ row }) => <div>{row.getValue("cinNo") || "-"}</div>,
      },
    ],
    [navigate, page],
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

  useEffect(() => {
    table?.setPageSize(res?.data?.data?.metrics?.count || 10);
  }, [res?.data?.data?.metrics?.count]);

  return (
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
          className=""
          valueProps={{ defaultValue: "Name", placeholder: "Select a field" }}
          wrapperProps={{
            onValueChange(value) {
              setSearch({ value: "", field: value });
            },
          }}
          items={["Operator Registered Name", "Operator HQ Address", "HQ POC Name"].map((s) => ({
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
        <Table className="">
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
        <div className="flex gap-2 items-center">
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
          <p className="text-lg font-medium">
            Page :{" "}
            {!isFetching && (
              <>
                {page + 1} / {table.getPageCount()}
              </>
            )}
          </p>
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
        {!!pagination && (
          <div className="space-x-2">
            <div className="flex gap-2 items-center">
              Limit Records :
              <LimitSelector
                defaultLimit={20}
                onLimitChange={(limit) => {
                  setLimit(limit);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorsTabledResults;
