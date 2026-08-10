import { createFileRoute } from "@tanstack/react-router";
import { FileText, IdCard, Share2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import {
  CtaBand,
  FeatureCard,
  PageHero,
  Section,
  SectionTitle,
} from "@/components/site/primitives";
import mobileUser from "@/assets/mobile-user.jpg";
import heroCandidate from "@/assets/hero-candidate.jpg";
import skills from "@/assets/skills.jpg";

export const Route = createFileRoute("/for-candidates")({
  head: () => ({
    meta: [
      { title: "For Candidates | Build a verified profile on Gava Hub" },
      {
        name: "description",
        content:
          "Create a verified citizen profile, upload your documents, build your CV and share proof of your qualifications with Kenyan employers.",
      },
      { property: "og:title", content: "For Candidates | Gava Hub" },
      {
        property: "og:description",
        content:
          "Upload documents, build your CV, track verification status and share a trusted profile.",
      },
    ],
  }),
  component: ForCandidates,
});

function ForCandidates() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="For candidates"
        title="Your qualifications, proven once and trusted everywhere"
        intro="Register, complete your profile, upload your documents and let employers see verified proof instead of promises."
        image={mobileUser}
        alt="Kenyan woman checking her verified profile on a phone"
      />

      <Section>
        <SectionTitle
          eyebrow="What you can do"
          title="Everything in one citizen profile"
          intro="Full name, ID number, phone, email, location, education, skills and experience — structured and ready to share."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={IdCard}
            title="Complete your profile"
            body="Add your personal details, education history, skills and work experience in a guided flow."
          />
          <FeatureCard
            icon={Upload}
            title="Upload documents"
            body="National ID, CV, academic certificates, professional licences, recommendation, attachment and internship letters."
          />
          <FeatureCard
            icon={FileText}
            title="Build your CV"
            body="Generate a clean, professional CV directly from the records already on your profile."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Track verification"
            body="See at a glance whether each record is Pending, Verified or Rejected — and why."
          />
          <FeatureCard
            icon={Share2}
            title="Share your profile"
            body="Send a trusted profile link to an employer instead of resending scanned attachments."
          />
          <FeatureCard
            icon={Sparkles}
            title="Prove experience"
            body="Attachments, internships, volunteer and part-time work can all be verified by the organisation."
          />
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="Verification status"
              title="Always know where you stand"
              intro="Each document carries a live status so you can follow up before an employer ever asks."
            />
            <div className="mt-8 space-y-4">
              {[
                {
                  label: "Pending",
                  note: "Awaiting review by the issuing institution.",
                  cls: "bg-secondary text-navy",
                },
                {
                  label: "Verified",
                  note: "Certificate confirmed with a reference number.",
                  cls: "bg-leaf/15 text-leaf-deep",
                },
                {
                  label: "Rejected",
                  note: "Record not found or information incomplete.",
                  cls: "bg-destructive/10 text-destructive",
                },
              ].map((s) => (
                <div key={s.label} className="card-elevated flex items-center gap-4 p-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${s.cls}`}
                  >
                    {s.label}
                  </span>
                  <p className="text-sm text-muted-foreground">{s.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <img
              src={heroCandidate}
              alt="Kenyan professional with a verified Gava Hub profile"
              loading="lazy"
              width={1280}
              height={1600}
              className="h-72 w-full rounded-2xl object-cover object-top sm:h-96"
            />
            <img
              src={skills}
              alt="Kenyan artisan trainee in a workshop"
              loading="lazy"
              width={1280}
              height={960}
              className="h-72 w-full rounded-2xl object-cover sm:mt-10 sm:h-96"
            />
          </div>
        </div>
      </Section>

      <CtaBand
        title="Build your verified profile"
        body="It takes minutes to register and upload your first document."
        primaryLabel="Register as a candidate"
      />
    </SiteLayout>
  );
}
