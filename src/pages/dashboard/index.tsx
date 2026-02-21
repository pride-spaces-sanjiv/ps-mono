import UserCreateModal from "@/containers/user-create-modal";
import UsersTabledResults from "@/containers/users-table";
import { userStore } from "@/services/store/user";
import { validateNumber } from "@/utils/number";

const Dashboard = () => {
  const totalCredits = userStore((state) =>
    validateNumber(state.value?.credits, { invalidValue: 0 }),
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Total Credits: {totalCredits}</h1>
        <UserCreateModal />
      </div>
      <UsersTabledResults />
    </div>
  );
};

export default Dashboard;
