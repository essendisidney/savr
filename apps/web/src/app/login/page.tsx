"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { formatPhoneHint } from "@/lib/phone";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

type Tab = "phone" | "email" | "password";

export default function LoginPage() {
  const {
    signIn,
    signUp,
    sendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    user,
  } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("phone");
  const [passwordMode, setPasswordMode] = useState<"in" | "up">("in");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/basket");
  }, [user, router]);

  useEffect(() => {
    setError(null);
    setInfo(null);
    setOtp("");
    setOtpSent(false);
  }, [tab]);

  async function onPhoneSend(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const err = await sendPhoneOtp(phone);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setOtpSent(true);
    setInfo(`Code sent to ${formatPhoneHint(phone)}. Enter it below.`);
  }

  async function onPhoneVerify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await verifyPhoneOtp(phone, otp);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/basket");
  }

  async function onEmailSend(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const err = await sendEmailOtp(email);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setOtpSent(true);
    setInfo("Check your email for a sign-in link. Or enter the 6-digit code if your template includes one.");
  }

  async function onEmailVerify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await verifyEmailOtp(email, otp);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/basket");
  }

  async function onPassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const err =
      passwordMode === "in"
        ? await signIn(email, password)
        : await signUp(email, password, fullName);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (passwordMode === "up") {
      setInfo("Account created — check email if confirmation is required, or you’re signed in.");
    }
    router.push("/basket");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "phone", label: "Phone" },
    { id: "email", label: "Email link" },
    { id: "password", label: "Password" },
  ];

  return (
    <PageFrame>
      <PageHero
        theme="login"
        title={tab === "password" && passwordMode === "up" ? "Join Savr" : "Welcome back"}
        subtitle="Sign in with phone OTP, email link, or password — then unlock wallet cashback."
      />
      <div className="page-band">
        <PageShell narrow>
          <div className="mb-5 flex gap-1 border border-savr-ink/[0.08] bg-white p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 px-2 py-2.5 text-xs font-semibold uppercase tracking-wide transition sm:text-[13px] sm:normal-case sm:tracking-normal ${
                  tab === t.id
                    ? "bg-savr-night text-white"
                    : "text-savr-mute hover:text-savr-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "phone" && (
            <div className="animate-rise space-y-3">
              {!otpSent ? (
                <form onSubmit={onPhoneSend} className="space-y-3">
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                  />
                  <p className="text-xs text-savr-mute">
                    Kenya mobiles only · SMS from SIDNET via Taifa Mobile.
                  </p>
                  <button type="submit" disabled={busy} className="btn-primary w-full">
                    {busy ? "Sending…" : "Send code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={onPhoneVerify} className="space-y-3">
                  <p className="text-sm text-savr-mute">{formatPhoneHint(phone)}</p>
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="6-digit code"
                    className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                  />
                  <button type="submit" disabled={busy || otp.length < 6} className="btn-primary w-full">
                    {busy ? "Verifying…" : "Verify & continue"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm font-semibold text-savr-forest"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setInfo(null);
                    }}
                  >
                    Use a different number
                  </button>
                </form>
              )}
            </div>
          )}

          {tab === "email" && (
            <div className="animate-rise space-y-3">
              {!otpSent ? (
                <form onSubmit={onEmailSend} className="space-y-3">
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                  />
                  <p className="text-xs text-savr-mute">
                    We’ll email a one-tap sign-in link. No password needed.
                  </p>
                  <button type="submit" disabled={busy} className="btn-primary w-full">
                    {busy ? "Sending…" : "Email me a link"}
                  </button>
                </form>
              ) : (
                <form onSubmit={onEmailVerify} className="space-y-3">
                  <p className="text-sm text-savr-mute">
                    Sent to <span className="font-medium text-savr-ink">{email}</span>
                  </p>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="Optional 6-digit code"
                    className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                  />
                  <button
                    type="submit"
                    disabled={busy || otp.length < 6}
                    className="btn-primary w-full"
                  >
                    {busy ? "Verifying…" : "Verify code"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm font-semibold text-savr-forest"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      const err = await sendEmailOtp(email);
                      setBusy(false);
                      if (err) setError(err);
                      else setInfo("Link resent — check your inbox.");
                    }}
                  >
                    Resend link
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm text-savr-mute hover:text-savr-forest"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setInfo(null);
                    }}
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          )}

          {tab === "password" && (
            <form onSubmit={onPassword} className="animate-rise space-y-3">
              {passwordMode === "up" && (
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
                />
              )}
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
              />
              <input
                required
                type="password"
                minLength={6}
                autoComplete={passwordMode === "in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="field shadow-[0_10px_30px_-20px_rgba(4,36,25,0.5)]"
              />
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy
                  ? "Please wait…"
                  : passwordMode === "in"
                    ? "Sign in"
                    : "Create account"}
              </button>
              <button
                type="button"
                className="w-full text-sm font-semibold text-savr-forest"
                onClick={() => setPasswordMode(passwordMode === "in" ? "up" : "in")}
              >
                {passwordMode === "in" ? "New here? Create an account" : "Already saving? Sign in"}
              </button>
            </form>
          )}

          {info && <p className="mt-4 text-sm font-medium text-savr-forest">{info}</p>}
          {error && <p className="mt-4 text-sm font-medium text-red-700">{error}</p>}

          <Link href="/basket" className="mt-6 block text-sm text-savr-mute hover:text-savr-forest">
            Skip for now
          </Link>
        </PageShell>
      </div>
    </PageFrame>
  );
}
