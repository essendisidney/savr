"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { formatPhoneHint } from "@/lib/phone";
import { PageFrame, PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";

type Tab = "phone" | "email" | "password";

const PHONE_RESEND_SEC = 60;

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
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (user) router.replace("/basket");
  }, [user, router]);

  useEffect(() => {
    setError(null);
    setInfo(null);
    setOtp("");
    setOtpSent(false);
    setResendIn(0);
  }, [tab]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  function startResendCooldown(seconds = PHONE_RESEND_SEC) {
    setResendIn(Math.max(1, seconds));
  }

  async function onPhoneSend(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const err = await sendPhoneOtp(phone);
    setBusy(false);
    if (err) {
      setError(err.error);
      if (err.retryAfter) startResendCooldown(err.retryAfter);
      return;
    }
    setOtpSent(true);
    startResendCooldown();
    setInfo(`Code sent to ${formatPhoneHint(phone)}. Enter it below.`);
  }

  async function onPhoneResend() {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    setError(null);
    const err = await sendPhoneOtp(phone);
    setBusy(false);
    if (err) {
      setError(err.error);
      if (err.retryAfter) startResendCooldown(err.retryAfter);
      return;
    }
    startResendCooldown();
    setInfo(`New code sent to ${formatPhoneHint(phone)}.`);
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
    startResendCooldown();
    setInfo(
      "Check your email for a sign-in link. Or enter the 6-digit code if your template includes one.",
    );
  }

  async function onEmailResend() {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    setError(null);
    const err = await sendEmailOtp(email);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    startResendCooldown();
    setInfo("Link re-sent — check your inbox.");
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
                  <button
                    type="submit"
                    disabled={busy || resendIn > 0}
                    className="btn-primary w-full"
                  >
                    {busy
                      ? "Sending…"
                      : resendIn > 0
                        ? `Wait ${resendIn}s`
                        : "Send code"}
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
                  <button
                    type="submit"
                    disabled={busy || otp.length < 6}
                    className="btn-primary w-full"
                  >
                    {busy ? "Verifying…" : "Verify & continue"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || resendIn > 0}
                    className="w-full text-sm font-semibold text-savr-forest disabled:text-savr-mute"
                    onClick={onPhoneResend}
                  >
                    {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm font-semibold text-savr-mute hover:text-savr-ink"
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
                  <button
                    type="submit"
                    disabled={busy || resendIn > 0}
                    className="btn-primary w-full"
                  >
                    {busy
                      ? "Sending…"
                      : resendIn > 0
                        ? `Wait ${resendIn}s`
                        : "Email me a link"}
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
                    disabled={busy || resendIn > 0}
                    className="w-full text-sm font-semibold text-savr-forest disabled:text-savr-mute"
                    onClick={onEmailResend}
                  >
                    {resendIn > 0 ? `Resend link in ${resendIn}s` : "Resend link"}
                  </button>
                  <button
                    type="button"
                    className="w-full text-sm font-semibold text-savr-mute hover:text-savr-ink"
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
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setPasswordMode("in")}
                  className={
                    passwordMode === "in"
                      ? "font-semibold text-savr-forest"
                      : "text-savr-mute"
                  }
                >
                  Sign in
                </button>
                <span className="text-savr-mute">·</span>
                <button
                  type="button"
                  onClick={() => setPasswordMode("up")}
                  className={
                    passwordMode === "up"
                      ? "font-semibold text-savr-forest"
                      : "text-savr-mute"
                  }
                >
                  Create account
                </button>
              </div>
              {passwordMode === "up" && (
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="field"
                />
              )}
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="field"
              />
              <input
                required
                type="password"
                autoComplete={passwordMode === "in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={6}
                className="field"
              />
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy
                  ? "Working…"
                  : passwordMode === "in"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          )}
          {info && !error && (
            <p className="mt-4 text-sm font-medium text-savr-forest">{info}</p>
          )}

          <p className="mt-8 text-center text-xs text-savr-mute">
            By continuing you agree to our{" "}
            <Link href="/terms" className="font-semibold text-savr-forest hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-savr-forest hover:underline">
              Privacy
            </Link>
            .{" "}
            <Link href="/" className="font-semibold text-savr-forest hover:underline">
              Back home
            </Link>
          </p>
        </PageShell>
      </div>
    </PageFrame>
  );
}
