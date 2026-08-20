import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={['mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className].join(' ')}>{children}</div>;
}

export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={['py-12 sm:py-16', className].join(' ')}>{children}</section>;
}

export function Stack({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={['flex flex-col', className].join(' ')}>{children}</div>;
}
