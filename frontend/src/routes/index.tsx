import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  FileCheck2,
  FileText,
  GraduationCap,
  Landmark,
  Lock,
  Search,
  ShieldCheck,
  Upload,
  UserRoundCheck,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import {
  CtaBand,
  Eyebrow,
  FeatureCard,
  Section,
  SectionTitle,
  StatCard,
} from "@/components/site/primitives";
import heroCandidate from "@/assets/hero-candidate.jpg";
import employers from "@/assets/employers.jpg";
import institutions from "@/assets/institutions.jpg";
import skills from "@/assets/skills.jpg";
import mobileUser from "@/assets/mobile-user.jpg";
import nairobi from "@/assets/nairobi.jpg";
import verifyDesk from "@/assets/verify-desk.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gava Hub | Verified People. Trusted Hiring." },
      {
        name: "description",
        content:
          "Store, verify and share your credentials, qualifications and work experience through a secure platform trusted by Kenyan employers and institutions.",
      },
      { property: "og:title", content: "Gava Hub | Verified People. Trusted Hiring." },
      {
        property: "og:description",
        content:
          "A trusted verification ecosystem connecting candidates, employers and institutions across Kenya.",
      },
    ],
  }),
  component: Index,
});

const audiences = [
  {
    icon: UserRoundCheck,
    title: "Candidates",
    body: "Build a verified profile, upload your documents and share proof of who you are with any employer.",
    to: "/for-candidates" as const,
    image: mobileUser,
  },
  {
    icon: Briefcase,
    title: "Employers",
    body: "Search verified talent, request verification and hire with confidence backed by an audit trail.",
    to: "/for-employers" as const,
    image: employers,
  },
  {
    icon: Landmark,
    title: "Institutions",
    body: "Universities, colleges, TVETs and professional bodies confirm the records they issued.",
    to: "/for-institutions" as const,
    image: institutions,
  },
];

