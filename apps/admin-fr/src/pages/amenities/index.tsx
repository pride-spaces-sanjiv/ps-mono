import { lazy } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import { SuspensedView } from "@/components/suspensed-view";
import ActionButton from "@/components/buttons/action-btn";

const AmenitiesTable = lazy(() => import("@/containers/amenities/table"));

const Amenities = () => {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Amenities:</h1>
        <ActionButton
          onClick={() => {
            navigate("/amenities/new");
          }}
        >
          <div className="flex gap-2 items-center">
            List Amenity
            <PlusIcon />
          </div>
        </ActionButton>
      </div>
      <SuspensedView>
        <AmenitiesTable />
      </SuspensedView>
    </div>
  );
};
export default Amenities;
