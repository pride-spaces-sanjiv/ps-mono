import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type Space = {
  id: number;
  name: string;
  email: string;
  city: string;
  state: string;
  rating: number;
};

export const columns: ColumnDef<Space>[] = [

  {
    accessorKey: "name",
    header: "Space",
  },

  {
    accessorKey: "email",
    header: "Email",
  },

  {
    accessorKey: "city",
    header: "City",
  },

  {
    accessorKey: "state",
    header: "State",
  },

  {
    accessorKey: "rating",
    header: "Rating",
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {

      const space = row.original;

      return (
        <div className="flex gap-2">

          <Button size="sm">
            Edit
          </Button>

          <Button
            size="sm"
            variant="destructive"
          >
            Delete
          </Button>

        </div>
      );
    },
  },
];