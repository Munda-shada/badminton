"use server";

import { TABLES, mapPaymentFromRow } from "@/lib/club-data";
import { CLUB_PAYMENT_COLUMNS } from "@/lib/club-columns";
import { ADMIN_PAYMENTS_PAGE_SIZE } from "@/lib/club-data-service";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestSupabase } from "@/lib/supabase/server";
import type { ClubPayment, ClubPaymentRow } from "@/types";

export async function fetchAdminPaymentsBatchAction(
  offset: number,
  limit: number = ADMIN_PAYMENTS_PAGE_SIZE,
): Promise<ClubPayment[]> {
  await requireClubUser({ allowRoles: ["admin"] });
  const supabase = await getRequestSupabase();
  const result = await supabase
    .from(TABLES.payments)
    .select(CLUB_PAYMENT_COLUMNS)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (result.error) {
    throw result.error;
  }

  return (result.data || []).map((row) => mapPaymentFromRow(row as ClubPaymentRow));
}
