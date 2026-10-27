"use client";

import { useEffect, useState } from "react";
import { Download, Info, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAInstallButtonProps {
  className?: string;
}

interface InstallEnvironment {
  hasServiceWorkerSupport: boolean;
  isIos: boolean;
  isMobile: boolean;
  isSecureContext: boolean;
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  const iosStandalone =
    typeof window.navigator !== "undefined" &&
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

export function PWAInstallButton({ className }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [environment, setEnvironment] = useState<InstallEnvironment>({
    hasServiceWorkerSupport: false,
    isIos: false,
    isMobile: false,
    isSecureContext: false,
  });
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;

    setEnvironment({
      hasServiceWorkerSupport: "serviceWorker" in window.navigator,
      isIos: /iphone|ipad|ipod/i.test(userAgent),
      isMobile: /android|iphone|ipad|ipod/i.test(userAgent),
      isSecureContext: window.isSecureContext,
    });

    setInstalled(isStandaloneMode());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowHelp(false);
    };

    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  if (installed || !environment.isMobile) return null;

  const canInstallWithPrompt = deferredPrompt !== null;
  const buttonIcon = canInstallWithPrompt ? Download : environment.isIos ? Share2 : Info;
  const isBlockedByInsecureContext =
    !canInstallWithPrompt && !environment.isIos && !environment.isSecureContext;
  const isBlockedByBrowserSupport =
    !canInstallWithPrompt &&
    !environment.isIos &&
    environment.isSecureContext &&
    !environment.hasServiceWorkerSupport;

  const helpText = environment.isIos
    ? "On iPhone or iPad, tap Share in Safari, then choose Add to Home Screen."
    : !environment.isSecureContext
      ? "Install is blocked because this page is not running in a secure context. Open the site on HTTPS. If you are testing from a phone on a local network URL over HTTP, the browser will not allow PWA install."
      : !environment.hasServiceWorkerSupport
        ? "This browser does not support the service worker features required for PWA install. Try Chrome, Edge, or Safari."
        : "If no install prompt appears yet, open the browser menu and look for Install app or Add to Home screen after the page fully loads.";

  const buttonLabel = isBlockedByInsecureContext
    ? "Install Requires HTTPS"
    : isBlockedByBrowserSupport
      ? "Install Not Supported"
      : "Install App";

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome !== "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    setShowHelp((value) => !value);
  };

  const Icon = buttonIcon;

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={handleInstall}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-canvas-subtle px-3 py-2 text-sm font-medium text-fg-default transition-colors hover:bg-canvas"
        aria-expanded={showHelp}
        aria-controls="mobile-install-help"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {buttonLabel}
      </button>

      {!canInstallWithPrompt &&
        (showHelp || isBlockedByInsecureContext || isBlockedByBrowserSupport) && (
          <p
            id="mobile-install-help"
            className="mt-2 rounded-md border border-border bg-canvas px-3 py-2 text-xs text-fg-muted"
            role="status"
            aria-live="polite"
          >
            {helpText}
          </p>
        )}
    </div>
  );
}
