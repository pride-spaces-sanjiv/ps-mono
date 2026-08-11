import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import OperatorsTabledResults from "@/containers/operators-table";
import SpacesTabledResults from "@/containers/spaces-table";
import ActionButton from "@/components/buttons/action-btn";
import { Tabs, TabsContent } from "@/components/ui/tabs";

type OperatorsPageProps = {
  defaultTab?: "operator" | "centre";
};

export default function OperatorsPage({
  defaultTab = "operator",
}: OperatorsPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");

    return tab === "centre" || tab === "operator" ? tab : defaultTab;
  }, [defaultTab, searchParams]);
  const subheading = activeTab === "centre" ? "Centre" : "Operator";

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Space Operators</h1>
        <ActionButton
          onClick={() => {
            navigate(activeTab === "centre" ? "/spaces/new" : "/operators/new");
          }}
        >
          <div className="flex gap-2 items-center">
            {activeTab === "centre" ? "List Centre" : "List Operator"}
            <Plus />
          </div>
        </ActionButton>
      </div>
      <Tabs
        value={activeTab}
        className="w-full"
      >
        <TabsContent value="operator">
          <h2 className="mb-4 text-xl font-semibold">{subheading}</h2>
          <OperatorsTabledResults />
        </TabsContent>
        <TabsContent value="centre">
          <h2 className="mb-4 text-xl font-semibold">{subheading}</h2>
          <SpacesTabledResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}
