"use client";

import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-slate-50 overflow-x-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1e293b] border-b border-white/5 flex items-center justify-between px-5 z-[1000] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0a3d34] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">B</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight uppercase">BiCalendar</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 lg:ml-[280px] p-4 md:p-8 pt-20 lg:pt-8 w-full max-w-[1600px] mx-auto min-h-screen transition-all">
        {children}
      </main>
    </div>
  );
}
