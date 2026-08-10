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
export const Route = createFileRoute("/dashboard/admin")({ component: Admin });
function Admin() {
  const qc = useQueryClient();
  const roles = useQuery({ queryKey: ["roles"], queryFn: dashboardApi.roles });
  const admin = roles.data?.includes("ROLE_ADMIN");
  const system = useQuery({ queryKey: ["system"], queryFn: dashboardApi.system, enabled: !!admin });
  const users = useQuery({ queryKey: ["users"], queryFn: dashboardApi.users, enabled: !!admin });
  const audit = useQuery({ queryKey: ["audit"], queryFn: dashboardApi.audit, enabled: !!admin });
  const grant = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => dashboardApi.grantRole(id, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role granted");
    },
  });
  const revoke = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => dashboardApi.revokeRole(id, role),
    onSuccess: () => toast.success("Role revoked"),
  });
  const invoice = useMutation({
    mutationFn: (body: unknown) => dashboardApi.createInvoice(body),
    onSuccess: () => toast.success("Invoice created"),
  });
  if (roles.isPending) return <Loading />;
  if (!admin)
    return (
      <DashboardPage title="Administration" description="Platform administration is restricted.">
        <Empty>Your account does not have the administrator role.</Empty>
      </DashboardPage>
    );
  return (
    <DashboardPage
      title="Administration"
      description="Monitor platform health, users, access roles, and immutable audit events."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="System status">
          {system.data ? (
            <div className="flex items-center justify-between">
              <strong>{system.data.service}</strong>
              <Status value={system.data.status} />
            </div>
          ) : (
            <Loading />
          )}
        </Panel>
        <Panel title="Grant role">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              grant.mutate({ id: String(d.get("userId")), role: String(d.get("role")) });
            }}
          >
            <input className={inputClass} name="userId" placeholder="User UUID" required />
            <select className={inputClass} name="role">
              <option>ROLE_VERIFIER</option>
              <option>ROLE_ADMIN</option>
            </select>
            <button className={buttonClass}>Grant role</button>
          </form>
          {grant.error && <ErrorText error={grant.error} />}
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              revoke.mutate({ id: String(data.get("userId")), role: String(data.get("role")) });
            }}
          >
            <input className={inputClass} name="userId" placeholder="User UUID" required />
            <select className={inputClass} name="role">
              <option>ROLE_VERIFIER</option>
              <option>ROLE_ADMIN</option>
            </select>
            <button className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700">
              Revoke role
            </button>
          </form>
        </Panel>
      </div>
      <Panel title="Create invoice">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            invoice.mutate({
              billedUserId: String(data.get("userId")),
              verificationRequestId: String(data.get("verificationId")) || null,
              subtotal: Number(data.get("subtotal")),
              tax: Number(data.get("tax") || 0),
              currency: "KES",
              dueAt: String(data.get("dueAt")) || null,
            });
          }}
        >
          <input className={inputClass} name="userId" placeholder="Billed user UUID" required />
          <input
            className={inputClass}
            name="verificationId"
            placeholder="Verification UUID (optional)"
          />
          <input
            className={inputClass}
            name="subtotal"
            type="number"
            min="0"
            step="0.01"
            placeholder="Subtotal"
            required
          />
          <input
            className={inputClass}
            name="tax"
            type="number"
            min="0"
            step="0.01"
            placeholder="Tax"
          />
          <input className={inputClass} name="dueAt" type="datetime-local" />
          <button className={buttonClass}>Create invoice</button>
        </form>
        {invoice.error && <ErrorText error={invoice.error} />}
      </Panel>
      <Panel title="Users">
        {users.isPending ? (
          <Loading />
        ) : users.error ? (
          <ErrorText error={users.error} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {users.data?.map((u) => (
                  <tr className="border-b" key={u.id}>
                    <td className="p-3 font-medium">{u.displayName}</td>
                    <td>{u.email}</td>
                    <td>
                      <Status value={u.status} />
                    </td>
                    <td className="font-mono text-xs">{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Recent audit events">
        {audit.isPending ? (
          <Loading />
        ) : audit.error ? (
          <ErrorText error={audit.error} />
        ) : audit.data?.length ? (
          <div className="space-y-2">
            {audit.data.map((a) => (
              <div
                className="grid gap-1 rounded-lg bg-secondary p-3 text-sm md:grid-cols-[1fr_1fr_auto]"
                key={a.id}
              >
                <span>{a.action}</span>
                <span>
                  {a.resourceType} {a.resourceId}
                </span>
                <Status value={a.outcome} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>No audit events have been recorded.</Empty>
        )}
      </Panel>
    </DashboardPage>
  );
}
