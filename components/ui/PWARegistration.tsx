"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

declare global {
  interface Window {
    workbox?: {
      register: () => Promise<ServiceWorkerRegistration>;
    };
  }
}

const isPwaEnabled =
  process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_PWA_DEV === "true";

export function PWARegistration() {
  useEffect(() => {
    if (!isPwaEnabled || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        if (window.workbox === undefined) {
          return;
        }

        const registration = await window.workbox?.register();

        void registration?.update().catch(() => undefined);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          logger.error("PWARegistration", "Service worker registration failed.", error);
        }
      }
    };

    if (document.readyState === "complete") {
      void registerServiceWorker();
      return;
    }

    const onLoad = () => {
      void registerServiceWorker();
    };

    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
