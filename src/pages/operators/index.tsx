import OperatorsTabledResults from "@/containers/operators-table";


export default function OperatorsPage() {

  return (
        <div className="admin-page-shell">
            <div className="admin-page-header">
                <h1 className="text-2xl font-semibold">Operators: </h1>
            </div>
            <OperatorsTabledResults/>
        </div>
  );
}
