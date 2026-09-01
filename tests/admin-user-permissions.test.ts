import assert from "node:assert/strict";
import test from "node:test";

import { ADMIN_USER_PERMISSIONS, adminHasPermission, isSuperAdmin } from "@/server/services/admin-auth";

test("super admin has all permissions", () => {
  const admin: { role: string; permissions: string[] } = { role: "SUPER_ADMIN", permissions: [] };
  assert.equal(isSuperAdmin(admin), true);
  for (const permission of ADMIN_USER_PERMISSIONS) {
    assert.equal(adminHasPermission(admin, permission), true);
  }
});

test("admin requires explicit permission", () => {
  const admin: { role: string; permissions: string[] } = { role: "ADMIN", permissions: ["users.view", "users.edit"] };
  assert.equal(adminHasPermission(admin, "users.view"), true);
  assert.equal(adminHasPermission(admin, "users.delete"), false);
});

test("admin permissions are normalized and case-insensitive", () => {
  const admin: { role: string; permissions: string[] } = { role: "ADMIN", permissions: ["Users.View"] };
  assert.equal(adminHasPermission(admin, "users.view"), true);
});
