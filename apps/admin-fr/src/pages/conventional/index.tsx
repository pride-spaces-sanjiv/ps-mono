import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import ConventionalTable from "@/containers/conventional-table";

export default function ConventionalPage() {
  const [searchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");

    return tab === "landlord" || tab === "builder" ? tab : "builder";
  }, [searchParams]);
  const subheading = activeTab === "landlord" ? "Others" : "Grade A";

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Conventional Spaces</h1>
      </div>

      <Tabs
        value={activeTab}
        className="w-full"
      >
        <TabsContent value="builder">
          <h2 className="mb-4 text-xl font-semibold">{subheading}</h2>
          <ConventionalTable mode="builder" />
        </TabsContent>
        <TabsContent value="landlord">
          <h2 className="mb-4 text-xl font-semibold">{subheading}</h2>
          <ConventionalTable mode="landlord" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
