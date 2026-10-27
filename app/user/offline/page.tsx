import { Metadata } from "next";
import { OfflineQueueClient } from "./OfflineQueueClient";

export const metadata: Metadata = {
  title: "Saved Offline | Quotient",
  description: "Lessons you queued for offline reading.",
};

export default function OfflinePage() {
  return <OfflineQueueClient />;
}
