"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import clubConfig from "@/config/club.json";
import { cn } from "@/lib/utils";
import type { ClubUser } from "@/types";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/games", label: "Games" },
  { href: "/admin/ledger", label: "Ledger" },
  { href: "/admin/members", label: "Members" },
  { href: "/player", label: "Player View" },
];

const PLAYER_NAV = [
  { href: "/player", label: "Upcoming Polls" },
  { href: "/player/history", label: "Match History" },
  { href: "/player/ledger", label: "Payments" },
  { href: "/player/profile", label: "Profile" },
];

export function SideNav({ currentUser }: { currentUser: ClubUser }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const navItems = currentUser.role === "admin" ? ADMIN_NAV : PLAYER_NAV;

  return (
    <aside className="arena-sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">SC</span>
        <div>
          <h1>{clubConfig.name}</h1>
          <p>{currentUser.role === "admin" ? "Management Console" : "Player Dashboard"}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin" || item.href === "/player"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn("sidebar-nav__item", isActive && "is-active")}
            href={item.href}
            key={item.href}
          >
            <span className="sidebar-nav__indicator" />
            <span>{item.label}</span>
          </Link>
          );
        })}
      </nav>

      <button
        className="sidebar-exit"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            void signOutAction();
          })
        }
        type="button"
      >
        {isPending ? "Logging out..." : "Log out"}
      </button>
    </aside>
  );
}
