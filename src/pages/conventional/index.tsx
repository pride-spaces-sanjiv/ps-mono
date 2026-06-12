import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConventionalTable from "@/containers/conventional-table";

export default function ConventionalPage() {
  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Conventional</h1>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="landlord">Landlord</TabsTrigger>
        </TabsList>
        <TabsContent value="builder">
          <ConventionalTable mode="builder" />
        </TabsContent>
        <TabsContent value="landlord">
          <ConventionalTable mode="landlord" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