function Index() {
  return (
    <SiteLayout>
      {/* HERO */}
      <div className="surface-navy relative overflow-hidden">
        <div className="grid-lines">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="reveal">
              <Eyebrow tone="light">Verified People. Trusted Hiring.</Eyebrow>
              <h1 className="mt-5 text-4xl font-bold text-primary-foreground md:text-6xl md:leading-[1.04]">
                Prove who you are.
                <span className="block text-leaf">Hire who you trust.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/75">
                Store, verify and share your credentials, qualifications and work experience through
                a secure platform trusted by employers and institutions across Kenya.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-leaf px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-leaf-deep"
                >
                  Create your account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="rounded-lg border border-white/25 px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/10"
                >
                  See how it works
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <StatCard value="4" label="User types" />
                <StatCard value="7" label="Document types" />
                <StatCard value="100%" label="Audit logged" />
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-white/15">
                <img
                  src={heroCandidate}
                  alt="Kenyan professional woman holding a tablet in a Nairobi office"
                  width={1280}
                  height={1600}
                  className="h-[26rem] w-full object-cover object-top md:h-[34rem]"
                />
              </div>

              <div className="card-elevated absolute -bottom-6 left-4 w-64 p-4 md:-left-8">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-leaf/15 text-leaf-deep">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">Degree Verified</p>
                    <p className="text-xs text-muted-foreground">Ref GH-2026-04871</p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-[86%] rounded-full bg-leaf" />
                </div>
              </div>

              <div className="card-elevated absolute -top-5 right-2 hidden items-center gap-2 px-4 py-3 md:flex">
                <Lock className="h-4 w-4 text-navy" />
                <span className="text-xs font-semibold text-navy">Secure & consent based</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="border-y border-border bg-secondary/60 py-4">
        <div className="flex w-max marquee-track gap-10 whitespace-nowrap px-5">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex gap-10">
              {[
                "National ID",
                "Academic Certificates",
                "Professional Licenses",
                "Recommendation Letters",
                "Attachment Letters",
                "Internship Letters",
                "Employment History",
              ].map((item) => (
                <span
                  key={`${dup}-${item}`}
                  className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-navy/70"
                >
                  <FileCheck2 className="h-4 w-4 text-leaf-deep" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* AUDIENCES */}
      <Section>
        <SectionTitle
          eyebrow="One platform, three roles"
          title="Built for the people who need trust the most"
          intro="Gava Hub connects citizens, employers and institutions in a single verification chain — professional, secure and government-oriented."
        />
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {audiences.map((a) => (
            <Link
              key={a.title}
              to={a.to}
              className="card-elevated group overflow-hidden transition-transform duration-300 hover:-translate-y-1.5"
            >
              <img
                src={a.image}
                alt={`${a.title} using Gava Hub in Kenya`}
                loading="lazy"
                width={1280}
                height={960}
                className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-navy">
                  <a.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-xl font-semibold text-navy">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-leaf-deep">
                  Explore{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS STRIP */}
      <div className="surface-navy relative overflow-hidden">
        <img
          src={verifyDesk}
          alt="Institution registrar reviewing academic records"
          loading="lazy"
          width={1280}
          height={960}
          className="ken-burns absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="grid-lines relative">
          <Section>
            <SectionTitle
              tone="light"
              eyebrow="The verification chain"
              title="From upload to verified record in four steps"
              intro="Every verification is traceable — status, verifying institution, date, notes and a unique reference number."
            />
            <ol className="mt-12 grid gap-6 md:grid-cols-4">
              {[
                {
                  icon: Upload,
                  t: "Candidate uploads",
                  d: "ID, certificates, licences and letters uploaded to a secure profile.",
                },
                {
                  icon: Search,
                  t: "Employer requests",
                  d: "An employer finds the candidate and requests verification.",
                },
                {
                  icon: Landmark,
                  t: "Institution reviews",
                  d: "The issuing institution confirms, rejects or asks for more information.",
                },
                {
                  icon: ShieldCheck,
                  t: "Record is stamped",
                  d: "A verified record with reference number and audit log is issued.",
                },
              ].map((s, i) => (
                <li
                  key={s.t}
                  className="rounded-2xl border border-white/12 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <span className="font-display text-sm font-bold text-leaf">0{i + 1}</span>
                  <s.icon className="mt-4 h-6 w-6 text-primary-foreground" />
                  <h3 className="mt-4 text-lg font-semibold text-primary-foreground">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{s.d}</p>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>

      {/* FEATURES */}
      <Section>
        <SectionTitle
          align="center"
          eyebrow="Why Gava Hub"
          title="Trust you can document"
          intro="No social feed. No likes. No noise. Just verified records that employers and institutions can rely on."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={FileText}
            title="One secure record"
            body="Education, skills, experience and documents held in a single, structured citizen profile."
          />
          <FeatureCard
            icon={GraduationCap}
            title="Institution-backed"
            body="Universities, colleges, TVETs and professional bodies verify the credentials they issued."
          />
          <FeatureCard
            icon={Building2}
            title="Employer ready"
            body="Post jobs, search candidates and view verification status without chasing paperwork."
          />
          <FeatureCard
            icon={BadgeCheck}
            title="Experience verified"
            body="Internships, attachments, volunteer and part-time work confirmed by supervisors and organisations."
          />
          <FeatureCard
            icon={Lock}
            title="Consent and control"
            body="Candidates decide who can see their profile and every access is logged."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Admin oversight"
            body="Platform administrators maintain audit logs, approvals and reporting end to end."
          />
        </div>
      </Section>

      {/* SKILLS FEATURE SPLIT */}
      <Section className="pt-0">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <img
              src={skills}
              alt="Young Kenyan technician training in a TVET workshop"
              loading="lazy"
              width={1280}
              height={960}
              className="h-64 w-full rounded-2xl object-cover sm:h-80"
            />
            <img
              src={institutions}
              alt="Kenyan graduates holding their certificates"
              loading="lazy"
              width={1280}
              height={960}
              className="h-64 w-full rounded-2xl object-cover sm:mt-10 sm:h-80"
            />
          </div>
          <div>
            <SectionTitle
              eyebrow="Every kind of talent"
              title="Graduates, artisans, interns and professionals"
              intro="Whether you trained at a university, a TVET or on the job, Gava Hub gives your experience a verifiable record — so opportunity follows proof, not connections."
            />
            <ul className="mt-8 space-y-4">
              {[
                "Attachment Verified",
                "Internship Verified",
                "Volunteer Verified",
                "Employment Verified",
              ].map((v) => (
                <li key={v} className="flex items-center gap-3 text-sm font-medium text-navy">
                  <BadgeCheck className="h-5 w-5 text-leaf-deep" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* NAIROBI BAND */}
      <div className="relative overflow-hidden">
        <img
          src={nairobi}
          alt="Nairobi city skyline at dusk"
          loading="lazy"
          width={1600}
          height={912}
          className="h-[22rem] w-full object-cover md:h-[26rem]"
        />
        <div className="absolute inset-0 bg-navy-deep/75" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto max-w-7xl px-5">
            <Eyebrow tone="light">Made for Kenya</Eyebrow>
            <p className="mt-4 max-w-2xl font-display text-2xl font-semibold leading-snug text-primary-foreground md:text-4xl">
              “Helping employers trust candidate information and helping candidates prove who they
              are.”
            </p>
          </div>
        </div>
      </div>

      <CtaBand
        title="Start building your verified record today"
        body="Register as a candidate, employer or institution and join a verification ecosystem designed for trust."
      />
    </SiteLayout>
  );
}
