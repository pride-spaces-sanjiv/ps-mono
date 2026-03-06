import React, { useMemo, useState } from "react";
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
import { usePaginatedQuery } from "@/services/hooks/usePaginatedQuery";
import { getSpaces } from "@/services/apis/spaces";
import type { Space } from "@/types/data/spaces";
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
    MoreHorizontal,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/utils/query-keys";
import { datifyObjectValues } from "@/utils/object/datify";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DisplayPage = () => {
  const navigate = useNavigate();
    const [search, setSearch] = useState("");
  
  const debouncedSearch = useDebouncer(search, 500);


const {
  data: res,
  isFetching,
} = usePaginatedQuery({
  limit: 10,
  queryKey: [queryKeys.SPACES],
  queryFn: () => getSpaces(),
  placeholderData: keepPreviousData,
});

// const spaces = useMemo(
    //   () =>
    //     (res?.data?.data?.results || [])
    //       .map(
        //         (dt) =>
        //           datifyObjectValues(dt, [
        //             "createdAt",
        //             "updatedAt",
        //             "openTime",
        //             "closeTime",
        //           ]) 
        //       )
        //       .filter((dt) => !!dt),
        //   [res?.data?.data]
        // );
        // const spaces = res?.data?.data?.results || [];
        const spaces = [
  {
    id: "1",
    branch: "BR001",
    enterprise: "ENT001",
    name: "Awfis – Cyber Hub",
    email: "cyberhub@awfis.com",
    location: {
      address: "DLF Cyber Hub",
      city: "Gurgaon",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
      lat: 28.4959,
      lng: 77.089,
    },
    description: "Premium coworking space.",
    openTime: "09:00",
    closeTime: "20:00",
    openDays: 5,
    isVerified: true,
    isActive: true,
    rating: 4.6,
    reviews: 210,
    createdAt: "2026-02-28T10:00:00.000Z",
    updatedAt: "2026-02-28T10:00:00.000Z",
  },
  {
    id: "2",
    branch: "BR002",
    enterprise: "ENT002",
    name: "Smartworks – Andheri East",
    email: "andheri@smartworks.com",
    location: {
      address: "MIDC Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400093",
      country: "India",
      lat: 19.1136,
      lng: 72.8697,
    },
    description: "Large coworking campus with meeting rooms.",
    openTime: "09:00",
    closeTime: "21:00",
    openDays: 6,
    isVerified: true,
    isActive: false,
    rating: 4.4,
    reviews: 98,
    createdAt: "2026-02-28T11:00:00.000Z",
    updatedAt: "2026-02-28T11:00:00.000Z",
  },
  {
    id: "3",
    branch: "BR003",
    enterprise: "ENT003",
    name: "IndiQube – Whitefield",
    email: "whitefield@indiqube.com",
    location: {
      address: "Whitefield Main Road",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560066",
      country: "India",
      lat: 12.9698,
      lng: 77.7499,
    },
    description: "Flexible workspace for growing startups.",
    openTime: "08:30",
    closeTime: "19:30",
    openDays: 5,
    isVerified: false,
    isActive: true,
    rating: 4.3,
    reviews: 120,
    createdAt: "2026-02-28T12:00:00.000Z",
    updatedAt: "2026-02-28T12:00:00.000Z",
  },
];
        console.log("spaces", spaces);

    // Columns definition
    const columns: ColumnDef<Space>[]= useMemo(
        () => [

            {
                accessorKey: "branch",
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
                accessorKey: "location",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Location
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
                accessorKey: "description",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Description
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
                cell: ({ row }) => <div>{row.getValue("description") || "-"}</div>,
            },
            {
                accessorKey: "openTime",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Open Time
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
                cell: ({ row }) => <div>{row.getValue("openTime") || "-"}</div>,
            },
            {
                accessorKey: "closeTime",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Close Time
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
                cell: ({ row }) => <div>{row.getValue("closeTime") || "-"}</div>,
            },
            {
                accessorKey: "openDays",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(column.getIsSorted() === "asc")
                            }
                        >
                            Open Days
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
                cell: ({ row }) => <div>{row.getValue("openDays") || "-"}</div>,
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
                                    onClick={() => navigate(`/users/${row.id}`)}
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
    });

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">Spaces: </h1>

            </div>
            <div

                className=
                "rounded-md border max-w-full overflow-x-auto w-auto"
            >
                <Table>
                    {/* <TableCaption>Data of Spaces with there operators.</TableCaption> */}
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Branch</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead >Location</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>OpenTime</TableHead>
                            <TableHead>CloseTime</TableHead>
                            <TableHead>OpenDays</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>

  {spaces.map((space) => (
    <TableRow key={space.id}>
      <TableCell className="font-medium">{space.branch}</TableCell>
      <TableCell className="whitespace-normal">{space.name }</TableCell>
      <TableCell className="whitespace-normal">{space.email}</TableCell>
      <TableCell className="whitespace-normal">
        {space.location.city}, {space.location.state}
      </TableCell>
      <TableCell className="whitespace-normal">{space.description}</TableCell>
      <TableCell>{space.openTime}</TableCell>
      <TableCell>{space.closeTime}</TableCell>
      <TableCell>{space.openDays}</TableCell>
      
    </TableRow>
  ))}               </TableBody>
                    {/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
                </Table>

            </div>
        </div>
    )
}
export default DisplayPage;