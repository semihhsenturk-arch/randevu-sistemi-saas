"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Plus, Trash2, X, ChevronLeft, ChevronRight, ImageIcon, Upload, Tag, StickyNote, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";
import { toast } from "sonner";
import type { BeforeAfterPhoto } from "@/hooks/use-database";

// ── Helpers ──────────────────────────────────────────────────

function generateId() {
  return "ba_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
}

async function resizeImage(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; } }
        else { if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; } }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Slider Component ─────────────────────────────────────────

function ComparisonSlider({ beforeSrc, afterSrc, fullscreen = false }: { beforeSrc: string; afterSrc: string; fullscreen?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className={fullscreen ? "ba-slider-fullscreen" : "ba-slider-container"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ touchAction: "none" }}
    >
      {/* After (background — full width) */}
      <img src={afterSrc} alt="Sonra" className="ba-slider-img" draggable={false} />

      {/* Before (clipped) */}
      <div className="ba-slider-before" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={beforeSrc} alt="Önce" className="ba-slider-img" draggable={false} />
      </div>

      {/* Divider Line */}
      <div className="ba-slider-line" style={{ left: `${position}%` }}>
        <div className="ba-slider-handle">
          <ChevronLeft className="w-3.5 h-3.5 text-white/90" />
          <ChevronRight className="w-3.5 h-3.5 text-white/90" />
        </div>
      </div>

      {/* Labels */}
      <span className="ba-label ba-label-before">ÖNCE</span>
      <span className="ba-label ba-label-after">SONRA</span>
    </div>
  );
}

// ── Fullscreen Overlay ───────────────────────────────────────

function FullscreenOverlay({ beforeSrc, afterSrc, label, date, onClose }: {
  beforeSrc: string;
  afterSrc: string;
  label: string;
  date: string;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="ba-fullscreen-overlay">
      {/* Top bar */}
      <div className="ba-fullscreen-topbar">
        <div className="flex items-center gap-2">
          <span className="bg-violet-500/20 text-violet-200 border border-violet-400/30 px-3 py-1 rounded-full text-[0.72rem] font-extrabold">{label}</span>
          <span className="text-[0.7rem] font-bold text-white/50">{date}</span>
        </div>
        <button onClick={onClose} className="ba-fullscreen-close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Slider — fills the screen */}
      <ComparisonSlider beforeSrc={beforeSrc} afterSrc={afterSrc} fullscreen />
    </div>
  );
}

// ── Upload Zone ──────────────────────────────────────────────

