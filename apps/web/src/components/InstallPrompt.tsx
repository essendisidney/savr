"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "savr-install-dismissed-at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000; // show again after a week

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
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
  const [mode, setMode] = useState<"native" | "ios" | "manual" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;

    if (isIos()) {
      setMode("ios");
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // Android/Chrome may delay or skip BIP — still show how to install.
    const fallback = window.setTimeout(() => {
      setMode((prev) => prev ?? (isAndroid() ? "manual" : "manual"));
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(fallback);
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
    } finally {
      setDeferred(null);
      setMode(null);
      setBusy(false);
    }
  }

  if (!mode) return null;

  const copy =
    mode === "ios"
      ? "Share → Add to Home Screen"
      : mode === "native"
        ? "Install for one-tap basket checks."
        : "Browser menu → Install app / Add to Home screen";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-40 px-3 md:bottom-6 md:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-start gap-3 border border-savr-ink/[0.08] bg-white/95 px-4 py-3 shadow-[0_12px_40px_-20px_rgba(1,20,14,0.45)] backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold tracking-tightish text-savr-ink">
            Keep Savr on your phone
          </p>
          <p className="mt-0.5 text-sm text-savr-mute">{copy}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === "native" && deferred && (
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
