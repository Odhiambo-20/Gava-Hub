import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api/dashboard";
import { getSession } from "@/lib/api/auth";
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
export const Route = createFileRoute("/dashboard/verifications")({ component: Verifications });
function Verifications() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["verifications"], queryFn: dashboardApi.verifications });
  const candidates = useQuery({
    queryKey: ["all-candidates"],
    queryFn: dashboardApi.allCandidates,
  });
  const organizations = useQuery({
    queryKey: ["all-organizations"],
    queryFn: dashboardApi.allOrganizations,
  });
  const roles = useQuery({ queryKey: ["roles"], queryFn: dashboardApi.roles });
  const create = useMutation({
    mutationFn: (body: unknown) => dashboardApi.createVerification(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["verifications"] });
      toast.success("Verification request created");
    },
  });
  const update = useMutation({
    mutationFn: ({ id, purpose, status }: { id: string; purpose: string; status: string }) =>
      dashboardApi.updateVerification(id, { purpose, status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["verifications"] }),
  });
  const decide = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      dashboardApi.decideVerification(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["verifications"] });
      toast.success("Decision recorded");
    },
  });
  return (
    <DashboardPage
      title="Verification requests"
      description="Submit consent-backed checks and monitor each verification stage."
    >
      <Panel title="Create request">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            create.mutate({
              requestedByUserId: getSession()!.userId,
              requestingOrganizationId: String(d.get("organizationId")) || null,
              candidateId: String(d.get("candidateId")),
              consentId: String(d.get("consentId")) || null,
              purpose: String(d.get("purpose")),
            });
          }}
        >
          <select className={inputClass} name="candidateId" required>
            <option value="">Select candidate</option>
            {candidates.data?.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.givenName} {candidate.familyName}
              </option>
            ))}
          </select>
          <select className={inputClass} name="organizationId" required>
            <option value="">Select requesting organization</option>
            {organizations.data?.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.legalName}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            name="consentId"
            placeholder="Existing consent UUID (optional)"
          />
          <input
            className={inputClass}
            name="purpose"
            placeholder="Purpose of verification"
            minLength={3}
            required
          />
          <button className={buttonClass}>Create request</button>
        </form>
        {create.error && <ErrorText error={create.error} />}
      </Panel>
      {roles.data?.some((role) => role === "ROLE_ADMIN" || role === "ROLE_VERIFIER") && (
        <Panel title="Record verification decision">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              decide.mutate({
                id: String(data.get("requestId")),
                body: {
                  credentialId: String(data.get("credentialId")),
                  decidedByUserId: getSession()!.userId,
                  assignedOrganizationId: String(data.get("organizationId")) || null,
                  decision: String(data.get("decision")),
                  notes: String(data.get("notes")),
                },
              });
            }}
          >
            <select className={inputClass} name="requestId" required>
              <option value="">Select request</option>
              {list.data?.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.referenceNumber}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              name="credentialId"
              placeholder="Credential UUID"
              required
            />
            <select className={inputClass} name="organizationId">
              <option value="">No assigned organization</option>
              {organizations.data?.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.legalName}
                </option>
              ))}
            </select>
            <select className={inputClass} name="decision">
              <option>VERIFIED</option>
              <option>REJECTED</option>
              <option>MORE_INFORMATION_REQUIRED</option>
            </select>
            <input className={inputClass} name="notes" placeholder="Decision notes" />
            <button className={buttonClass}>Record decision</button>
          </form>
          {decide.error && <ErrorText error={decide.error} />}
        </Panel>
      )}
      <Panel title="Requests">
        {list.isPending ? (
          <Loading />
        ) : list.error ? (
          <ErrorText error={list.error} />
        ) : list.data?.length ? (
          <div className="space-y-3">
            {list.data.map((v) => (
              <div className="rounded-xl border p-4" key={v.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <strong className="block text-navy">{v.referenceNumber}</strong>
                    <small>{v.purpose}</small>
                  </div>
                  <Status value={v.status} />
                </div>
                {["DRAFT", "AWAITING_PAYMENT"].includes(v.status) && (
                  <button
                    className="mt-3 text-sm font-semibold text-leaf-deep"
                    onClick={() =>
                      update.mutate({ id: v.id, purpose: v.purpose, status: "SUBMITTED" })
                    }
                  >
                    Submit for review
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty>No verification requests.</Empty>
        )}
      </Panel>
    </DashboardPage>
  );
}
