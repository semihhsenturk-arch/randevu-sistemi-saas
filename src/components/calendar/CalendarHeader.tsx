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
    <div className="space-y-4 mb-3">
      <header className="flex justify-between items-center bg-white/88 backdrop-blur-[20px] p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] sticky top-3 z-[40]">
        <div className="flex flex-col gap-[2px]">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">
            {(clinicName || "Klinik").toUpperCase()}
          </div>
          <h1 className="text-[1.25rem] font-extrabold text-[#1e293b]">Randevu Sistemi</h1>
          <div className="text-[0.78rem] font-medium text-[#64748b]">
            {format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <div className="flex gap-3">
            {/* Günlük Randevu */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.65rem] font-bold text-slate-500 uppercase leading-none mb-1">Bugün</div>
                <div className="text-sm font-extrabold text-[#1e293b]">{stats.todayCount}</div>
              </div>
            </div>
            
            {/* Haftalık Randevu */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CalendarRange className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.65rem] font-bold text-slate-500 uppercase leading-none mb-1">Hafta</div>
                <div className="text-sm font-extrabold text-[#1e293b]">{stats.weekCount}</div>
              </div>
            </div>

            {/* Doluluk */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.65rem] font-bold text-slate-500 uppercase leading-none mb-1">Doluluk</div>
                <div className="text-sm font-extrabold text-[#1e293b]">{stats.occupancy}%</div>
              </div>
            </div>

            {/* Gelir */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-[#0a3d3420] hover:bg-[#0a3d3405] transition-all group">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0a3d3408] text-[#0a3d34]">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.65rem] font-bold text-slate-500 uppercase leading-none mb-1">Gelir</div>
                <div className="text-sm font-extrabold text-[#1e293b]">{stats.income} TL</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={() => onNewAppointment(format(new Date(), "yyyy-MM-dd"), "09:00")}
            className="bg-[#0a3d34] hover:bg-[#072b25] text-white p-[10px_24px] rounded-lg font-bold text-[0.82rem] uppercase tracking-[0.04em] shadow-[0_4px_14px_-3px_rgba(10,61,52,0.3)] transition-all hover:-translate-y-[2px]"
          >
            <Plus className="w-4 h-4 mr-2" />
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
