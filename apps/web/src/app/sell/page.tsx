"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { useAuth } from "@/lib/auth";
import { createListing } from "@/lib/marketplace-actions";
import { getSupabase } from "@/lib/supabase";

export default function SellPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      router.push("/login?next=/sell");
      return;
    }
    if (!file) {
      setError("Add one photo");
      return;
    }
    const priceKes = Number(price);
    if (!Number.isFinite(priceKes) || priceKes < 1) {
      setError("Enter a price in KES");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabase();
      let imageUrl: string | null = null;
      let imagePath: string | null = null;

      if (supabase) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) {
          setError(upErr.message);
          setBusy(false);
          return;
        }
        const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
        imageUrl = pub.publicUrl;
        imagePath = path;
      } else {
        imageUrl = preview;
      }

      const res = await createListing({
        title,
        priceKes,
        imageUrl,
        imagePath,
      });
      setBusy(false);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/listing/${res.id}`);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not post");
    }
  }

  return (
    <PageFrame>
      <PageHero
        theme="prices"
        title="Sell something"
        subtitle="One photo. Title. Price. Live in 60 seconds."
      />
      <PageShell narrow>
        {!authLoading && !user ? (
          <div className="card space-y-4 px-5 py-6">
            <p className="text-sm text-savr-mute">Sign in to post a listing.</p>
            <Link href="/login?next=/sell" className="btn-primary inline-flex">
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                Photo
              </span>
              <div className="mt-2 overflow-hidden rounded-2xl border border-dashed border-savr-ink/15 bg-white">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center px-4 text-center text-sm text-savr-mute">
                    Tap to add one photo
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  id="sell-photo"
                  onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="sell-photo"
                  className="flex cursor-pointer justify-center border-t border-savr-ink/[0.06] py-3 text-sm font-semibold text-savr-forest"
                >
                  {preview ? "Change photo" : "Choose photo"}
                </label>
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                Title
              </span>
              <input
                className="field mt-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="iPhone 13, dining table…"
                maxLength={120}
                required
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-savr-mute">
                Price (KES)
              </span>
              <input
                className="field mt-2"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="45000"
                required
              />
            </label>

            {error && <p className="text-sm font-semibold text-amber-800">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Posting…" : "Post listing"}
            </button>
          </form>
        )}
      </PageShell>
    </PageFrame>
  );
}
