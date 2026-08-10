import type { ReactNode } from "react";

export function DashboardPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-secondary p-5 text-sm text-muted-foreground">{children}</p>;
}
export function Status({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-navy">
      {value.replaceAll("_", " ")}
    </span>
  );
}
export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-navy outline-none focus:border-navy";
export const buttonClass =
  "rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
export function Loading() {
  return <p className="text-sm text-muted-foreground">Loading…</p>;
}
export function ErrorText({ error }: { error: unknown }) {
  return (
    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {error instanceof Error ? error.message : "Request failed"}
    </p>
  );
}
