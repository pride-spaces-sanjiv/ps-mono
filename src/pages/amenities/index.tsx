import ActionButton from "@/components/buttons/action-btn";
import AmenitiesTabledResults from "@/containers/amenities-table";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Amenities() {
      const navigate = useNavigate();

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">This is Amenities Page!</h1>
                        <ActionButton
          onClick={() => {
            navigate("/operators/new");
          }}
        >
          <div className="flex gap-2 items-center">
            Add Amenities
            <Plus />
          </div>
        </ActionButton>
            </div>
            <AmenitiesTabledResults />
        </div>
    )
};