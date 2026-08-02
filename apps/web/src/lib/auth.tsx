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
import { toE164Kenya } from "./phone";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  sendEmailOtp: (email: string) => Promise<string | null>;
  verifyEmailOtp: (email: string, token: string) => Promise<string | null>;
  sendPhoneOtp: (phone: string) => Promise<string | null>;
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
    const supabase = getSupabase();
    if (!supabase) return "Supabase is not configured.";
    const e164 = toE164Kenya(phone);
    if (!e164) return "Enter a valid Kenya mobile (e.g. 0712 345 678).";
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { shouldCreateUser: true },
    });
    if (error?.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes("sms") || msg.includes("provider") || msg.includes("phone")) {
        return `${error.message} Enable Phone under Auth → Providers and connect an SMS provider.`;
      }
      return error.message;
    }
    return null;
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Supabase is not configured.";
    const e164 = toE164Kenya(phone);
    if (!e164) return "Enter a valid Kenya mobile.";
    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: token.trim(),
      type: "sms",
    });
    return error?.message ?? null;
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
