import { Suspense } from "react";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search across all courses, problems, cheat sheets, and question answers.",
  path: "/search",
});

function SearchFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm text-fg-muted">Loading search…</p>
    </div>
  );
}

export default function SearchPage() {
  // `SearchClient` reads `useSearchParams`; wrapping it in Suspense keeps the
  // route statically renderable instead of forcing a client-side bailout.
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  );
}
