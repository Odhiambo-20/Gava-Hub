import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpenCheck,
  FileClock,
  GraduationCap,
  Landmark,
  ScrollText,
  XCircle,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import {
  CtaBand,
  FeatureCard,
  PageHero,
  Section,
  SectionTitle,
} from "@/components/site/primitives";
import institutions from "@/assets/institutions.jpg";
import verifyDesk from "@/assets/verify-desk.jpg";

export const Route = createFileRoute("/for-institutions")({
  head: () => ({
    meta: [
      { title: "For Institutions | Verify credentials on Gava Hub" },
      {
        name: "description",
        content:
          "Universities, colleges, TVETs, training centres and professional bodies verify academic and professional records submitted by candidates.",
      },
      { property: "og:title", content: "For Institutions | Gava Hub" },
      {
        property: "og:description",
        content:
          "Receive verification requests, confirm or reject credentials and keep a full verification history.",
      },
    ],
  }),
  component: ForInstitutions,
});

const kinds = [
  "Universities",
  "Colleges",
  "TVETs",
  "Training Centres",
  "Certification Bodies",
  "Professional Associations",
];

function ForInstitutions() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="For institutions"
        title="Confirm the credentials you issued — securely"
        intro="Receive verification requests, review the record and publish a decision that employers can rely on."
        image={institutions}
        alt="Kenyan graduates holding certificates outside a university"
      />

      <Section>
        <SectionTitle
          eyebrow="Who registers"
          title="Built for every issuing body"
          intro="Institution name, type, registration number, contact person, official email, phone, website and physical address form your verified institution profile."
        />
        <div className="mt-10 flex flex-wrap gap-3">
          {kinds.map((k) => (
            <span
              key={k}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-navy"
            >
              {k}
            </span>
          ))}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Landmark}
            title="Institution profile"
            body="Register your official details once so requests reach the right desk."
          />
          <FeatureCard
            icon={FileClock}
            title="Receive requests"
            body="Verification requests are routed to you with the candidate record attached."
          />
          <FeatureCard
            icon={BookOpenCheck}
            title="Verify credentials"
            body="Confirm a certificate, licence or record with a note such as Certificate Confirmed."
          />
          <FeatureCard
            icon={XCircle}
            title="Reject invalid records"
            body="Mark Record Not Found or Information Incomplete and request additional information."
          />
          <FeatureCard
            icon={ScrollText}
            title="Verification history"
            body="Every decision is stored with date, notes and a verification reference number."
          />
          <FeatureCard
            icon={GraduationCap}
            title="Protect your name"
            body="Stop forged certificates being used in your institution's name."
          />
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            src={verifyDesk}
            alt="Institution officer verifying records"
            loading="lazy"
            width={1280}
            height={960}
            className="h-80 w-full rounded-3xl object-cover md:h-[26rem]"
          />
          <div>
            <SectionTitle
              eyebrow="Verification actions"
              title="Three clear decisions"
              intro="Institutions can verify, reject or request additional information — nothing is left ambiguous."
            />
            <div className="mt-8 grid gap-3">
              {[
                "Certificate Confirmed",
                "Record Not Found",
                "Awaiting Review",
                "Information Incomplete",
              ].map((n) => (
                <div
                  key={n}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-navy"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Partner with Gava Hub"
        body="Register your institution and start receiving verification requests through a secure channel."
        primaryLabel="Register your institution"
      />
    </SiteLayout>
  );
}
