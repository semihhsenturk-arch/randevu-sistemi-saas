"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck, 
  CalendarRange, 
  Percent, 
  Banknote,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface CalendarHeaderProps {
  monday: Date;
  sunday: Date;
  weekOffset: number;
  setWeekOffset: (offset: number | ((prev: number) => number)) => void;
  syncing: boolean;
  onSync: () => void;
  onNewAppointment: (tarih: string, saat: string) => void;
  clinicName?: string;
  stats: {
    todayCount: number;
    weekCount: number;
    income: number;
    occupancy: number;
  };
}

export function CalendarHeader({
  monday,
  sunday,
  weekOffset,
  setWeekOffset,
  syncing,
  onSync,
  onNewAppointment,
  clinicName,
  stats
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-3 sticky top-16 md:top-20 xl:top-3 z-[40] bg-slate-50">
      <header className="flex flex-col md:flex-row justify-between items-center bg-white/88 backdrop-blur-[20px] p-4 md:p-[10px_16px] lg:p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] gap-3 md:gap-2">
        {/* Left: Clinic Name & Date */}
        <div className="flex flex-col gap-[2px] text-center md:text-left w-full md:w-auto shrink-0">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">
            {(clinicName || "Klinik").toUpperCase()}
          </div>
          <h1 className="text-[1.1rem] lg:text-[1.25rem] font-extrabold text-[#1e293b]">Randevu Sistemi</h1>
          <div className="text-[0.72rem] lg:text-[0.78rem] font-medium text-[#64748b]">
            {format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}
          </div>
        </div>

        {/* Center: Stats Cards */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <div className="flex gap-2 lg:gap-4">
            {/* Bugün */}
            <div className="flex items-center gap-2 lg:gap-3.5 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg lg:rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                <CalendarCheck className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <div>
                <div className="text-[0.6rem] lg:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Bugün</div>
                <div className="text-sm lg:text-lg font-black text-[#1e293b]">{stats.todayCount}</div>
              </div>
            </div>
            
            {/* Hafta */}
            <div className="flex items-center gap-2 lg:gap-3.5 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg lg:rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
                <CalendarRange className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <div>
                <div className="text-[0.6rem] lg:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Hafta</div>
                <div className="text-sm lg:text-lg font-black text-[#1e293b]">{stats.weekCount}</div>
              </div>
            </div>

            {/* Doluluk */}
            <div className="flex items-center gap-2 lg:gap-3.5 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg lg:rounded-xl bg-amber-50 text-amber-600 shadow-sm">
                <Percent className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <div>
                <div className="text-[0.6rem] lg:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Doluluk</div>
                <div className="text-sm lg:text-lg font-black text-[#1e293b]">{stats.occupancy}%</div>
              </div>
            </div>

            {/* Gelir */}
            <div className="flex items-center gap-2 lg:gap-3.5 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg lg:rounded-xl bg-[#0a3d3408] text-[#0a3d34] shadow-sm">
                <Banknote className="w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              <div>
                <div className="text-[0.6rem] lg:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Gelir</div>
                <div className="text-sm lg:text-lg font-black text-[#1e293b]">{stats.income} TL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: New Appointment Button */}
        <div className="flex items-center w-full md:w-auto shrink-0">
          <Button 
            onClick={() => onNewAppointment(format(new Date(), "yyyy-MM-dd"), "09:00")}
            className="w-full md:w-auto bg-[#0a3d34] hover:bg-[#072b25] text-white p-4 md:p-[10px_20px] lg:p-[14px_32px] rounded-xl font-bold text-[0.85rem] md:text-[0.8rem] lg:text-[1rem] uppercase tracking-[0.05em] shadow-[0_6px_20px_-4px_rgba(10,61,52,0.4)] transition-all hover:-translate-y-[2px] active:scale-95 h-auto"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 lg:mr-2" />
            RANDEVU
          </Button>
        </div>
      </header>

      <div className="flex justify-center items-center py-2">
        <div className="flex items-center gap-3 bg-white p-[6px_12px] rounded-full border border-slate-200 shadow-md">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full border border-slate-200 hover:bg-[#0a3d34] hover:text-white transition-all transform hover:scale-110"
            onClick={() => setWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="font-bold min-w-[200px] text-center text-[0.85rem] text-[#1e293b]">
            {format(monday, "d MMM", { locale: tr })} - {format(sunday, "d MMM yyyy", { locale: tr })}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full border border-slate-200 hover:bg-[#0a3d34] hover:text-white transition-all transform hover:scale-110"
            onClick={() => setWeekOffset(prev => prev + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