function UploadZone({ label, image, onUpload, onClear }: {
  label: string;
  image?: string;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Lütfen bir resim dosyası seçin."); return; }
    try {
      const resized = await resizeImage(file);
      onUpload(resized);
    } catch { toast.error("Resim yüklenirken hata oluştu."); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (image) {
    return (
      <div className="ba-upload-preview">
        <img src={image} alt={label} className="ba-upload-preview-img" />
        <div className="ba-upload-preview-overlay">
          <button onClick={onClear} className="ba-upload-clear-btn"><X className="w-4 h-4" /></button>
          <span className="ba-upload-preview-label">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ba-upload-zone ${dragOver ? "ba-upload-zone-active" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <div className="ba-upload-zone-icon">
        <Camera className="w-6 h-6" />
      </div>
      <span className="ba-upload-zone-text">{label}</span>
      <span className="ba-upload-zone-hint">Fotoğraf çekin veya yükleyin</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Props = {
  photos: BeforeAfterPhoto[];
  onAdd: (photo: BeforeAfterPhoto) => void;
  onUpdate: (photo: BeforeAfterPhoto) => void;
  onDelete: (id: string) => void;
};

export function BeforeAfterCompare({ photos, onAdd, onUpdate, onDelete }: Props) {
  const [mode, setMode] = useState<"list" | "new" | "view">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);

  const fullscreenPhoto = photos.find((p) => p.id === fullscreenId);

  // New record form state
  const [beforeImg, setBeforeImg] = useState<string>("");
  const [afterImg, setAfterImg] = useState<string>("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  const selectedPhoto = photos.find((p) => p.id === selectedId);

  const resetForm = () => { setBeforeImg(""); setAfterImg(""); setLabel(""); setNote(""); };

  const handleSaveNew = () => {
    if (!beforeImg) { toast.error("Lütfen 'Önce' fotoğrafını yükleyin."); return; }
    if (!label.trim()) { toast.error("Lütfen bir etiket girin."); return; }

    const photo: BeforeAfterPhoto = {
      id: generateId(),
      date: format(new Date(), "dd.MM.yyyy HH:mm"),
      label: label.trim(),
      before_image: beforeImg,
      after_image: afterImg || undefined,
      note: note.trim() || undefined,
    };
    onAdd(photo);
    resetForm();
    setMode("list");
    toast.success("Kayıt oluşturuldu.");
  };

  const handleAddAfter = (dataUrl: string) => {
    if (!selectedPhoto) return;
    const updated = { ...selectedPhoto, after_image: dataUrl };
    onUpdate(updated);
    toast.success("Sonra fotoğrafı eklendi.");
  };

  const handleDeleteRecord = (id: string) => {
    onDelete(id);
    if (selectedId === id) { setSelectedId(null); setMode("list"); }
    toast.success("Kayıt silindi.");
  };

  // ── LIST MODE ──
  if (mode === "list") {
    return (
      <>
      {/* Fullscreen overlay — rendered above everything */}
      {fullscreenPhoto && fullscreenPhoto.before_image && fullscreenPhoto.after_image && (
        <FullscreenOverlay
          beforeSrc={fullscreenPhoto.before_image}
          afterSrc={fullscreenPhoto.after_image}
          label={fullscreenPhoto.label}
          date={fullscreenPhoto.date}
          onClose={() => setFullscreenId(null)}
        />
      )}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {photos.length > 0 ? `${photos.length} kayıt` : "Henüz kayıt yok"}
          </p>
          <Button onClick={() => setMode("new")} className="bg-violet-600 hover:bg-violet-700 h-9 text-xs font-bold shadow-md shadow-violet-600/20 rounded-xl gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Yeni Kayıt
          </Button>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-400">
              <ArrowLeftRight className="w-7 h-7" />
            </div>
            <span className="italic text-sm text-slate-400 font-medium">Önce/Sonra karşılaştırma kaydı bulunmuyor.</span>
            <Button variant="outline" size="sm" onClick={() => setMode("new")} className="mt-2 text-xs font-bold text-violet-600 border-violet-200 hover:bg-violet-50">
              <Camera className="w-3.5 h-3.5 mr-1.5" /> İlk Kaydı Oluştur
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {photos.slice().reverse().map((p) => (
              <div
                key={p.id}
                className="ba-record-card group"
                onClick={() => {
                  if (p.after_image) {
                    setFullscreenId(p.id);
                  } else {
                    setSelectedId(p.id); setMode("view");
                  }
                }}
              >
                <div className="ba-record-thumb">
                  <img src={p.before_image} alt="Önce" className="ba-record-thumb-img" />
                  {p.after_image && (
                    <div className="ba-record-thumb-after">
                      <img src={p.after_image} alt="Sonra" className="ba-record-thumb-img" />
                    </div>
                  )}
                  {!p.after_image && (
                    <div className="ba-record-thumb-pending">
                      <Camera className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </div>
                <div className="ba-record-info">
                  <span className="text-[0.82rem] font-extrabold text-[#1e293b] group-hover:text-violet-700 transition-colors">{p.label}</span>
                  <span className="text-[0.65rem] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                    <Tag className="w-3 h-3" /> {p.date}
                  </span>
                  {p.after_image ? (
                    <span className="text-[0.6rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1 w-fit border border-emerald-100">
                      <ArrowLeftRight className="w-3 h-3" /> Karşılaştır
                    </span>
                  ) : (
                    <span className="text-[0.6rem] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1 w-fit border border-amber-100">
                      <Camera className="w-3 h-3" /> Sonra bekleniyor
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteRecord(p.id); }}
                  className="ba-record-delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
    );
  }

  // ── NEW RECORD MODE ──
  if (mode === "new") {
    return (
      <div className="space-y-4">
        <button onClick={() => { resetForm(); setMode("list"); }} className="text-xs font-bold text-slate-500 hover:text-violet-600 flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Listeye Dön
        </button>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <UploadZone label="Önce Fotoğrafı" image={beforeImg} onUpload={setBeforeImg} onClear={() => setBeforeImg("")} />
            <UploadZone label="Sonra Fotoğrafı" image={afterImg} onUpload={setAfterImg} onClear={() => setAfterImg("")} />
          </div>

          {beforeImg && afterImg && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer" onClick={() => {
              // Preview fullscreen before saving
              setSelectedId('__preview__');
            }}>
              <ComparisonSlider beforeSrc={beforeImg} afterSrc={afterImg} />
              <div className="bg-violet-50 text-center py-1.5 text-[0.65rem] font-bold text-violet-600">Tam ekran görmek için tıklayın</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[0.65rem] font-extrabold uppercase text-slate-500 ml-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Etiket / İşlem Adı</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Örn: Dudak Dolgusu" className="bg-slate-50 border-slate-200 focus-visible:ring-violet-500 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.65rem] font-extrabold uppercase text-slate-500 ml-1 flex items-center gap-1"><StickyNote className="w-3 h-3" /> Not (Opsiyonel)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ek açıklama..." className="bg-slate-50 border-slate-200 focus-visible:ring-violet-500 h-9" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-10 font-bold rounded-xl" onClick={() => { resetForm(); setMode("list"); }}>İptal</Button>
          <Button className="flex-1 h-10 font-bold bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20 rounded-xl" onClick={handleSaveNew}>
            <Camera className="w-4 h-4 mr-2" /> Kaydı Oluştur
          </Button>
        </div>
      </div>
    );
  }

  // ── VIEW MODE (no after_image yet — upload it) ──
  if (mode === "view" && selectedPhoto) {
    // If both images exist, go fullscreen immediately
    if (selectedPhoto.before_image && selectedPhoto.after_image) {
      return (
        <>
          <FullscreenOverlay
            beforeSrc={selectedPhoto.before_image}
            afterSrc={selectedPhoto.after_image}
            label={selectedPhoto.label}
            date={selectedPhoto.date}
            onClose={() => { setSelectedId(null); setMode("list"); }}
          />
          <div /> {/* placeholder */}
        </>
      );
    }

    // Only before image — show upload for after
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedId(null); setMode("list"); }} className="text-xs font-bold text-slate-500 hover:text-violet-600 flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Listeye Dön
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-bold text-slate-400">{selectedPhoto.date}</span>
            <span className="bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full text-[0.72rem] font-extrabold">{selectedPhoto.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="ba-upload-preview">
            <img src={selectedPhoto.before_image} alt="Önce" className="ba-upload-preview-img" />
            <div className="ba-upload-preview-overlay">
              <span className="ba-upload-preview-label">ÖNCE</span>
            </div>
          </div>
          <UploadZone label="Sonra Fotoğrafı Ekle" onUpload={handleAddAfter} onClear={() => {}} />
        </div>

        {selectedPhoto.note && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 font-medium">
            <span className="text-[0.65rem] font-extrabold text-slate-400 uppercase block mb-1">Not:</span>
            {selectedPhoto.note}
          </div>
        )}
      </div>
    );
  }

  // Preview fullscreen from new record form
  if (selectedId === '__preview__' && beforeImg && afterImg) {
    return (
      <>
        <FullscreenOverlay
          beforeSrc={beforeImg}
          afterSrc={afterImg}
          label={label || 'Önizleme'}
          date={format(new Date(), 'dd.MM.yyyy')}
          onClose={() => setSelectedId(null)}
        />
        <div /> {/* placeholder */}
      </>
    );
  }

  return null;
}
