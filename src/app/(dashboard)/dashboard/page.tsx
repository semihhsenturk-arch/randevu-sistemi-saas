"use client";

import { useState, useEffect, useMemo } from "react";
import { useDatabase, Appointment } from "@/hooks/use-database";
import { CalendarCheck, Banknote, Star, TrendingUp } from "lucide-react";
import { format, startOfMonth, parseISO, isValid } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { useAuth } from "@/hooks/use-auth";
import { FlatPicker } from "@/components/ui/flat-picker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Cell as PieCell } from "recharts";

const HIZMETLER = [
  { id: 1, ad: 'Klinik Muayene', fiyat: 600, renk: '#0a3d34' },
  { id: 2, ad: 'Dermoskopi', fiyat: 450, renk: '#14b8a6' },
  { id: 3, ad: 'Botoks Uygulaması', fiyat: 2500, renk: '#0d9488' },
  { id: 4, ad: 'Lazer Tedavisi', fiyat: 1800, renk: '#ef4444' },
  { id: 5, ad: 'Cilt Bakımı', fiyat: 1200, renk: '#f59e0b' }
];

export default function DashboardAnalyticsPage() {
  const { profile } = useAuth();
  const { getAppointments } = useDatabase();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    const data = await getAppointments();
    setAppointments(data);
  };

  const filtered = useMemo(() => {
    return appointments.filter(a => a.durum === 'onaylandi' && a.tarih >= startDate && a.tarih <= endDate);
  }, [appointments, startDate, endDate]);

  const { totalApt, totalRevenue, topSvc, avgRevenue, barData, pieData, occupancyRate } = useMemo(() => {
    const totalApt = filtered.length;
    let totalRevenue = 0;
    const counts: Record<string, number> = {};

    filtered.forEach(a => {
        const svc = HIZMETLER.find(h => h.id.toString() === a.hizmetId.toString());
        if (svc) {
           totalRevenue += svc.fiyat;
           counts[svc.ad] = (counts[svc.ad] || 0) + 1;
        }
    });

    let topSvc = "-";
    let maxCount = 0;
    for (const [name, count] of Object.entries(counts)) {
        if (count > maxCount) { maxCount = count; topSvc = name; }
    }

    const avgRevenue = totalApt > 0 ? Math.round(totalRevenue / totalApt) : 0;

    const barData = HIZMETLER.map(h => {
        const rev = filtered.filter(a => a.hizmetId.toString() === h.id.toString()).reduce((s, a) => s + h.fiyat, 0);
        const qty = counts[h.ad] || 0;
        return { name: h.ad, revenue: rev, quantity: qty, color: h.renk };
    });

    const pieData = barData.filter(b => b.revenue > 0);

    const sd = new Date(startDate);
    const ed = new Date(endDate);
    const diffDays = Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalCapacity = diffDays * 16;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalApt / totalCapacity) * 100) : 0;

    return { totalApt, totalRevenue, topSvc, avgRevenue, barData, pieData, occupancyRate };
  }, [filtered, startDate, endDate]);

  const varColor = (val: number) => {
    if (val > 80) return '#0d9488';
    if (val > 40) return '#f59e0b';
    return '#ef4444';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border-none text-white text-[0.8rem] px-3 py-2 rounded-lg font-bold">
          <p>{label}</p>
          <p className="text-emerald-400">{payload[0].payload.quantity} Adet | {payload[0].value.toLocaleString('tr-TR')} TL</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col">
      <header className="flex justify-between items-center bg-white/88 backdrop-blur-[20px] p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] sticky top-3 z-[40] mb-6">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">{(profile?.clinic_name || "Klinik").toUpperCase()}</span>
          <h1 className="text-[1.25rem] font-extrabold text-[#1e293b]">Klinik Analiz Paneli</h1>
          <div className="text-[0.78rem] font-medium text-[#64748b]">
            {format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}
          </div>
        </div>
      </header>

      {/* Modern Filters matched exactly to dashboard.html */}
      <div className="bg-white/50 backdrop-blur-sm px-6 py-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-8 justify-center items-center shadow-sm border border-dashed border-slate-200">
        <div className="flex flex-col items-center gap-2 min-w-[220px]">
           <label className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-500">Başlangıç Tarihi</label>
           <FlatPicker 
             value={startDate} 
             onChange={(val) => setStartDate(val)}
             placeholder="Başlangıç Seçin"
           />
        </div>
        <div className="flex flex-col items-center gap-2 min-w-[220px]">
           <label className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-slate-500">Bitiş Tarihi</label>
           <FlatPicker 
             value={endDate} 
             onChange={(val) => setEndDate(val)}
             placeholder="Bitiş Seçin"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white p-[18px_20px] rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 bg-[#eff6ff] text-[#3b82f6]"><CalendarCheck className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Toplam Hizmet</div>
            <div className="text-[1.4rem] font-extrabold text-slate-900 leading-tight">{totalApt}</div>
          </div>
        </div>
        <div className="bg-white p-[18px_20px] rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 bg-[#f0fdf4] text-[#059669]"><Banknote className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Toplam Gelir</div>
            <div className="text-[1.4rem] font-extrabold text-slate-900 leading-tight">{totalRevenue.toLocaleString('tr-TR')} TL</div>
          </div>
        </div>
        <div className="bg-white p-[18px_20px] rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 bg-[#fffbeb] text-[#d97706]"><Star className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wide mb-0.5">En Çok Tercih Edilen</div>
            <div className="text-[1.1rem] min-h-[1.6rem] flex items-center font-extrabold text-slate-900 leading-tight line-clamp-1 truncate block">{topSvc}</div>
          </div>
        </div>
        <div className="bg-white p-[18px_20px] rounded-xl border border-slate-200 flex items-center gap-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 bg-[#f5f3ff] text-[#8b5cf6]"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <div className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Ortalama Gelir</div>
            <div className="text-[1.4rem] font-extrabold text-slate-900 leading-tight">{avgRevenue.toLocaleString('tr-TR')} TL</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-[0.95rem] font-extrabold mb-4 pb-2 border-b border-slate-100 flex justify-between items-center text-slate-900">
             Hizmet Tipleri Dağılımı
           </div>
           <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                 <XAxis type="number" tickFormatter={(val) => val.toLocaleString('tr-TR') + ' TL'} stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                 <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                 <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={24}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <div className="text-[0.95rem] font-extrabold mb-4 pb-2 border-b border-slate-100 flex justify-between items-center text-slate-900">
             Gelir Paylaşımı
           </div>
           <div className="flex-1 h-[350px] w-full flex flex-col items-center justify-center relative">
              {pieData.length === 0 ? <div className="text-slate-400 italic text-sm font-semibold">Veri Yok</div> : (
                <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="revenue" stroke="none">
                       {pieData.map((entry, index) => (
                         <PieCell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => value.toLocaleString('tr-TR') + ' TL'} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full px-2 flex flex-wrap justify-center gap-x-4 gap-y-2 mt-auto">
                    {pieData.map((entry, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: entry.color}}></div>
                            <span className="text-[0.65rem] font-bold text-slate-600">{entry.name}</span>
                        </div>
                    ))}
                </div>
                </>
              )}
           </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center mb-10 w-full lg:w-[600px] mx-auto">
         <div className="text-[0.95rem] font-extrabold text-slate-900 mb-2">Genel Doluluk Oranı</div>
         <p className="text-[0.9rem] text-slate-500 font-medium mb-6">Seçilen tarih aralığındaki toplam klinik kapasite kullanımı</p>
         <div className="relative h-[250px] w-full max-w-[400px] mx-auto flex items-end justify-center overflow-hidden">
            <ResponsiveContainer width="100%" height="200%">
               <PieChart>
                 <Pie 
                    data={[{value: occupancyRate}, {value: 100 - occupancyRate}]} 
                    cx="50%" cy="50%" 
                    startAngle={180} endAngle={0} 
                    innerRadius={110} outerRadius={140} 
                    dataKey="value" stroke="none"
                    cornerRadius={10}
                 >
                    <Cell fill={varColor(occupancyRate)} />
                    <Cell fill="#f1f5f9" />
                 </Pie>
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 text-[3rem] font-extrabold" style={{color: varColor(occupancyRate)}}>
               {occupancyRate}%
            </div>
         </div>
      </div>
    </div>
  );
}
