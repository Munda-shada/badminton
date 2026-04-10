import { describe, expect, it } from "vitest";

import { appendLedgerAuditTag } from "@/lib/audit-note";

describe("appendLedgerAuditTag", () => {
  it("appends a tagged line", () => {
    const next = appendLedgerAuditTag("hello", "TAG", { a: "1" });
    expect(next).toContain("hello");
    expect(next).toContain("[TAG]");
    expect(next).toContain("a=1");
  });

  it("works with empty base", () => {
    expect(appendLedgerAuditTag(null, "X", { y: "z" })).toBe("[X] y=z");
  });
});
