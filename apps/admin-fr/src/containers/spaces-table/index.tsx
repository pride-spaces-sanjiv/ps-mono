import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
import { days, formatOpenDays } from "@/utils/data/days";
import { queryKeys } from "@/utils/query-keys";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import type { Space } from "@/types/data/spaces";
import { cn } from "@/utils/className";
import { SelectPicker } from "@/components/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import TablePaginationFooter from "@/components/table/pagination";
import { DialogModal } from "@/components/dialog";
import ActionButton from "@/components/buttons/action-btn";
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
  onSave: (val: string | number) => Promise<boolean | void>;
  className?: string;
}

const InlineCellInput = ({
  value: initialValue,
  type = "text",
  onSave,
  className,
  ...props
}: InlineCellInputProps &
  Omit<React.ComponentProps<typeof Input>, keyof InlineCellInputProps>) => {
  const [val, setVal] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const hasPressedEnter = useRef(false);

  useEffect(() => {
    setVal(initialValue);
    hasPressedEnter.current = false;
  }, [initialValue]);

  const handleSave = async () => {
    if (val === initialValue) return;
    setLoading(true);
    try {
      const res = await onSave(type === "number" ? Number(val) : String(val));
      if (res === false) {
        setVal(initialValue);
      }
    } catch {
      // Revert to initial value on failure
      setVal(initialValue);
    } finally {
      setLoading(false);
      hasPressedEnter.current = false;
    }
  };

  const handleBlur = () => {
    if (!hasPressedEnter.current) {
      setVal(initialValue);
    }
  };

  return (
    <div
      className="relative flex items-center w-full"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Input
        {...props}
        type={type}
        min={type === "number" ? 0 : props.min}
        max={type === "number" ? 99999 : props.max}
        value={val}
        disabled={loading}
        onChange={(e) => {
          if (type === "number") {
            const raw = e.target.value;
            if (raw === "") {
              setVal("" as any);
              return;
            }
            let numVal = Math.max(0, Number(raw) || 0);
            if (numVal > 99999) numVal = 99999;
            setVal(numVal);
          } else {
            setVal(e.target.value);
          }
        }}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            hasPressedEnter.current = true;
            handleSave();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setVal(initialValue);
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "h-8 py-1 px-2 text-center text-sm border-border/50 bg-background/30 hover:bg-background/80 focus:bg-background shadow-none",
          className,
        )}
      />
    </div>
  );
};

