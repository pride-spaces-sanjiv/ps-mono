import { lazy } from "react";

import { SuspensedView } from "@/components/suspensed-view";
const AmenitiesTable = lazy(() => import("@/containers/amenities/table"));

const Amenities = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">This is Amenities Page!</h1>
        {/* <UserCreateModal /> */}
      </div>
      <SuspensedView>
        <AmenitiesTable />
      </SuspensedView>
    </div>
  );
};
export default Amenities;
