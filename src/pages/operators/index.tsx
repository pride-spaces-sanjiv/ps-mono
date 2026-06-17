import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import OperatorsTabledResults from "@/containers/operators-table";
import SpacesTabledResults from "@/containers/spaces-table";
import ActionButton from "@/components/buttons/action-btn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OperatorsPageProps = {
  defaultTab?: "operator" | "centre";
};

export default function OperatorsPage({
  defaultTab = "operator",
}: OperatorsPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Space Operators</h1>
        {activeTab === "operator" && (
          <ActionButton
            onClick={() => {
              navigate("/operators/new");
            }}
          >
            <div className="flex gap-2 items-center">
              List Operator
              <Plus />
            </div>
          </ActionButton>
        )}
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="operator">Operator</TabsTrigger>
          <TabsTrigger value="centre">Centre</TabsTrigger>
        </TabsList>
        <TabsContent value="operator">
          <OperatorsTabledResults />
        </TabsContent>
        <TabsContent value="centre">
          <SpacesTabledResults />
        </TabsContent>
      </Tabs>
    </div>
  );
}
