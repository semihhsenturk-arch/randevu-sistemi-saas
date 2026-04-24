"use client";

import { useState, useEffect } from "react";
import { useDatabase, Service, getCacheSync, CACHE_KEYS } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Layers, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const PREDEFINED_COLORS = [
  { label: "Mavi", value: "#3b82f6" },
  { label: "Kırmızı", value: "#ef4444" },
  { label: "Zümrüt", value: "#10b981" },
  { label: "Turuncu", value: "#f97316" },
  { label: "Mor", value: "#8b5cf6" },
  { label: "Turkuaz", value: "#14b8a6" },
  { label: "Pembe", value: "#ec4899" },
  { label: "Koyu Yeşil", value: "#0a3d34" },
];

export default function HizmetYonetimiPage() {
  const { profile, isLoading } = useAuth();
  const { getServices, saveService, deleteService } = useDatabase();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<{ ad: string; sure: number | string; fiyat: number | string; renk: string }>({ ad: "", sure: 30, fiyat: "", renk: "#3b82f6" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cached = getCacheSync<Service[]>(CACHE_KEYS.SERVICES);
    if (cached && cached.length > 0) {
      setServices(cached);
    } else {
      setLoading(true);
    }
    loadServices();
  }, [getServices]);

  const loadServices = async () => {
    try {
      const data = await getServices();
      if (data) {
        setServices(data);
      }
    } catch (e) {
      console.error("Hizmetler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingId(service.id);
      setFormData({
        ad: service.ad,
        sure: service.sure,
        fiyat: service.fiyat,
        renk: service.renk || "#3b82f6",
      });
    } else {
      setEditingId(null);
      setFormData({ ad: "", sure: "", fiyat: "", renk: "#3b82f6" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ad.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: any = { 
        ...formData,
        sure: Number(formData.sure) || 0,
        fiyat: Number(formData.fiyat) || 0
      };
      if (editingId) {
        payload.id = editingId;
      } else {
        payload.id = "temp_" + Date.now();
      }

      await saveService(payload);
      await loadServices();
      setIsModalOpen(false);
    } catch (e: any) {
      console.error("Hizmet kaydedilirken hata:", e);
      alert("Hizmet kaydedilemedi: " + (e?.message || "Bilinmeyen hata"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (confirm("Bu hizmeti silmek istediğinize emin misiniz? (Geçmiş randevulardaki hizmet adı etkilenmeyebilir ancak yeni randevularda kullanılamaz.)")) {
      try {
        await deleteService(id);
        await loadServices();
      } catch (e) {
        console.error("Silme hatası:", e);
        alert("Hizmet silinirken bir hata oluştu.");
      }
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-center bg-white/88 backdrop-blur-[20px] p-[14px_24px] rounded-[20px] border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] sticky top-3 z-[40]">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0a3d34] opacity-80 mb-[1px]">
            {(profile?.clinic_name || "Klinik").toUpperCase()}
          </span>
          <h1 className="text-[1.25rem] font-extrabold text-[#1e293b]">Hizmet Yönetimi</h1>
          <div className="text-[0.78rem] font-medium text-[#64748b]">
            Kliniğinize ait tedavi ve hizmet türlerini düzenleyin.
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4 w-full md:w-auto">
          <Button className="bg-[#0a3d34] hover:bg-[#072b25] shadow-md shadow-[#0a3d34]/20 font-bold" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Ekle
          </Button>
        </div>
      </header>

      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden relative">
        <Table>
          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:bg-transparent">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[0.72rem] py-4">Renk</TableHead>
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[0.72rem] py-4">Hizmet Adı</TableHead>
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[0.72rem] py-4">Süre (Dk)</TableHead>
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[0.72rem] py-4">Fiyat (₺)</TableHead>
              <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[0.72rem] py-4 text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Yükleniyor...</TableCell></TableRow>
            ) : services.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Henüz bir hizmet tanımlanmadı.</TableCell></TableRow>
            ) : (
              services.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="py-4">
                    <div className="w-4 h-4 rounded-full ring-2 ring-slate-100" style={{ backgroundColor: s.renk || "#3b82f6" }}></div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-extrabold text-[#111827]">{s.ad}</span>
                  </TableCell>
                  <TableCell className="py-4 font-medium text-slate-600">{s.sure} dk</TableCell>
                  <TableCell className="py-4 font-bold text-[#0a3d34]">{s.fiyat} ₺</TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleOpenModal(s)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#111827]">
              {editingId ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Bu hizmet takvimde ve hasta listesinde seçilebilir olacaktır.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[0.7rem] font-extrabold uppercase text-slate-500 tracking-wide">Hizmet Adı</Label>
              <Input 
                value={formData.ad} 
                onChange={e => setFormData({ ...formData, ad: e.target.value })} 
                placeholder="Örn: Diş Çekimi" 
                className="bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] h-10" 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[0.7rem] font-extrabold uppercase text-slate-500 tracking-wide">Süre (Dakika)</Label>
                <Input 
                  type="number"
                  value={formData.sure} 
                  onChange={e => setFormData({ ...formData, sure: e.target.value === "" ? "" : Number(e.target.value) })} 
                  className="bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] h-10" 
                  min={1} required 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[0.7rem] font-extrabold uppercase text-slate-500 tracking-wide">Fiyat (₺)</Label>
                <Input 
                  type="number"
                  value={formData.fiyat} 
                  onChange={e => setFormData({ ...formData, fiyat: e.target.value === "" ? "" : Number(e.target.value) })} 
                  className="bg-slate-50 border-slate-200 focus-visible:ring-[#0a3d34] h-10" 
                  min={0} required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[0.7rem] font-extrabold uppercase text-slate-500 tracking-wide">Takvim Rengi</Label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, renk: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${formData.renk === c.value ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  >
                    {formData.renk === c.value && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit" disabled={isSubmitting || !formData.ad} className="bg-[#0a3d34] hover:bg-[#072b25]">
                {isSubmitting ? "Kaydediliyor..." : (editingId ? "Güncelle" : "Ekle")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
