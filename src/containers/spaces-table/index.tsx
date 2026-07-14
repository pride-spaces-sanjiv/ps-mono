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
  Loader2,
} from "lucide-react";
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import {
  getSpaces as getAdminSpaces,
  updateSpace as updateAdminSpace,
} from "@/services/apis/admin/spaces";
import {
  labelledSpaceGrades,
  labelledSpaceTypes,
} from "@/utils/data/spaceTypes";
import {
  getSpaces as getOperatorSpaces,
  updateSpace as updateOperatorSpace,
} from "@/services/apis/operator/spaces";

import { useUser } from "@/services/hooks/use-user";
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

interface InlineCellInputProps {
  value: string | number;
  type?: "text" | "number";
  onSave: (val: string | number) => Promise<void>;
  className?: string;
}

const InlineCellInput = ({
  value: initialValue,
  type = "text",
  onSave,
  className,
}: InlineCellInputProps) => {
  const [val, setVal] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleBlurOrEnter = async () => {
    if (val === initialValue) return;
    setLoading(true);
    try {
      await onSave(type === "number" ? Number(val) : String(val));
    } catch {
      // Revert to initial value on failure
      setVal(initialValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center w-full"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Input
        type={type}
        value={val}
        disabled={loading}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlurOrEnter}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleBlurOrEnter();
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "h-8 py-1 px-2 text-center text-sm border-border/50 bg-background/30 hover:bg-background/80 focus:bg-background shadow-none",
          loading && "pr-8",
          className,
        )}
      />
      {loading && (
        <Loader2 className="absolute right-2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
};

const SpacesTabledResults = ({
  operatorId,
  className,
  inputProps,
  ...props
}: Partial<Props>) => {
  const navigate = useNavigate();
  const { userLevel } = useUser();

  const [search, setSearch] = useState({ field: "Name", value: "" });
  const debouncedSearch = useDebouncer(search, 500);
  const getSpacesApi =
    userLevel === "operator" ? getOperatorSpaces : getAdminSpaces;
  const updateSpaceApi =
    userLevel === "operator" ? updateOperatorSpace : updateAdminSpace;
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
      getSpacesApi({
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
    mutationFn: updateSpaceApi,
  });

  const handleUpdateField = async (
    spaceId: string,
    updatedFields: Partial<Space>,
  ) => {
    try {
      const res = await updateMutater({
        url: spaceId,
        body: updatedFields,
      });
      if (res.status === 200) {
        toast.success("Centre updated successfully");
        refetch();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to update centre");
      throw new Error();
    }
  };

  const spaces = useMemo(
    () =>
      ((res?.data?.data?.results ?? []) as Space[])
        .map((dt) => datifyObjectValues(dt, ["createdAt", "updatedAt"]))
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
    () =>
      [
        {
          accessorKey: "serialNo",
          header: ({ column }) => (
            <SortableHeader column={column}>Serial No</SortableHeader>
          ),
          cell: ({ row }) => <div>{page * limit + (row.index + 1) || "-"}</div>,
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
                "-"}
            </TextCell>
          ),
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
          accessorKey: "slug",
          header: ({ column }) => (
            <SortableHeader column={column}>Slug</SortableHeader>
          ),
          cell: ({ row }) => <TextCell>{row.original?.slug}</TextCell>,
        },
        // {
        //   accessorKey: "email",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Centre Email</SortableHeader>
        //   ),
        //   cell: ({ row }) => <TextCell>{row.original?.email}</TextCell>,
        // },
        {
          accessorKey: "specs.category",
          header: ({ column }) => (
            <SortableHeader column={column}>Category</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>{row.original?.specs?.category}</TextCell>
          ),
        },
        {
          accessorKey: "specs.spaceType",
          header: ({ column }) => (
            <SortableHeader column={column}>Space Type</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>
              {labelledSpaceTypes.find(
                (t) => t.value === row.original?.specs?.spaceType,
              )?.label ?? "-"}
            </TextCell>
          ),
        },
        {
          accessorKey: "specs.grade",
          header: ({ column }) => (
            <SortableHeader column={column}>Building Type</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>
              {labelledSpaceGrades.find(
                (g) => g.value === row.original?.specs?.grade,
              )?.label ?? "-"}
            </TextCell>
          ),
        },
        {
          accessorKey: "flags.isOc",
          header: ({ column }) => (
            <SortableHeader column={column}>OC</SortableHeader>
          ),
          cell: ({ row }) => <BooleanBadge value={row.original?.flags?.isOc} />,
        },
        {
          accessorKey: "flags.isSez",
          header: ({ column }) => (
            <SortableHeader column={column}>SEZ</SortableHeader>
          ),
          cell: ({ row }) => (
            <BooleanBadge value={row.original?.flags?.isSez} />
          ),
        },
        {
          accessorKey: "flags.isVerified",
          header: ({ column }) => (
            <SortableHeader column={column}>Verified</SortableHeader>
          ),
          cell: ({ row }) => (
            <BooleanBadge value={row.original?.flags?.isVerified} />
          ),
        },
        {
          accessorKey: "flags.isActive",
          header: ({ column }) => (
            <SortableHeader column={column}>Active Status</SortableHeader>
          ),
          cell: ({ row }) => (
            <div className="flex justify-center">
              <Switch
                key={row.original?.flags?.isActive ? "active" : "inactive"}
                className="data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                defaultChecked={!!row.original?.flags?.isActive}
                disabled={isUpdating}
                onCheckedChange={async (checked) => {
                  try {
                    const res = await updateMutater({
                      url: row.original.id,
                      body: {
                        flags: {
                          ...row.original.flags,
                          isActive: checked,
                        },
                      },
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
          accessorKey: "seats.total",
          header: ({ column }) => (
            <SortableHeader column={column}>Total Seats</SortableHeader>
          ),
          cell: ({ row }) => <div>{row.original?.seats?.total ?? "-"}</div>,
        },
        {
          accessorKey: "seats.available",
          header: ({ column }) => (
            <SortableHeader column={column}>Available Seats</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={
                    row.original?.seats?.total -
                    (row.original?.seats?.booked ?? 0)
                  }
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Math.floor(Number(val)));
                    await handleUpdateField(row.original.id, {
                      seats: {
                        ...row.original.seats,
                        booked: row.original?.seats?.total - numVal,
                      },
                    });
                  }}
                  className="w-20 mx-auto"
                />
              );
            }
            return <div>{row.original?.seats?.booked ?? "-"}</div>;
          },
        },
        {
          accessorKey: "seats.occupancy",
          header: ({ column }) => (
            <SortableHeader column={column}>Occupancy</SortableHeader>
          ),
          cell: ({ row }) => (
            <div>
              {row.original?.seats?.total === 0
                ? 0
                : (
                    ((row.original?.seats?.booked ?? 0) /
                      (row.original?.seats?.total ?? 0)) *
                    100
                  ).toFixed(2)}{" "}
              %
            </div>
          ),
        },
        {
          accessorKey: "price",
          header: ({ column }) => (
            <SortableHeader column={column}>Price</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.price ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Math.floor(Number(val)));
                    await handleUpdateField(row.original.id, {
                      price: numVal,
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.price ?? "-"}</div>;
          },
        },
        // {
        //   accessorKey: "rating",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Rating</SortableHeader>
        //   ),
        //   cell: ({ row }) => <div>{row.original?.rating ?? "-"}</div>,
        // },
        // {
        //   accessorKey: "reviews",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Reviews</SortableHeader>
        //   ),
        //   cell: ({ row }) => <div>{row.original?.reviews ?? "-"}</div>,
        // },
        {
          accessorKey: "pricing.dayPass",
          header: ({ column }) => (
            <SortableHeader column={column}>Day Pass</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.dayPass ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Number(val));
                    await handleUpdateField(row.original.id, {
                      pricing: {
                        ...row.original?.pricing,
                        dayPass: numVal,
                      },
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.dayPass ?? "-"}</div>;
          },
        },
        {
          accessorKey: "pricing.perSeat",
          header: ({ column }) => (
            <SortableHeader column={column}>Per Seat</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.perSeat ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Number(val));
                    await handleUpdateField(row.original.id, {
                      pricing: {
                        ...row.original?.pricing,
                        perSeat: numVal,
                      },
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.perSeat ?? "-"}</div>;
          },
        },
        {
          accessorKey: "pricing.dedicatedDesk",
          header: ({ column }) => (
            <SortableHeader column={column}>Dedicated Desk</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.dedicatedDesk ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Number(val));
                    await handleUpdateField(row.original.id, {
                      pricing: {
                        ...row.original?.pricing,
                        dedicatedDesk: numVal,
                      },
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.dedicatedDesk ?? "-"}</div>;
          },
        },
        {
          accessorKey: "pricing.flexiDesk",
          header: ({ column }) => (
            <SortableHeader column={column}>Flexi Desk</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.flexiDesk ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Number(val));
                    await handleUpdateField(row.original.id, {
                      pricing: {
                        ...row.original?.pricing,
                        flexiDesk: numVal,
                      },
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.flexiDesk ?? "-"}</div>;
          },
        },
        {
          accessorKey: "pricing.privateCabin",
          header: ({ column }) => (
            <SortableHeader column={column}>Private Cabin</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.privateCabin ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Number(val));
                    await handleUpdateField(row.original.id, {
                      pricing: {
                        ...row.original?.pricing,
                        privateCabin: numVal,
                      },
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.privateCabin ?? "-"}</div>;
          },
        },
        {
          accessorKey: "pricing.vo",
          header: ({ column }) => (
            <SortableHeader column={column}>VO</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.vo ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Number(val));
                    await handleUpdateField(row.original.id, {
                      pricing: {
                        ...row.original?.pricing,
                        vo: numVal,
                      },
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.vo ?? "-"}</div>;
          },
        },
        {
          accessorKey: "timing.operationalHrs",
          header: ({ column }) => (
            <SortableHeader column={column}>Operational Hrs</SortableHeader>
          ),
          cell: ({ row }) => (
            <div>{row.original?.timing?.operationalHrs ?? "-"}</div>
          ),
        },
        {
          accessorKey: "specs.area",
          header: ({ column }) => (
            <SortableHeader column={column}>Area (sq.ft.)</SortableHeader>
          ),
          cell: ({ row }) => <div>{row.original?.specs?.area ?? "-"}</div>,
        },
        {
          accessorKey: "specs.workingSizes",
          header: ({ column }) => (
            <SortableHeader column={column}>Working Sizes</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>{formatList(row.original?.specs?.workingSizes)}</TextCell>
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
          accessorKey: "timing.openTime",
          header: ({ column }) => (
            <SortableHeader column={column}>Open Time</SortableHeader>
          ),
          cell: ({ row }) => (
            <div>{formatTime(row.original?.timing?.openTime)}</div>
          ),
        },
        {
          accessorKey: "timing.closeTime",
          header: ({ column }) => (
            <SortableHeader column={column}>Close Time</SortableHeader>
          ),
          cell: ({ row }) => (
            <div>{formatTime(row.original?.timing?.closeTime)}</div>
          ),
        },
        {
          accessorKey: "timing.openDays",
          header: ({ column }) => (
            <SortableHeader column={column}>Open Days</SortableHeader>
          ),
          cell: ({ row }) => (
            <div>{formatOpenDays(row.original?.timing?.openDays)}</div>
          ),
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
            <SortableHeader column={column}>Area - Micro Market</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>{row.original?.location?.area}</TextCell>
          ),
        },
        {
          accessorKey: "location.city",
          header: ({ column }) => (
            <SortableHeader column={column}>City</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>{row.original?.location?.city}</TextCell>
          ),
        },
        {
          accessorKey: "location.state",
          header: ({ column }) => (
            <SortableHeader column={column}>State</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>{row.original?.location?.state}</TextCell>
          ),
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
        // {
        //   accessorKey: "description",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Description</SortableHeader>
        //   ),
        //   cell: ({ row }) => (
        //     <TextCell className="min-w-[260px]">
        //       {row.original?.description}
        //     </TextCell>
        //   ),
        // },
        // {
        //   accessorKey: "createdAt",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Created At</SortableHeader>
        //   ),
        //   cell: ({ row }) => <div>{formatDateTime(row.original?.createdAt)}</div>,
        // },
        // {
        //   accessorKey: "updatedAt",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Updated At</SortableHeader>
        //   ),
        //   cell: ({ row }) => <div>{formatDateTime(row.original?.updatedAt)}</div>,
        // },
      ].filter((col) => {
        if (userLevel === "operator") {
          const allowedOperatorColumns = [
            "serialNo",
            "name",
            "seats.booked",
            "price",
            "pricing.dayPass",
            "pricing.perSeat",
            "pricing.dedicatedDesk",
            "pricing.flexiDesk",
            "pricing.privateCabin",
            "pricing.vo",
          ];
          return (
            "accessorKey" in col &&
            allowedOperatorColumns.includes(col.accessorKey as string)
          );
        }
        return (
          userLevel !== "operator" ||
          !("accessorKey" in col && col.accessorKey === "operator")
        );
      }),
    [
      isUpdating,
      limit,
      page,
      refetch,
      res?.data?.data?.references?.operators?.results,
      updateMutater,
      userLevel,
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
