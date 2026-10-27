"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  StickyNote,
  Settings2,
  User,
  AlertTriangle,
  CloudOff,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Account sections in the order they are presented to the learner:
 * identity first (profile, personalization), then the saved-learning tools
 * (progress, bookmarks, notes, saved offline), and finally account
 * administration in the danger zone.
 */
export const USER_NAV_ITEMS: UserNavItem[] = [
  { href: "/user/profile", label: "Profile", icon: User },
  { href: "/user/personalization", label: "Personalization", icon: Settings2 },
  { href: "/user/progress", label: "Progress", icon: BarChart3 },
  { href: "/user/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/user/notes", label: "Notes", icon: StickyNote },
  { href: "/user/offline", label: "Saved offline", icon: CloudOff },
  { href: "/user/danger-zone", label: "Danger Zone", icon: AlertTriangle },
];

/**
 * Vertical sidebar navigation shared by every page under `/user/*`.
 *
 * The list is stacked (never a horizontal tab strip) so it can sit in a
 * left-hand column on wide screens and above the content on small screens
 * while keeping the same reading order and hit targets.
 */
export function UserNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account sections" className="w-full">
      <ul className="flex flex-col gap-1">
        {USER_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-accent-fg/30 bg-accent-fg/10 text-accent-fg"
                    : "text-fg-muted hover:bg-canvas-subtle hover:text-fg-default"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
