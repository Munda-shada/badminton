import { describe, expect, it } from "vitest";

import { getActionErrorMessage } from "@/lib/action-errors";

describe("getActionErrorMessage", () => {
  it("reads Error.message", () => {
    expect(getActionErrorMessage(new Error("bad"))).toBe("bad");
  });

  it("falls back for unknown values", () => {
    expect(getActionErrorMessage(null)).toMatch(/try again/i);
  });
});
