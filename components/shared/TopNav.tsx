"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { Avatar } from "@/components/shared/Avatar";
import clubConfig from "@/config/club.json";
import { cn } from "@/lib/utils";
import type { ClubUser } from "@/types";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", shortLabel: "Home" },
  { href: "/admin/games", label: "Games", shortLabel: "Games" },
  { href: "/admin/ledger", label: "Ledger", shortLabel: "Ledger" },
  { href: "/admin/members", label: "Members", shortLabel: "Members" },
  { href: "/player", label: "Player View", shortLabel: "Player" },
];

const PLAYER_NAV = [
  { href: "/player", label: "Dashboard", shortLabel: "Games" },
  { href: "/player/history", label: "History", shortLabel: "History" },
  { href: "/player/ledger", label: "Ledger", shortLabel: "Ledger" },
  { href: "/player/profile", label: "Profile", shortLabel: "Profile" },
];

const MOBILE_PLAYER_NAV = PLAYER_NAV.filter((item) => item.href !== "/player/profile");

export function TopNav({ currentUser }: { currentUser: ClubUser }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const mobileNavItems = currentUser.role === "admin" ? ADMIN_NAV : MOBILE_PLAYER_NAV;

  return (
    <>
      <header className="arena-topbar">
        <div className="topbar-club">
          <strong>{clubConfig.name}</strong>
        </div>

        <details className="topbar-profile-menu">
          <summary className="topbar-profile">
            <Avatar name={currentUser.name} />
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.tier}</span>
            </div>
          </summary>
          <div className="topbar-profile-menu__panel">
            <Link className="topbar-profile-menu__item" href="/player/profile">
              Profile
            </Link>
            <button
              className="topbar-profile-menu__item"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  void signOutAction();
                })
              }
              type="button"
            >
              {isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        </details>
      </header>

      <nav aria-label="Section" className="mobile-nav">
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === "/admin" || item.href === "/player"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn("mobile-nav__button", isActive && "is-active")}
            href={item.href}
            key={item.href}
          >
            {item.shortLabel}
          </Link>
          );
        })}
      </nav>
    </>
  );
}
