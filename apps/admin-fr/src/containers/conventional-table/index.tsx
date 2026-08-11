import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { keepPreviousData } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePaginationFooter from "@/components/table/pagination";
import { SelectPicker } from "@/components/select";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import {
  getBuilders,
  getConventionalProperties,
} from "@/services/apis/admin/conventional";
import { queryKeys } from "@/utils/query-keys";
import { cn } from "@/utils/className";
import type { Builder } from "@/types/data/builder";
import type { ConventionalProperty } from "@/types/data/conventional";

type TableMode = "builder" | "landlord";
type RowData = Builder | ConventionalProperty;

const SortableHeader = ({
  column,
  children,
}: {
  column: any;
  children: React.ReactNode;
}) => (
  <Button
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    {children}
    {column.getIsSorted() === "asc" ? (
      <ArrowDown />
    ) : column.getIsSorted() === "desc" ? (
      <ArrowUp />
    ) : (
      <ArrowUpDown />
    )}
  </Button>
);

const TextCell = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const title = typeof children === "string" ? children : undefined;

  return (
    <div
      className={cn("max-w-[240px] truncate whitespace-nowrap", className)}
      title={title}
    >
      {children || <span className="text-muted-foreground">-</span>}
    </div>
  );
};

const BooleanBadge = ({ value }: { value?: boolean }) => (
  <span
    className={cn(
      "inline-flex rounded-md px-2 py-1 text-xs font-medium",
      value
        ? "bg-emerald-400/15 text-emerald-200"
        : "bg-red-400/15 text-red-200",
    )}
  >
    {value ? "Active" : "Inactive"}
  </span>
);

const formatDateTime = (value?: Date | string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleString([], {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ConventionalTable({ mode }: { mode: TableMode }) {
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
  } = usePaginatedQuery({
    limit: 20,
    queryKey: [
      mode === "builder" ? queryKeys.BUILDERS : queryKeys.CONVENTIONAL,
      debouncedSearch.field,
      debouncedSearch.value,
    ],
    queryFn: (page, limit) =>
      (mode === "builder" ? getBuilders : getConventionalProperties)({
        query: {
          page: page + 1,
          limit,
          [`s${debouncedSearch.field}`]: debouncedSearch.value,
          sortBy: "name",
          sortOrder: "asc",
        },
      }),
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(
    () => ((res?.data?.data?.results ?? []) as RowData[]).filter(Boolean),
    [res?.data?.data?.results],
  );

  const builderColumns: ColumnDef<RowData>[] = useMemo(
    () => [
      {
        accessorKey: "serialNo",
        header: ({ column }) => (
          <SortableHeader column={column}>Serial No</SortableHeader>
        ),
        cell: ({ row }) => <div>{page * limit + row.index + 1}</div>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Builder Name</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original.name}</TextCell>,
      },
      {
        accessorKey: "brandName",
        header: ({ column }) => (
          <SortableHeader column={column}>Brand Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>{(row.original as Builder).brandName}</TextCell>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original.email}</TextCell>,
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <SortableHeader column={column}>Slug</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original.slug}</TextCell>,
      },
      {
        accessorKey: "gstNo",
        header: ({ column }) => (
          <SortableHeader column={column}>GST</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original.gstNo}</TextCell>,
      },
      {
        accessorKey: "cinNo",
        header: ({ column }) => (
          <SortableHeader column={column}>CIN</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{(row.original as Builder).cinNo}</TextCell>,
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        cell: ({ row }) => <BooleanBadge value={row.original.isActive} />,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Created At</SortableHeader>
        ),
        cell: ({ row }) => <div>{formatDateTime(row.original.createdAt)}</div>,
      },
    ],
    [limit, page],
  );

  const landlordColumns: ColumnDef<RowData>[] = useMemo(
    () => [
      {
        accessorKey: "serialNo",
        header: ({ column }) => (
          <SortableHeader column={column}>Serial No</SortableHeader>
        ),
        cell: ({ row }) => <div>{page * limit + row.index + 1}</div>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Property Name</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original.name}</TextCell>,
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <SortableHeader column={column}>Slug</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original.slug}</TextCell>,
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <SortableHeader column={column}>Type</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>{(row.original as ConventionalProperty).type}</TextCell>
        ),
      },
      {
        accessorKey: "grade",
        header: ({ column }) => (
          <SortableHeader column={column}>Grade</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>{(row.original as ConventionalProperty).grade}</TextCell>
        ),
      },
      {
        accessorKey: "location.city",
        header: ({ column }) => (
          <SortableHeader column={column}>City</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>
            {(row.original as ConventionalProperty).location?.city}
          </TextCell>
        ),
      },
      {
        accessorKey: "location.state",
        header: ({ column }) => (
          <SortableHeader column={column}>State</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>
            {(row.original as ConventionalProperty).location?.state}
          </TextCell>
        ),
      },
      {
        accessorKey: "pricing.rent",
        header: ({ column }) => (
          <SortableHeader column={column}>Rent</SortableHeader>
        ),
        cell: ({ row }) => (
          <div>{(row.original as ConventionalProperty).pricing?.rent ?? "-"}</div>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        cell: ({ row }) => <BooleanBadge value={row.original.isActive} />,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Created At</SortableHeader>
        ),
        cell: ({ row }) => <div>{formatDateTime(row.original.createdAt)}</div>,
      },
    ],
    [limit, page],
  );

  const columns = mode === "builder" ? builderColumns : landlordColumns;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data: rows,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
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
      columnVisibility,
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
  }, [debouncedSearch, mode, setPage]);

  return (
    <div>
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder={`Search by ${search.field.toLowerCase()}...`}
          onChange={(event) => {
            setSearch((prev) => ({
              ...prev,
              value: event.currentTarget.value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " "),
            }));
          }}
          className="max-w-sm"
        />
        <SelectPicker
          valueProps={{ defaultValue: "Name", placeholder: "Select a field" }}
          wrapperProps={{
            onValueChange(value) {
              setSearch({ value: "", field: value });
            },
          }}
          items={(mode === "builder"
            ? ["Name", "Brand Name", "Email"]
            : ["Name", "City", "State"]
          ).map((field) => ({ label: field, value: field }))}
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
              .map((column) => (
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
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="admin-table-frame">
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
                  onClick={() =>
                    navigate(`/conventional/${mode}/${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
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
                  className="py-4 text-center font-medium"
                >
                  No {mode === "builder" ? "builders" : "landlord properties"}{" "}
                  found
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
}
