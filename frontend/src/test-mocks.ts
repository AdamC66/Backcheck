import type { User } from "@/types/auth";

// Shared fixtures so test files assert against one definition of "a user" rather
// than each inventing its own shape.
export const SUPER_ADMIN: User = {
  id: 1,
  email: "admin@example.com",
  is_super_admin: true,
};

export const TEAM_USER: User = {
  id: 2,
  email: "gm@example.com",
  is_super_admin: false,
};
