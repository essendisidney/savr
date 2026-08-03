"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { submitCrowdsourcePrice } from "@/lib/actions";
import {
  encodeSavrProductQr,
  learnBarcode,
  resolveBarcode,
  type BarcodeHit,
} from "@/lib/barcodes";
import { askRecoveryProducts } from "@/lib/compare";
import { loadCatalog } from "@/lib/catalog";
import { buildPriceTipShare, whatsAppShareUrl } from "@/lib/share";
import { pushUnmatchedAsk } from "@/lib/unmatched-asks";
import { track } from "@/lib/track";
import type { Catalog, Product } from "@/lib/types";

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

type DetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

function getDetector(): BarcodeDetectorLike | null {
  if (typeof window === "undefined") return null;
  const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
    });
  } catch {
    try {
      return new Ctor();
    } catch {
      return null;
    }
  }
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCodeRef = useRef("");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectorOk, setDetectorOk] = useState(false);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [hit, setHit] = useState<BarcodeHit | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [tipBranchKey, setTipBranchKey] = useState("");
  const [tipPrice, setTipPrice] = useState("");
  const [tipBusy, setTipBusy] = useState(false);
  const [learnMode, setLearnMode] = useState(false);

  const branches = useMemo(() => {
    if (!catalog) return [] as { key: string; merchantId: string; locationId: string; label: string }[];
    return catalog.merchants
      .filter((m) => m.category === "grocery" && (m.locationId || m.location?.id))
      .map((m) => {
        const locationId = m.locationId ?? m.location!.id;
        return {
          key: `${m.id}|${locationId}`,
          merchantId: m.id,
          locationId,
          label: `${m.name}${m.location?.name ? ` · ${m.location.name}` : ""}`,
        };
      });
  }, [catalog]);

  const recovery = useMemo(
    () => (catalog ? askRecoveryProducts(catalog, 8) : []),
    [catalog],
  );

  useEffect(() => {
    loadCatalog().then((c) => {
      setCatalog(c);
      const grocery = c.merchants.find((m) => m.category === "grocery" && (m.locationId || m.location?.id));
      if (grocery) {
        setTipBranchKey(`${grocery.id}|${grocery.locationId ?? grocery.location!.id}`);
      }
    });
    setDetectorOk(Boolean(getDetector()));
    return () => stopCamera();
  }, []);

  const applyHit = useCallback(
    (next: BarcodeHit, c: Catalog) => {
      const p = c.products.find((x) => x.id === next.productId) ?? null;
      if (!p) {
        setStatus("Code resolved, but that product isn’t in the catalog yet.");
        setHit(null);
        setProduct(null);
        return;
      }
      setHit(next);
      setProduct(p);
      setPendingCode(null);
      setLearnMode(false);
      setStatus(
        next.via === "savr_qr"
          ? `Savr QR → ${p.name}`
          : next.via === "learned"
            ? `Learned barcode → ${p.name}`
            : `Matched → ${p.name}`,
      );
      track("scan_match", { via: next.via, productId: p.id });
      const price = c.prices.find((row) => row.productId === p.id);
      if (price) setTipPrice(String(Math.round(price.priceCents / 100)));
    },
    [],
  );

  const onCode = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code || code === lastCodeRef.current) return;
      lastCodeRef.current = code;
      window.setTimeout(() => {
        if (lastCodeRef.current === code) lastCodeRef.current = "";
      }, 2500);

      if (!catalog) return;
      const resolved = resolveBarcode(code);
      if (resolved) {
        applyHit(resolved, catalog);
        return;
      }
      setHit(null);
      setProduct(null);
      setPendingCode(code);
      setLearnMode(true);
      setStatus(`No match for “${code.slice(0, 32)}${code.length > 32 ? "…" : ""}” — pick the product to teach Savr.`);
      pushUnmatchedAsk(`barcode:${code.slice(0, 48)}`);
      track("scan_miss", { q: code.slice(0, 48) });
    },
    [applyHit, catalog],
  );

  async function startCamera() {
    setCameraError(null);
    const detector = getDetector();
    if (!detector) {
      setCameraError(
        "This browser can’t decode barcodes in-camera. Type the digits below, or use Chrome on Android.",
      );
      setDetectorOk(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraOn(true);
      setDetectorOk(true);
      track("scan_camera_on");
    } catch {
      setCameraError("Camera permission blocked — type the barcode digits instead.");
      setCameraOn(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  useEffect(() => {
    if (!cameraOn) return;
    const detector = getDetector();
    if (!detector || !videoRef.current) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) onCode(codes[0].rawValue);
      } catch {
        /* frame miss */
      }
    };
    const id = window.setInterval(() => void tick(), 450);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [cameraOn, onCode]);

  function pickProductForLearn(p: Product) {
    if (!pendingCode || !catalog) return;
    learnBarcode(pendingCode, p.id);
    applyHit({ productId: p.id, via: "learned", raw: pendingCode }, catalog);
    track("scan_learn", { productId: p.id });
  }

  async function onTip(e: FormEvent) {
    e.preventDefault();
    if (!product || !tipBranchKey) return;
    const branch = branches.find((b) => b.key === tipBranchKey);
    if (!branch) return;
    setTipBusy(true);
    setStatus(null);
    const res = await submitCrowdsourcePrice({
      merchantId: branch.merchantId,
      locationId: branch.locationId,
      productId: product.id,
      priceKes: Number(tipPrice),
    });
    setTipBusy(false);
    if ("error" in res) {
      setStatus(res.error);
      return;
    }
    const share = buildPriceTipShare({
      productName: product.name,
      productId: product.id,
      merchantName: branch.label.split(" · ")[0] ?? "Store",
      branchName: branch.label.split(" · ")[1] ?? null,
      priceCents: Math.round(Number(tipPrice) * 100),
    });
    track("price_tip", { productId: product.id, via: "scan" });
    track("share_save", { via: "whatsapp_price_tip", productId: product.id });
    setStatus(
      `Thanks — tip saved${
        res.tipCount ? ` (${res.tipCount} shopper${res.tipCount === 1 ? "" : "s"})` : ""
      }. Opening WhatsApp…`,
    );
    window.open(whatsAppShareUrl(share), "_blank", "noopener,noreferrer");
    const c = await loadCatalog();
    setCatalog(c);
  }

  const savrQrExample = product ? encodeSavrProductQr(product.id) : null;

  return (
    <PageFrame>
      <PageHero
        theme="prices"
        title="Scan to tip"
        subtitle="Point at a pack barcode or a Savr product QR — confirm KES, tip the shelf. Same trust path as manual tips."
        action={{ href: "/ops", label: "Soft launch ops" }}
      />

      <div className="page-band">
        <PageShell narrow>
          <div className="space-y-6">
            <section className="card space-y-3 overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-savr-ink">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  aria-label="Barcode scanner camera"
                />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-savr-ink/90 px-6 text-center">
                    <p className="text-sm text-white/80">
                      Camera reads EAN barcodes and QR codes. You confirm the price — Savr never
                      invents it.
                    </p>
                    <button type="button" onClick={() => void startCamera()} className="btn-primary">
                      Open camera
                    </button>
                  </div>
                )}
                {cameraOn && (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Stop
                  </button>
                )}
              </div>
              {cameraError && (
                <p className="px-4 pb-3 text-sm text-amber-800">{cameraError}</p>
              )}
              {!detectorOk && !cameraError && (
                <p className="px-4 pb-3 text-sm text-savr-mute">
                  In-camera decode needs a supporting browser (Chrome on Android works best). Use
                  manual entry below on iPhone for now.
                </p>
              )}
            </section>

            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onCode(manual);
                setManual("");
              }}
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Or type barcode / paste Savr QR URL"
                className="field min-w-0 flex-1"
                inputMode="text"
                autoComplete="off"
              />
              <button type="submit" className="btn-dark">
                Look up
              </button>
            </form>

            {status && (
              <p
                className={`text-sm font-medium ${
                  status.startsWith("Thanks") || status.includes("→")
                    ? "text-savr-forest"
                    : status.startsWith("No match")
                      ? "text-amber-900"
                      : "text-savr-mute"
                }`}
              >
                {status}
              </p>
            )}

            {product && (
              <section className="card space-y-4 px-4 py-5 sm:px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                    Matched product
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold tracking-tightish">
                    {product.name}
                  </h2>
                  <p className="text-sm text-savr-mute">
                    {[product.brand, product.category].filter(Boolean).join(" · ")}
                    {hit ? ` · via ${hit.via.replace("_", " ")}` : ""}
                  </p>
                </div>
                <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={onTip}>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Branch
                    </span>
                    <select
                      value={tipBranchKey}
                      onChange={(e) => setTipBranchKey(e.target.value)}
                      className="field"
                      required
                    >
                      {branches.map((b) => (
                        <option key={b.key} value={b.key}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-savr-mute">
                      Price (KES)
                    </span>
                    <input
                      required
                      inputMode="decimal"
                      value={tipPrice}
                      onChange={(e) => setTipPrice(e.target.value)}
                      placeholder="e.g. 70"
                      className="field w-full sm:w-28"
                    />
                  </label>
                  <button type="submit" disabled={tipBusy} className="btn-primary h-[46px]">
                    {tipBusy ? "…" : "Tip shelf"}
                  </button>
                </form>
                <p className="text-xs text-savr-mute">
                  Prefill is catalog only — change it to what the tag says.{" "}
                  <Link href={`/prices?id=${product.id}`} className="font-semibold text-savr-forest">
                    Full compare →
                  </Link>
                </p>
                {savrQrExample && (
                  <p className="break-all text-[11px] text-savr-mute">
                    Savr QR for this SKU (print for tippers): {savrQrExample}
                  </p>
                )}
              </section>
            )}

            {learnMode && pendingCode && (
              <section className="card space-y-3 px-4 py-5 sm:px-5">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-tightish">
                    Teach this barcode
                  </h2>
                  <p className="mt-1 text-sm text-savr-mute">
                    First time seeing <span className="font-semibold text-savr-ink">{pendingCode}</span>
                    . Pick the product on the shelf — saved on this phone for next scan.
                  </p>
                </div>
                <ul className="divide-y divide-savr-ink/[0.06] overflow-hidden rounded-2xl border border-savr-ink/[0.08]">
                  {recovery.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => pickProductForLearn(p)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-savr-mist"
                      >
                        <span>
                          <span className="block font-semibold text-savr-ink">{p.name}</span>
                          <span className="text-xs text-savr-mute">
                            {[p.brand, p.category].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span className="text-xs font-semibold text-savr-forest">Link →</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Link href="/prices" className="btn-ghost inline-flex text-sm">
                  Search full catalog
                </Link>
              </section>
            )}

            <p className="text-sm text-savr-mute">
              Logic: scan → match product → you confirm KES → same tip as Prices. Unknown codes
              become a teach-once map on this device until we seed real EANs from Weekly 30 walks.
            </p>
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
