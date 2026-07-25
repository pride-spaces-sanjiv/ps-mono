import { useNavigate } from "react-router-dom";
import MigrationsTabledResults from "@/containers/migrations-table";

const MigrationsPage = () => {
  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Migrations </h1>
      </div>
      <div className="py-4"></div>
      <h1 className="text-lg font-semibold">Upload Migration Data </h1>
      <div className="py-4"></div>
      <h1 className="text-lg font-semibold">All Migrations </h1>
      <MigrationsTabledResults />
    </div>
  );
};
export default MigrationsPage;
