import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--background)] shadow-[var(--shadow-sm)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={['border-b border-[var(--brand-border)] p-5', className].join(' ')}>{children}</div>;
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={['p-5', className].join(' ')}>{children}</div>;
}
