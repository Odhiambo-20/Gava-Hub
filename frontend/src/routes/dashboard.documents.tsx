import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api/dashboard";
import {
  DashboardPage,
  Empty,
  ErrorText,
  Loading,
  Panel,
  Status,
  buttonClass,
  inputClass,
} from "@/components/dashboard/primitives";
export const Route = createFileRoute("/dashboard/documents")({ component: Documents });
function Documents() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["documents"], queryFn: dashboardApi.documents });
  const upload = useMutation({
    mutationFn: dashboardApi.uploadDocument,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
    },
  });
  const remove = useMutation({
    mutationFn: dashboardApi.deleteDocument,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["documents"] }),
  });
  return (
    <DashboardPage
      title="Documents"
      description="Upload and manage files attached to your verification profile."
    >
      <Panel title="Upload">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const file = new FormData(e.currentTarget).get("file");
            if (file instanceof File && file.size) upload.mutate(file);
          }}
        >
          <input className={inputClass} name="file" type="file" required />
          <button className={buttonClass} disabled={upload.isPending}>
            {upload.isPending ? "Uploading…" : "Upload document"}
          </button>
        </form>
        {upload.error && <ErrorText error={upload.error} />}
      </Panel>
      <Panel title="Stored documents">
        {list.isPending ? (
          <Loading />
        ) : list.error ? (
          <ErrorText error={list.error} />
        ) : list.data?.length ? (
          <div className="space-y-3">
            {list.data.map((doc) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                key={doc.id}
              >
                <div>
                  <strong className="block text-navy">{doc.originalFilename}</strong>
                  <small className="text-muted-foreground">
                    {Math.ceil(doc.sizeBytes / 1024)} KB · {doc.contentType}
                  </small>
                </div>
                <div className="flex items-center gap-2">
                  <Status value={doc.malwareScanStatus} />
                  <button
                    className="text-sm font-semibold text-leaf-deep"
                    onClick={() => void dashboardApi.downloadDocument(doc)}
                  >
                    Download
                  </button>
                  <button
                    className="text-sm font-semibold text-red-700"
                    onClick={() => remove.mutate(doc.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No documents uploaded yet.</Empty>
        )}
      </Panel>
    </DashboardPage>
  );
}
