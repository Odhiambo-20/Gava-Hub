import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { CtaBand, PageHero, Section, SectionTitle } from "@/components/site/primitives";
import support from "@/assets/support.jpg";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Gava Hub verification questions answered" },
      {
        name: "description",
        content:
          "Answers about registering on Gava Hub, document uploads, verification timelines, data security and who can see your records.",
      },
      { property: "og:title", content: "Gava Hub FAQ" },
      {
        property: "og:description",
        content: "Common questions from candidates, employers and institutions.",
      },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  {
    q: "Who can register on Gava Hub?",
    a: "Candidates (citizens), employers and institutions such as universities, colleges, TVETs, training centres, certification bodies and professional associations.",
  },
  {
    q: "What documents can I upload?",
    a: "National ID, CV, academic certificates, professional licences, recommendation letters, attachment letters and internship letters. Certificate and licence numbers can be captured where available.",
  },
  {
    q: "Who verifies my credentials?",
    a: "Verification requests are routed to the issuing institution where applicable, with platform administrators overseeing the process and maintaining audit logs.",
  },
  {
    q: "What verification statuses exist?",
    a: "Pending, Verified and Rejected. Each record also carries notes such as Certificate Confirmed, Record Not Found, Awaiting Review or Information Incomplete.",
  },
  {
    q: "Can work experience be verified?",
    a: "Yes. Internships, attachments, volunteer work and part-time work can be verified using the organisation name, supervisor name and duration you provide.",
  },
  {
    q: "Who can see my profile?",
    a: "You control sharing. Employers see what you share with them, and every verification request and access event is logged.",
  },
  {
    q: "Is Gava Hub a social network?",
    a: "No. There is no social feed, no likes, no comments and no networking posts. Gava Hub exists purely for verification and trusted hiring.",
  },
  {
    q: "What is coming next?",
    a: "Planned future features include QR verification, skill assessments, portfolio verification, a mobile app, government and university database integrations, APIs, AI verification assistance and digital certificate issuance.",
  },
];

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="FAQ"
        title="Questions about verification, answered"
        intro="Everything candidates, employers and institutions ask most often about how Gava Hub works."
        image={support}
        alt="Gava Hub support agent ready to help"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <SectionTitle eyebrow="Common questions" title="Frequently asked" />
            <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {faqs.map((f, i) => (
                <div key={f.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(open === i ? null : i)}
                    aria-expanded={open === i}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-semibold text-navy">{f.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                        open === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open === i && (
                    <p className="reveal px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                      {f.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <img
              src={support}
              alt="Support agent at a Nairobi help desk"
              loading="lazy"
              width={1280}
              height={960}
              className="h-72 w-full rounded-2xl object-cover"
            />
            <div className="card-elevated mt-6 p-6">
              <h3 className="text-lg font-semibold text-navy">Still stuck?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Our team responds to verification queries within one working day.
              </p>
              <p className="mt-4 text-sm font-semibold text-leaf-deep">support@gavahub.co.ke</p>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Ready when you are"
        body="Create your Gava Hub account and start building verified records."
      />
    </SiteLayout>
  );
}
