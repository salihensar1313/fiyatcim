"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Profile } from "@/types";
import { safeGetJSON, safeSetJSON, safeRemove } from "@/lib/safe-storage";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
}

interface RegisteredUser {
  user_id: string;
  email: string;
  ad: string;
  soyad: string;
  telefon: string;
  role: "user" | "admin";
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signUp: (email: string, password: string, ad: string, soyad: string, telefon?: string) => Promise<{ error?: string }>;
  signOut: () => void;
  updateProfile: (data: Partial<Profile>) => void;
  adminUpdateUser: (userId: string, data: { ad: string; soyad: string; telefon: string }) => void;
  adminChangePassword: (email: string, newPassword: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "fiyatcim_auth";
const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Simple SHA-256 hash for demo password storage (NOT for production auth) */
async function simpleHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text + "_fiyatcim_salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function translateAuthError(msg: string): string {
  // Use generic messages to prevent email enumeration attacks
  const map: Record<string, string> = {
    "Invalid login credentials": "Geçersiz e-posta veya şifre.",
    "Email not confirmed": "Geçersiz e-posta veya şifre.",
    "User not found": "Geçersiz e-posta veya şifre.",
    "Email rate limit exceeded": "Çok fazla deneme yaptınız. Lütfen biraz bekleyin.",
    "For security purposes, you can only request this after": "Güvenlik nedeniyle lütfen biraz bekleyip tekrar deneyin.",
    "User already registered": "Kayıt işleminiz alındı. Devam etmek için e-postanızı kontrol edin.",
    "Password should be at least 6 characters": "Şifre en az 6 karakter olmalıdır.",
    "Signup requires a valid password": "Geçerli bir şifre giriniz.",
  };
  for (const [en, tr] of Object.entries(map)) {
    if (msg.includes(en)) return tr;
  }
  // Never leak raw Supabase error messages to client
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}

function mapProfile(data: Record<string, unknown>): Profile {
  return {
    user_id: data.user_id as string,
    ad: (data.ad as string) ?? "",
    soyad: (data.soyad as string) ?? "",
    telefon: (data.telefon as string) ?? "",
    role: (data.role as "admin" | "user") ?? "user",
    avatar: (data.avatar as string) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ========================================
  // DEMO MODE: localStorage auth + httpOnly admin cookie
  // ========================================
  const persistDemo = useCallback((u: User | null, p: Profile | null) => {
    if (u) {
      safeSetJSON(AUTH_STORAGE_KEY, { user: u, profile: p });
      // Set httpOnly admin cookie via API if admin role
      if (p?.role === "admin") {
        fetch("/api/auth/demo-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u.id, email: u.email }),
        }).catch(() => {});
      }
    } else {
      safeRemove(AUTH_STORAGE_KEY);
      // Clear admin cookie on logout
      fetch("/api/auth/demo-admin", { method: "DELETE" }).catch(() => {});
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
    let settled = false;

    const settle = () => { if (!settled) { settled = true; clearTimeout(timer); setIsLoading(false); } };

    // Timeout: 5s max bekle, sonra loading'i kapat
    const timer = setTimeout(settle, 5000);

    const loadUser = async (userId: string, email: string) => {
      setUser({ id: userId, email });
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      if (data) setProfile(mapProfile(data as Record<string, unknown>));
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email!).finally(settle);
      } else {
        settle();
      }
    }).catch(settle);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUser(session.user.id, session.user.email!);
        settle();
      } else {
        setUser(null);
        setProfile(null);
        settle();
      }
    });

    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  // ========================================
  // SIGN IN
  // ========================================
  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    if (!email || !password) {
      return { error: "E-posta ve şifre zorunludur." };
    }

    if (IS_DEMO_MODE) {
      // Demo: kayıtlı kullanıcı kontrolü (şifre hash ile karşılaştırılır)
      const registeredUsers = safeGetJSON<RegisteredUser[]>("fiyatcim_registered_users", []);
      const regArr = Array.isArray(registeredUsers) ? registeredUsers : [];
      const registeredUser = regArr.find((ru) => ru.email === email);

      if (registeredUser) {
        // Kayıtlı kullanıcı — basit hash kontrolü
        const hashes = safeGetJSON<Record<string, string>>("fiyatcim_demo_pw_hashes", {});
        const hashMap = typeof hashes === "object" && hashes ? hashes : {};
        const inputHash = await simpleHash(password);
        if (hashMap[email] !== inputHash) {
          return { error: "Geçersiz e-posta veya şifre." };
        }
        const u: User = { id: registeredUser.user_id, email };
        const p: Profile = { user_id: u.id, ad: registeredUser.ad, soyad: registeredUser.soyad, telefon: registeredUser.telefon, role: registeredUser.role as "user" | "admin" };
        setUser(u);
        setProfile(p);
        persistDemo(u, p);
        return {};
      }

      // Kayıtlı değil → min 6 karakter ile demo giriş
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
    if (error) return { error: translateAuthError(error.message) };
    return {};
  }, [persistDemo]);

  // ========================================
  // SIGN IN WITH GOOGLE
  // ========================================
  const signInWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    if (IS_DEMO_MODE) {
      // Demo mode: simulate Google login
      const u: User = { id: "user-google-" + Date.now(), email: "demo@gmail.com" };
      const p: Profile = { user_id: u.id, ad: "Google", soyad: "Kullanıcı", telefon: "", role: "user" };
      setUser(u);
      setProfile(p);
      persistDemo(u, p);
      return {};
    }

    // Non-demo: Supabase Google OAuth
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  }, [persistDemo]);

  // ========================================
  // SIGN UP
  // ========================================
  const signUp = useCallback(async (email: string, password: string, ad: string, soyad: string, telefon?: string): Promise<{ error?: string }> => {
    if (!email || !password || !ad || !soyad) {
      return { error: "Tüm alanlar zorunludur." };
    }
    if (password.length < 6) {
      return { error: "Şifre en az 6 karakter olmalıdır." };
    }

    if (IS_DEMO_MODE) {
      const tel = telefon || "";
      const u: User = { id: "user-" + Date.now(), email };
      const p: Profile = { user_id: u.id, ad, soyad, telefon: tel, role: "user" };
      setUser(u);
      setProfile(p);
      persistDemo(u, p);

      const existingUsers = safeGetJSON<Array<Record<string, unknown>>>("fiyatcim_registered_users", []);
      const usersArray = Array.isArray(existingUsers) ? existingUsers : [];
      safeSetJSON("fiyatcim_registered_users", [
        ...usersArray,
        { user_id: u.id, email, ad, soyad, telefon: tel, role: "user", created_at: new Date().toISOString() },
      ]);
      // Store password hash for demo mode (never store plaintext)
      const hashes = safeGetJSON<Record<string, string>>("fiyatcim_demo_pw_hashes", {});
      const hashMap = typeof hashes === "object" && hashes ? hashes : {};
      hashMap[email] = await simpleHash(password);
      safeSetJSON("fiyatcim_demo_pw_hashes", hashMap);
      return {};
    }

    // Non-demo: Supabase Auth
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateAuthError(error.message) };

    // Create profile
    if (data.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        ad,
        soyad,
        telefon: telefon || "",
        role: "user",
      });
    }

    return {};
  }, [persistDemo]);

  // ========================================
  // SIGN OUT
  // ========================================
  const signOut = useCallback(async () => {
    // Clear state FIRST so UI updates immediately
    setUser(null);
    setProfile(null);

    if (IS_DEMO_MODE) {
      persistDemo(null, null);
      return;
    }

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, [persistDemo]);

  // ========================================
  // UPDATE PROFILE (+ registered_users sync)
  // ========================================
  const updateProfile = useCallback((data: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };

      if (IS_DEMO_MODE) {
        persistDemo(user, updated);
        // Sync to registered_users list so admin panel sees changes
        if (user) {
          const users = safeGetJSON<RegisteredUser[]>("fiyatcim_registered_users", []);
          const arr = Array.isArray(users) ? users : [];
          const idx = arr.findIndex((u) => u.user_id === user.id || u.email === user.email);
          if (idx >= 0) {
            arr[idx] = { ...arr[idx], ...data };
            safeSetJSON("fiyatcim_registered_users", arr);
          }
        }
      } else if (user) {
        const supabase = createClient();
        supabase.from("profiles").update(data).eq("user_id", user.id).then(({ error }) => {
          if (error) console.error("Profile update error:", error.message);
        });
      }

      return updated;
    });
  }, [user, persistDemo]);

  // ========================================
  // ADMIN: Update any user profile
  // ========================================
  const adminUpdateUser = useCallback((userId: string, data: { ad: string; soyad: string; telefon: string }) => {
    if (IS_DEMO_MODE) {
      const users = safeGetJSON<RegisteredUser[]>("fiyatcim_registered_users", []);
      const arr = Array.isArray(users) ? users : [];
      const idx = arr.findIndex((u) => u.user_id === userId);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...data };
        safeSetJSON("fiyatcim_registered_users", arr);
      }
    } else {
      const supabase = createClient();
      supabase.from("profiles").update(data).eq("user_id", userId).then(({ error }) => {
        if (error) console.error("Admin profile update error:", error.message);
      });
    }
  }, []);

  // ========================================
  // ADMIN: Change any user password
  // ========================================
  const adminChangePassword = useCallback(async (email: string, newPassword: string): Promise<{ error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { error: "Şifre en az 6 karakter olmalıdır." };
    }
    if (IS_DEMO_MODE) {
      const hashes = safeGetJSON<Record<string, string>>("fiyatcim_demo_pw_hashes", {});
      const hashMap = typeof hashes === "object" && hashes ? hashes : {};
      hashMap[email] = await simpleHash(newPassword);
      safeSetJSON("fiyatcim_demo_pw_hashes", hashMap);
      return {};
    }
    return { error: "Bu özellik demo modda çalışır." };
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isAdmin, signIn, signInWithGoogle, signUp, signOut, updateProfile, adminUpdateUser, adminChangePassword }}
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
