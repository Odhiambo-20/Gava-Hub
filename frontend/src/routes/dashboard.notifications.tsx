import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
export const Route = createFileRoute("/dashboard/notifications")({ component: Notifications });
function Notifications() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["notifications"],
    queryFn: dashboardApi.notifications,
    refetchInterval: 30000,
  });
  const create = useMutation({
    mutationFn: (body: unknown) => dashboardApi.createNotification(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <DashboardPage
      title="Notifications"
      description="Queue and monitor email, SMS, and in-app messages."
    >
      <Panel title="Send a notification">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            create.mutate({
              userId: getSession()!.userId,
              channel: String(data.get("channel")),
              destination: String(data.get("destination")),
              templateCode: "USER_MESSAGE",
              data: { message: String(data.get("message")) },
            });
          }}
        >
          <select className={inputClass} name="channel">
            <option>EMAIL</option>
            <option>SMS</option>
            <option>IN_APP</option>
          </select>
          <input
            className={inputClass}
            name="destination"
            placeholder="Email address or phone"
            required
          />
          <input className={inputClass} name="message" placeholder="Message" required />
          <button className={buttonClass}>Queue notification</button>
        </form>
        {create.error && <ErrorText error={create.error} />}
      </Panel>
      <Panel title="Recent notifications">
        {list.isPending ? (
          <Loading />
        ) : list.error ? (
          <ErrorText error={list.error} />
        ) : list.data?.length ? (
          <div className="space-y-3">
            {list.data.map((n) => (
              <div className="flex justify-between rounded-xl border p-4" key={n.id}>
                <span>
                  <strong className="block">{n.templateCode.replaceAll("_", " ")}</strong>
                  <small>
                    {n.channel} · {new Date(n.createdAt).toLocaleString()}
                  </small>
                </span>
                <Status value={n.status} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>No notifications yet.</Empty>
        )}
      </Panel>
    </DashboardPage>
  );
}
