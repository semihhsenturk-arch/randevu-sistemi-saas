"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Contact, Warehouse, ChartPie, LogOut, Users, Lock, CreditCard, Layers, X, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, profile, isLoading, checkAccess, isTrialActive } = useAuth();

  // Ödeme yapılmamışsa VE deneme süresi aktif değilse /odeme dışındaki sayfalara erişimi engelle
  const needsPayment = !isLoading && profile && profile.payment_status !== 'paid' && !isTrialActive && profile.role !== 'admin';

  useEffect(() => {
    if (needsPayment && pathname !== '/odeme' && pathname !== '/ayarlar') {
      router.replace('/odeme');
    }
  }, [needsPayment, pathname, router]);

  const navItems = [
    { href: "/takvim", label: "Randevu Takvimi", icon: CalendarDays, minTier: "starter" },
    { href: "/hasta-listesi", label: "Hasta Listesi", icon: Contact, minTier: "professional" },
    { href: "/stok-yonetimi", label: "Stok Yönetimi", icon: Warehouse, minTier: "advanced" },
    { href: "/dashboard", label: "Analiz", icon: ChartPie, minTier: "advanced" },
    { href: "/hizmet-yonetimi", label: "Hizmet Yönetimi", icon: Layers, minTier: "starter" },
    { href: "/ayarlar", label: "Ayarlar", icon: Settings, minTier: "starter" },
  ];

  const isDemo = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';

  if (profile?.role === "admin" && !isDemo) {
    navItems.push({ href: "/admin/users", label: "Kullanıcılar", icon: Users, minTier: "starter" });
  }

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div 
          className="xl:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1999] animate-in fade-in duration-300"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      <nav className={`fixed top-0 left-0 h-screen w-[280px] bg-[#1e293b] text-[#f8fafc] p-6 flex flex-col z-[2000] shadow-[4px_0_20px_rgba(0,0,0,0.15)] transition-transform duration-300 xl:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between xl:block pb-10">
          <div>
            <div className="text-[0.65rem] tracking-[0.12rem] text-[#94a3b8] font-bold mb-1 uppercase">
              Klinik Yönetimi
            </div>
            <div className="text-[1.15rem] font-extrabold leading-snug uppercase">
              {(profile?.clinic_name || "Klinik").toUpperCase()}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="xl:hidden text-[#94a3b8] hover:text-white"
            onClick={() => setIsOpen?.(false)}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <ul id="tour-nav-menu" className="flex-1 list-none m-0 p-0 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            const isLocked = !checkAccess(item.minTier as any);

            // BUG-15 FIX: Kilitli nav item'lar tıklanamaz — Link yerine div render et
            if (isLocked) {
              return (
                <li key={item.href}>
                  <div
                    className="flex items-center justify-between p-3 rounded-xl text-[0.9rem] font-medium text-[#475569] opacity-50 cursor-not-allowed select-none"
                    title="Bu özellik planınızda mevcut değil"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <Lock className="w-4 h-4 opacity-70" />
                  </div>
                </li>
              );
            }

            return (
              <li key={item.href} id={`tour-link${item.href.replace('/', '-')}`}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen?.(false)}
                  className={`flex items-center justify-between p-3 rounded-xl text-[0.9rem] font-medium transition-all duration-250 ${
                    isActive
                      ? "bg-[#f8fafc] text-[#1e293b] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                      : "text-[#94a3b8] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="pt-5 mt-auto border-t border-white/10 flex">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-transparent border border-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış</span>
          </button>
        </div>
      </nav>
    </>
  );
}
