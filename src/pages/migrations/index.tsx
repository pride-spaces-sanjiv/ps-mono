import { useNavigate } from "react-router-dom";
import MigrationsTabledResults from "@/containers/migrations-table";
import SpaceMigrationsUploadSection from "@/containers/space/section/migration-upload";
import { mediaTypes } from "@/utils/data/media";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadLayoutFile,
  uploadMigrationFile,
} from "@/services/apis/admin/file";
import type { UploadedFile } from "@/components/form/file-upload";
import FormSectionTitle from "@/components/form/section/title";
import { queryKeys } from "@/utils/query-keys";
import { queryClient } from "@/App";

const MigrationsPage = () => {
  const { mutateAsync: uploadMutater, isPending: uploadPending } = useMutation({
    mutationFn: uploadMigrationFile,
  });

  const handleFileUpload = async (file: UploadedFile) => {
    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("name", file.file.name);
      formData.append("id", file.id);
      formData.append("contentType", file.file.type);
      formData.append("fileType", "migrationfile");
      const res = await uploadMutater({ body: formData });
      if (res.status === 201 && res?.data?.data?.files) {
        queryClient.invalidateQueries({ queryKey: [queryKeys.MIGRATIONS] });
        toast.success(
          `File uploaded successfully: migration ${file.file.name}`,
        );
        return true;
      }
      throw new Error("Invalid response");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload migration : ${file.file.name}`);
      throw error;
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <h1 className="text-2xl font-semibold">Bulk Centres Upload </h1>
      </div>
      <div className="py-4"></div>
      {/* <h1 className="text-lg font-semibold">Upload Migration Data </h1> */}
      <SpaceMigrationsUploadSection
        titleProps={{ children: "Upload Centres file" }}
        processUpload={async (ref, file, setter) => {
          try {
            const done = await handleFileUpload(file);
            if (!done) {
              throw new Error("Incomplete");
            }
            ref.current?.click?.();
            return {
              status: "completed",
            };
          } catch (err) {
            return { status: "error" };
          }
        }}
      />
      <div className="py-4"></div>
      <FormSectionTitle>All Migrations</FormSectionTitle>
      <MigrationsTabledResults />
    </div>
  );
};
export default MigrationsPage;
