"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export const PLAN_TIERS = {
  starter: 0,
  professional: 1,
  advanced: 2,
} as const;

export type PlanType = keyof typeof PLAN_TIERS;

export interface UserProfile {
  id: string;
  clinic_name: string;
  email?: string;
  role: string;
  is_approved: boolean;
  plan?: PlanType;
  payment_status?: "pending" | "paid";
  billing_cycle?: "monthly" | "yearly";
  approved_at?: string;
  google_sheet_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  checkAccess: (minTier: PlanType) => boolean;
  isTrialActive: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => null,
  checkAccess: () => false,
  isTrialActive: false,
});

const PROFILE_CACHE_KEY = "cached_user_profile";

function getCachedProfile(): UserProfile | null {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function setCachedProfile(profile: UserProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {}
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const isProcessingRef = useRef(false);
  const signingOutRef = useRef(false);

  // Load profile from cache on mount (client-side only)
  useEffect(() => {
    const cached = getCachedProfile();
    if (cached) setProfile(cached);
  }, []);

  // Keep the ref always up to date
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Helper to apply plan overrides and cache
  function applyProfile(profileData: any, email?: string | null): UserProfile {
    let finalProfile = profileData as UserProfile;
    // Database value is now priority. 
    // Manual overrides removed to ensure Admin panel changes take effect.
    if (typeof window !== 'undefined') {
      setCachedProfile(finalProfile);
    }
    return finalProfile;
  }

  // Real-time listener for profile changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Profile updated in real-time:", payload.new);
          const updated = applyProfile(payload.new, user.email || profile?.email);
          setProfile(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;

    // Safety timeout: stop loading after 5 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("Auth initialization timed out after 5s. Forcing isLoading to false.");
        setIsLoading(false);
      }
    }, 5000);

    async function handleAuthChange(event: string, session: Session | null) {
      if (!mounted || isProcessingRef.current) return;
      // During sign-out, skip all auth processing to prevent intermediate screens
      if (signingOutRef.current) return;
      
      console.log(`Auth Event: ${event}`, session?.user?.id ? `User: ${session.user.id}` : "No Session");
      
      const currentPath = pathnameRef.current;
      let currentProfile: UserProfile | null = null;

      try {
        isProcessingRef.current = true;

        if (session?.user) {
          // Profile check
          const { data: profileData, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (pErr || !profileData || profileData.is_approved === false) {
            console.error("Profile check failed or unapproved:", pErr?.message || "Not found/Unapproved");
            
            // Eğer hata bir ağ hatası ise (TypeError: Load failed vb.), kullanıcıyı hemen sistemden atmayalım
            const isNetworkError = pErr?.message?.includes("Load failed") || pErr?.message?.includes("Failed to fetch");
            
            if (isNetworkError) {
              console.warn("Ağ bağlantısı koptu, profil doğrulanamadı. Oturum kapatılmıyor.");
              if (mounted) {
                // Sadece yükleme ekranını kapat, kullanıcının mevcut durumunu koru
                setIsLoading(false);
              }
              return;
            }

            if (event === "SIGNED_IN") {
              await supabase.auth.signOut().catch(() => {});
            }
            if (mounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setCachedProfile(null);
              setIsLoading(false);
              if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/" && !currentPath.startsWith("/legal")) {
                router.replace("/login");
              }
            }
            return;
          }
          currentProfile = applyProfile(profileData, session.user.email);
        } else {
          // Clear everything on sign out
          setCachedProfile(null);
          currentProfile = null;
        }

        if (mounted) {
          // DEMO MODE CHECK
          const isDemoMode = typeof window !== "undefined" && localStorage.getItem("demo_mode") === "true";
          if (isDemoMode) {
            const demoProfile: UserProfile = {
              id: "demo-user",
              clinic_name: "Demo Clinic",
              email: "demo@bicalendo.com",
              role: "admin",
              is_approved: true,
              plan: "advanced",
              payment_status: "paid",
            };
            setSession({ user: { id: "demo-user" } } as Session);
            setUser({ id: "demo-user", email: "demo@bicalendo.com" } as User);
            setProfile(demoProfile);
            setIsLoading(false);
            if (currentPath === "/login" || currentPath === "/register" || currentPath === "/") {
              router.replace("/takvim");
              setTimeout(() => { if (mounted) router.refresh(); }, 150);
            }
            isProcessingRef.current = false;
            return;
          }

          setSession(session);
          setUser(session?.user ?? null);
          setProfile(currentProfile);
          setIsLoading(false);
          authInitialized = true;

          // Navigation logic - Only redirect if necessary to prevent loops
          if (!session) {
            if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/" && !currentPath.startsWith("/legal")) {
              router.replace("/login");
            }
          } else if (currentPath === "/login" || currentPath === "/register" || currentPath === "/") {
            const isTrialActive = currentProfile?.approved_at 
              ? (new Date().getTime() - new Date(currentProfile.approved_at).getTime()) < 7 * 24 * 60 * 60 * 1000
              : false;

            const target = (currentProfile && currentProfile.payment_status !== 'paid' && !isTrialActive && currentProfile.role !== 'admin')
              ? "/odeme"
              : "/takvim";
            
            console.log(`Redirecting to ${target} from ${currentPath} (Trial Active: ${isTrialActive})`);
            router.replace(target);
            
            // Wait a bit before refreshing to let navigation settle
            setTimeout(() => {
              if (mounted) router.refresh();
            }, 150);
          }
        }
      } catch (err) {
        console.error("Auth handle error:", err);
        if (mounted) {
          setIsLoading(false);
        }
      } finally {
        isProcessingRef.current = false;
      }
    }

    // Initialize with current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!authInitialized) {
        handleAuthChange("INITIAL_SESSION", session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange(event, session);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [router]); // pathname removed - we use pathnameRef instead

  const signOut = useCallback(async () => {
    // Immediately block auth listener from processing any more events
    signingOutRef.current = true;

    // Clear React state immediately to prevent any intermediate UI renders
    setSession(null);
    setUser(null);
    setProfile(null);

    // Clear all cached data from localStorage
    const keysToClear = [
      'randevular', 
      'cache_appointments', 
      'cache_patient_profiles', 
      'cache_inventory',
      'klinik_stok',
      'klinik_stok_tanimlari',
      'hasta_profilleri',
      'dashboard_start',
      'dashboard_end',
      PROFILE_CACHE_KEY,
      'demo_mode',
      'demo_started_at',
      'demo_seeded',
      'cache_services',
      'cache_consent_records',
      'cache_admin_users'
    ];

    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
          keysToClear.push(key);
        }
      }
      
      keysToClear.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      });
    }

    // Redirect to login immediately — no waiting for Supabase
    window.location.href = "/login";

    // Fire-and-forget: tell Supabase to end the session in the background
    supabase.auth.signOut().catch(() => {});
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return null;
    try {
      // Önce cache'i temizle ki güncel veri gelsin
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PROFILE_CACHE_KEY);
      }
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && profileData) {
        const updatedProfile = applyProfile(profileData, user.email || profile?.email);
        setProfile(updatedProfile);
        return updatedProfile;
      }
    } catch (e) {
      console.error("Refresh profile error:", e);
    }
    return null;
  }, [user, profile?.email]);

  const checkAccess = useCallback((minTier: PlanType) => {
    if (profile?.role === 'admin') return true;
    const userPlan = profile?.plan || "starter";
    const userLevel = PLAN_TIERS[userPlan] ?? 0;
    const requiredLevel = PLAN_TIERS[minTier] ?? 0;
    return userLevel >= requiredLevel;
  }, [profile]);

  const isTrialActive = profile?.approved_at 
    ? (new Date().getTime() - new Date(profile.approved_at.endsWith('Z') ? profile.approved_at : profile.approved_at + 'Z').getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signOut, refreshProfile, checkAccess, isTrialActive }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
