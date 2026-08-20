import type { ButtonHTMLAttributes, ReactNode } from "react";

const buttonVariants = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] shadow-[var(--shadow-sm)]",
  secondary:
    "bg-[var(--brand-primary-light)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]/90",
  outline:
    "border border-[var(--brand-border)] bg-white text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]",
  ghost:
    "text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]",
} as const;

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  xl: "h-12 px-6 text-base",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  icon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      ].join(" ")}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}
