import OperatorsTabledResults from "@/containers/operators-table";


export default function OperatorsPage() {

  return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-semibold">Space Operators: </h1>
            </div>
            <OperatorsTabledResults/>
        </div>
  );
}