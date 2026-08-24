import { describe, expect, it } from "vitest";
import { isTeamGm } from "../membership";
import { SUPER_ADMIN, TEAM_USER } from "@/test-mocks";

describe("isTeamGm", () => {
  it("is true for a user with a gm membership on that team", () => {
    expect(isTeamGm(TEAM_USER, 1)).toBe(true);
  });

  it("is false for a gm membership on a different team", () => {
    expect(isTeamGm(TEAM_USER, 999)).toBe(false);
  });

  it("is true for a super admin regardless of membership", () => {
    expect(isTeamGm(SUPER_ADMIN, 1)).toBe(true);
  });

  it("is false when signed out", () => {
    expect(isTeamGm(null, 1)).toBe(false);
  });
});
