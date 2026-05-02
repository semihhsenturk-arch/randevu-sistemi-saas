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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  checkAccess: (minTier: PlanType) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => null,
  checkAccess: () => false,
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
            if (event === "SIGNED_IN") {
              await supabase.auth.signOut().catch(() => {});
            }
            if (mounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setCachedProfile(null);
              setIsLoading(false);
              if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
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
          setSession(session);
          setUser(session?.user ?? null);
          setProfile(currentProfile);
          setIsLoading(false);
          authInitialized = true;

          // Navigation logic - Only redirect if necessary to prevent loops
          if (!session) {
            if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
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
    // Supabase auth key'lerini de manuel temizlemek garanti sağlar
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
      PROFILE_CACHE_KEY
    ];

    // Sayfada localStorage erişimi olduğundan eminiz (client side)
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

    // Supabase oturumunu arka planda sonlandır, askıda (hang) kalmasını bekleme
    // Network hatası durumunda işlemi tıkamaması için setTimeout ile yarıştıralım veya await'i sınırlandıralım
    Promise.race([
      supabase.auth.signOut(),
      new Promise(resolve => setTimeout(resolve, 500))
    ]).catch(() => {}).finally(() => {
      // Yönlendir
      window.location.href = "/login";
    });
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

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signOut, refreshProfile, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
