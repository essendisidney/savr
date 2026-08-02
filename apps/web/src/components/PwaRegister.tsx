"use client";

import { useEffect } from "react";

/** Registers the installability service worker once on the client. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Ensure an active worker so Chrome considers the app installable.
          void reg.update();
        })
        .catch(() => {
          /* ignore offline / unsupported */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
