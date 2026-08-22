import { describe, expect, it } from "vitest";
import { initialsFrom } from "../initials";

describe("initialsFrom", () => {
  it("takes one letter per name segment, up to two", () => {
    expect(initialsFrom("adam.cote@example.com")).toBe("AC");
    expect(initialsFrom("admin@example.com")).toBe("A");
    expect(initialsFrom("first.middle.last@example.com")).toBe("FM");
  });

  it("falls back rather than rendering an empty avatar", () => {
    expect(initialsFrom("")).toBe("?");
    expect(initialsFrom("@example.com")).toBe("?");
  });
});
