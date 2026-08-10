import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { PageHero, Section, SectionTitle } from "@/components/site/primitives";
import support from "@/assets/support.jpg";
import nairobi from "@/assets/nairobi.jpg";
import { submitContact, type RequesterType } from "@/lib/api/contact";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Gava Hub | Talk to our verification team" },
      {
        name: "description",
        content:
          "Reach the Gava Hub team in Nairobi for candidate support, employer onboarding or institution partnership enquiries.",
      },
      { property: "og:title", content: "Contact Gava Hub" },
      {
        property: "og:description",
        content: "Candidate support, employer onboarding and institution partnerships.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact us"
        title="Talk to the Gava Hub team"
        intro="Whether you are a candidate needing help with a document, an employer onboarding your team or an institution ready to partner — we are here."
        image={support}
        alt="Gava Hub support team member"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionTitle
              eyebrow="Send a message"
              title="We reply within one working day"
              intro="Tell us who you are and what you need verified, and the right team will pick it up."
            />

            <form
              className="mt-10 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (sending) return;
                setSending(true);
                const form = e.currentTarget;
                const data = new FormData(form);
                const phone = String(data.get("phone") ?? "").trim();
                try {
                  const response = await submitContact({
                    fullName: String(data.get("name") ?? "").trim(),
                    email: String(data.get("email") ?? "")
                      .trim()
                      .toLowerCase(),
                    ...(phone ? { phoneNumber: phone } : {}),
                    requesterType: String(data.get("role") ?? "OTHER") as RequesterType,
                    message: String(data.get("message") ?? "").trim(),
                  });
                  form.reset();
                  toast.success("Message sent", {
                    description: `Reference ${response.referenceNumber}. Our team will reply within one working day.`,
                  });
                } catch (error) {
                  toast.error("Message not sent", {
                    description:
                      error instanceof ApiError
                        ? error.message
                        : "Could not reach the Gava Hub API. Please try again.",
                  });
                } finally {
                  setSending(false);
                }
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" name="name" placeholder="Amina Wanjiru" />
                <Field label="Email" name="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone number" name="phone" placeholder="+254 7.." required={false} />
                <div>
                  <label className="block text-sm font-semibold text-navy" htmlFor="role">
                    I am a
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-navy outline-none focus:border-navy"
                  >
                    <option value="CANDIDATE">Candidate</option>
                    <option value="EMPLOYER">Employer</option>
                    <option value="INSTITUTION">Institution</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  placeholder="How can we help?"
                  className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-navy outline-none placeholder:text-muted-foreground focus:border-navy"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-navy-soft disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send message"} <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <img
              src={nairobi}
              alt="Nairobi skyline where Gava Hub is based"
              loading="lazy"
              width={1600}
              height={912}
              className="h-64 w-full rounded-2xl object-cover"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard icon={MapPin} title="Office" body="Upper Hill, Nairobi, Kenya" />
              <InfoCard icon={Phone} title="Phone" body="+254 700 000 000" />
              <InfoCard icon={Mail} title="Email" body="support@gavahub.co.ke" />
              <InfoCard icon={Clock} title="Hours" body="Mon – Fri, 8am – 5pm EAT" />
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-navy" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-navy outline-none placeholder:text-muted-foreground focus:border-navy"
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof MapPin;
  title: string;
  body: string;
}) {
  return (
    <div className="card-elevated p-5">
      <Icon className="h-5 w-5 text-leaf-deep" />
      <p className="mt-3 text-sm font-semibold text-navy">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
