import { Metadata } from "next";
import { BookmarksClient } from "./BookmarksClient";
import { BookmarkErrorBoundary } from "@/components/bookmarks/BookmarkErrorBoundary";

export const metadata: Metadata = {
  title: "Bookmarks | Quotient",
  description: "View and manage your saved bookmarks.",
};

export default function BookmarksPage() {
  return (
    <BookmarkErrorBoundary>
      <BookmarksClient />
    </BookmarkErrorBoundary>
  );
}
