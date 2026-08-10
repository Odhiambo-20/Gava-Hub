import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Landmark, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import heroCandidate from "@/assets/hero-candidate.jpg";
import { login, register, saveSession } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in or Register | Gava Hub" },
      {
        name: "description",
        content:
          "Sign in to your Gava Hub account or register as a candidate, employer or institution to start verifying credentials.",
      },
      { property: "og:title", content: "Sign in or Register | Gava Hub" },
      {
        property: "og:description",
        content: "Access your candidate, employer or institution dashboard on Gava Hub.",
      },
    ],
  }),
  component: LoginPage,
});

const roles = [
  { id: "candidate", label: "Candidate", icon: UserRound },
  { id: "employer", label: "Employer", icon: Briefcase },
  { id: "institution", label: "Institution", icon: Landmark },
] as const;

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [role, setRole] = useState<(typeof roles)[number]["id"]>("candidate");
  const [submitting, setSubmitting] = useState(false);

  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-24">
        <div>
          <div className="inline-flex rounded-xl border border-border bg-secondary p-1">
            {(["signin", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                  mode === m ? "bg-navy text-primary-foreground" : "text-navy"
                }`}
              >
                {m === "signin" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <h1 className="mt-8 text-3xl font-bold text-navy md:text-4xl">
            {mode === "signin" ? "Welcome back to Gava Hub" : "Create your Gava Hub account"}
          </h1>
          <p className="mt-3 max-w-lg text-muted-foreground">
            {mode === "signin"
              ? "Access your dashboard to manage documents, requests and verification status."
              : "Choose your account type to get started. You can complete your profile after registering."}
          </p>

          {mode === "register" && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`card-elevated flex flex-col items-start gap-3 p-5 text-left transition-colors ${
                    role === r.id ? "border-navy" : ""
                  }`}
                >
                  <r.icon className={`h-5 w-5 ${role === r.id ? "text-leaf-deep" : "text-navy"}`} />
                  <span className="text-sm font-semibold text-navy">{r.label}</span>
                </button>
              ))}
            </div>
          )}

          <form
            className="mt-8 max-w-lg space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (submitting) return;
              setSubmitting(true);
              const data = new FormData(e.currentTarget);
              const email = String(data.get("email") ?? "")
                .trim()
                .toLowerCase();
              const password = String(data.get("password") ?? "");
              try {
                const session =
                  mode === "signin"
                    ? await login({ email, password })
                    : await register({
                        email,
                        password,
                        displayName: String(data.get("name") ?? "").trim(),
                        accountType: role.toUpperCase() as "CANDIDATE" | "EMPLOYER" | "INSTITUTION",
                        ...(String(data.get("phone") ?? "").trim()
                          ? { phoneNumber: String(data.get("phone")).trim() }
                          : {}),
                      });
                saveSession(session);
                toast.success(mode === "signin" ? "Signed in" : "Account created", {
                  description:
                    mode === "register" && role !== "candidate"
                      ? "Your account is ready. Organisation onboarding will continue from your dashboard."
                      : "Your secure Gava Hub session is now active.",
                });
                await navigate({ to: "/dashboard" });
              } catch (error) {
                toast.error(mode === "signin" ? "Sign in failed" : "Registration failed", {
                  description:
                    error instanceof ApiError ? error.message : "Could not reach the Gava Hub API.",
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {mode === "register" && (
              <Input label={role === "candidate" ? "Full name" : "Organisation name"} name="name" />
            )}
            <Input label="Email address" name="email" type="email" />
            {mode === "register" && <Input label="Phone number" name="phone" />}
            <Input label="Password" name="password" type="password" />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-navy px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-navy-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-leaf-deep" />
              Your documents are stored securely and shared only with your consent.
            </p>
            <p className="text-sm text-muted-foreground">
              Need help getting started?{" "}
              <Link to="/contact" className="font-semibold text-leaf-deep">
                Contact our team
              </Link>
            </p>
          </form>
        </div>

        <div className="relative hidden overflow-hidden rounded-3xl lg:block">
          <img
            src={heroCandidate}
            alt="Kenyan professional signing in to Gava Hub"
            loading="lazy"
            width={1280}
            height={1600}
            className="h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-navy-deep/45" />
          <div className="absolute bottom-0 p-8">
            <p className="font-display text-2xl font-semibold text-primary-foreground">
              Verified People. Trusted Hiring.
            </p>
            <p className="mt-2 max-w-xs text-sm text-primary-foreground/75">
              One profile. Institution-backed verification. Employers who trust what they see.
            </p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Input({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-navy" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-navy outline-none focus:border-navy"
      />
    </div>
  );
}
