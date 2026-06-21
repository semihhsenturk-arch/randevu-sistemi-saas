"use client";

import { Sidebar } from "@/components/Sidebar";
import { DemoBanner } from "@/components/DemoBanner";
import { DemoTour } from "@/components/DemoTour";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(
      typeof window !== "undefined" && localStorage.getItem("demo_mode") === "true"
    );
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-slate-50 overflow-x-hidden">
      {/* Demo Banner — fixed top bar with countdown */}
      {isDemoMode && <DemoBanner />}
      {isDemoMode && <DemoTour />}

      {/* Mobile Header */}
      <div className={`xl:hidden fixed left-0 right-0 h-16 bg-[#1e293b] border-b border-white/5 flex items-center px-5 z-40 shadow-lg gap-4 ${isDemoMode ? "top-[52px]" : "top-0"}`}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10 shrink-0 -ml-2"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0a3d34] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">B</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight uppercase">BiCalendo</span>
        </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className={`flex-1 xl:ml-[280px] p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto min-h-screen transition-all ${isDemoMode ? "pt-[100px] md:pt-[100px] lg:pt-[100px] xl:pt-[60px]" : "pt-24 md:pt-24 lg:pt-24 xl:pt-8"}`}>
        {children}
      </main>
    </div>
  );
}

