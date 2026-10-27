"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  User,
  Mail,
  CalendarDays,
  Shield,
  LogOut,
  Bookmark,
  StickyNote,
  CheckCircle2,
  CloudOff,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { StatCard } from "@/components/user/StatCard";

interface ProfileClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface AccountSummary {
  createdAt: string | null;
  emailVerified: string | null;
  counts: { progress: number; bookmarks: number; notes: number; offlineQueue: number };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-canvas-subtle px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="truncate text-sm font-medium text-fg-default">{value}</p>
      </div>
    </div>
  );
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/account-summary");
        if (res.ok) {
          setSummary(await res.json());
        }
      } catch (err) {
        logger.error("ProfileClient", "Failed to fetch account summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-canvas p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 rounded-full border border-border object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-canvas-subtle text-fg-muted">
              <User className="h-9 w-9" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-fg-default">{user.name || "Unnamed user"}</h2>
            <p className="text-sm text-fg-muted">{user.email}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-fg-subtle sm:justify-start">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Signed in with Google
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-fg-default">Account details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={User} label="Name" value={user.name || "—"} />
          <InfoRow icon={Mail} label="Email" value={user.email || "—"} />
          <InfoRow
            icon={CalendarDays}
            label="Member since"
            value={loading ? "Loading…" : formatDate(summary?.createdAt ?? null)}
          />
          <InfoRow
            icon={Shield}
            label="Email verified"
            value={loading ? "Loading…" : summary?.emailVerified ? "Verified" : "Google account"}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-fg-default">Your activity</h3>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-canvas-inset" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Completed Items"
              value={summary?.counts.progress ?? 0}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Bookmarks"
              value={summary?.counts.bookmarks ?? 0}
              icon={Bookmark}
              tone="accent"
            />
            <StatCard
              label="Notes"
              value={summary?.counts.notes ?? 0}
              icon={StickyNote}
              tone="done"
            />
            <StatCard
              label="Saved Offline"
              value={summary?.counts.offlineQueue ?? 0}
              icon={CloudOff}
              tone="attention"
            />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/user/progress"
            className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent-fg hover:text-fg-default"
          >
            View progress
          </Link>
          <Link
            href="/user/bookmarks"
            className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent-fg hover:text-fg-default"
          >
            View bookmarks
          </Link>
          <Link
            href="/user/notes"
            className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent-fg hover:text-fg-default"
          >
            View notes
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-canvas p-6">
        <h3 className="text-sm font-semibold text-fg-default">Session</h3>
        <p className="mt-1 text-sm text-fg-muted">
          Signing out only ends this session. Your saved progress and notes stay on your account.
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-fg-default transition-colors hover:border-danger-fg hover:text-danger-fg"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </section>
    </div>
  );
}
