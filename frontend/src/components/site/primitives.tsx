import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-5 py-20 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "dark",
}: {
  children: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <span className={`eyebrow ${tone === "light" ? "text-leaf" : "text-leaf-deep"}`}>
      <span className="h-px w-8 bg-current" />
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  intro,
  tone = "dark",
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  tone?: "dark" | "light";
  align?: "left" | "center";
}) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        className={`mt-4 text-3xl font-bold md:text-[2.6rem] md:leading-[1.1] ${
          tone === "light" ? "text-primary-foreground" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={`mt-4 text-base leading-relaxed ${
            tone === "light" ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="card-elevated group p-6 transition-transform duration-300 hover:-translate-y-1">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-navy transition-colors group-hover:bg-navy group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/5 p-5 backdrop-blur-sm">
      <p className="font-display text-3xl font-bold text-primary-foreground">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-primary-foreground/60">{label}</p>
    </div>
  );
}

export function CtaBand({
  title,
  body,
  primaryLabel = "Create your account",
}: {
  title: string;
  body: string;
  primaryLabel?: string;
}) {
  return (
    <Section>
      <div className="surface-navy overflow-hidden rounded-3xl">
        <div className="grid-lines px-8 py-14 md:px-14">
          <div className="max-w-2xl">
            <Eyebrow tone="light">Get started</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold text-primary-foreground md:text-4xl">{title}</h2>
            <p className="mt-4 text-primary-foreground/70">{body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-lg bg-leaf px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-leaf-deep"
              >
                {primaryLabel}
              </Link>
              <Link
                to="/contact"
                className="rounded-lg border border-white/25 px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/10"
              >
                Talk to our team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  alt,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  alt: string;
}) {
  return (
    <div className="surface-navy relative overflow-hidden">
      <img
        src={image}
        alt={alt}
        loading="lazy"
        width={1280}
        height={960}
        className="ken-burns absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="grid-lines relative">
        <div className="mx-auto max-w-7xl px-5 py-20 md:py-28">
          <div className="reveal max-w-3xl">
            <Eyebrow tone="light">{eyebrow}</Eyebrow>
            <h1 className="mt-4 text-4xl font-bold text-primary-foreground md:text-6xl md:leading-[1.05]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-primary-foreground/75">{intro}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
