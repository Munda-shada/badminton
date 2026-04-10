/** Structured append for ledger notes (no schema migration). */
export function appendLedgerAuditTag(
  base: string | null | undefined,
  tag: string,
  fields: Record<string, string>,
): string {
  const payload = Object.entries(fields)
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  const line = `[${tag}] ${payload}`;
  const cur = (base || "").trim();
  return cur ? `${cur}\n${line}` : line;
}
