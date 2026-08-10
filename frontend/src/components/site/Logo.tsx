import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img
        src={logo}
        alt="Gava Hub logo"
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-full bg-white object-contain"
      />
      <span className="leading-tight">
        <span
          className={`block font-display text-lg font-bold tracking-tight ${
            variant === "light" ? "text-primary-foreground" : "text-navy"
          }`}
        >
          Gava Hub
        </span>
        <span
          className={`block text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${
            variant === "light" ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          Verified People
        </span>
      </span>
    </Link>
  );
}
