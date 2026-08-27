"use client";

import { useState, useEffect, useMemo } from "react";
import { useDatabase, Appointment, Service, getCacheSync, CACHE_KEYS } from "@/hooks/use-database";
import { CalendarCheck, Banknote, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, startOfMonth, subDays, startOfWeek, endOfWeek, getWeek } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { useAuth } from "@/hooks/use-auth";
import { FlatPicker } from "@/components/ui/flat-picker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Cell as PieCell, AreaChart, Area } from "recharts";
import { UpgradeScreen } from "@/components/UpgradeScreen";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionReceiptModal } from "@/components/TransactionReceiptModal";

/* ── Circular Progress Ring ── */
function CircularProgress({ value, size = 56, stroke = 5, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center"
        fill={color} fontSize={size * 0.24} fontWeight={800}>{value}%</text>
    </svg>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 text-white text-[0.78rem] px-3.5 py-2.5 rounded-xl font-semibold shadow-xl border border-white/10">
        <p className="font-bold mb-0.5">{label}</p>
        <p className="text-emerald-400">{payload[0].payload.quantity} Adet · {payload[0].value.toLocaleString('tr-TR')} TL</p>
      </div>
    );
  }
  return null;
};

interface ChangeBadgeProps {
  val: number;
}

const ChangeBadge = ({ val }: ChangeBadgeProps) => {
  if (val === 0) return null;
  const up = val > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {up ? '+' : ''}{val}%
    </span>
  );
};

