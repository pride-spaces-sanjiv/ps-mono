import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel
} from "@tanstack/react-table";

import type {
  SortingState,
  RowSelectionState
} from "@tanstack/react-table";

import { useQuery } from "@tanstack/react-query";

import { useState } from "react";

import { columns } from "./columns.tsx";
import type { Space } from "./columns.tsx";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ---------- Mock Server API ---------- */

const fetchSpaces = async (
  page: number,
  search: string
): Promise<Space[]> => {

  const data: Space[] = [
    {
      id: 1,
      name: "Awfis Cyber Hub",
      email: "cyberhub@awfis.com",
      city: "Gurgaon",
      state: "Haryana",
      rating: 4.6,
    },
    {
      id: 2,
      name: "Smartworks Andheri",
      email: "andheri@smartworks.com",
      city: "Mumbai",
      state: "Maharashtra",
      rating: 4.2,
    },
    {
      id: 3,
      name: "IndiQube Whitefield",
      email: "whitefield@indiqube.com",
      city: "Bangalore",
      state: "Karnataka",
      rating: 4.8,
    },
  ];

  return new Promise((resolve) =>
    setTimeout(() => resolve(data), 500)
  );
};

export default function SpacesTable() {

  const [sorting, setSorting] = useState<SortingState>([]);          // <- typed
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({}); // optional

  /* ---------- Server Fetch ---------- */

  const { data = [], isLoading } = useQuery({

    queryKey: ["spaces", page, search],

    queryFn: () => fetchSpaces(page, search),

  });

  const table = useReactTable({

    data,

    columns,

    state: { sorting, rowSelection },

    onSortingChange: setSorting,           // now matches OnChangeFn<SortingState>
    onRowSelectionChange: setRowSelection,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

  });

  return (
    <div className="flex flex-col gap-4">

      {/* Search */}

      <Input
        placeholder="Search spaces..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-[300px]"
      />

      {/* Table */}

      <div className="border rounded-lg">

        <table className="w-full">

          <thead>

            {table.getHeaderGroups().map((headerGroup) => (

              <tr key={headerGroup.id}>

                {headerGroup.headers.map((header) => (

                  <th
                    key={header.id}
                    className="p-3 text-left cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >

                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}

                  </th>

                ))}

              </tr>

            ))}

          </thead>

          <tbody>

            {isLoading ? (

              <tr>
                <td className="p-4">Loading...</td>
              </tr>

            ) : (

              table.getRowModel().rows.map((row) => (

                <tr key={row.id} className="border-t">

                  {row.getVisibleCells().map((cell) => (

                    <td key={cell.id} className="p-3">

                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}

                    </td>

                  ))}

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* Pagination */}

      <div className="flex gap-2">

        <Button
          size="sm"
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>

        <Button
          size="sm"
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>

      </div>

    </div>
  );
}