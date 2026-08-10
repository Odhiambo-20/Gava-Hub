import { createFileRoute } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  ClipboardCheck,
  Search,
  ShieldCheck,
  Users,
  Building2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import {
  CtaBand,
  FeatureCard,
  PageHero,
  Section,
  SectionTitle,
} from "@/components/site/primitives";
import employers from "@/assets/employers.jpg";
import nairobi from "@/assets/nairobi.jpg";

export const Route = createFileRoute("/for-employers")({
  head: () => ({
    meta: [
      { title: "For Employers | Hire verified candidates on Gava Hub" },
      {
        name: "description",
        content:
          "Post jobs, search verified candidates, request credential verification and hire with confidence backed by institution-verified records.",
      },
      { property: "og:title", content: "For Employers | Gava Hub" },
      {
        property: "og:description",
        content:
          "Search candidates, request verification and track verification status from one employer dashboard.",
      },
    ],
  }),
  component: ForEmployers,
});

function ForEmployers() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="For employers"
        title="Hire on evidence, not on paperwork"
        intro="Create a company profile, post roles, search candidates and request verification of the credentials that matter to your decision."
        image={employers}
        alt="Kenyan hiring panel reviewing a verified candidate profile"
      />

      <Section>
        <SectionTitle
          eyebrow="Employer tools"
          title="Everything your hiring team needs"
          intro="Company name, industry, contact person, email and phone — one verified company profile powers every request you make."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Building2}
            title="Company profile"
            body="Register your organisation once and have your requests recognised across the platform."
          />
          <FeatureCard
            icon={BriefcaseBusiness}
            title="Post jobs"
            body="Publish roles and receive applications from candidates with verifiable records."
          />
          <FeatureCard
            icon={Search}
            title="Search candidates"
            body="Filter talent by education, skills, location and verification status."
          />
          <FeatureCard
            icon={ClipboardCheck}
            title="Request verification"
            body="Raise a request against a specific certificate, licence or work experience entry."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="View status"
            body="Track Pending, Verified and Rejected outcomes with notes and reference numbers."
          />
          <FeatureCard
            icon={Users}
            title="Reduce hiring risk"
            body="Cut fraudulent qualifications and costly mis-hires out of your recruitment pipeline."
          />
        </div>
      </Section>

      <div className="relative overflow-hidden">
        <img
          src={nairobi}
          alt="Nairobi business district at dusk"
          loading="lazy"
          width={1600}
          height={912}
          className="h-[20rem] w-full object-cover md:h-[24rem]"
        />
        <div className="absolute inset-0 bg-navy-deep/78" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-3">
            {[
              { v: "Faster", l: "shortlisting decisions" },
              { v: "Lower", l: "risk of fraudulent papers" },
              { v: "Complete", l: "verification audit trail" },
            ].map((s) => (
              <div key={s.v} className="rounded-xl border border-white/12 bg-white/5 p-6">
                <p className="font-display text-3xl font-bold text-primary-foreground">{s.v}</p>
                <p className="mt-1 text-sm text-primary-foreground/70">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CtaBand
        title="Start verifying your next hire"
        body="Register your company and raise your first verification request today."
        primaryLabel="Register as an employer"
      />
    </SiteLayout>
  );
}
