"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export interface UserProfile {
  id: string;
  clinic_name: string;
  role: string;
  is_approved: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Keep the ref always up to date
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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
            setIsLoading(false);
            if (pathnameRef.current !== "/login" && pathnameRef.current !== "/register") {
              router.replace("/login");
            }
          }
          return;
        }

        if (mounted) {
          let currentProfile = null;
          
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
              setIsLoading(false);
              if (pathnameRef.current !== "/login" && pathnameRef.current !== "/register") {
                router.replace("/login");
              }
              return;
            }
            currentProfile = profileData;
          }

          setSession(session);
          setUser(session?.user ?? null);
          setProfile(currentProfile);
          setIsLoading(false);
          
          if (!session && pathnameRef.current !== "/login" && pathnameRef.current !== "/register") {
            router.replace("/login");
          } else if (session && (pathnameRef.current === "/login" || pathnameRef.current === "/register")) {
            router.replace("/");
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
        if (session?.user && event === "SIGNED_IN") {
          const { data: profileData, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (pErr || !profileData || profileData.is_approved === false) {
            await supabase.auth.signOut().catch(() => {});
            return;
          }
          currentProfile = profileData;
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setProfile(currentProfile);
          setIsLoading(false);

          if (event === "SIGNED_OUT" && currentPath !== "/login" && currentPath !== "/register") {
            router.replace("/login");
          } else if (event === "SIGNED_IN" && (currentPath === "/login" || currentPath === "/register")) {
            router.replace("/");
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
    // Önce cache'i temizle
    const keysToClear = [
      'randevular', 
      'cache_appointments', 
      'cache_patient_profiles', 
      'cache_inventory',
      'klinik_stok',
      'klinik_stok_tanimlari',
      'hasta_profilleri',
      'dashboard_start',
      'dashboard_end'
    ];
    keysToClear.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // State'i sıfırla ve yönlendir
    setUser(null);
    setProfile(null);
    setSession(null);

    // Supabase oturumunu kapat (arka planda)
    supabase.auth.signOut().catch(() => {});

    // Login sayfasına yönlendir
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
