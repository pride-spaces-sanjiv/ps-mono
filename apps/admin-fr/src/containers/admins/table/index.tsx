import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  type Column,
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
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import moment from "moment";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { getAdmins, updateAdmin } from "@/services/apis/admin/admins";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { datifyObjectValues } from "@/utils/object/datify";
import { cn } from "@/utils/className";
import { getAdminLabel, type AdminLevel } from "@/utils/data/admin";
import { queryKeys } from "@/utils/query-keys";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectPicker } from "@/components/select";
import type { Admin } from "@/types/data/user";
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

const SortableHeader = ({
  column,
  children,
}: {
  column: Column<Admin, unknown>;
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
  return (
    <div
      className={cn("max-w-[220px] truncate whitespace-nowrap", className)}
      title={typeof children === "string" ? children : undefined}
    >
      {children || "-"}
    </div>
  );
};

const AdminsTable = ({
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
      queryKeys.ADMINS,
      debouncedSearch.field,
      debouncedSearch.value,
    ],
    queryFn: (page, limit) =>
      getAdmins({
        query: {
          page: page + 1,
          limit: limit,
          [`s${debouncedSearch.field}`]: debouncedSearch.value,
        },
      }),
    placeholderData: keepPreviousData,
  });

  // Update status mutation
  const { mutateAsync: updateMutater, isPending: isUpdating } = useMutation({
    mutationFn: updateAdmin,
  });

  const admins: Admin[] = useMemo(
    () =>
      ((res?.data?.data?.results ?? []) as Admin[])
        .map((dt) => datifyObjectValues(dt, ["createdAt", "updatedAt"]))
        .filter(Boolean),
    [res?.data?.data?.results],
  );

  // Columns definition matching Centre table
  const columns: ColumnDef<Admin>[] = useMemo(
    () => [
      {
        accessorKey: "serialNo",
        header: ({ column }) => (
          <SortableHeader column={column}>Serial No</SortableHeader>
        ),
        cell: ({ row }) => <div>{page * limit + (row.index + 1) || "-"}</div>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell className="font-medium text-foreground">
            {row.original?.name}
          </TextCell>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell className="text-foreground">
            {row.original?.email}
          </TextCell>
        ),
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <SortableHeader column={column}>Phone</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell className="text-foreground">
            {row.original?.phone || "-"}
          </TextCell>
        ),
      },
      {
        accessorKey: "level",
        header: ({ column }) => (
          <SortableHeader column={column}>Member Role</SortableHeader>
        ),
        cell: ({ row }) => (
          <div>
            <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {getAdminLabel(row.original.level as AdminLevel) || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <SortableHeader column={column}>Active Status</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Switch
              key={row.original?.isActive ? "active" : "inactive"}
              className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
              defaultChecked={!!row.original?.isActive}
              disabled={isUpdating}
              onCheckedChange={async (checked) => {
                try {
                  await updateMutater({
                    url: row.original.id,
                    body: { isActive: checked },
                  });
                  toast.success("Status updated successfully");
                  refetch();
                } catch (error) {
                  toast.error("Failed to update status");
                }
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Last Updated</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="whitespace-nowrap text-xs text-muted-foreground">
            {row.original?.updatedAt
              ? moment(row.original.updatedAt).format("DD MMM YYYY hh:mm A")
              : "-"}
          </div>
        ),
      },
    ],
    [navigate, page, limit, isUpdating, updateMutater, refetch],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: admins,
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
          className="admin-filter-select"
          valueProps={{ defaultValue: "Name", placeholder: "Select a field" }}
          wrapperProps={{
            onValueChange(value) {
              setSearch({ value: "", field: value });
            },
          }}
          items={["Name", "Email", "Username", "Phone"].map((s) => ({
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
        <Table className="admin-data-table min-w-full">
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
                  onDoubleClick={() => navigate(`/team/${row.original?.id}`)}
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
                  className="text-center py-4 font-medium"
                >
                  No team members found
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

export default AdminsTable;
