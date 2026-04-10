"use server";

import { revalidatePath } from "next/cache";

import { TABLES } from "@/lib/club-data";
import { syncClubSessionCharges, updateClubSession } from "@/lib/club-data-service";
import { appendLedgerAuditTag } from "@/lib/audit-note";
import { appendPaymentSubmissionNote } from "@/lib/payment-submission";
import { requireClubUser } from "@/lib/club-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function settleGameAction(formData: FormData) {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin"] });
  const adminSupabase = createAdminClient();
  const sessionId = String(formData.get("sessionId") || "").trim();
  const costPerPlayer = Number(formData.get("costPerPlayer") || 0);
  const note = String(formData.get("note") || "").trim();

  if (!sessionId || !costPerPlayer) {
    throw new Error("Add a session and cost per player before settling.");
  }

  await updateClubSession(adminSupabase, sessionId, {
    costPerPlayer,
  });
  await syncClubSessionCharges(adminSupabase, {
    sessionId,
    costPerPlayer,
    note,
    audit: { actorId: clubUser.id },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath("/admin/ledger");
  revalidatePath("/player");
  revalidatePath("/player/ledger");
}

export async function markPaymentPaidAction(formData: FormData) {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin"] });
  const adminSupabase = createAdminClient();
  const paymentId = String(formData.get("paymentId") || "").trim();

  if (!paymentId) {
    return;
  }

  const { data: row, error: fetchError } = await adminSupabase
    .from(TABLES.payments)
    .select("note")
    .eq("id", paymentId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!row) {
    throw new Error("Payment not found.");
  }

  const at = new Date().toISOString();
  const nextNote = appendLedgerAuditTag(row.note ?? null, "PAID_BY_ADMIN", {
    userId: clubUser.id,
    at,
  });

  const { error: updateError } = await adminSupabase
    .from(TABLES.payments)
    .update({
      status: "paid",
      note: nextNote,
    })
    .eq("id", paymentId);

  if (updateError) {
    throw updateError;
  }
  revalidatePath("/admin/ledger");
  revalidatePath("/player/ledger");
}

export async function submitPlayerPaymentsAction(formData: FormData) {
  const { clubUser } = await requireClubUser({ allowRoles: ["admin", "player"] });
  const paymentIds = formData
    .getAll("paymentId")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const reference = String(formData.get("reference") || "").trim();

  if (!paymentIds.length) {
    throw new Error("Select at least one pending payment.");
  }

  if (!reference) {
    throw new Error("Transaction ID is required.");
  }

  const adminSupabase = createAdminClient();
  const { data: payments, error } = await adminSupabase
    .from(TABLES.payments)
    .select("id, note, status, user_id")
    .in("id", paymentIds)
    .eq("user_id", clubUser.id);

  if (error) {
    throw error;
  }

  const allowedPayments = (payments || []).filter((payment) => payment.status === "due");

  await Promise.all(
    allowedPayments.map(async (payment) => {
      const submissionNote = appendPaymentSubmissionNote(payment.note, reference);
      const { error: updateError } = await adminSupabase
        .from(TABLES.payments)
        .update({
          status: "due",
          note: submissionNote,
        })
        .eq("id", payment.id);

      if (updateError) {
        throw updateError;
      }
    }),
  );

  revalidatePath("/player/ledger");
  revalidatePath("/admin/ledger");
}
