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
export const Route = createFileRoute("/dashboard/credentials")({ component: Credentials });
function Credentials() {
  const qc = useQueryClient();
  const candidates = useQuery({ queryKey: ["candidates"], queryFn: dashboardApi.candidates });
  const candidate = candidates.data?.[0];
  const list = useQuery({
    queryKey: ["credentials", candidate?.id],
    queryFn: () => dashboardApi.credentials(candidate!.id),
    enabled: !!candidate,
  });
  const create = useMutation({
    mutationFn: (body: unknown) => dashboardApi.createCredential(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["credentials", candidate?.id] });
      toast.success("Credential added");
    },
  });
  const revoke = useMutation({
    mutationFn: dashboardApi.revokeCredential,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["credentials", candidate?.id] }),
  });
  if (candidates.isPending) return <Loading />;
  if (!candidate)
    return (
      <DashboardPage
        title="Credentials"
        description="Manage qualifications and professional records."
      >
        <Empty>Create or complete a candidate profile before adding credentials.</Empty>
      </DashboardPage>
    );
  return (
    <DashboardPage
      title="Credentials"
      description="Add qualifications, licences, and other records for verification."
    >
      <Panel title="Add credential">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            create.mutate({
              candidateId: candidate.id,
              credentialType: String(d.get("type")),
              title: String(d.get("title")),
              credentialNumber: String(d.get("number")) || null,
              issuedOn: String(d.get("issuedOn")) || null,
              expiresOn: String(d.get("expiresOn")) || null,
            });
          }}
        >
          <select name="type" className={inputClass}>
            <option>ACADEMIC</option>
            <option>PROFESSIONAL_LICENSE</option>
            <option>EMPLOYMENT</option>
            <option>TRAINING</option>
          </select>
          <input name="title" className={inputClass} placeholder="Credential title" required />
          <input name="number" className={inputClass} placeholder="Certificate number" />
          <input name="issuedOn" className={inputClass} type="date" />
          <input name="expiresOn" className={inputClass} type="date" />
          <button className={buttonClass}>Add credential</button>
        </form>
        {create.error && <ErrorText error={create.error} />}
      </Panel>
      <Panel title="My credentials">
        {list.isPending ? (
          <Loading />
        ) : list.data?.length ? (
          <div className="space-y-3">
            {list.data.map((item) => (
              <div
                className="flex items-center justify-between rounded-xl border p-4"
                key={item.id}
              >
                <div>
                  <strong className="block text-navy">{item.title}</strong>
                  <small>
                    {item.credentialType} {item.credentialNumber && `· ${item.credentialNumber}`}
                  </small>
                </div>
                <div className="flex gap-3">
                  <Status value={item.status} />
                  <button className="text-sm text-red-700" onClick={() => revoke.mutate(item.id)}>
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No credentials added.</Empty>
        )}
      </Panel>
    </DashboardPage>
  );
}
