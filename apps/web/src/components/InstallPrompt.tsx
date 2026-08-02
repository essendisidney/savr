"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "savr-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* private mode */
    }

    if (isIos()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    setBusy(true);
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    setBusy(false);
  }

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-40 px-3 md:bottom-6 md:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-start gap-3 border border-savr-ink/[0.08] bg-white/95 px-4 py-3 shadow-[0_12px_40px_-20px_rgba(1,20,14,0.45)] backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold tracking-tightish text-savr-ink">
            Keep Savr on your phone
          </p>
          <p className="mt-0.5 text-sm text-savr-mute">
            {iosHint
              ? "Safari → Share → Add to Home Screen"
              : "Install for one-tap basket checks before you spend."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!iosHint && deferred && (
            <button
              type="button"
              onClick={install}
              disabled={busy}
              className="bg-savr-night px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-60"
            >
              {busy ? "…" : "Install"}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-savr-mute hover:text-savr-ink"
            aria-label="Dismiss"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
