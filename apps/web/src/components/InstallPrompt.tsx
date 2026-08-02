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
  const [mode, setMode] = useState<"native" | "ios" | "manual" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;

    if (isIos()) {
      const t = window.setTimeout(() => setMode("ios"), 800);
      return () => window.clearTimeout(t);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    window.addEventListener("beforeinstallprompt", onBip);

    const fallback = window.setTimeout(() => {
      setMode((prev) => prev ?? "manual");
    }, 1800);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!mode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mode]);

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
      ? "Tap Share, then Add to Home Screen — Savr opens like an app."
      : mode === "native"
        ? "Install Savr for one-tap basket checks before you spend."
        : "Open your browser menu and choose Install app or Add to Home screen.";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-savr-night/55 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="savr-install-title"
      onClick={dismiss}
    >
      <div
        className="animate-rise w-full max-w-sm border border-white/10 bg-white p-6 shadow-[0_24px_60px_-28px_rgba(1,20,14,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-forest">
          Savr
        </p>
        <h2
          id="savr-install-title"
          className="mt-2 font-display text-2xl font-bold tracking-tightish text-savr-ink"
        >
          Install Savr?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-savr-mute">{detail}</p>

        <div className="mt-6 flex flex-col gap-2">
          {mode === "native" && deferred ? (
            <button
              type="button"
              onClick={install}
              disabled={busy}
              className="btn-primary w-full disabled:opacity-60"
            >
              {busy ? "Opening…" : "Install"}
            </button>
          ) : mode === "ios" ? (
            <p className="rounded-sm bg-savr-fog px-3 py-2.5 text-center text-xs font-semibold text-savr-ink">
              Share → Add to Home Screen
            </p>
          ) : (
            <p className="rounded-sm bg-savr-fog px-3 py-2.5 text-center text-xs font-semibold text-savr-ink">
              Menu ⋮ → Install app
            </p>
          )}
          <button type="button" onClick={dismiss} className="btn-ghost w-full">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
