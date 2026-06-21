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
      <header className="flex flex-col lg:flex-row justify-between items-center bg-white/88 backdrop-blur-[20px] p-4 lg:p-[10px_16px] xl:p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] gap-3 lg:gap-2">
        {/* Left: Clinic Name & Date */}
        <div className="flex flex-col gap-[2px] text-center lg:text-left w-full lg:w-auto shrink-0">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">
            {(clinicName || "Klinik").toUpperCase()}
          </div>
          <h1 className="text-[1.25rem] lg:text-[1.1rem] xl:text-[1.25rem] font-extrabold text-[#1e293b]">Randevu Sistemi</h1>
          <div className="text-[0.78rem] lg:text-[0.72rem] xl:text-[0.78rem] font-medium text-[#64748b]">
            {format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}
          </div>
        </div>

        {/* Center: Stats Cards */}
        <div className="hidden md:flex items-center justify-center w-full lg:w-auto">
          <div className="grid grid-cols-4 gap-2 lg:flex lg:gap-1.5 xl:gap-4">
            {/* Bugün */}
            <div className="flex items-center gap-2 lg:gap-1.5 xl:gap-3.5 px-3 lg:px-2 xl:px-4 py-2 lg:py-1 xl:py-2 rounded-xl lg:rounded-lg xl:rounded-2xl border border-slate-100 shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-7 lg:h-7 xl:w-10 xl:h-10 flex items-center justify-center rounded-lg lg:rounded-md xl:rounded-xl bg-blue-50 text-blue-600 shadow-sm">
                <CalendarCheck className="w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-5 xl:h-5" />
              </div>
              <div>
                <div className="text-[0.65rem] lg:text-[0.55rem] xl:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5 xl:mb-1.5">Bugün</div>
                <div className="text-base lg:text-xs xl:text-lg font-black text-[#1e293b]">{stats.todayCount}</div>
              </div>
            </div>
            
            {/* Hafta */}
            <div className="flex items-center gap-2 lg:gap-1.5 xl:gap-3.5 px-3 lg:px-2 xl:px-4 py-2 lg:py-1 xl:py-2 rounded-xl lg:rounded-lg xl:rounded-2xl border border-slate-100 shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-7 lg:h-7 xl:w-10 xl:h-10 flex items-center justify-center rounded-lg lg:rounded-md xl:rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
                <CalendarRange className="w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-5 xl:h-5" />
              </div>
              <div>
                <div className="text-[0.65rem] lg:text-[0.55rem] xl:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5 xl:mb-1.5">Hafta</div>
                <div className="text-base lg:text-xs xl:text-lg font-black text-[#1e293b]">{stats.weekCount}</div>
              </div>
            </div>

            {/* Doluluk */}
            <div className="flex items-center gap-2 lg:gap-1.5 xl:gap-3.5 px-3 lg:px-2 xl:px-4 py-2 lg:py-1 xl:py-2 rounded-xl lg:rounded-lg xl:rounded-2xl border border-slate-100 shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-7 lg:h-7 xl:w-10 xl:h-10 flex items-center justify-center rounded-lg lg:rounded-md xl:rounded-xl bg-amber-50 text-amber-600 shadow-sm">
                <Percent className="w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-5 xl:h-5" />
              </div>
              <div>
                <div className="text-[0.65rem] lg:text-[0.55rem] xl:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5 xl:mb-1.5">Doluluk</div>
                <div className="text-base lg:text-xs xl:text-lg font-black text-[#1e293b]">{stats.occupancy}%</div>
              </div>
            </div>

            {/* Gelir */}
            <div className="flex items-center gap-2 lg:gap-1.5 xl:gap-3.5 px-3 lg:px-2 xl:px-4 py-2 lg:py-1 xl:py-2 rounded-xl lg:rounded-lg xl:rounded-2xl border border-slate-100 shadow-sm bg-slate-50/20">
              <div className="w-8 h-8 lg:w-7 lg:h-7 xl:w-10 xl:h-10 flex items-center justify-center rounded-lg lg:rounded-md xl:rounded-xl bg-[#0a3d3408] text-[#0a3d34] shadow-sm">
                <Banknote className="w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-5 xl:h-5" />
              </div>
              <div>
                <div className="text-[0.65rem] lg:text-[0.55rem] xl:text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider leading-none mb-0.5 xl:mb-1.5">Gelir</div>
                <div className="text-base lg:text-xs xl:text-lg font-black text-[#1e293b]">
                  {stats.income.toLocaleString('tr-TR')} <span className="text-[0.75rem] lg:text-[0.55rem] xl:text-sm font-bold text-slate-400">TL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: New Appointment Button */}
        <div className="flex items-center w-full lg:w-auto shrink-0">
          <Button 
            id="tour-add-appointment"
            onClick={() => onNewAppointment(format(new Date(), "yyyy-MM-dd"), "09:00")}
            className="w-full lg:w-auto bg-[#0a3d34] hover:bg-[#072b25] text-white p-4 lg:p-[10px_20px] xl:p-[14px_32px] rounded-xl font-bold text-[0.9rem] lg:text-[0.8rem] xl:text-[1rem] uppercase tracking-[0.05em] shadow-[0_6px_20px_-4px_rgba(10,61,52,0.4)] transition-all hover:-translate-y-[2px] active:scale-95 h-auto"
          >
            <Plus className="w-5 h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 mr-2 lg:mr-1.5 xl:mr-2" />
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
