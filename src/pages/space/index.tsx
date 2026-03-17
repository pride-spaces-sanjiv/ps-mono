import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import ActionButton from "@/components/buttons/action-btn";
import SpacesTabledResults from "@/containers/spaces-table";

const SpacePage = () => {
  const navigate = useNavigate();
  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Centres </h1>
        <ActionButton
          onClick={() => {
            navigate("/spaces/new");
          }}
        >
          <div className="flex gap-2 items-center">
            List Centre
            <Plus />
          </div>
        </ActionButton>
      </div>
      <SpacesTabledResults />
    </div>
  );
};
export default SpacePage;
