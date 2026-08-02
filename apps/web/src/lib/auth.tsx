"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";
import { track } from "./track";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  sendEmailOtp: (email: string) => Promise<string | null>;
  verifyEmailOtp: (email: string, token: string) => Promise<string | null>;
  sendPhoneOtp: (
    phone: string,
  ) => Promise<{ error: string; retryAfter?: number } | null>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function redirectTo(): string {
  if (typeof window === "undefined") return "https://savr-teal.vercel.app/basket";
  return `${window.location.origin}/basket`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: redirectTo() },
    });
    return error?.message ?? null;
  }, []);

  const sendEmailOtp = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Supabase is not configured.";
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return "Enter your email.";
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo(),
      },
    });
    return error?.message ?? null;
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    });
    return error?.message ?? null;
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as {
        error?: string;
        detail?: string;
        retry_after?: number;
      };
      if (!res.ok) {
        return {
          error: data.detail
            ? `${data.error ?? "Failed"}: ${data.detail}`
            : data.error ?? "Failed to send code",
          retryAfter: typeof data.retry_after === "number" ? data.retry_after : undefined,
        };
      }
      return null;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to send code" };
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Supabase is not configured.";
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: token }),
      });
      const data = (await res.json()) as {
        error?: string;
        access_token?: string;
        refresh_token?: string;
      };
      if (!res.ok || !data.access_token || !data.refresh_token) {
        return data.error ?? "Invalid or expired code";
      }
      const { error } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (!error) track("phone_otp_success");
      return error?.message ?? null;
    } catch (e) {
      return e instanceof Error ? e.message : "Verification failed";
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      sendEmailOtp,
      verifyEmailOtp,
      sendPhoneOtp,
      verifyPhoneOtp,
      signOut,
    }),
    [
      user,
      session,
      loading,
      signIn,
      signUp,
      sendEmailOtp,
      verifyEmailOtp,
      sendPhoneOtp,
      verifyPhoneOtp,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
