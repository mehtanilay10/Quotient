"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="no-print fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-auto">
      <div className="flex items-center gap-2 rounded-lg border border-attention-emphasis bg-attention-subtle px-4 py-2.5 text-sm font-medium text-attention-fg shadow-lg">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span>You are currently offline. Some features may be limited.</span>
      </div>
    </div>
  );
}
