import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { dashboardApi, type Organization } from "@/lib/api/dashboard";
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
export const Route = createFileRoute("/dashboard/organizations")({ component: Organizations });
function Organizations() {
  const [selected, setSelected] = useState<Organization>();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["organizations"], queryFn: dashboardApi.organizations });
  const members = useQuery({
    queryKey: ["members", selected?.id],
    queryFn: () => dashboardApi.members(selected!.id),
    enabled: !!selected,
  });
  const add = useMutation({
    mutationFn: (v: { userId: string; memberRole: string }) =>
      dashboardApi.addMember(selected!.id, v),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["members", selected?.id] });
      toast.success("Member added");
    },
  });
  if (list.isPending) return <Loading />;
  return (
    <DashboardPage
      title="Organizations"
      description="Review your employer or institution and manage its active members."
    >
      {list.error && <ErrorText error={list.error} />}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="My organizations">
          {list.data?.length ? (
            <div className="space-y-3">
              {list.data.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelected(org)}
                  className="flex w-full items-center justify-between rounded-xl border p-4 text-left"
                >
                  <span>
                    <strong className="block text-navy">{org.legalName}</strong>
                    <small>{org.organizationType}</small>
                  </span>
                  <Status value={org.status} />
                </button>
              ))}
            </div>
          ) : (
            <Empty>No organization is linked to this account.</Empty>
          )}
        </Panel>
        <Panel title={selected ? `${selected.legalName} members` : "Members"}>
          {!selected ? (
            <Empty>Select an organization.</Empty>
          ) : (
            <>
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  add.mutate({
                    userId: String(d.get("userId")),
                    memberRole: String(d.get("memberRole")),
                  });
                }}
              >
                <input className={inputClass} name="userId" placeholder="User UUID" required />
                <select className={inputClass} name="memberRole">
                  <option>MEMBER</option>
                  <option>RECRUITER</option>
                  <option>VERIFIER</option>
                  <option>FINANCE</option>
                  <option>ADMIN</option>
                </select>
                <button className={buttonClass}>Add member</button>
              </form>
              <div className="mt-5 space-y-2">
                {members.data?.map((m) => (
                  <div className="rounded-lg bg-secondary p-3 text-sm" key={m.userId}>
                    <strong>{m.displayName}</strong>
                    <span className="ml-2 text-muted-foreground">
                      {m.email} · {m.memberRole}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </DashboardPage>
  );
}
