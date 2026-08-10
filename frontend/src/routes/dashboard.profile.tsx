import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api/dashboard";
import {
  DashboardPage,
  ErrorText,
  Loading,
  Panel,
  inputClass,
  buttonClass,
} from "@/components/dashboard/primitives";

export const Route = createFileRoute("/dashboard/profile")({ component: Profile });
function Profile() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: dashboardApi.me });
  const roles = useQuery({ queryKey: ["roles"], queryFn: dashboardApi.roles });
  const candidates = useQuery({ queryKey: ["candidates"], queryFn: dashboardApi.candidates });
  const save = useMutation({
    mutationFn: (name: string) => dashboardApi.updateMe(name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
    },
  });
  const saveCandidate = useMutation({
    mutationFn: (body: { givenName: string; familyName: string; headline: string }) =>
      dashboardApi.updateCandidate(candidates.data![0]!.id, {
        ...body,
        dateOfBirth: null,
        profileStatus: "ACTIVE",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate profile updated");
    },
  });
  if (me.isPending) return <Loading />;
  if (me.error) return <ErrorText error={me.error} />;
  return (
    <DashboardPage
      title="User profile"
      description="Manage your account name and review assigned access roles."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Account details">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(String(new FormData(e.currentTarget).get("displayName")));
            }}
          >
            <label className="block text-sm font-medium">
              Display name
              <input
                className={`${inputClass} mt-2`}
                name="displayName"
                defaultValue={me.data.displayName}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input className={`${inputClass} mt-2`} value={me.data.email} disabled />
            </label>
            {save.error && <ErrorText error={save.error} />}
            <button className={buttonClass} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </button>
          </form>
        </Panel>
        <Panel title="Access roles">
          <div className="flex flex-wrap gap-2">
            {roles.data?.map((role) => (
              <span
                className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-navy"
                key={role}
              >
                {role}
              </span>
            ))}
          </div>
        </Panel>
        {candidates.data?.[0] && (
          <Panel title="Candidate profile">
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                saveCandidate.mutate({
                  givenName: String(data.get("givenName")),
                  familyName: String(data.get("familyName")),
                  headline: String(data.get("headline")),
                });
              }}
            >
              <input
                className={inputClass}
                name="givenName"
                defaultValue={candidates.data[0].givenName}
                required
              />
              <input
                className={inputClass}
                name="familyName"
                defaultValue={candidates.data[0].familyName}
                required
              />
              <input
                className={`${inputClass} sm:col-span-2`}
                name="headline"
                defaultValue={candidates.data[0].headline ?? ""}
                placeholder="Professional headline"
              />
              <button className={buttonClass}>Save candidate profile</button>
            </form>
          </Panel>
        )}
      </div>
    </DashboardPage>
  );
}
