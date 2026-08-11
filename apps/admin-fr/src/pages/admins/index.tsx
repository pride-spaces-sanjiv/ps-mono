import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminsTable from "@/containers/admins/table";
import ActionButton from "@/components/buttons/action-btn";

export default function AdminsPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Team</h1>
        <ActionButton
          onClick={() => {
            navigate("/team/new");
          }}
        >
          <div className="flex gap-2 items-center">
            Add a Member
            <Plus />
          </div>
        </ActionButton>
      </div>
      <AdminsTable />
    </div>
  );
}
