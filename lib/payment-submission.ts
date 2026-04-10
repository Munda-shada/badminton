export const PAYMENT_SUBMITTED_TAG = "[PAYMENT_SUBMITTED]";

export function isPaymentSubmittedNote(note: string | null | undefined) {
  return String(note || "").includes(PAYMENT_SUBMITTED_TAG);
}

export function appendPaymentSubmissionNote(note: string | null | undefined, reference: string) {
  const base = String(note || "").replace(PAYMENT_SUBMITTED_TAG, "").trim();
  const metadata = `${PAYMENT_SUBMITTED_TAG} Txn ${reference}`;
  return base ? `${base} | ${metadata}` : metadata;
}