const SpacesTabledResults = ({
  id,
  operatorId,
  tableWrapperProps,
  tableProps,
  tableHeaderProps,
  tableBodyProps,
  tableRowProps,
  tableHeadProps,
  tableCellProps,
  skeletonProps,
  pagination,
  prevButtonProps,
  nextButtonProps,
  inputProps,
  className,
  ...props
}: Props) => {
  const navigate = useNavigate();
  const { userLevel } = useUser();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState({ field: "Name", value: "" });
  const debouncedSearch = useDebouncer(search, 500);
  const getSpacesApi =
    userLevel === "operator" ? getOperatorSpaces : getAdminSpaces;
  const updateSpaceApi =
    userLevel === "operator" ? updateOperatorSpace : updateAdminSpace;
  const {
    data: res,
    isFetching,
    refetch,
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

  const [pendingInlineUpdate, setPendingInlineUpdate] = useState<{
    spaceId: string;
    updatedFields: Partial<Space>;
    fullSpaceObj?: Space;
    resolve?: (confirmed: boolean) => void;
  } | null>(null);

  const handleUpdateField = async (
    spaceId: string,
    updatedFields: Partial<Space>,
    fullSpaceObj?: Space,
  ) => {
    try {
      const res = await updateMutater({
        url: spaceId,
        body: updatedFields,
      });
      if (res.status === 200 || res.status === 201) {
        toast.success("Centre updated successfully");
        refetch();
      } else {
        throw new Error("Failed to update centre");
      }
    } catch (err: any) {
      console.error("Update space error:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update centre",
      );
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
        // 1. Operator Slug
        {
          accessorKey: "operatorSlug",
          header: ({ column }) => (
            <SortableHeader column={column}>Operator Slug</SortableHeader>
          ),
          cell: ({ row }) => {
            const op = res?.data?.data?.references?.operators?.results?.find(
              (o) => o.id === row.original?.operator,
            );
            return (
              <TextCell>
                {op?.slug || row.original?.operatorSlug || row.original?.slug || "-"}
              </TextCell>
            );
          },
        },
        // 2. Operator Brand Name
        {
          accessorKey: "operatorBrandName",
          header: ({ column }) => (
            <SortableHeader column={column}>Operator Brand Name</SortableHeader>
          ),
          cell: ({ row }) => {
            const op = res?.data?.data?.references?.operators?.results?.find(
              (o) => o.id === row.original?.operator,
            );
            return (
              <TextCell>
                {op?.brandName || op?.name || row.original?.operatorBrandName || "-"}
              </TextCell>
            );
          },
        },
        // 3. Centre Name
        {
          accessorKey: "name",
          header: ({ column }) => (
            <SortableHeader column={column}>Centre Name</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell className="min-w-[220px]">{row.original?.name || "-"}</TextCell>
          ),
        },
        // 4. Address
        {
          accessorKey: "location.address",
          header: ({ column }) => (
            <SortableHeader column={column}>Address</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell className="min-w-[280px]">
              {row.original?.location?.address || "-"}
            </TextCell>
          ),
        },
        // 5. Location URL
        {
          accessorKey: "location.url",
          header: ({ column }) => (
            <SortableHeader column={column}>Location URL</SortableHeader>
          ),
          cell: ({ row }) => {
            const url = row.original?.location?.url;
            return url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline max-w-[220px] truncate block"
              >
                {url}
              </a>
            ) : (
              <EmptyValue />
            );
          },
        },
        // 6. Area - Micro Market
        {
          accessorKey: "location.area",
          header: ({ column }) => (
            <SortableHeader column={column}>Area - Micro Market</SortableHeader>
          ),
          cell: ({ row }) => <TextCell>{row.original?.location?.area || "-"}</TextCell>,
        },
        // 7. Building Type
        {
          accessorKey: "specs.grade",
          header: ({ column }) => (
            <SortableHeader column={column}>Building Type</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>
              {labelledSpaceGrades.find(
                (g) => g.value === row.original?.specs?.grade,
              )?.label ?? row.original?.specs?.grade ?? "-"}
            </TextCell>
          ),
        },
        // 8. OC/NON-OC
        {
          accessorKey: "flags.isOc",
          header: ({ column }) => (
            <SortableHeader column={column}>OC/NON-OC</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>
              {row.original?.flags?.isOc === true
                ? "OC"
                : row.original?.flags?.isOc === false
                ? "Non-OC"
                : "-"}
            </TextCell>
          ),
        },
        // 9. SEZ/Non-SEZ
        {
          accessorKey: "flags.isSez",
          header: ({ column }) => (
            <SortableHeader column={column}>SEZ/Non-SEZ</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>
              {row.original?.flags?.isSez === true
                ? "SEZ"
                : row.original?.flags?.isSez === false
                ? "Non-SEZ"
                : "-"}
            </TextCell>
          ),
        },
        // 10. Operational Since (year)
        {
          accessorKey: "timing.operationalSince",
          header: ({ column }) => (
            <SortableHeader column={column}>Operational Since (year)</SortableHeader>
          ),
          cell: ({ row }) => (
            <div>{row.original?.timing?.operationalSince ?? "-"}</div>
          ),
        },
        // 11. Centre Area In Sq. Ft. (approx)
        {
          accessorKey: "specs.area",
          header: ({ column }) => (
            <SortableHeader column={column}>Centre Area In Sq. Ft. (approx)</SortableHeader>
          ),
          cell: ({ row }) => <div>{row.original?.specs?.area ?? "-"}</div>,
        },
        // 12. Total Seats
        {
          accessorKey: "seats.total",
          header: ({ column }) => (
            <SortableHeader column={column}>Total Seats</SortableHeader>
          ),
          cell: ({ row }) => <div>{row.original?.seats?.total ?? "-"}</div>,
        },
        // 13. Available Seats
        {
          accessorKey: "seats.available",
          header: ({ column }) => (
            <SortableHeader column={column}>Available Seats</SortableHeader>
          ),
          cell: ({ row }) => {
            const available =
              (row.original?.seats?.total ?? 0) -
              (row.original?.seats?.booked ?? 0);
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={available}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.max(0, Math.floor(Number(val)));
                    return new Promise<boolean>((resolve) => {
                      setPendingInlineUpdate({
                        spaceId: row.original.id,
                        updatedFields: {
                          seats: {
                            ...row.original.seats,
                            booked: (row.original?.seats?.total ?? 0) - numVal,
                          },
                        },
                        fullSpaceObj: row.original,
                        resolve,
                      });
                    });
                  }}
                  className="w-20 mx-auto"
                />
              );
            }
            return <div>{available}</div>;
          },
        },
        // Occupancy (%)
        {
          accessorKey: "seats.occupancy",
          header: ({ column }) => (
            <SortableHeader column={column}>Occupancy (%)</SortableHeader>
          ),
          cell: ({ row }) => {
            const total = row.original?.seats?.total ?? 0;
            const booked = row.original?.seats?.booked ?? 0;
            const occupancy =
              total === 0 ? "0.00" : ((booked / total) * 100).toFixed(2);
            return <div>{occupancy}%</div>;
          },
        },
        // 14. Space Type
        {
          accessorKey: "specs.spaceType",
          header: ({ column }) => (
            <SortableHeader column={column}>Space Type</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>
              {labelledSpaceTypes.find(
                (t) => t.value === row.original?.specs?.spaceType,
              )?.label ?? row.original?.specs?.spaceType ?? "-"}
            </TextCell>
          ),
        },
        // 15. State
        {
          accessorKey: "location.state",
          header: ({ column }) => (
            <SortableHeader column={column}>State</SortableHeader>
          ),
          cell: ({ row }) => <TextCell>{row.original?.location?.state || "-"}</TextCell>,
        },
        // 16. City
        {
          accessorKey: "location.city",
          header: ({ column }) => (
            <SortableHeader column={column}>City</SortableHeader>
          ),
          cell: ({ row }) => <TextCell>{row.original?.location?.city || "-"}</TextCell>,
        },
        // 17. Center POC Name
        {
          accessorKey: "person.name",
          header: ({ column }) => (
            <SortableHeader column={column}>Center POC Name</SortableHeader>
          ),
          cell: ({ row }) => <TextCell>{row.original?.person?.name || "-"}</TextCell>,
        },
        // 18. Center POC Email
        {
          accessorKey: "person.email",
          header: ({ column }) => (
            <SortableHeader column={column}>Center POC Email</SortableHeader>
          ),
          cell: ({ row }) => <TextCell>{row.original?.person?.email || "-"}</TextCell>,
        },
        // 19. Center POC Contact No.
        {
          accessorKey: "person.contactNo",
          header: ({ column }) => (
            <SortableHeader column={column}>Center POC Contact No.</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>{row.original?.person?.contactNo || "-"}</TextCell>
          ),
        },
        // 20. Lock In
        // {
        //   accessorKey: "terms.lockIn",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Lock In</SortableHeader>
        //   ),
        //   cell: ({ row }) => <TextCell>{row.original?.terms?.lockIn || "-"}</TextCell>,
        // },
        // // 21. Notice Period
        // {
        //   accessorKey: "terms.noticePeriod",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Notice Period</SortableHeader>
        //   ),
        //   cell: ({ row }) => <TextCell>{row.original?.terms?.noticePeriod || "-"}</TextCell>,
        // },
        // // 22. Security Deposit
        // {
        //   accessorKey: "terms.securityDeposit",
        //   header: ({ column }) => (
        //     <SortableHeader column={column}>Security Deposit</SortableHeader>
        //   ),
        //   cell: ({ row }) => (
        //     <TextCell>{row.original?.terms?.securityDeposit || "-"}</TextCell>
        //   ),
        // },
        // 23. Opening Day
        {
          accessorKey: "timing.openingDay",
          header: ({ column }) => (
            <SortableHeader column={column}>Opening Day</SortableHeader>
          ),
          cell: ({ row }) => {
            if (row.original?.timing?.openingDay) {
              return <TextCell>{row.original.timing.openingDay}</TextCell>;
            }
            const openDays = row.original?.timing?.openDays;
            if (openDays && openDays.length > 0) {
              const sorted = [...openDays].sort((a, b) => a - b);
              return <TextCell>{days[sorted[0] - 1] || "-"}</TextCell>;
            }
            return <TextCell>-</TextCell>;
          },
        },
        // 24. Closing Day
        {
          accessorKey: "timing.closingDay",
          header: ({ column }) => (
            <SortableHeader column={column}>Closing Day</SortableHeader>
          ),
          cell: ({ row }) => {
            if (row.original?.timing?.closingDay) {
              return <TextCell>{row.original.timing.closingDay}</TextCell>;
            }
            const openDays = row.original?.timing?.openDays;
            if (openDays && openDays.length > 0) {
              const sorted = [...openDays].sort((a, b) => a - b);
              return <TextCell>{days[sorted[sorted.length - 1] - 1] || "-"}</TextCell>;
            }
            return <TextCell>-</TextCell>;
          },
        },
        // 25. Opening Time
        {
          accessorKey: "timing.openTime",
          header: ({ column }) => (
            <SortableHeader column={column}>Opening Time</SortableHeader>
          ),
          cell: ({ row }) => <div>{formatTime(row.original?.timing?.openTime)}</div>,
        },
        // 26. Closing Time
        {
          accessorKey: "timing.closeTime",
          header: ({ column }) => (
            <SortableHeader column={column}>Closing Time</SortableHeader>
          ),
          cell: ({ row }) => <div>{formatTime(row.original?.timing?.closeTime)}</div>,
        },
        // 27. Category
        {
          accessorKey: "specs.category",
          header: ({ column }) => (
            <SortableHeader column={column}>Category</SortableHeader>
          ),
          cell: ({ row }) => <TextCell>{row.original?.specs?.category || "-"}</TextCell>,
        },
        // 28. Day Pass
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
                    const numVal = Math.min(99999, Math.max(0, Number(val)));
                    return new Promise<boolean>((resolve) => {
                      setPendingInlineUpdate({
                        spaceId: row.original.id,
                        updatedFields: {
                          pricing: {
                            ...row.original?.pricing,
                            dayPass: numVal,
                          },
                        },
                        fullSpaceObj: row.original,
                        resolve,
                      });
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.dayPass ?? "-"}</div>;
          },
        },
        // 29. Meeting Room
        {
          accessorKey: "pricing.meetingRoom",
          header: ({ column }) => (
            <SortableHeader column={column}>Meeting Room</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.meetingRoom ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.min(99999, Math.max(0, Number(val)));
                    return new Promise<boolean>((resolve) => {
                      setPendingInlineUpdate({
                        spaceId: row.original.id,
                        updatedFields: {
                          pricing: {
                            ...row.original?.pricing,
                            meetingRoom: numVal,
                          },
                        },
                        fullSpaceObj: row.original,
                        resolve,
                      });
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.meetingRoom ?? "-"}</div>;
          },
        },
        // 30. Dedicated Desk
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
                    const numVal = Math.min(99999, Math.max(0, Number(val)));
                    return new Promise<boolean>((resolve) => {
                      setPendingInlineUpdate({
                        spaceId: row.original.id,
                        updatedFields: {
                          pricing: {
                            ...row.original?.pricing,
                            dedicatedDesk: numVal,
                          },
                        },
                        fullSpaceObj: row.original,
                        resolve,
                      });
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.dedicatedDesk ?? "-"}</div>;
          },
        },
        // 31. Flexi/Hot Desk
        {
          accessorKey: "pricing.flexiDesk",
          header: ({ column }) => (
            <SortableHeader column={column}>Flexi/Hot Desk</SortableHeader>
          ),
          cell: ({ row }) => {
            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.flexiDesk ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.min(99999, Math.max(0, Number(val)));
                    return new Promise<boolean>((resolve) => {
                      setPendingInlineUpdate({
                        spaceId: row.original.id,
                        updatedFields: {
                          pricing: {
                            ...row.original?.pricing,
                            flexiDesk: numVal,
                          },
                        },
                        fullSpaceObj: row.original,
                        resolve,
                      });
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.flexiDesk ?? "-"}</div>;
          },
        },
        // 32. Per Seat
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
                    const numVal = Math.min(99999, Math.max(0, Number(val)));
                    return new Promise<boolean>((resolve) => {
                      setPendingInlineUpdate({
                        spaceId: row.original.id,
                        updatedFields: {
                          pricing: {
                            ...row.original?.pricing,
                            perSeat: numVal,
                          },
                        },
                        fullSpaceObj: row.original,
                        resolve,
                      });
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            return <div>{row.original?.pricing?.perSeat ?? "-"}</div>;
          },
        },
        // 33. VO Service
        {
          accessorKey: "pricing.voService",
          header: ({ column }) => (
            <SortableHeader column={column}>VO Service</SortableHeader>
          ),
          cell: ({ row }) => {
            const isVo =
              row.original?.flags?.isVoService ??
              (row.original?.pricing?.voService
                ? row.original.pricing.voService.toUpperCase() === "YES"
                : false);
            const val = isVo ? "Yes" : "No";
            return <TextCell>{val}</TextCell>;
          },
        },
        // 34. VO Price Per month
        {
          accessorKey: "pricing.vo",
          header: ({ column }) => (
            <SortableHeader column={column}>VO Price Per month</SortableHeader>
          ),
          cell: ({ row }) => {
            const isVo =
              row.original?.flags?.isVoService ??
              (row.original?.pricing?.voService
                ? row.original.pricing.voService.toUpperCase() === "YES"
                : false);

            if (!isVo) {
              return <div>-</div>;
            }

            if (userLevel === "operator") {
              return (
                <InlineCellInput
                  value={row.original?.pricing?.vo ?? 0}
                  type="number"
                  onSave={async (val) => {
                    const numVal = Math.min(99999, Math.max(0, Number(val)));
                    return new Promise<boolean>((resolve) => {
                      setPendingInlineUpdate({
                        spaceId: row.original.id,
                        updatedFields: {
                          pricing: {
                            ...row.original?.pricing,
                            vo: numVal,
                          },
                        },
                        fullSpaceObj: row.original,
                        resolve,
                      });
                    });
                  }}
                  className="w-24 mx-auto"
                />
              );
            }
            const price = row.original?.pricing?.vo;
            return <div>{price ? price : "-"}</div>;
          },
        },
        // 35. Workstation size
        {
          accessorKey: "specs.workingSizes",
          header: ({ column }) => (
            <SortableHeader column={column}>Workstation size</SortableHeader>
          ),
          cell: ({ row }) => (
            <TextCell>{formatList(row.original?.specs?.workingSizes)}</TextCell>
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
      ].filter((col) => {
        if (userLevel === "operator") {
          const allowedOperatorColumns = [
            "serialNo",
            "name",
            "seats.available",
            "price",
            "pricing.dayPass",
            "pricing.meetingRoom",
            "pricing.dedicatedDesk",
            "pricing.flexiDesk",
            "pricing.perSeat",
            "pricing.voService",
            "pricing.vo",
            "flags.isActive",
          ];
          return (
            "accessorKey" in col &&
            allowedOperatorColumns.includes(col.accessorKey as string)
          );
        }
        return true;
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

      <DialogModal
        open={!!pendingInlineUpdate}
        onOpenChange={(open) => {
          if (!open) {
            pendingInlineUpdate?.resolve?.(false);
            setPendingInlineUpdate(null);
          }
        }}
        showClose={false}
        contentProps={{
          onPointerDownOutside: (e) => e.preventDefault(),
          onInteractOutside: (e) => e.preventDefault(),
        }}
        titleProps={{ children: "Confirm Changes" }}
        descriptionProps={{
          children: "Are you sure you want to confirm the changes you made?",
        }}
        footerProps={{
          children: (
            <div className="flex justify-end gap-2 mt-4">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => {
                  pendingInlineUpdate?.resolve?.(false);
                  setPendingInlineUpdate(null);
                }}
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="button"
                loading={isUpdating}
                onClick={async () => {
                  if (pendingInlineUpdate) {
                    pendingInlineUpdate.resolve?.(true);
                    await handleUpdateField(
                      pendingInlineUpdate.spaceId,
                      pendingInlineUpdate.updatedFields,
                      pendingInlineUpdate.fullSpaceObj,
                    );
                    setPendingInlineUpdate(null);
                  }
                }}
              >
                Confirm
              </ActionButton>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default SpacesTabledResults;
