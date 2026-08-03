"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
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

const READER_ID = "savr-scan-reader";

export default function ScanPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const catalogRef = useRef<Catalog | null>(null);
  const lastCodeRef = useRef("");
  const coolUntilRef = useRef(0);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
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
      catalogRef.current = c;
      setCatalog(c);
      const grocery = c.merchants.find(
        (m) => m.category === "grocery" && (m.locationId || m.location?.id),
      );
      if (grocery) {
        setTipBranchKey(`${grocery.id}|${grocery.locationId ?? grocery.location!.id}`);
      }
    });
    return () => {
      void stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyHit = useCallback((next: BarcodeHit, c: Catalog) => {
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
    coolUntilRef.current = Date.now() + 2200;
  }, []);

  const onCode = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      if (Date.now() < coolUntilRef.current && code === lastCodeRef.current) return;
      if (code === lastCodeRef.current && Date.now() < coolUntilRef.current) return;
      lastCodeRef.current = code;
      coolUntilRef.current = Date.now() + 1800;

      const c = catalogRef.current;
      if (!c) {
        setStatus("Catalog still loading — hold the code a second and try again.");
        return;
      }

      const resolved = resolveBarcode(code);
      if (resolved) {
        applyHit(resolved, c);
        return;
      }
      setHit(null);
      setProduct(null);
      setPendingCode(code);
      setLearnMode(true);
      setStatus(
        `Scanned “${code.slice(0, 32)}${code.length > 32 ? "…" : ""}” — not in Savr yet. Pick the product to teach this phone.`,
      );
      pushUnmatchedAsk(`barcode:${code.slice(0, 48)}`);
      track("scan_miss", { q: code.slice(0, 48) });
    },
    [applyHit],
  );

  async function stopCamera() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        /* already stopped */
      }
    }
    setCameraOn(false);
    setCameraBusy(false);
  }

  async function startCamera() {
    setCameraError(null);
    setCameraBusy(true);
    setStatus("Starting camera…");
    try {
      await stopCamera();
      // Let the reader node remount cleanly.
      await new Promise((r) => window.setTimeout(r, 50));
      // Prefer ZXing over native BarcodeDetector — many phones claim Detector
      // support but never decode grocery EAN/UPC packs reliably.
      const scanner = new Html5Qrcode(READER_ID, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        useBarCodeDetectorIfSupported: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          // Wide short box — pack barcodes are horizontal, not square QR.
          qrbox: (w, h) => ({
            width: Math.floor(Math.min(w * 0.94, 420)),
            height: Math.floor(Math.min(h * 0.32, 140)),
          }),
          aspectRatio: 1.777778,
          disableFlip: false,
        },
        (decodedText) => onCode(decodedText),
        () => {
          /* frame with no code — ignore */
        },
      );
      setCameraOn(true);
      setStatus("Point at the bars — hold steady until you hear/see a match.");
      track("scan_camera_on", { engine: "html5-qrcode" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera failed";
      setCameraError(
        /NotAllowedError|Permission|denied/i.test(msg)
          ? "Camera permission blocked — allow camera for this site, or type the digits below."
          : `Camera couldn’t start (${msg}). Type the barcode digits below.`,
      );
      setCameraOn(false);
      try {
        scannerRef.current?.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    } finally {
      setCameraBusy(false);
    }
  }

  function pickProductForLearn(p: Product) {
    const c = catalogRef.current;
    if (!pendingCode || !c) return;
    learnBarcode(pendingCode, p.id);
    applyHit({ productId: p.id, via: "learned", raw: pendingCode }, c);
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
    catalogRef.current = c;
    setCatalog(c);
  }

  const savrQrExample = product ? encodeSavrProductQr(product.id) : null;

  return (
    <PageFrame>
      <PageHero
        theme="prices"
        title="Scan to tip"
        subtitle="Hold a pack barcode in the wide box — or a Savr QR. Confirm KES, then tip. Works on phone browsers (HTTPS)."
        action={{ href: "/ops", label: "Soft launch ops" }}
      />

      <div className="page-band">
        <PageShell narrow>
          <div className="space-y-6">
            <section className="card space-y-0 overflow-hidden p-0">
              <div className="relative min-h-[280px] bg-savr-ink">
                <div id={READER_ID} className="savr-scan-reader w-full overflow-hidden" />
                {!cameraOn && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-savr-ink px-6 text-center">
                    <p className="text-sm text-white/80">
                      Uses a real barcode engine (EAN / UPC / QR) — not the flaky browser-only API.
                      Good light helps.
                    </p>
                    <button
                      type="button"
                      disabled={cameraBusy}
                      onClick={() => void startCamera()}
                      className="btn-primary disabled:opacity-60"
                    >
                      {cameraBusy ? "Starting…" : "Open camera"}
                    </button>
                  </div>
                )}
                {cameraOn && (
                  <button
                    type="button"
                    onClick={() => void stopCamera()}
                    className="absolute right-3 top-3 z-20 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Stop
                  </button>
                )}
              </div>
              {cameraError && (
                <p className="px-4 py-3 text-sm text-amber-800">{cameraError}</p>
              )}
              {cameraOn && (
                <p className="border-t border-white/10 px-4 py-2.5 text-xs text-savr-mute">
                  Align the barcode inside the horizontal frame. If it won’t lock, type digits below.
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
                inputMode="numeric"
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
                    : status.startsWith("Scanned") || status.startsWith("Catalog")
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
                <form
                  className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                  onSubmit={onTip}
                >
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
                  Change KES to what the tag says.{" "}
                  <Link href={`/prices?id=${product.id}`} className="font-semibold text-savr-forest">
                    Full compare →
                  </Link>
                </p>
                {savrQrExample && (
                  <p className="break-all text-[11px] text-savr-mute">
                    Savr QR for this SKU: {savrQrExample}
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
                    First time seeing{" "}
                    <span className="font-semibold text-savr-ink">{pendingCode}</span>. Pick the
                    product — remembered on this phone for next scan.
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
          </div>
        </PageShell>
      </div>
    </PageFrame>
  );
}
