import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { dashboardApi, type Invoice } from "@/lib/api/dashboard";
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
export const Route = createFileRoute("/dashboard/billing")({ component: Billing });
function Billing() {
  const [invoice, setInvoice] = useState<Invoice>();
  const qc = useQueryClient();
  const configuration = useQuery({
    queryKey: ["payment-configuration"],
    queryFn: dashboardApi.paymentConfiguration,
  });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: dashboardApi.invoices });
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: dashboardApi.payments,
    refetchInterval: 15000,
  });
  const pay = useMutation({
    mutationFn: (phone: string) => dashboardApi.pay(invoice!.id, phone),
    onSuccess: (p) => {
      toast.success("M-Pesa prompt sent", { description: `Payment status: ${p.status}` });
      void qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
  return (
    <DashboardPage
      title="Billing and payments"
      description="Review your invoices and payment status."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Invoices">
          {invoices.isPending ? (
            <Loading />
          ) : invoices.error ? (
            <ErrorText error={invoices.error} />
          ) : invoices.data?.length ? (
            <div className="space-y-3">
              {invoices.data.map((i) => (
                <button
                  className="flex w-full justify-between rounded-xl border p-4 text-left"
                  key={i.id}
                  onClick={() => setInvoice(i)}
                >
                  <span>
                    <strong className="block">{i.invoiceNumber}</strong>
                    <small>
                      {i.currency} {Number(i.total).toLocaleString()}
                    </small>
                  </span>
                  <Status value={i.status} />
                </button>
              ))}
            </div>
          ) : (
            <Empty>No invoices issued to your account.</Empty>
          )}
        </Panel>
        <Panel
          title={configuration.data?.method === "COOP_PAYBILL" ? "Co-op Bank payments" : "Payment"}
        >
          {configuration.isPending ? (
            <Loading />
          ) : configuration.error ? (
            <ErrorText error={configuration.error} />
          ) : !configuration.data?.available ? (
            <p role="status" className="text-sm text-muted-foreground">
              Payments are temporarily unavailable. Please contact{" "}
              <a
                href="mailto:info@wihlverify.org"
                className="underline underline-offset-4 hover:opacity-80"
              >
                info@wihlverify.org
              </a>{" "}
              for assistance before making a payment.
            </p>
          ) : invoice ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                pay.mutate(String(new FormData(e.currentTarget).get("phone")));
              }}
            >
              <p className="text-sm">
                Pay{" "}
                <strong>
                  {invoice.currency} {invoice.total}
                </strong>{" "}
                for {invoice.invoiceNumber}
              </p>
              <input className={inputClass} name="phone" placeholder="0712 345 678" required />
              <button className={buttonClass} disabled={pay.isPending || invoice.status !== "OPEN"}>
                {pay.isPending ? "Sending…" : "Send STK Push"}
              </button>
              {pay.error && <ErrorText error={pay.error} />}
            </form>
          ) : (
            <Empty>Select an open invoice to pay.</Empty>
          )}
        </Panel>
      </div>
      <Panel title="Payment history">
        {payments.isPending ? (
          <Loading />
        ) : payments.error ? (
          <ErrorText error={payments.error} />
        ) : payments.data?.length ? (
          <div className="space-y-3">
            {payments.data.map((p) => (
              <div className="flex justify-between rounded-xl border p-4" key={p.id}>
                <span>
                  <strong>
                    {p.currency} {p.amount}
                  </strong>
                  <small className="ml-2 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </small>
                </span>
                <Status value={p.status} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>No payments initiated.</Empty>
        )}
      </Panel>
    </DashboardPage>
  );
}
