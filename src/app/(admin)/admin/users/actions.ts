"use server";

import { z } from "zod";

import {
  countActiveSuperAdmins,
  createAdminUser,
  deleteAdminUserById,
  findAdminUserById,
  updateAdminUser,
  findAdminUserByEmail,
} from "@/server/repositories/admin";
import {
  adminHasPermission,
  hashPassword,
  normalizePermissions as normalizePermsAuth,
  requireAdminSession,
  ADMIN_USER_PERMISSIONS,
  validateAdminCanMutateUser,
  validatePermissionGrant,
} from "@/server/services/admin-auth";

const emailSchema = z.string().trim().email("Invalid email");
const idSchema = z.string().uuid("Invalid ID format");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const displayNameSchema = z.string().trim().min(1, "Display name is required").max(255, "Display name is too long");

const validRoles = ["SUPER_ADMIN", "ADMIN"] as const;

interface ActionResult {
  ok: boolean;
  error?: string;
  data?: unknown;
}

function normalizePermissions(value: FormDataEntryValue | null | undefined): string[] {
  if (!value) return [];
  const parts = String(value)
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return parts.filter((p) => (ADMIN_USER_PERMISSIONS as readonly string[]).includes(p));
}

export async function createAdminUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminSession();

    if (!adminHasPermission(actor, "users.create")) {
      return { ok: false, error: "You do not have permission to create users" };
    }

    const email = String(formData.get("email") ?? "").trim();
    const displayName = String(formData.get("displayName") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const role = String(formData.get("role") ?? "ADMIN");
    const permissionsInput = normalizePermissions(formData.get("permissions"));

    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return { ok: false, error: "Invalid email address" };
    }

    const displayNameValidation = displayNameSchema.safeParse(displayName);
    if (!displayNameValidation.success) {
      return { ok: false, error: "Invalid display name" };
    }

    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }

    if (!validRoles.includes(role as typeof validRoles[number])) {
      return { ok: false, error: "Invalid role" };
    }

    if (role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
      return { ok: false, error: "You do not have permission to create SUPER_ADMIN users" };
    }

    const existingUser = await findAdminUserByEmail(email);
    if (existingUser) {
      return { ok: false, error: "Email already exists" };
    }

    if (permissionsInput.length > 0) {
      const permValidation = await validatePermissionGrant(actor.id, permissionsInput);
      if (!permValidation.allowed) {
        return { ok: false, error: permValidation.reason };
      }
    }

    let finalPermissions: string[] = [];
    if (role === "SUPER_ADMIN") {
      finalPermissions = ["users.view", "users.create", "users.edit", "users.delete", "users.manage_access"];
    } else {
      finalPermissions = permissionsInput;
    }

    const passwordHash = await hashPassword(password);

    const user = await createAdminUser({
      email,
      displayName,
      role: role as "SUPER_ADMIN" | "ADMIN",
      status: "ACTIVE",
      permissions: finalPermissions,
      passwordHash,
    });

    if (!user) {
      return { ok: false, error: "Failed to create user" };
    }

    return { ok: true, data: { id: user.id, email: user.email } };
  } catch (error) {
    console.error("Error creating admin user:", error);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function updateAdminUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminSession();
    const userId = String(formData.get("userId") ?? "");

    const idValidation = idSchema.safeParse(userId);
    if (!idValidation.success) {
      return { ok: false, error: "Invalid user ID" };
    }

    const target = await findAdminUserById(userId);
    if (!target) {
      return { ok: false, error: "User not found" };
    }

    const displayName = String(formData.get("displayName") ?? "").trim();
    const role = String(formData.get("role") ?? "");
    const status = String(formData.get("status") ?? "");
    const permissionsInput = normalizePermissions(formData.get("permissions"));

    const mutationAllowed = await validateAdminCanMutateUser(
      actor.id,
      userId,
      role || target.role,
      status || target.status,
    );

    if (!mutationAllowed.allowed) {
      return { ok: false, error: mutationAllowed.reason };
    }

    if (displayName && !displayNameSchema.safeParse(displayName).success) {
      return { ok: false, error: "Invalid display name" };
    }

    if (actor.id === userId && actor.role === "SUPER_ADMIN" && role === "ADMIN") {
      const activeSuperAdminCount = await countActiveSuperAdmins();
      if (activeSuperAdminCount <= 1) {
        return { ok: false, error: "Cannot demote yourself as the last active SUPER_ADMIN" };
      }
    }

    if (actor.id === userId && actor.role === "SUPER_ADMIN" && status === "DISABLED") {
      const activeSuperAdminCount = await countActiveSuperAdmins();
      if (activeSuperAdminCount <= 1) {
        return { ok: false, error: "Cannot disable yourself as the last active SUPER_ADMIN" };
      }
    }

    if (role) {
      if (!validRoles.includes(role as typeof validRoles[number])) {
        return { ok: false, error: "Invalid role" };
      }
      if (role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
        return { ok: false, error: "You do not have permission to assign SUPER_ADMIN role" };
      }
    }

    if (status) {
      if (!["ACTIVE", "DISABLED"].includes(status)) {
        return { ok: false, error: "Invalid status" };
      }
      if (target.role === "SUPER_ADMIN" && status === "DISABLED" && target.status === "ACTIVE") {
        const activeSuperAdminCount = await countActiveSuperAdmins();
        if (activeSuperAdminCount <= 1) {
          return { ok: false, error: "Cannot disable the last active SUPER_ADMIN" };
        }
      }
    }

    let finalPermissions: string[] | undefined = undefined;
    if (permissionsInput.length > 0 || (role && role !== "SUPER_ADMIN")) {
      const roleToCheck = role || target.role;
      if (roleToCheck === "SUPER_ADMIN") {
        finalPermissions = ["users.view", "users.create", "users.edit", "users.delete", "users.manage_access"];
      } else {
        if (permissionsInput.length > 0) {
          const permValidation = await validatePermissionGrant(actor.id, permissionsInput);
          if (!permValidation.allowed) {
            return { ok: false, error: permValidation.reason };
          }
          finalPermissions = permValidation.sanitized;
        } else {
          finalPermissions = normalizePermsAuth(target.permissions);
        }
      }
    }

    const updateData: Parameters<typeof updateAdminUser>[0] = {
      id: userId,
    };

    if (displayName && displayName !== target.displayName) {
      updateData.displayName = displayName;
    }
    if (role && role !== target.role) {
      updateData.role = role as "SUPER_ADMIN" | "ADMIN";
    }
    if (status && status !== target.status) {
      updateData.status = status as "ACTIVE" | "DISABLED";
    }
    if (finalPermissions !== undefined) {
      updateData.permissions = finalPermissions;
    }

    const updated = await updateAdminUser(updateData);
    if (!updated) {
      return { ok: false, error: "Failed to update user" };
    }

    return { ok: true, data: { id: updated.id } };
  } catch (error) {
    console.error("Error updating admin user:", error);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function disableAdminUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminSession();
    const userId = String(formData.get("userId") ?? "");

    if (!idSchema.safeParse(userId).success) {
      return { ok: false, error: "Invalid user ID" };
    }

    const target = await findAdminUserById(userId);
    if (!target) {
      return { ok: false, error: "User not found" };
    }

    if (actor.id === userId) {
      return { ok: false, error: "You cannot disable your own account" };
    }

    if (target.role === "SUPER_ADMIN" && target.status === "ACTIVE") {
      const activeSuperAdminCount = await countActiveSuperAdmins();
      if (activeSuperAdminCount <= 1) {
        return { ok: false, error: "Cannot disable the last active SUPER_ADMIN" };
      }
    }

    const allowed = await validateAdminCanMutateUser(actor.id, userId, target.role, "DISABLED");
    if (!allowed.allowed) {
      return { ok: false, error: allowed.reason };
    }

    const updated = await updateAdminUser({ id: userId, status: "DISABLED" });
    if (!updated) {
      return { ok: false, error: "Failed to disable user" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error disabling admin user:", error);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function enableAdminUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminSession();
    const userId = String(formData.get("userId") ?? "");

    if (!idSchema.safeParse(userId).success) {
      return { ok: false, error: "Invalid user ID" };
    }

    const target = await findAdminUserById(userId);
    if (!target) {
      return { ok: false, error: "User not found" };
    }

    const allowed = await validateAdminCanMutateUser(actor.id, userId, target.role, "ACTIVE");
    if (!allowed.allowed) {
      return { ok: false, error: allowed.reason };
    }

    const updated = await updateAdminUser({ id: userId, status: "ACTIVE" });
    if (!updated) {
      return { ok: false, error: "Failed to enable user" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error enabling admin user:", error);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function deleteAdminUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireAdminSession();
    const userId = String(formData.get("userId") ?? "");

    if (!idSchema.safeParse(userId).success) {
      return { ok: false, error: "Invalid user ID" };
    }

    const target = await findAdminUserById(userId);
    if (!target) {
      return { ok: false, error: "User not found" };
    }

    if (actor.id === userId) {
      return { ok: false, error: "You cannot delete your own account" };
    }

    if (target.role === "SUPER_ADMIN") {
      return { ok: false, error: "Cannot delete SUPER_ADMIN users" };
    }

    if (!adminHasPermission(actor, "users.delete")) {
      return { ok: false, error: "You do not have permission to delete users" };
    }

    const deleted = await deleteAdminUserById(userId);
    if (!deleted) {
      return { ok: false, error: "Failed to delete user" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return { ok: false, error: "An unexpected error occurred" };
  }
}
