import type { TeamColor } from "@defuse/shared";
import type { ButtonHTMLAttributes } from "react";

export const teamBg: Record<TeamColor, string> = {
  "team-1": "bg-team-1",
  "team-2": "bg-team-2",
  "team-3": "bg-team-3",
  "team-4": "bg-team-4",
};

/** Team color is always shown next to the team name, never on its own. */
export function TeamDot({ color, className = "size-4" }: { color: TeamColor; className?: string }) {
  return <span aria-hidden className={`inline-block shrink-0 rounded-full ${teamBg[color]} ${className}`} />;
}

const variants = {
  primary: "bg-primary text-on-primary active:bg-primary-pressed disabled:bg-surface-raised disabled:text-on-surface-muted",
  secondary: "bg-surface text-on-surface border border-outline-strong active:bg-surface-raised disabled:text-on-surface-muted",
  danger: "bg-error-container text-on-error-container disabled:opacity-60",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      {...props}
      className={`h-14 rounded-md px-4 text-base font-semibold tracking-[0.02em] disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    />
  );
}

export const inputClass =
  "h-14 w-full rounded-md border border-outline bg-surface px-4 text-lg text-on-surface placeholder:text-on-surface-muted focus:border-primary focus:outline-none";
