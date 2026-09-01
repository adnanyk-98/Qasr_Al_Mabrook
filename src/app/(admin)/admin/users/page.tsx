import { requireAdminPermission, requireAdminSession } from "@/server/services/admin-auth";
import { listAdminUsersPaginated, findAdminUserById } from "@/server/repositories/admin";
import { AdminUsersClient } from "./users-client";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    role?: string;
    status?: string;
    edit?: string;
  }>;
}) {
  await requireAdminPermission("users.view");
  const admin = await requireAdminSession();

  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const pageSize = [10, 20, 30, 50].includes(Number(params.pageSize ?? "10"))
    ? Number(params.pageSize ?? "10")
    : 10;
  const role =
    params.role === "SUPER_ADMIN" || params.role === "ADMIN" ? params.role : "ALL";
  const status =
    params.status === "ACTIVE" || params.status === "DISABLED"
      ? params.status
      : "ALL";
  const search = typeof params.search === "string" ? params.search : "";

  const users = await listAdminUsersPaginated({
    page,
    pageSize,
    search,
    role: role === "ALL" ? undefined : role,
    status: status === "ALL" ? undefined : status,
  });

  const editingUser = params.edit ? await findAdminUserById(params.edit) : null;

  return (
    <AdminUsersClient
      users={users}
      editingUser={editingUser}
      currentAdmin={{
        id: admin.id,
        role: admin.role as "SUPER_ADMIN" | "ADMIN",
        permissions: admin.permissions || [],
      }}
      page={page}
      pageSize={pageSize}
      search={search}
      role={role}
      status={status}
    />
  );
}
