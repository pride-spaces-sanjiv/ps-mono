import { useParams } from "react-router-dom";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

type Space = {
  id: number;
  operatorId: number;
  name: string;
  city: string;
};

const spaces: Space[] = [
  { id: 1, operatorId: 1, name: "Awfis Cyber Hub", city: "Gurgaon" },
  { id: 2, operatorId: 1, name: "Awfis Udyog Vihar", city: "Gurgaon" },
  { id: 3, operatorId: 2, name: "Smartworks Andheri", city: "Mumbai" },
  { id: 4, operatorId: 3, name: "IndiQube Whitefield", city: "Bangalore" },
];

export default function OperatorSpacesPage() {

  const { operatorId } = useParams();

  const operatorSpaces = spaces.filter(
    (space) => space.operatorId === Number(operatorId)
  );

  const columns: ColumnDef<Space>[] = [
    {
      accessorKey: "name",
      header: "Space",
    },
    {
      accessorKey: "city",
      header: "City",
    },
  ];

  const table = useReactTable({
    data: operatorSpaces,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Spaces for Operator {operatorId}
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