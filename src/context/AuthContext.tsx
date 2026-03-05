"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Profile } from "@/types";
import { safeGetJSON, safeSetJSON, safeRemove } from "@/lib/safe-storage";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, ad: string, soyad: string) => Promise<{ error?: string }>;
  signOut: () => void;
  updateProfile: (data: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "fiyatcim_auth";
const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function mapProfile(data: Record<string, unknown>): Profile {
  return {
    user_id: data.user_id as string,
    ad: (data.ad as string) ?? "",
    soyad: (data.soyad as string) ?? "",
    telefon: (data.telefon as string) ?? "",
    role: (data.role as "admin" | "user") ?? "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ========================================
  // DEMO MODE: localStorage auth
  // ========================================
  const persistDemo = useCallback((u: User | null, p: Profile | null) => {
    if (u) {
      safeSetJSON(AUTH_STORAGE_KEY, { user: u, profile: p });
    } else {
      safeRemove(AUTH_STORAGE_KEY);
    }
  }, []);

  // ========================================
  // INIT: Demo → localStorage, Non-demo → Supabase
  // ========================================
  useEffect(() => {
    if (IS_DEMO_MODE) {
      const stored = safeGetJSON<{ user?: User; profile?: Profile }>(AUTH_STORAGE_KEY, {});
      if (stored.user && typeof stored.user.id === "string" && typeof stored.user.email === "string") {
        setUser(stored.user);
        setProfile(stored.profile || null);
      }
      setIsLoading(false);
      return;
    }

    // Non-demo: Supabase Auth
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (sbUser) {
        setUser({ id: sbUser.id, email: sbUser.email! });
        supabase.from("profiles").select("*").eq("user_id", sbUser.id).single()
          .then(({ data }) => { if (data) setProfile(mapProfile(data as Record<string, unknown>)); });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single();
        if (data) setProfile(mapProfile(data as Record<string, unknown>));
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ========================================
  // SIGN IN
  // ========================================
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (!email || !password) {
      return { error: "E-posta ve şifre zorunludur." };
    }

    if (IS_DEMO_MODE) {
      // Demo admin hesabı
      if (email === "admin@fiyatcim.com" && password === "admin123") {
        const u: User = { id: "user-admin", email };
        const p: Profile = { user_id: "user-admin", ad: "Admin", soyad: "Fiyatcim", telefon: "05551234567", role: "admin" };
        setUser(u);
        setProfile(p);
        persistDemo(u, p);
        return {};
      }

      // Demo normal kullanıcı
      if (password.length >= 6) {
        const u: User = { id: "user-demo-" + Date.now(), email };
        const p: Profile = { user_id: u.id, ad: "", soyad: "", telefon: "", role: "user" };
        setUser(u);
        setProfile(p);
        persistDemo(u, p);
        return {};
      }

      return { error: "Geçersiz e-posta veya şifre." };
    }

    // Non-demo: Supabase Auth
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, [persistDemo]);

  // ========================================
  // SIGN UP
  // ========================================
  const signUp = useCallback(async (email: string, password: string, ad: string, soyad: string): Promise<{ error?: string }> => {
    if (!email || !password || !ad || !soyad) {
      return { error: "Tüm alanlar zorunludur." };
    }
    if (password.length < 6) {
      return { error: "Şifre en az 6 karakter olmalıdır." };
    }

    if (IS_DEMO_MODE) {
      const u: User = { id: "user-" + Date.now(), email };
      const p: Profile = { user_id: u.id, ad, soyad, telefon: "", role: "user" };
      setUser(u);
      setProfile(p);
      persistDemo(u, p);

      const existingUsers = safeGetJSON<Array<Record<string, unknown>>>("fiyatcim_registered_users", []);
      const usersArray = Array.isArray(existingUsers) ? existingUsers : [];
      safeSetJSON("fiyatcim_registered_users", [
        ...usersArray,
        { user_id: u.id, email, ad, soyad, telefon: "", role: "user", created_at: new Date().toISOString() },
      ]);
      return {};
    }

    // Non-demo: Supabase Auth
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // Create profile
    if (data.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        ad,
        soyad,
        telefon: "",
        role: "user",
      });
    }

    return {};
  }, [persistDemo]);

  // ========================================
  // SIGN OUT
  // ========================================
  const signOut = useCallback(async () => {
    if (IS_DEMO_MODE) {
      setUser(null);
      setProfile(null);
      persistDemo(null, null);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [persistDemo]);

  // ========================================
  // UPDATE PROFILE
  // ========================================
  const updateProfile = useCallback((data: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };

      if (IS_DEMO_MODE) {
        persistDemo(user, updated);
      } else if (user) {
        const supabase = createClient();
        supabase.from("profiles").update(data).eq("user_id", user.id);
      }

      return updated;
    });
  }, [user, persistDemo]);

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isAdmin, signIn, signUp, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
