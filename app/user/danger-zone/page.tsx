import type { Metadata } from "next";
import { DangerZone } from "./DangerZone";

export const metadata: Metadata = {
  title: "Danger Zone | Quotient",
  description: "Permanently delete your progress, bookmarks, notes, and offline queue.",
};

/**
 * Home for the irreversible account actions. It lives on its own route so the
 * account sidebar can link to it directly rather than burying it among the
 * everyday account sections.
 */
export default function DangerZonePage() {
  return <DangerZone />;
}
