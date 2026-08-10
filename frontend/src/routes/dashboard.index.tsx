import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { DashboardPage, ErrorText, Loading, Panel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/dashboard/")({ component: Overview });
function Overview() {
  const profile = useQuery({ queryKey: ["me"], queryFn: dashboardApi.me });
  const candidates = useQuery({ queryKey: ["candidates"], queryFn: dashboardApi.candidates });
  const orgs = useQuery({ queryKey: ["organizations"], queryFn: dashboardApi.organizations });
  const docs = useQuery({ queryKey: ["documents"], queryFn: dashboardApi.documents });
  if (profile.isPending) return <Loading />;
  if (profile.error) return <ErrorText error={profile.error} />;
  return (
    <DashboardPage
      title={`Welcome, ${profile.data.displayName}`}
      description="Your Gava Hub account and verification activity at a glance."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Account", profile.data.status],
          ["Candidate profiles", candidates.data?.length ?? 0],
          ["Organizations", orgs.data?.length ?? 0],
          ["Documents", docs.data?.length ?? 0],
        ].map(([label, value]) => (
          <Panel key={label} title={String(label)}>
            <p className="text-3xl font-bold text-navy">{value}</p>
          </Panel>
        ))}
      </div>
    </DashboardPage>
  );
}
