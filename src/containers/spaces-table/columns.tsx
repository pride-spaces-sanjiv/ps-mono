// src/containers/spaces-table/columns.tsx
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
    // Use a small render component so we can call hooks (useNavigate)
    cell: ({ row }) => {
      const space = row.original;
      // NOTE: calling hooks inside inline functions is OK because this function
      // gets executed as part of React render for the cell.
      const navigate = useNavigate();

      const handleOpenForm = () => {
        // navigate to the edit page for this space (use id)
        navigate(`/space-operator/${space.id}`);
      };

      return (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleOpenForm}>
            Manage
          </Button>
        </div>
      );
    },
  },
];