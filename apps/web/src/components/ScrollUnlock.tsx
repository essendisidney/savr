"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Clears leftover body/html scroll locks (e.g. old install modal). */
export function ScrollUnlock() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const { body } = document;

    html.style.overflow = "";
    html.style.overflowY = "";
    html.style.height = "";
    body.style.overflow = "";
    body.style.overflowY = "";
    body.style.position = "";
    body.style.height = "";
    body.style.top = "";
    body.style.width = "";
    body.removeAttribute("data-scroll-locked");

    const unlocked = window.getComputedStyle(body).overflowY;
    if (unlocked === "hidden" || unlocked === "clip") {
      body.style.setProperty("overflow-y", "auto", "important");
      html.style.setProperty("overflow-y", "auto", "important");
    }
  }, [pathname]);

  return null;
}
