"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Profile } from "@/types";
import { safeGetJSON, safeSetJSON, safeRemove } from "@/lib/safe-storage";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/password";
import { logger } from "@/lib/logger";

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
  isPremium: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signUp: (email: string, password: string, ad: string, soyad: string, telefon?: string) => Promise<{ error?: string }>;
  signOut: () => void;
  updateProfile: (data: Partial<Profile>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  updateEmail: (newEmail: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string; message?: string }>;
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
    is_premium: data.is_premium === true,
    premium_expires_at: (data.premium_expires_at as string) ?? undefined,
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
    let settled = false;

    const settle = () => { if (!settled) { settled = true; clearTimeout(timer); setIsLoading(false); } };

    // Timeout: 5s max bekle, sonra loading'i kapat
    const timer = setTimeout(settle, 5000);

    // Helper: get access token from Supabase auth cookie
    const getAccessToken = (): string | null => {
      try {
        const cookies = document.cookie.split(";").map(c => c.trim());
        const part0 = cookies.find(c => c.startsWith("sb-qnsvqshljktoiktwprkr-auth-token.0="));
        const part1 = cookies.find(c => c.startsWith("sb-qnsvqshljktoiktwprkr-auth-token.1="));
        if (!part0) return null;
        const val0 = decodeURIComponent(part0.split("=").slice(1).join("="));
        const val1 = part1 ? decodeURIComponent(part1.split("=").slice(1).join("=")) : "";
        const b64 = (val0 + val1).replace("base64-", "");
        const session = JSON.parse(atob(b64));
        return session.access_token || null;
      } catch {
        return null;
      }
    };

    // Helper: direct Supabase REST call (bypasses hanging client)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const directQuery = async (table: string, query: string, token: string) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
      const data = await res.json();
      return { data, error: null };
    };

    const directUpdate = async (table: string, query: string, body: Record<string, string>, token: string) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(body),
      });
      return { error: res.ok ? null : `HTTP ${res.status}` };
    };

    const loadUser = async (userId: string, email: string) => {
      setUser({ id: userId, email });

      const token = getAccessToken();
      if (!token) return;

      // Fetch profile via direct REST call
      const { data: rows } = await directQuery("profiles", `select=*&user_id=eq.${userId}`, token);
      const data = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

      if (data) {
        const mapped = mapProfile(data as Record<string, unknown>);
        setProfile(mapped);

        // If profile ad/soyad is empty, try to fill from auth user_metadata (Google OAuth etc.)
        if (!mapped.ad || !mapped.soyad || !mapped.avatar) {
          try {
            const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
              headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
            });
            if (authRes.ok) {
              const authUser = await authRes.json();
              const meta = authUser.user_metadata || {};
              const fullName = ((meta.full_name || meta.name || "") as string).trim();

              if (fullName) {
                const nameParts = fullName.split(" ");
                const metaAd = nameParts[0] || "";
                const metaSoyad = nameParts.slice(1).join(" ") || "";
                const metaAvatar = ((meta.avatar_url || meta.picture || "") as string);

                const updates: Record<string, string> = {};
                if (!mapped.ad && metaAd) updates.ad = metaAd;
                if (!mapped.soyad && metaSoyad) updates.soyad = metaSoyad;
                if (!mapped.avatar && metaAvatar) updates.avatar = metaAvatar;

                if (Object.keys(updates).length > 0) {
                  const { error } = await directUpdate("profiles", `user_id=eq.${userId}`, updates, token);
                  if (!error) {
                    setProfile((prev) => prev ? { ...prev, ...updates } : prev);
                  }
                }
              }
            }
          } catch {
            // Metadata sync is best-effort
          }
        }
      } else {
        // No profile — create via auth callback (should already exist)
        // Fallback: create minimal profile
        try {
          const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
          });
          if (authRes.ok) {
            const authUser = await authRes.json();
            const meta = authUser.user_metadata || {};
            const fullName = ((meta.full_name || meta.name || "") as string).trim();
            const nameParts = fullName.split(" ");

            const newProfile = {
              user_id: userId,
              ad: nameParts[0] || "",
              soyad: nameParts.slice(1).join(" ") || "",
              telefon: "",
              role: "user",
              avatar: (meta.avatar_url || meta.picture || "") as string || null,
            };

            const insertRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
              method: "POST",
              headers: { apikey: supabaseKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify(newProfile),
            });
            if (insertRes.ok) {
              setProfile(mapProfile(newProfile as unknown as Record<string, unknown>));
            }
          }
        } catch {
          // Profile creation failed — user can still use the app
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email!).finally(settle);
      } else {
        settle();
      }
    }).catch(settle);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED" && !session) {
        // Stale refresh token — clear session silently
        console.warn("[auth] Token refresh failed, clearing session");
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        settle();
        return;
      }
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

    // Non-demo: Login via API route (brute-force protection + email alert)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "Giris basarisiz." };
      }

      // Set session from API response
      if (data.session?.access_token && data.session?.refresh_token) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      return {};
    } catch {
      return { error: "Baglanti hatasi. Lutfen tekrar deneyin." };
    }
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

    // Non-demo: Custom Google OAuth (redirect through fiyatcim.com)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return { error: "Google OAuth yapılandırılmamış." };

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = "openid email profile";

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "select_account");

    window.location.href = url.toString();
    return {};
  }, [persistDemo]);

  // ========================================
  // SIGN UP
  // ========================================
  const signUp = useCallback(async (email: string, password: string, ad: string, soyad: string, telefon?: string): Promise<{ error?: string }> => {
    if (!email || !password || !ad || !soyad) {
      return { error: "Tüm alanlar zorunludur." };
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return { error: pwCheck.error! };
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

    // Telefon numarası kontrolü — aynı numara ile birden fazla hesap açılamaz
    if (telefon && telefon !== "" && telefon !== "905") {
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("telefon", telefon)
        .limit(1);
      if (existing && existing.length > 0) {
        return { error: "Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın veya giriş yapın." };
      }
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateAuthError(error.message) };

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: data.user.id,
        ad,
        soyad,
        telefon: telefon || "",
        role: "user",
      });
      if (profileError?.message?.includes("profiles_telefon_unique")) {
        return { error: "Bu telefon numarası zaten kayıtlı. Lütfen farklı bir numara kullanın." };
      }
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
      logger.error("sign_out_failed", { fn: "signOut", error: err instanceof Error ? err.message : String(err) });
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
          if (error) logger.error("profile_update_failed", { fn: "updateProfile", error: error.message });
        });
      }

      return updated;
    });
  }, [user, persistDemo]);

  // ========================================
  // CHANGE PASSWORD (user self-service)
  // ========================================
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Giriş yapmanız gerekiyor." };
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) return { error: pwCheck.error! };

    if (IS_DEMO_MODE) {
      // Verify current password
      const hashes = safeGetJSON<Record<string, string>>("fiyatcim_demo_pw_hashes", {});
      const hashMap = typeof hashes === "object" && hashes ? hashes : {};
      const currentHash = await simpleHash(currentPassword);
      if (hashMap[user.email] && hashMap[user.email] !== currentHash) {
        return { error: "Mevcut şifreniz yanlış." };
      }
      hashMap[user.email] = await simpleHash(newPassword);
      safeSetJSON("fiyatcim_demo_pw_hashes", hashMap);
      return {};
    }

    // Non-demo: Supabase — first verify current password by re-signing in
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (signInErr) return { error: "Mevcut şifreniz yanlış." };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  }, [user]);

  // ========================================
  // UPDATE EMAIL (user self-service)
  // ========================================
  const updateEmail = useCallback(async (newEmail: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Giriş yapmanız gerekiyor." };
    if (!newEmail || !newEmail.includes("@")) return { error: "Geçerli bir e-posta adresi giriniz." };

    if (IS_DEMO_MODE) {
      // Demo: update email directly
      const oldEmail = user.email;
      setUser((prev) => prev ? { ...prev, email: newEmail } : prev);
      persistDemo({ ...user, email: newEmail }, profile);

      // Sync registered users
      const users = safeGetJSON<RegisteredUser[]>("fiyatcim_registered_users", []);
      const arr = Array.isArray(users) ? users : [];
      const idx = arr.findIndex((u) => u.user_id === user.id || u.email === oldEmail);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], email: newEmail };
        safeSetJSON("fiyatcim_registered_users", arr);
      }

      // Update password hash key
      const hashes = safeGetJSON<Record<string, string>>("fiyatcim_demo_pw_hashes", {});
      const hashMap = typeof hashes === "object" && hashes ? hashes : {};
      if (hashMap[oldEmail]) {
        hashMap[newEmail] = hashMap[oldEmail];
        delete hashMap[oldEmail];
        safeSetJSON("fiyatcim_demo_pw_hashes", hashMap);
      }

      return {};
    }

    // Non-demo: Supabase Auth — sends verification email to new address
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  }, [user, profile, persistDemo]);

  // ========================================
  // DELETE ACCOUNT (user self-service)
  // ========================================
  /**
   * Hesap silme — e-posta onay akışı.
   * Doğrudan silmez, onay e-postası gönderir.
   * Hesap yalnızca e-postadaki linke tıklanarak silinebilir.
   */
  const deleteAccount = useCallback(async (): Promise<{ error?: string; message?: string }> => {
    if (!user) return { error: "Giriş yapmanız gerekiyor." };

    if (IS_DEMO_MODE) {
      // Demo: doğrudan sil
      const users = safeGetJSON<RegisteredUser[]>("fiyatcim_registered_users", []);
      const arr = Array.isArray(users) ? users : [];
      safeSetJSON("fiyatcim_registered_users", arr.filter((u) => u.user_id !== user.id));
      const hashes = safeGetJSON<Record<string, string>>("fiyatcim_demo_pw_hashes", {});
      const hashMap = typeof hashes === "object" && hashes ? hashes : {};
      delete hashMap[user.email];
      safeSetJSON("fiyatcim_demo_pw_hashes", hashMap);
      setUser(null);
      setProfile(null);
      persistDemo(null, null);
      return {};
    }

    // Production: e-posta onay talebi gönder (hesap hemen silinmez)
    try {
      const res = await fetch("/api/auth/request-delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "İşlem başarısız." };
      return { message: data.message || "Onay e-postası gönderildi." };
    } catch {
      return { error: "Bağlantı hatası. Lütfen tekrar deneyin." };
    }
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
        if (error) logger.error("admin_profile_update_failed", { fn: "adminUpdateUser", error: error.message });
      });
    }
  }, []);

  // ========================================
  // ADMIN: Change any user password
  // ========================================
  const adminChangePassword = useCallback(async (email: string, newPassword: string): Promise<{ error?: string }> => {
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) {
      return { error: pwCheck.error! };
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
  const isPremium = profile?.is_premium === true;

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isAdmin, isPremium, signIn, signInWithGoogle, signUp, signOut, updateProfile, changePassword, updateEmail, deleteAccount, adminUpdateUser, adminChangePassword }}
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
