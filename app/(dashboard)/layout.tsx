import type { ReactNode } from "react";

import { DashboardProviders } from "@/components/providers/DashboardProviders";
import { SideNav } from "@/components/shared/SideNav";
import { TopNav } from "@/components/shared/TopNav";
import { requireClubUser } from "@/lib/club-auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { clubUser } = await requireClubUser();

  return (
    <main className="arena-app">
      <SideNav currentUser={clubUser} />
      <div className="arena-main">
        <TopNav currentUser={clubUser} />
        <div className="view-stack">
          <DashboardProviders>{children}</DashboardProviders>
        </div>
      </div>
    </main>
  );
}
