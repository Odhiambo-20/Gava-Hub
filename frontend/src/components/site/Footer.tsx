import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="surface-navy mt-24">
      <div className="grid-lines">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              Gava Hub is a trusted verification ecosystem for employment and professional
              development in Kenya — helping employers trust candidate information and helping
              candidates prove who they are.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground/90">
              Platform
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-primary-foreground/70">
              {[
                { to: "/about", label: "About Gava Hub" },
                { to: "/how-it-works", label: "How It Works" },
                { to: "/for-candidates", label: "For Candidates" },
                { to: "/for-employers", label: "For Employers" },
                { to: "/for-institutions", label: "For Institutions" },
                { to: "/faq", label: "FAQ" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition-colors hover:text-primary-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground/90">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-leaf" />
                Upper Hill, Nairobi, Kenya
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-leaf" />
                +254 700 000 000
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-leaf" />
                support@gavahub.co.ke
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/10 px-5 py-6 text-xs text-primary-foreground/55 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Gava Hub. All rights reserved.</p>
          <p>Verified People. Trusted Hiring.</p>
        </div>
      </div>
    </footer>
  );
}
