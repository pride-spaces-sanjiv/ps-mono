import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton, { type SkeletonProps } from "react-loading-skeleton";
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
import { keepPreviousData, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
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

const SortableHeader = ({
  column,
  children,
}: {
  column: Column<Space, unknown>;
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

const EmptyValue = () => <span className="text-muted-foreground">-</span>;

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
      className={cn("max-w-[220px] truncate whitespace-nowrap", className)}
      title={title}
    >
      {children || <EmptyValue />}
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
    {value ? "Yes" : "No"}
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

const formatTime = (value?: Date | string | null) => {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatList = (value?: string[] | readonly string[]) =>
  value?.length ? value.join(", ") : "-";

const SpacesTabledResults = ({
  operatorId,
  className,
  inputProps,
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
  //  const spaceId = spaces
  // Columns definition
  const columns: ColumnDef<Space>[] = useMemo(
    () => [
      {
        accessorKey: "serialNo",
        header: ({ column }) => (
          <SortableHeader column={column}>Serial No</SortableHeader>
        ),
        cell: ({ row }) => <div>{page * limit + (row.index + 1) || "-"}</div>,
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <SortableHeader column={column}>Centre ID</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.id}</TextCell>,
      },
      {
        accessorKey: "branch",
        header: ({ column }) => (
          <SortableHeader column={column}>Branch ID</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.branch}</TextCell>,
      },
      {
        accessorKey: "operator",
        header: ({ column }) => (
          <SortableHeader column={column}>Operator</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>
            {(row.original?.operator &&
              res?.data?.data?.references?.operators?.results?.find(
                (op) => op.id === row.original?.operator,
              )?.name) ||
              row.original?.operator}
          </TextCell>
        ),
      },
      {
        accessorKey: "operatorId",
        header: ({ column }) => (
          <SortableHeader column={column}>Operator ID</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.operator}</TextCell>,
      },
      {
        accessorKey: "slug",
        header: ({ column }) => (
          <SortableHeader column={column}>Slug</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.slug}</TextCell>,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell className="min-w-[220px]">{row.original?.name}</TextCell>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Centre Email</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.email}</TextCell>,
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <SortableHeader column={column}>Category</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.category}</TextCell>,
      },
      {
        accessorKey: "spaceType",
        header: ({ column }) => (
          <SortableHeader column={column}>Space Type</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.spaceType}</TextCell>,
      },
      {
        accessorKey: "grade",
        header: ({ column }) => (
          <SortableHeader column={column}>Grade</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.grade}</TextCell>,
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
                } catch {
                  toast.error("Failed to update space");
                }
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "isVerified",
        header: ({ column }) => (
          <SortableHeader column={column}>Verified</SortableHeader>
        ),
        cell: ({ row }) => <BooleanBadge value={row.original?.isVerified} />,
      },
      {
        accessorKey: "totalSeats",
        header: ({ column }) => (
          <SortableHeader column={column}>Total Seats</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.totalSeats ?? "-"}</div>,
      },
      {
        accessorKey: "bookedSeats",
        header: ({ column }) => (
          <SortableHeader column={column}>Booked Seats</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.bookedSeats ?? "-"}</div>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <SortableHeader column={column}>Price</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.price ?? "-"}</div>,
      },
      {
        accessorKey: "rating",
        header: ({ column }) => (
          <SortableHeader column={column}>Rating</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.rating ?? "-"}</div>,
      },
      {
        accessorKey: "reviews",
        header: ({ column }) => (
          <SortableHeader column={column}>Reviews</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.reviews ?? "-"}</div>,
      },
      {
        accessorKey: "operationalHrs",
        header: ({ column }) => (
          <SortableHeader column={column}>Operational Hrs</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.operationalHrs ?? "-"}</div>,
      },
      {
        accessorKey: "workingSizes",
        header: ({ column }) => (
          <SortableHeader column={column}>Working Sizes</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>{formatList(row.original?.workingSizes)}</TextCell>
        ),
      },
      {
        accessorKey: "facilities",
        header: ({ column }) => (
          <SortableHeader column={column}>Facilities</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell className="min-w-[240px]">
            {formatList(row.original?.facilities)}
          </TextCell>
        ),
      },
      {
        accessorKey: "openTime",
        header: ({ column }) => (
          <SortableHeader column={column}>Open Time</SortableHeader>
        ),
        cell: ({ row }) => <div>{formatTime(row.original.openTime)}</div>,
      },
      {
        accessorKey: "closeTime",
        header: ({ column }) => (
          <SortableHeader column={column}>Close Time</SortableHeader>
        ),
        cell: ({ row }) => <div>{formatTime(row.original.closeTime)}</div>,
      },
      {
        accessorKey: "openDays",
        header: ({ column }) => (
          <SortableHeader column={column}>Open Days</SortableHeader>
        ),
        cell: ({ row }) => {
          const openDays = row.original.openDays;
          return <div>{formatOpenDays(openDays)}</div>;
        },
      },
      {
        accessorKey: "location.address",
        header: ({ column }) => (
          <SortableHeader column={column}>Address</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell className="min-w-[280px]">
            {row.original?.location?.address}
          </TextCell>
        ),
      },
      {
        accessorKey: "location.area",
        header: ({ column }) => (
          <SortableHeader column={column}>Area</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.location?.area}</TextCell>,
      },
      {
        accessorKey: "location.city",
        header: ({ column }) => (
          <SortableHeader column={column}>City</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.location?.city}</TextCell>,
      },
      {
        accessorKey: "location.state",
        header: ({ column }) => (
          <SortableHeader column={column}>State</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.location?.state}</TextCell>,
      },
      {
        accessorKey: "location.country",
        header: ({ column }) => (
          <SortableHeader column={column}>Country</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>{row.original?.location?.country}</TextCell>
        ),
      },
      {
        accessorKey: "location.postalCode",
        header: ({ column }) => (
          <SortableHeader column={column}>Postal Code</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>{row.original?.location?.postalCode}</TextCell>
        ),
      },
      {
        accessorKey: "location.lat",
        header: ({ column }) => (
          <SortableHeader column={column}>Latitude</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.location?.lat ?? "-"}</div>,
      },
      {
        accessorKey: "location.lng",
        header: ({ column }) => (
          <SortableHeader column={column}>Longitude</SortableHeader>
        ),
        cell: ({ row }) => <div>{row.original?.location?.lng ?? "-"}</div>,
      },
      {
        accessorKey: "person.name",
        header: ({ column }) => (
          <SortableHeader column={column}>POC Name</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.person?.name}</TextCell>,
      },
      {
        accessorKey: "person.email",
        header: ({ column }) => (
          <SortableHeader column={column}>POC Email</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.person?.email}</TextCell>,
      },
      {
        accessorKey: "person.contactNo",
        header: ({ column }) => (
          <SortableHeader column={column}>POC Contact</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell>{row.original?.person?.contactNo}</TextCell>
        ),
      },
      {
        accessorKey: "person.role",
        header: ({ column }) => (
          <SortableHeader column={column}>POC Role</SortableHeader>
        ),
        cell: ({ row }) => <TextCell>{row.original?.person?.role}</TextCell>,
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <SortableHeader column={column}>Description</SortableHeader>
        ),
        cell: ({ row }) => (
          <TextCell className="min-w-[260px]">
            {row.original?.description}
          </TextCell>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Created At</SortableHeader>
        ),
        cell: ({ row }) => <div>{formatDateTime(row.original?.createdAt)}</div>,
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Updated At</SortableHeader>
        ),
        cell: ({ row }) => <div>{formatDateTime(row.original?.updatedAt)}</div>,
      },
    ],
    [
      isUpdating,
      limit,
      page,
      refetch,
      res?.data?.data?.references?.operators?.results,
      updateMutater,
    ],
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
  }, [debouncedSearch, setPage]);

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
