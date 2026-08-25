export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--brand-border)] bg-white p-8 text-center shadow-[var(--shadow-sm)]">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-8 text-center text-sm text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
      {label ?? "Preparing content..."}
    </div>
  );
}
