import Spacetable from "@/containers/spaces-table/spaces-operator-table";
import AddSpaceDialog from "@/components/dialog/add-space";

export default function SpaceOperatorPage() {

  return (
    <div className="flex flex-col gap-6">

      <div className="flex justify-between items-center">

        <h1 className="text-xl font-semibold">
          Spaces Under Operator
        </h1>

        <AddSpaceDialog />

      </div>

      <Spacetable />

    </div>
  );
}