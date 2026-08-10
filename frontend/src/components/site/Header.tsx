import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { AUTH_CHANGED_EVENT, clearSession, getSession } from "@/lib/api/auth";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/for-candidates", label: "Candidates" },
  { to: "/for-employers", label: "Employers" },
  { to: "/for-institutions", label: "Institutions" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const refresh = () => setSignedIn(getSession() !== null);
    refresh();
    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5">
        <Logo />

        <nav className="hidden items-center gap-1 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-navy data-[status=active]:bg-secondary data-[status=active]:text-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={clearSession}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-secondary"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-secondary"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-navy-soft"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-navy xl:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 pb-6 pt-3 xl:hidden">
          <nav className="grid gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-navy hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            {signedIn ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearSession();
                    setOpen(false);
                  }}
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-navy"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Sign in / Register
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
