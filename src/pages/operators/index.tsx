import { useNavigate } from "react-router-dom";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

type Operator = {
  id: number;
  name: string;
  city: string;
};

const operators: Operator[] = [
  { id: 1, name: "Awfis", city: "Gurgaon" },
  { id: 2, name: "Smartworks", city: "Mumbai" },
  { id: 3, name: "IndiQube", city: "Bangalore" },
];

export default function OperatorsPage() {
  const navigate = useNavigate();

  const columns: ColumnDef<Operator>[] = [
    {
      accessorKey: "name",
      header: "Operator",
    },
    {
      accessorKey: "city",
      header: "City",
    },
    {
      id: "spaces",
      header: "Spaces",
      cell: ({ row }) => {
        const operator = row.original;

        return (
          <Button
            size="sm"
            onClick={() => navigate(`/operators/${operator.id}`)}
          >
            View Spaces
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: operators,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Space Operators
      </h1>

      <div className="border rounded-lg overflow-hidden">

        <table className="w-full">

          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left">
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
            {table.getRowModel().rows.map((row) => (
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
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );
}