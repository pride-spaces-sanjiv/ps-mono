import { useParams } from "react-router-dom";

const SpaceEditPage = () => {
  const { id } = useParams();
    console.log(id);

  // const totalCredits = userStore((state) =>
  //   validateNumber(state.value?.credits, { invalidValue: 0 }),
  // );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">      Edit space with id: {id} 
!!!</h1>
        {/* <UserCreateModal /> */}
      </div>
      {/* <UsersTabledResults /> */}
    </div>
  );
};

export default SpaceEditPage;