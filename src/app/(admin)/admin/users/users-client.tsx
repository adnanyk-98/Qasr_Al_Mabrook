"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Input, Label, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AdminBackButton } from "@/components/admin/admin-back-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDateConsistent } from "@/lib/date-utils";
import {
  createAdminUserAction,
  updateAdminUserAction,
  disableAdminUserAction,
  enableAdminUserAction,
  deleteAdminUserAction,
} from "./actions";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: "SUPER_ADMIN" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
  permissions: string[];
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface AdminUsersClientProps {
  users: {
    items: User[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  editingUser: User | null;
  currentAdmin: {
    id: string;
    role: "SUPER_ADMIN" | "ADMIN";
    permissions: string[];
  };
  page: number;
  pageSize: number;
  search: string;
  role: string;
  status: string;
}

export function AdminUsersClient({
  users,
  editingUser,
  currentAdmin,
  page,
  pageSize,
  search,
  role,
  status,
}: AdminUsersClientProps) {
  const router = useRouter();
  const createFormRef = useRef<HTMLFormElement | null>(null);
  const editFormRef = useRef<HTMLFormElement | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const canCreate =
    currentAdmin.role === "SUPER_ADMIN" ||
    currentAdmin.permissions?.includes("users.create");
  const canEdit =
    currentAdmin.role === "SUPER_ADMIN" ||
    currentAdmin.permissions?.includes("users.edit");
  const canDelete =
    currentAdmin.role === "SUPER_ADMIN" ||
    currentAdmin.permissions?.includes("users.delete");
  const canManage =
    currentAdmin.role === "SUPER_ADMIN" ||
    currentAdmin.permissions?.includes("users.manage_access");

  const handleCreateSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isSubmitting) return;

      setCreateError(null);
      setCreateSuccess(false);
      setIsSubmitting(true);

      try {
        const form = e.currentTarget;
        const formData = new FormData(form);
        const result = await createAdminUserAction(formData);

        if (result.ok) {
          setCreateSuccess(true);
          setShowCreateForm(false);
          form.reset();
          router.refresh();
          return;
        }

        setCreateError(result.error || "Failed to create user");
      } catch (error) {
        console.error("Error submitting create form:", error);
        setCreateError("An unexpected error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router]
  );

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isSubmitting) return;

      setEditError(null);
      setEditSuccess(false);
      setIsSubmitting(true);

      try {
        const formData = new FormData(e.currentTarget);
        const result = await updateAdminUserAction(formData);

        if (result.ok) {
          setEditSuccess(true);
          editFormRef.current?.reset();
          router.refresh();
          return;
        }

        setEditError(result.error || "Failed to update user");
      } catch (error) {
        console.error("Error updating admin user:", error);
        setEditError("An unexpected error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router]
  );

  const handleDeleteClick = (displayName: string) => {
    return confirm(
      `Are you sure you want to delete ${displayName}? This action cannot be undone.`
    );
  };

  const handleDisableClick = (displayName: string) => {
    return confirm(
      `Are you sure you want to disable ${displayName}? They will not be able to log in.`
    );
  };

  const handleMutationSubmit = useCallback(
    async (
      e: React.FormEvent<HTMLFormElement>,
      action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>
    ) => {
      e.preventDefault();
      if (isSubmitting) return;

      setCreateError(null);
      setEditError(null);
      setIsSubmitting(true);

      try {
        const formData = new FormData(e.currentTarget);
        const result = await action(formData);

        if (!result.ok) {
          const message = result.error || "The request failed.";
          setCreateError(message);
          setEditError(message);
          return;
        }

        router.refresh();
      } catch (error) {
        console.error("Mutation error:", error);
        const message = "An unexpected error occurred";
        setCreateError(message);
        setEditError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router]
  );

  const buildQueryString = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    params.set("page", String(overrides.page ?? page));
    params.set("pageSize", String(overrides.pageSize ?? pageSize));
    params.set("search", String(overrides.search ?? search));
    const roleVal = overrides.role ?? role;
    if (roleVal !== "ALL") {
      params.set("role", String(roleVal));
    }
    const statusVal = overrides.status ?? status;
    if (statusVal !== "ALL") {
      params.set("status", String(statusVal));
    }
    return params.toString();
  };

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
              Super Admin
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
              User &amp; Role Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <AdminBackButton />
            {canCreate && (
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="primary"
                size="md"
              >
                {showCreateForm ? "Cancel" : "Add User"}
              </Button>
            )}
          </div>
        </div>

        {showCreateForm && canCreate && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Create New User
              </h2>
            </CardHeader>
            <CardBody>
              {createSuccess && (
                <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700">
                  ✓ User created successfully! Refreshing...
                </div>
              )}
              {createError && (
                <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
                  ✗ {createError}
                </div>
              )}
              <form ref={createFormRef} onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      name="email"
                      type="email"
                      required
                      placeholder="user@example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-name">Display Name</Label>
                    <Input
                      id="create-name"
                      name="displayName"
                      required
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="create-password">Password</Label>
                    <Input
                      id="create-password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-role">Role</Label>
                    <Select
                      id="create-role"
                      name="role"
                      defaultValue="ADMIN"
                      disabled={isSubmitting}
                    >
                      {currentAdmin.role === "SUPER_ADMIN" && (
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      )}
                      <option value="ADMIN">ADMIN</option>
                    </Select>
                  </div>
                </div>

                {currentAdmin.role === "SUPER_ADMIN" && (
                  <div>
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {[
                        "users.view",
                        "users.create",
                        "users.edit",
                        "users.delete",
                        "users.manage_access",
                      ].map((perm) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            name="permissions"
                            value={perm}
                            disabled={isSubmitting}
                            className="h-4 w-4 rounded border-[var(--brand-border)] text-[var(--brand-primary)]"
                          />
                          <span className="text-sm text-[var(--foreground)]">
                            {perm}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || createSuccess}
                  >
                    {isSubmitting ? "Creating..." : "Create User"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateError(null);
                      setCreateSuccess(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Filters
            </h2>
          </CardHeader>
          <CardBody>
            <form
              method="get"
              action="/admin/users"
              className="grid gap-4 md:grid-cols-4"
            >
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  name="search"
                  defaultValue={search}
                  placeholder="Name or email"
                />
              </div>
              <div>
                <Label htmlFor="role-filter">Role</Label>
                <Select id="role-filter" name="role" defaultValue={role}>
                  <option value="ALL">All</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select id="status-filter" name="status" defaultValue={status}>
                  <option value="ALL">All</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISABLED">DISABLED</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Apply
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Users ({users.total})
            </h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--brand-border)] text-[var(--text-muted)]">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Last Login</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-[var(--text-muted)]"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.items.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[var(--brand-border)] align-middle hover:bg-[var(--brand-surface-hover)]"
                      >
                        <td className="px-3 py-3 font-medium">
                          {user.displayName}
                        </td>
                        <td className="px-3 py-3 text-xs">{user.email}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-[var(--brand-primary-light)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              user.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {formatDateConsistent(user.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {user.lastLoginAt
                            ? formatDateConsistent(user.lastLoginAt)
                            : "Never"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {canEdit && (
                              <a
                                href={`/admin/users?edit=${user.id}`}
                                className="text-xs text-[var(--brand-primary)] hover:underline"
                              >
                                Edit
                              </a>
                            )}
                            {user.status === "ACTIVE" && canManage && (
                              <form
                                method="POST"
                                onSubmit={async (e) => {
                                  if (!handleDisableClick(user.displayName)) {
                                    e.preventDefault();
                                    return;
                                  }
                                  await handleMutationSubmit(e, disableAdminUserAction);
                                }}
                                className="inline"
                              >
                                <input type="hidden" name="userId" value={user.id} />
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="text-xs text-orange-600 hover:underline disabled:opacity-50"
                                >
                                  Disable
                                </button>
                              </form>
                            )}
                            {user.status === "DISABLED" && canManage && (
                              <form
                                method="POST"
                                className="inline"
                                onSubmit={async (e) => {
                                  await handleMutationSubmit(e, enableAdminUserAction);
                                }}
                              >
                                <input type="hidden" name="userId" value={user.id} />
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="text-xs text-green-600 hover:underline disabled:opacity-50"
                                >
                                  Enable
                                </button>
                              </form>
                            )}
                            {canDelete && user.role !== "SUPER_ADMIN" && (
                              <form
                                method="POST"
                                onSubmit={async (e) => {
                                  if (!handleDeleteClick(user.displayName)) {
                                    e.preventDefault();
                                    return;
                                  }
                                  await handleMutationSubmit(e, deleteAdminUserAction);
                                }}
                                className="inline"
                              >
                                <input type="hidden" name="userId" value={user.id} />
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {users.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-[var(--text-muted)]">
                  Showing{" "}
                  {users.items.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
                  {Math.min(page * pageSize, users.total)} of {users.total}{" "}
                  users
                </div>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin/users?${buildQueryString({
                        page: page - 1,
                      })}`}
                      className="rounded border border-[var(--brand-border)] px-3 py-1 text-sm hover:bg-[var(--brand-surface-hover)]"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="text-sm text-[var(--text-muted)]">
                    Page {page} of {users.totalPages}
                  </span>
                  {page < users.totalPages && (
                    <Link
                      href={`/admin/users?${buildQueryString({
                        page: page + 1,
                      })}`}
                      className="rounded border border-[var(--brand-border)] px-3 py-1 text-sm hover:bg-[var(--brand-surface-hover)]"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {editingUser && canEdit && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Edit User - {editingUser.displayName}
              </h2>
            </CardHeader>
            <CardBody>
              {editSuccess && (
                <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700">
                  ✓ User updated successfully.
                </div>
              )}
              {editError && (
                <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
                  ✗ {editError}
                </div>
              )}
              <form ref={editFormRef} onSubmit={handleEditSubmit} className="space-y-4">
                <input type="hidden" name="userId" value={editingUser.id} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" value={editingUser.email} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="edit-name">Display Name</Label>
                    <Input
                      id="edit-name"
                      name="displayName"
                      defaultValue={editingUser.displayName}
                      placeholder="Display name"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {currentAdmin.role === "SUPER_ADMIN" && (
                    <>
                      <div>
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                          id="edit-role"
                          name="role"
                          defaultValue={editingUser.role}
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="ADMIN">ADMIN</option>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-status">Status</Label>
                        <Select
                          id="edit-status"
                          name="status"
                          defaultValue={editingUser.status}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="DISABLED">DISABLED</option>
                        </Select>
                      </div>
                    </>
                  )}
                  {currentAdmin.role === "ADMIN" &&
                    canManage &&
                    editingUser.role === "ADMIN" && (
                      <div>
                        <Label htmlFor="edit-status-admin">Status</Label>
                        <Select
                          id="edit-status-admin"
                          name="status"
                          defaultValue={editingUser.status}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="DISABLED">DISABLED</option>
                        </Select>
                      </div>
                    )}
                </div>

                {currentAdmin.role === "SUPER_ADMIN" &&
                  editingUser.role === "ADMIN" && (
                    <div>
                      <Label>Permissions</Label>
                      <div className="space-y-2">
                        {[
                          "users.view",
                          "users.create",
                          "users.edit",
                          "users.delete",
                          "users.manage_access",
                        ].map((perm) => (
                          <label
                            key={perm}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="checkbox"
                              name="permissions"
                              value={perm}
                              defaultChecked={editingUser.permissions?.includes(
                                perm
                              )}
                              className="h-4 w-4 rounded border-[var(--brand-border)] text-[var(--brand-primary)]"
                            />
                            <span className="text-sm text-[var(--foreground)]">
                              {perm}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Link
                    href="/admin/users"
                    className="rounded border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--brand-surface-hover)]"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </main>
  );
}
