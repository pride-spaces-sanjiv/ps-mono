import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import OperatorsTabledResults from "@/containers/operators-table";
import ActionButton from "@/components/buttons/action-btn";

export default function OperatorsPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Operators</h1>
        <ActionButton
          onClick={() => {
            navigate("/operators/new");
          }}
        >
          <div className="flex gap-2 items-center">
            List Operator
            <Plus />
          </div>
        </ActionButton>
      </div>
      <OperatorsTabledResults />
    </div>
  );
}
