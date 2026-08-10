import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, FileSearch, Landmark, Search, Upload, UserPlus } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { CtaBand, PageHero, Section, SectionTitle } from "@/components/site/primitives";
import verifyDesk from "@/assets/verify-desk.jpg";
import skills from "@/assets/skills.jpg";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works | Gava Hub verification workflow" },
      {
        name: "description",
        content:
          "See how Gava Hub moves a document from upload to a verified record: registration, upload, verification request, institution review and audit log.",
      },
      { property: "og:title", content: "How Gava Hub verification works" },
      {
        property: "og:description",
        content:
          "Registration, document upload, verification requests, institution review and a permanent verification record.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    icon: UserPlus,
    title: "Register your account",
    body: "Sign up as a candidate, employer or institution and complete your profile with your official details.",
  },
  {
    icon: Upload,
    title: "Upload your documents",
    body: "National ID, CV, academic certificates, professional licences, recommendation, attachment and internship letters.",
  },
  {
    icon: Search,
    title: "Employer requests verification",
    body: "An employer searches candidates and raises a verification request against a specific document or experience.",
  },
  {
    icon: Landmark,
    title: "Institution reviews the record",
    body: "The request is routed to the issuing institution and to admin, who can verify, reject or request more information.",
  },
  {
    icon: BadgeCheck,
    title: "Status is published",
    body: "The record becomes Pending, Verified or Rejected with notes such as Certificate Confirmed or Record Not Found.",
  },
  {
    icon: FileSearch,
    title: "Audit trail is kept",
    body: "Every verification stores the institution, date, notes and a unique verification reference number.",
  },
];

function HowItWorks() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="How it works"
        title="A clear, traceable path from document to trusted record"
        intro="Gava Hub routes every verification request to the right authority and keeps a permanent, auditable record of the outcome."
        image={verifyDesk}
        alt="Registrar verifying academic records at a desk"
      />

      <Section>
        <SectionTitle
          eyebrow="The workflow"
          title="Six steps, one verified outcome"
          intro="Candidates never chase paperwork, employers never guess and institutions confirm only what they issued."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="card-elevated relative p-7">
              <span className="font-display text-sm font-bold text-leaf-deep">0{i + 1}</span>
              <s.icon className="mt-4 h-6 w-6 text-navy" />
              <h3 className="mt-4 text-lg font-semibold text-navy">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            src={skills}
            alt="Kenyan trainee in a technical workshop"
            loading="lazy"
            width={1280}
            height={960}
            className="h-80 w-full rounded-3xl object-cover md:h-[26rem]"
          />
          <div>
            <SectionTitle
              eyebrow="Experience verification"
              title="Work history counts, not just certificates"
              intro="Candidates enter the organisation name, supervisor name and duration. Gava Hub then supports verification of internships, attachments, volunteer work and part-time work."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Attachment Verified",
                "Internship Verified",
                "Volunteer Verified",
                "Employment Verified",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-navy"
                >
                  <BadgeCheck className="h-4 w-4 text-leaf-deep" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Ready to verify with confidence?"
        body="Create an account and raise your first verification request in minutes."
      />
    </SiteLayout>
  );
}
