import { createFileRoute } from "@tanstack/react-router";
import { Building2, HeartHandshake, ShieldCheck, Target } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import {
  CtaBand,
  FeatureCard,
  PageHero,
  Section,
  SectionTitle,
} from "@/components/site/primitives";
import employers from "@/assets/employers.jpg";
import institutions from "@/assets/institutions.jpg";
import mobileUser from "@/assets/mobile-user.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Gava Hub | A trusted verification ecosystem" },
      {
        name: "description",
        content:
          "Gava Hub is a trusted verification ecosystem for employment and professional development, connecting talent, education and employers in Kenya.",
      },
      { property: "og:title", content: "About Gava Hub" },
      {
        property: "og:description",
        content:
          "We help individuals manage professional records, employers verify candidates and institutions validate credentials.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="About Gava Hub"
        title="A trusted verification ecosystem for work and learning"
        intro="We enable individuals to manage their professional records, employers to verify candidate information and institutions to validate credentials through a secure, transparent process."
        image={employers}
        alt="Kenyan professionals reviewing candidate records together"
      />

      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="Our purpose"
              title="Improving trust between talent and opportunity"
              intro="By improving trust, Gava Hub helps create stronger connections between talent, education and employment opportunities. The platform is deliberately professional, secure and government-oriented."
            />
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Gava Hub is not a social media platform. There is no feed, no likes, no comments and
              no networking posts — only verified records, clear verification status and a full
              audit trail for every request.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <img
              src={mobileUser}
              alt="Kenyan woman using the Gava Hub platform on her phone"
              loading="lazy"
              width={1280}
              height={960}
              className="h-64 w-full rounded-2xl object-cover sm:h-80"
            />
            <img
              src={institutions}
              alt="Kenyan graduates with certificates"
              loading="lazy"
              width={1280}
              height={960}
              className="h-64 w-full rounded-2xl object-cover sm:mt-10 sm:h-80"
            />
          </div>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionTitle align="center" eyebrow="What guides us" title="Four commitments" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={ShieldCheck}
            title="Security first"
            body="Documents and personal data are handled with strict access control and full logging."
          />
          <FeatureCard
            icon={Target}
            title="One clear problem"
            body="Helping employers trust candidate information and helping candidates prove who they are."
          />
          <FeatureCard
            icon={HeartHandshake}
            title="Consent driven"
            body="Candidates control what is shared and with whom, every single time."
          />
          <FeatureCard
            icon={Building2}
            title="Institution led"
            body="Verification comes from the bodies that issued the credential — not from guesswork."
          />
        </div>
      </Section>

      <CtaBand
        title="Join the verification ecosystem"
        body="Candidates, employers and institutions can register today and start building trusted records."
      />
    </SiteLayout>
  );
}
