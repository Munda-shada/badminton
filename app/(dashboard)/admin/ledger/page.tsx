import { Suspense } from "react";

import { AdminLedgerClient } from "@/components/admin/AdminLedgerClient";
import { PageContentSkeleton } from "@/components/shared/PageContentSkeleton";
import { loadAdminClubDb, loadAdminPaymentTotalCount } from "@/lib/club-db-cache";
import { requireClubUser } from "@/lib/club-auth";
import { getRequestNow } from "@/lib/request-time";

export default function AdminLedgerPage() {
  return (
    <Suspense fallback={<PageContentSkeleton label="Checking access" />}>
      <AdminLedgerShell />
    </Suspense>
  );
}

async function AdminLedgerShell() {
  await requireClubUser({ allowRoles: ["admin"] });
  return (
    <Suspense fallback={<PageContentSkeleton label="Loading ledger" />}>
      <AdminLedgerWithData />
    </Suspense>
  );
}

async function AdminLedgerWithData() {
  const [db, paymentTotalCount, requestNow] = await Promise.all([
    loadAdminClubDb(),
    loadAdminPaymentTotalCount(),
    getRequestNow(),
  ]);

  return (
    <AdminLedgerClient db={db} paymentTotalCount={paymentTotalCount} requestNow={requestNow} />
  );
}
