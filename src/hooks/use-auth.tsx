"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
    setCachedProfile(finalProfile);
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

    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Supabase Session Error:", error.message);
          if (error.message.includes("Refresh Token")) {
             await supabase.auth.signOut().catch(() => {});
          }
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setCachedProfile(null);
            setIsLoading(false);
            if (pathnameRef.current !== "/login" && pathnameRef.current !== "/register") {
              router.replace("/login");
            }
          }
          return;
        }

        if (mounted) {
          let currentProfile: UserProfile | null = null;
          
          if (session?.user) {
            const { data: profileData, error: pErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (pErr || !profileData || profileData.is_approved === false) {
              await supabase.auth.signOut().catch(() => {});
              setSession(null);
              setUser(null);
              setProfile(null);
              setCachedProfile(null);
              setIsLoading(false);
              if (pathnameRef.current !== "/login" && pathnameRef.current !== "/register") {
                router.replace("/login");
              }
              return;
            }
            currentProfile = applyProfile(profileData, session.user.email);
          }

          setSession(session);
          setUser(session?.user ?? null);
          setProfile(currentProfile);
          setIsLoading(false);
          
          if (!session && pathnameRef.current !== "/login" && pathnameRef.current !== "/register" && pathnameRef.current !== "/") {
            router.replace("/login");
          } else if (session && (pathnameRef.current === "/login" || pathnameRef.current === "/register" || pathnameRef.current === "/")) {
            // Ödeme yapılmamışsa ödeme sayfasına yönlendir
            if (currentProfile && currentProfile.payment_status !== 'paid' && currentProfile.role !== 'admin') {
              router.replace("/odeme");
            } else {
              router.replace("/takvim");
            }
          }
        }
      } catch (e) {
        console.error("Auth check exception:", e);
        if (mounted) {
          setIsLoading(false);
          if (pathnameRef.current !== "/login" && pathnameRef.current !== "/register") {
            router.replace("/login");
          }
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        const currentPath = pathnameRef.current;
        
        let currentProfile: UserProfile | null = null;
        if (session?.user) {
          const { data: profileData, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (pErr || !profileData || profileData.is_approved === false) {
            if (event === "SIGNED_IN") {
              await supabase.auth.signOut().catch(() => {});
            }
            return;
          }
          currentProfile = applyProfile(profileData, session.user.email);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setProfile(currentProfile);
          setIsLoading(false);

          if (event === "SIGNED_OUT" && currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
            router.replace("/login");
          } else if (event === "SIGNED_IN" && (currentPath === "/login" || currentPath === "/register" || currentPath === "/")) {
            // Ödeme yapılmamışsa ödeme sayfasına yönlendir
            if (currentProfile && currentProfile.payment_status !== 'paid' && currentProfile.role !== 'admin') {
              router.replace("/odeme");
            } else {
              router.replace("/takvim");
            }
            router.refresh();
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]); // pathname removed - we use pathnameRef instead

  const signOut = async () => {
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
  };

  const refreshProfile = async () => {
    if (!user) return null;
    try {
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
  };

  const checkAccess = (minTier: PlanType) => {
    if (profile?.role === 'admin') return true;
    const userPlan = profile?.plan || "starter";
    const userLevel = PLAN_TIERS[userPlan] ?? 0;
    const requiredLevel = PLAN_TIERS[minTier] ?? 0;
    return userLevel >= requiredLevel;
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signOut, refreshProfile, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
