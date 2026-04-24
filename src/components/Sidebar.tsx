"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Contact, Warehouse, ChartPie, HelpCircle, LogOut, Users, Lock, CreditCard, Layers } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, profile, isLoading, checkAccess } = useAuth();
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  // Ödeme yapılmamışsa /odeme dışındaki sayfalara erişimi engelle
  const needsPayment = !isLoading && profile && profile.payment_status !== 'paid' && profile.role !== 'admin';

  useEffect(() => {
    if (needsPayment && pathname !== '/odeme') {
      router.replace('/odeme');
    }
  }, [needsPayment, pathname, router]);

  const navItems = [
    { href: "/takvim", label: "Randevu Takvimi", icon: CalendarDays, minTier: "starter" },
    { href: "/hasta-listesi", label: "Hasta Listesi", icon: Contact, minTier: "professional" },
    { href: "/stok-yonetimi", label: "Stok Yönetimi", icon: Warehouse, minTier: "advanced" },
    { href: "/dashboard", label: "Analiz", icon: ChartPie, minTier: "advanced" },
    { href: "/hizmet-yonetimi", label: "Hizmet Yönetimi", icon: Layers, minTier: "starter" },
  ];

  if (profile?.role === "admin") {
    navItems.push({ href: "/admin/users", label: "Kullanıcılar", icon: Users, minTier: "starter" });
  }

  const handleSupportSend = async () => {
    if (!supportMessage.trim()) return;
    setIsSending(true);
    try {
      const SUPPORT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPSOfJE332q-Ci1XOAfLtY6CBY0IzyB_HmpAJUgtPMoGzrFM_ND5RpHtzpzLX12-dM/exec';
      await fetch(SUPPORT_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: supportMessage, sender: user?.email || "Bilinmeyen Kullanıcı" }),
      });
      setHasSent(true);
    } catch (e) {
      console.error(e);
      alert("Gönderim başarısız oldu.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 h-screen w-[280px] bg-[#1e293b] text-[#f8fafc] p-6 lg:flex flex-col z-[2000] shadow-[4px_0_20px_rgba(0,0,0,0.15)] hidden">
        <div className="pb-10">
          <div className="text-[0.65rem] tracking-[0.12rem] text-[#94a3b8] font-bold mb-1 uppercase">
            Klinik Yönetimi
          </div>
          <div className="text-[1.15rem] font-extrabold leading-snug uppercase">
            {(profile?.clinic_name || "Klinik").toUpperCase()}
          </div>
        </div>

        <ul className="flex-1 list-none m-0 p-0 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            const isLocked = !checkAccess(item.minTier as any);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
                  {isLocked && <Lock className="w-4 h-4 opacity-50" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="pt-5 mt-auto border-t border-white/10 flex gap-2">
          <button
            onClick={() => setSupportOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-transparent border border-white/15 text-[#94a3b8] text-xs font-semibold hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Destek</span>
          </button>
          <button
            onClick={() => signOut()}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-transparent border border-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış</span>
          </button>
        </div>
      </nav>

      {/* Mobile Nav Top Bar Placeholder if needed */}
      <div className="lg:hidden w-full h-[60px] bg-[#1e293b] fixed top-0 flex items-center justify-between px-4 z-[2000] text-white">
        <div className="font-bold text-sm uppercase">{(profile?.clinic_name || "Klinik").toUpperCase()}</div>
        {/* Mobile menu logic could be added here */}
      </div>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#0a3d34]">Teknik Destek</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Talebinizi aşağıya yazabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          {hasSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                 ✓
              </div>
              <h3 className="text-lg font-bold text-[#0a3d34] mb-2">Mesajınız İletildi!</h3>
              <p className="text-sm text-slate-500 mb-6">En kısa sürede geri dönüş yapılacaktır.</p>
              <Button onClick={() => setSupportOpen(false)} className="w-full bg-[#0a3d34] hover:bg-[#072b25]">Kapat</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Textarea 
                placeholder="Sorununuzu buraya detaylıca yazınız..." 
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                className="min-h-[150px] border-slate-200 focus:border-[#0a3d34] focus:ring-[#0a3d34]/20"
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSupportOpen(false)}>Vazgeç</Button>
                <Button onClick={handleSupportSend} disabled={isSending || !supportMessage.trim()} className="bg-[#0a3d34] hover:bg-[#072b25]">
                  {isSending ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
