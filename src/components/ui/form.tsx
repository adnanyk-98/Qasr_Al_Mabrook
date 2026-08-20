import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Label({
  children,
  htmlFor,
  className = "",
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={['mb-2 block text-sm font-medium text-[var(--foreground)]', className].join(' ')}
    >
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "w-full rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        "w-full rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: InputHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={[
        "w-full rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
