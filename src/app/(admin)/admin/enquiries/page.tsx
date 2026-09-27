import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { AdminBackButton } from "@/components/admin/admin-back-button";
import { requireAdminSession } from "@/server/services/admin-auth";
import { listQuoteRequestsWithItems } from "@/server/repositories/enquiries";
import { updateQuoteRequestStatusAction } from "@/server/services/enquiries";

export default async function EnquiriesPage() {
  await requireAdminSession();
  const quoteRequests = await listQuoteRequestsWithItems();

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">Enquiries</h1>
          </div>
          <AdminBackButton />
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Quote requests</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {quoteRequests.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No quote requests yet.</p>
            ) : (
              quoteRequests.map((request) => (
                <div key={request.id} className="rounded-[var(--radius-md)] border border-[var(--brand-border)] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{request.referenceNumber} · {request.customerName}</p>
                      <p className="text-sm text-[var(--text-muted)]">{request.customerEmail} · {request.customerPhone}</p>
                      {request.items.length > 0 ? <p className="mt-1 text-sm text-[var(--text-muted)]">{request.items.map((item) => `${item.productNameSnapshot}${item.skuSnapshot ? ` (${item.skuSnapshot})` : ""}`).join(", ")}</p> : null}
                      {request.message ? <p className="mt-1 text-sm text-[var(--text-muted)]">{request.message}</p> : null}
                    </div>
                    <form action={updateQuoteRequestStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={request.id} />
                      <Select name="status" defaultValue={request.status} aria-label={`Status for ${request.referenceNumber}`} className="w-auto">
                        {['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'SPAM'].map((status) => <option key={status} value={status}>{status}</option>)}
                      </Select>
                      <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-3 py-2 text-xs font-medium text-white">Update</button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
