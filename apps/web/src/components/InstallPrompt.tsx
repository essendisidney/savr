"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "savr-install-dismissed-at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

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
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"native" | "ios" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;

    if (isIos()) {
      const t = window.setTimeout(() => setMode("ios"), 2500);
      return () => window.clearTimeout(t);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    window.addEventListener("beforeinstallprompt", onBip);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
    };
  }, []);

  function dismiss() {
    setMode(null);
    setDeferred(null);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
      dismiss();
    } finally {
      setBusy(false);
    }
  }

  if (!mode) return null;

  const detail =
    mode === "ios"
      ? "Share → Add to Home Screen for one-tap checks before you spend."
      : "Install Savr for one-tap basket checks before you spend.";

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-[60] px-3 pb-2 md:bottom-4 md:px-4"
      role="dialog"
      aria-labelledby="savr-install-title"
    >
      <div className="animate-rise mx-auto flex max-w-lg flex-col gap-3 card p-4 shadow-[0_18px_50px_-28px_rgba(1,20,14,0.55)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            id="savr-install-title"
            className="font-display text-base font-bold tracking-tightish text-savr-ink"
          >
            Add Savr to your home screen
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-savr-mute">{detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === "native" && deferred ? (
            <button
              type="button"
              onClick={install}
              disabled={busy}
              className="btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
            >
              {busy ? "Opening…" : "Install"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="border border-savr-ink/[0.1] bg-white px-4 py-2.5 text-sm font-semibold text-savr-mute transition hover:text-savr-ink"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
