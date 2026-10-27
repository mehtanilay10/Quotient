import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserNav } from "@/components/user/UserNav";

export const metadata: Metadata = {
  title: "Your Account | Quotient",
  description: "Track progress, bookmarks, notes, and preferences for your learning account.",
  robots: { index: false, follow: false },
};

/**
 * Shared shell for every authenticated `/user/*` page.
 *
 * Everything except the sign-in page lives behind this layout, so the auth
 * check and the vertical section navigation only need to be written once. The
 * sign-in page keeps its own standalone, centered presentation.
 */
export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-fg-default">Your Account</h1>
        <p className="mt-2 text-fg-muted">
          Everything you have saved, learned, and personalised in one place.
        </p>
      </header>

      {/* Vertical tabs: sidebar on wide screens only. Hidden on mobile as requested. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="hidden w-full shrink-0 lg:block lg:w-56 lg:border-r lg:border-border lg:pr-4">
          <div className="lg:sticky lg:top-20">
            <UserNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