export default function DashboardAnalyticsPage() {
  const { profile, isLoading, checkAccess } = useAuth();
  const { getAppointments, getServices, getPatientProfiles, getInventory } = useDatabase();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [patientProfiles, setPatientProfiles] = useState<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [inventory, setInventory] = useState<any>({ stock: {}, items: [] });
  
  const isLocked = !checkAccess("advanced");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [appliedStartDate, setAppliedStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [appliedEndDate, setAppliedEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isMounted, setIsMounted] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<{ date: string; txNo: string; treatments: any[] } | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>("");
  const [selectedStockHistory, setSelectedStockHistory] = useState<any[]>([]);

  const handleOpenReceipt = (tx: any, profile: any) => {
    if (!tx || !profile) return;
    const [yyyy, mm, dd] = tx.date.split('-');
    const targetDateStr = `${dd}.${mm}.${yyyy}`;
    const treatments = profile.face_treatments?.filter((t: any) => t.date.split(' ')[0] === targetDateStr) || [];
    setSelectedReceipt({
      date: targetDateStr,
      txNo: tx.txNo,
      treatments
    });
    setSelectedPatientName(tx.patientName);
    setSelectedStockHistory(profile.stock_history || []);
  };

  const weekOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = subDays(today, i * 7);
      const start = startOfWeek(d, { weekStartsOn: 1 });
      const end = endOfWeek(d, { weekStartsOn: 1 });
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");
      
      const weekNum = getWeek(start, { weekStartsOn: 1 });
      const label = `${weekNum}. Hafta (${format(start, "d MMM", { locale: tr })} - ${format(end, "d MMM", { locale: tr })})`;
      
      options.push({
        value: `${startStr}_${endStr}`,
        label,
      });
    }
    return options;
  }, []);

  const selectedWeek = useMemo(() => {
    const currentRange = `${startDate}_${endDate}`;
    const found = weekOptions.find((o) => o.value === currentRange);
    return found ? currentRange : "custom";
  }, [startDate, endDate, weekOptions]);

  const loadData = async () => {
    const [data, svcs, profiles, inv] = await Promise.all([getAppointments(), getServices(), getPatientProfiles(), getInventory()]);
    setAppointments(data);
    if (svcs) setServices(svcs);
    if (profiles) setPatientProfiles(profiles);
    if (inv) setInventory(inv);
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedStart = localStorage.getItem("dashboard_startDate");
    const savedEnd = localStorage.getItem("dashboard_endDate");
    if (savedStart) { setStartDate(savedStart); setAppliedStartDate(savedStart); }
    if (savedEnd) { setEndDate(savedEnd); setAppliedEndDate(savedEnd); }
    setIsMounted(true);
    const cachedApts = getCacheSync<Appointment[]>(CACHE_KEYS.APPOINTMENTS);
    if (cachedApts) setAppointments(cachedApts);
    const cachedSvcs = getCacheSync<Service[]>(CACHE_KEYS.SERVICES);
    if (cachedSvcs) setServices(cachedSvcs);
    const cachedProfiles = getCacheSync<any>(CACHE_KEYS.PROFILES);
    if (cachedProfiles) setPatientProfiles(cachedProfiles);
    const cachedInv = getCacheSync<any>(CACHE_KEYS.INVENTORY);
    if (cachedInv) setInventory(cachedInv);

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("dashboard_startDate", appliedStartDate);
      localStorage.setItem("dashboard_endDate", appliedEndDate);
    }
  }, [appliedStartDate, appliedEndDate, isMounted]);

  const handleWeekChange = (val: string) => {
    if (val && val !== "custom") {
      const [start, end] = val.split("_");
      setStartDate(start);
      setEndDate(end);
      setAppliedStartDate(start);
      setAppliedEndDate(end);
    }
  };

  const handleUpdate = () => { setAppliedStartDate(startDate); setAppliedEndDate(endDate); };

  const filtered = useMemo(() => {
    return appointments.filter(a => a.durum === 'onaylandi' && a.tarih >= appliedStartDate && a.tarih <= appliedEndDate);
  }, [appointments, appliedStartDate, appliedEndDate]);

  /* ── Previous period for comparison ── */
  const prevFiltered = useMemo(() => {
    const sd = new Date(appliedStartDate);
    const ed = new Date(appliedEndDate);
    const diff = ed.getTime() - sd.getTime();
    const prevEnd = format(subDays(sd, 1), "yyyy-MM-dd");
    const prevStart = format(new Date(sd.getTime() - diff - 86400000), "yyyy-MM-dd");
    return appointments.filter(a => a.durum === 'onaylandi' && a.tarih >= prevStart && a.tarih <= prevEnd);
  }, [appointments, appliedStartDate, appliedEndDate]);

  const analytics = useMemo(() => {
    const totalApt = filtered.length;
    const prevTotalApt = prevFiltered.length;
    let totalRevenue = 0, prevTotalRevenue = 0;
    const counts: Record<string, number> = {};
    
    // Calculate transactions list
    const transactions: any[] = [];

    filtered.forEach(a => {
      const svc = services.find(h => h.id.toString() === a.hizmetId.toString());
      const revenue = svc ? svc.fiyat : 0;
      
      if (svc) { totalRevenue += svc.fiyat; counts[svc.ad] = (counts[svc.ad] || 0) + 1; }

      const profile = patientProfiles[a.musteriAdi.toLocaleUpperCase("tr-TR")] || patientProfiles[a.musteriAdi];
      let txNo = "-";
      let materialCost = 0;

      if (profile) {
        const [yyyy, mm, dd] = a.tarih.split('-');
        const targetDateStr = `${dd}.${mm}.${yyyy}`;
        
        const treatments = profile.face_treatments?.filter((t: any) => t.date.split(' ')[0] === targetDateStr) || [];
        if (treatments.length > 0 && treatments[0].transactionNo) {
          txNo = treatments[0].transactionNo;
        } else if (treatments.length > 0) {
          txNo = "Kayıtlı İşlem"; // Fallback if no specific ISL number yet
        }

        const stockHistory = profile.stock_history || [];
        let relevantStocks = stockHistory.filter((h: any) => h.date.split(' ')[0] === targetDateStr);
        
        if (relevantStocks.length === 0) {
           relevantStocks = stockHistory.filter((h: any) => h.treatment_date && h.treatment_date.split(' ')[0] === targetDateStr);
        }
        
        if (relevantStocks.length === 0) {
           const today = new Date();
           const todayStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
           relevantStocks = stockHistory.filter((h: any) => h.date.includes(todayStr));
        }
        
        if (relevantStocks.length === 0 && stockHistory.length > 0) {
           relevantStocks = stockHistory;
        }
        
        relevantStocks.forEach((stock: any) => {
           stock.text.split(", ").forEach((itemStr: string) => {
              const cleanItemStr = itemStr
                .replace(/\s*\(Toplam Maliyet:.*?\)/g, "")
                .replace(/\s*\(Maliyet:.*?\)/g, "")
                .replace(/\s*\[Toplam Maliyet:.*?\]/g, "")
                .replace(/\s*\[Maliyet:.*?\]/g, "")
                .trim();
              const parts = cleanItemStr.split(" ");
              const amountStr = parts[0];
              const amount = parseFloat(amountStr) || 0;
              const itemName = parts.slice(2).join(" ");
              
              const invItem = inventory?.items?.find((i: any) => i.ad === itemName);
              const unitPrice = invItem?.fiyat || 0;
              materialCost += (unitPrice * amount);
           });
        });
      }

      const profit = revenue - materialCost;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      transactions.push({
        id: a.id,
        patientName: a.musteriAdi,
        date: a.tarih,
        txNo,
        serviceName: svc?.ad || "Bilinmiyor",
        revenue,
        materialCost,
        profit,
        margin
      });
    });

    transactions.sort((a, b) => b.date.localeCompare(a.date) || b.revenue - a.revenue);

    prevFiltered.forEach(a => {
      const svc = services.find(h => h.id.toString() === a.hizmetId.toString());
      if (svc) prevTotalRevenue += svc.fiyat;
    });

    let topSvc = "-"; let maxCount = 0;
    for (const [name, count] of Object.entries(counts)) { if (count > maxCount) { maxCount = count; topSvc = name; } }

    const avgRevenue = totalApt > 0 ? Math.round(totalRevenue / totalApt) : 0;
    const prevAvgRevenue = prevTotalApt > 0 ? Math.round(prevTotalRevenue / prevTotalApt) : 0;

    const aptChange = prevTotalApt > 0 ? Math.round(((totalApt - prevTotalApt) / prevTotalApt) * 100) : 0;
    const revChange = prevTotalRevenue > 0 ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100) : 0;
    const avgChange = prevAvgRevenue > 0 ? Math.round(((avgRevenue - prevAvgRevenue) / prevAvgRevenue) * 100) : 0;

    const barData = services.map(h => {
      const qty = counts[h.ad] || 0;
      const rev = filtered.filter(a => a.hizmetId.toString() === h.id.toString()).reduce((s) => s + (h.fiyat || 0), 0);
      return { name: h.ad, revenue: rev, quantity: qty, color: h.renk || '#0a3d34' };
    }).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const pieData = barData.filter(b => b.revenue > 0);

    const sd = new Date(appliedStartDate); const ed = new Date(appliedEndDate);
    let workingDays = 0;
    const tempDate = new Date(sd);
    tempDate.setHours(12, 0, 0, 0);
    const tempEnd = new Date(ed);
    tempEnd.setHours(12, 0, 0, 0);
    while (tempDate <= tempEnd) {
      if (tempDate.getDay() !== 0) { // 0 is Sunday
        workingDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    const totalCapacity = workingDays * 16;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalApt / totalCapacity) * 100) : 0;

    /* trend data */
    let trendData: { date: string; count: number }[] = [];
    try {
      const current = new Date(sd.getTime());
      current.setHours(12, 0, 0, 0);
      const end = new Date(ed.getTime());
      end.setHours(12, 0, 0, 0);
      while (current <= end) {
        if (current.getDay() !== 0) { // 0 is Sunday
          const formattedDate = format(current, "yyyy-MM-dd");
          const cnt = filtered.filter(a => a.tarih === formattedDate).length;
          trendData.push({
            date: format(current, "d MMM", { locale: tr }),
            count: cnt
          });
        }
        current.setDate(current.getDate() + 1);
      }
    } catch { trendData = []; }

    /* performance table */
    const perfTable = services.map(h => {
      const qty = counts[h.ad] || 0;
      const rev = qty * h.fiyat;
      const pct = totalApt > 0 ? Math.round((qty / totalApt) * 100) : 0;
      return { name: h.ad, qty, rev, pct, color: h.renk || '#0a3d34' };
    }).filter(r => r.qty > 0).sort((a, b) => b.rev - a.rev);

    return { totalApt, totalRevenue, topSvc, avgRevenue, barData, pieData, occupancyRate, aptChange, revChange, avgChange, trendData, perfTable, transactions };
  }, [filtered, prevFiltered, services, patientProfiles, inventory, appliedStartDate, appliedEndDate]);

  const varColor = (v: number) => v > 80 ? '#0d9488' : v > 40 ? '#f59e0b' : '#ef4444';

  if (isLoading || !isMounted) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>);
  }
  if (isLocked) {
    return (<UpgradeScreen title="Verilerinizle Geleceği Planlayın 📈" description="Gelir dağılımları, doktor doluluk oranları ve en çok tercih edilen hizmetleri analiz ederek kliniğinizi büyütün." requiredPlan="Advanced" />);
  }

  return (
    <div className="flex flex-col gap-2 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-white/88 backdrop-blur-[20px] p-4 md:p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] sticky top-20 lg:top-3 z-[40] mb-4 gap-4">
        <div className="flex flex-col gap-[2px] text-center md:text-left w-full md:w-auto">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">{(profile?.clinic_name || "Klinik").toUpperCase()}</span>
          <h1 className="text-[1.25rem] font-extrabold text-[#1e293b]">Analiz Paneli</h1>
          <div className="text-[0.78rem] font-medium text-[#64748b]">{format(new Date(), "d MMMM yyyy, eeee", { locale: tr })}</div>
        </div>
      </header>

      {/* ── DATE FILTER ── */}
      <div className="bg-white/50 backdrop-blur-sm px-4 md:px-6 py-4 rounded-2xl mb-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6 shadow-sm border border-slate-200/60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 items-end">
          {/* Hafta Seçimi (Far Left) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6rem] font-black uppercase tracking-[0.1em] text-[#0a3d34] ml-1">HAFTA SEÇİMİ</label>
            <Select value={selectedWeek} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-full h-11 px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-[0.9rem] text-slate-900 bg-white hover:bg-emerald-50 focus:border-[#0a3d34] focus:ring-3 focus:ring-[#0a3d34]/10 transition-all shadow-none">
                <SelectValue placeholder="Hafta seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom" className="font-semibold text-slate-400">Özel Aralık</SelectItem>
                {weekOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-semibold text-slate-700">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Başlangıç Tarihi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-500 ml-1">BAŞLANGIÇ</label>
            <FlatPicker value={startDate} onChange={(val) => setStartDate(val)} className="w-full" />
          </div>

          {/* Bitiş Tarihi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-500 ml-1">BİTİŞ</label>
            <FlatPicker value={endDate} onChange={(val) => setEndDate(val)} className="w-full" />
          </div>
        </div>
        <button onClick={handleUpdate} className="bg-[#0a3d34] text-white h-11 px-8 rounded-xl text-sm font-bold shadow-md hover:bg-[#0a3d34]/90 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md flex items-center justify-center lg:mt-5 shrink-0">
          Güncelle
        </button>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Toplam Randevu */}
        <div className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform"><CalendarCheck className="w-5 h-5" /></div>
            <ChangeBadge val={analytics.aptChange} />
          </div>
          <div className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Toplam Randevu</div>
          <div className="text-[1.75rem] font-extrabold text-slate-900 leading-none">{analytics.totalApt}</div>
          <div className="text-[0.65rem] text-slate-400 mt-1.5 font-medium">Önceki dönem: {prevFiltered.length}</div>
        </div>

        {/* Toplam Gelir */}
        <div className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform"><Banknote className="w-5 h-5" /></div>
            <ChangeBadge val={analytics.revChange} />
          </div>
          <div className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Toplam Gelir</div>
          <div className="text-[1.75rem] font-extrabold text-slate-900 leading-none">{analytics.totalRevenue.toLocaleString('tr-TR')} <span className="text-base font-bold text-slate-400">TL</span></div>
        </div>

        {/* Ortalama Gelir */}
        <div className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-violet-500 group-hover:scale-110 transition-transform"><TrendingUp className="w-5 h-5" /></div>
            <ChangeBadge val={analytics.avgChange} />
          </div>
          <div className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Ortalama Gelir</div>
          <div className="text-[1.75rem] font-extrabold text-slate-900 leading-none">{analytics.avgRevenue.toLocaleString('tr-TR')} <span className="text-base font-bold text-slate-400">TL</span></div>
        </div>

        {/* Doluluk Oranı */}
        <div className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4">
            <CircularProgress value={analytics.occupancyRate} size={64} stroke={6} color={varColor(analytics.occupancyRate)} />
            <div>
              <div className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Doluluk Oranı</div>
              <div className="text-[1.5rem] font-extrabold leading-none" style={{ color: varColor(analytics.occupancyRate) }}>{analytics.occupancyRate}%</div>
              <div className="text-[0.6rem] text-slate-400 mt-1 font-medium">Kapasite kullanımı</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[0.95rem] font-extrabold mb-1 text-slate-900">Hizmet Bazlı Gelir Dağılımı</div>
          <p className="text-[0.75rem] text-slate-400 font-medium mb-5">Seçili tarih aralığında hizmet gelirleri</p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.barData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(v) => v.toLocaleString('tr-TR') + ' TL'} stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenue" radius={[0, 10, 10, 0]} barSize={22}>
                  {analytics.barData.map((entry, i) => (<Cell key={i} fill={entry.color} fillOpacity={0.85} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="text-[0.95rem] font-extrabold mb-1 text-slate-900">Gelir Paylaşımı</div>
          <p className="text-[0.75rem] text-slate-400 font-medium mb-3">Hizmet bazlı gelir oranları</p>
          <div className="flex-1 min-h-[280px] w-full flex flex-col items-center justify-center">
            {analytics.pieData.length === 0 ? <div className="text-slate-400 italic text-sm font-semibold">Veri Yok</div> : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={analytics.pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="revenue" stroke="none">
                      {analytics.pieData.map((entry, i) => (<PieCell key={i} fill={entry.color} />))}
                    </Pie>
                    <Tooltip formatter={(v: any) => typeof v === 'number' ? v.toLocaleString('tr-TR') + ' TL' : v} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full px-2 flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                  {analytics.pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[0.65rem] font-bold text-slate-600">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: TREND + TABLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Trend Grafiği */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[0.95rem] font-extrabold mb-1 text-slate-900">Trend Grafiği</div>
          <p className="text-[0.75rem] text-slate-400 font-medium mb-5">Günlük randevu yoğunluğu (Pazar hariç)</p>
          <div className="h-[260px] w-full">
            {analytics.trendData.length === 0 ? <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">Yeterli veri yok</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600 }} formatter={(v: any) => [String(v) + ' randevu', 'Sayı']} />
                  <Area type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ fill: '#0d9488', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Performance Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-[0.95rem] font-extrabold mb-1 text-slate-900">Hizmet Performans Tablosu</div>
          <p className="text-[0.75rem] text-slate-400 font-medium mb-4">Hizmet bazlı detaylı analiz</p>
          {analytics.perfTable.length === 0 ? <div className="flex items-center justify-center h-[200px] text-slate-400 italic text-sm">Veri Yok</div> : (
            <div className="overflow-x-auto custom-scrollbar-auto">
              <div className="min-w-[500px] w-full">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-2.5 pr-3">Hizmet</th>
                    <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-2.5 px-3 text-center">Randevu</th>
                    <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-2.5 px-3 text-right">Gelir</th>
                    <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-2.5 pl-3 w-[120px]">Oran</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.perfTable.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/50' : ''} hover:bg-slate-50 transition-colors`}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                          <span className="text-[0.8rem] font-semibold text-slate-800 truncate max-w-[140px]">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-[0.8rem] font-bold text-slate-700">{row.qty}</td>
                      <td className="py-3 px-3 text-right text-[0.8rem] font-bold text-slate-700">{row.rev.toLocaleString('tr-TR')} TL</td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                          </div>
                          <span className="text-[0.65rem] font-bold text-slate-500 w-8 text-right">{row.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TRANSACTIONS (İŞLEM FİŞLERİ) ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-8">
        <div className="text-[0.95rem] font-extrabold mb-1 text-slate-900">İşlem Fişi & Kârlılık Özeti</div>
        <p className="text-[0.75rem] text-slate-400 font-medium mb-4">Seçili tarih aralığındaki işlemler, liste fiyatları, stok maliyetleri ve kâr marjı analizi</p>
        
        {analytics.transactions.length === 0 ? (
           <div className="flex items-center justify-center h-[120px] text-slate-400 italic text-sm">Veri Yok</div>
        ) : (
           <div className="overflow-x-auto custom-scrollbar-auto">
             <div className="min-w-[800px] w-full">
               <table className="w-full text-left">
                 <thead>
                   <tr className="border-b border-slate-100">
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 pr-3">Tarih</th>
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 px-3">İşlem No</th>
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 px-3">Hasta Adı</th>
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 px-3">Hizmet</th>
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 px-3 text-right">Liste Fiyatı</th>
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 px-3 text-right">Gider (Maliyet)</th>
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 px-3 text-right">Net Kâr</th>
                     <th className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider py-3 pl-3 text-right">Kâr Marjı</th>
                   </tr>
                 </thead>
                 <tbody>
                   {analytics.transactions.map((tx: any, i: number) => (
                     <tr key={i} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/50' : ''} hover:bg-slate-50 transition-colors`}>
                       <td className="py-3 pr-3 text-[0.8rem] font-bold text-slate-700 whitespace-nowrap">
                         {format(new Date(tx.date), "dd.MM.yyyy")}
                       </td>
                       <td className="py-3 px-3">
                         {tx.txNo !== "-" ? (
                           <button 
                             onClick={() => handleOpenReceipt(tx, patientProfiles[tx.patientName.toLocaleUpperCase("tr-TR")] || patientProfiles[tx.patientName])}
                             className="text-[0.7rem] font-mono font-black text-[#0a3d34] bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                           >
                             {tx.txNo}
                           </button>
                         ) : (
                           <span className="text-[0.7rem] font-bold text-slate-400">—</span>
                         )}
                       </td>
                       <td className="py-3 px-3 text-[0.8rem] font-bold text-slate-800">{tx.patientName}</td>
                       <td className="py-3 px-3 text-[0.75rem] font-semibold text-slate-600">{tx.serviceName}</td>
                       <td className="py-3 px-3 text-right text-[0.8rem] font-black text-slate-900">{tx.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</td>
                       <td className="py-3 px-3 text-right text-[0.8rem] font-black text-red-600">{tx.materialCost > 0 ? `-${tx.materialCost.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ₺` : '0 ₺'}</td>
                       <td className="py-3 px-3 text-right text-[0.8rem] font-black text-emerald-600">{tx.profit.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ₺</td>
                       <td className="py-3 pl-3 text-right">
                         <div className={`inline-flex items-center justify-end min-w-[3rem] text-[0.7rem] font-bold px-1.5 py-0.5 rounded-md ${tx.margin >= 50 ? 'bg-emerald-100 text-emerald-700' : tx.margin > 0 ? 'bg-amber-100 text-amber-700' : tx.margin === 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                           %{tx.margin}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}
      </div>

      {selectedReceipt && (
        <TransactionReceiptModal 
          receiptDateGroup={selectedReceipt} 
          patientName={selectedPatientName} 
          stockHistory={selectedStockHistory}
          onClose={() => setSelectedReceipt(null)} 
        />
      )}
    </div>
  );
}
