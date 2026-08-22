export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-[var(--text-muted)]">The requested page is not available.</p>
      </div>
    </main>
  );
}
