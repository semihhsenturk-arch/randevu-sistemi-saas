"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { FaceTreatment } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Syringe, Clock, ZoomIn, ZoomOut, RotateCcw, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { format } from "date-fns";

interface FaceMapProps {
  gender: "female" | "male";
  treatments?: FaceTreatment[];
  onAddTreatment?: (t: FaceTreatment) => void;
  onUpdateTreatment?: (t: FaceTreatment) => void;
  onDeleteTreatment?: (id: string) => void;
  onGenderChange?: (g: "female" | "male") => void;
  readonly?: boolean;
}

export function FaceMap({ gender, treatments = [], onAddTreatment, onUpdateTreatment, onDeleteTreatment, onGenderChange, readonly = false }: FaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  // Form state
  const [formType, setFormType] = useState<"botoks" | "dolgu">("botoks");
  const [formAmount, setFormAmount] = useState("");
  const [formUnit, setFormUnit] = useState("ünite");
  const [formProduct, setFormProduct] = useState("");
  const [formNote, setFormNote] = useState("");

  const isFemale = gender === "female";
  const imgSrc = isFemale ? "/images/face-female.png" : "/images/face-male.png";

  // Group treatments by date
  const dateGroups = useMemo(() => {
    const groups: Record<string, FaceTreatment[]> = {};
    treatments.forEach(t => {
      const dateKey = t.date.split(" ")[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [treatments]);

  const activeTreatments = useMemo(() => {
    if (selectedDate) return treatments.filter(t => t.date.split(" ")[0] === selectedDate);
    return treatments;
  }, [treatments, selectedDate]);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Click on face image to place a marker
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (readonly || !innerRef.current) return;

    const rect = innerRef.current.getBoundingClientRect();
    
    // Zoom/pan yapılmış olan iç div'in merkezini buluyoruz
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Tıklanan noktanın merkeze göre mesafesi
    const clickXFromCenter = e.clientX - centerX;
    const clickYFromCenter = e.clientY - centerY;

    // Zoom etkisini bölerek sıfırlıyoruz.
    // rect.width ve rect.height zaten zoom'dan etkilenmiştir (zoom katı kadardır)
    const originalWidth = rect.width / zoom;
    const originalHeight = rect.height / zoom;

    // Tıklanan noktanın zoom'dan arındırılmış merkeze uzaklığı
    const unzoomedX = clickXFromCenter / zoom;
    const unzoomedY = clickYFromCenter / zoom;

    // Merkeze göre asıl konumu yüzdesel değere çeviriyoruz
    const x = ((unzoomedX + originalWidth / 2) / originalWidth) * 100;
    const y = ((unzoomedY + originalHeight / 2) / originalHeight) * 100;

    // Yüz ve boyun bölgesi sınırları kontrolü
    // Baş: y %10 - %65 arası ve x %24 - %76 arası
    // Boyun: y %65 - %85 arası ve x %34 - %66 arası
    const isHead = y >= 10 && y <= 65 && x >= 24 && x <= 76;
    const isNeck = y > 65 && y <= 85 && x >= 34 && x <= 66;

    if (!isHead && !isNeck) {
      // Sınırlar dışındaysa tıklamayı yoksay
      return;
    }

    setClickPos({ x, y });
    setShowForm(true);
    setFormType("botoks");
    setFormAmount("");
    setFormUnit("ünite");
    setFormProduct("");
    setFormNote("");
  }, [readonly, zoom]);

  const handleSubmit = () => {
    if (!clickPos || !formAmount || !onAddTreatment) return;
    const t: FaceTreatment = {
      id: `ft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: format(new Date(), "dd.MM.yyyy HH:mm"),
      zone: `${clickPos.x.toFixed(1)},${clickPos.y.toFixed(1)}`,
      type: formType,
      amount: parseFloat(formAmount),
      unit: formUnit,
      product: formProduct || undefined,
      note: formNote || undefined,
    };
    onAddTreatment(t);
    setShowForm(false);
    setClickPos(null);
  };

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(z + 0.3, 4));
  const zoomOut = () => setZoom(z => Math.max(z - 0.3, 0.7));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Fullscreen controls
  const handleExitFullscreen = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsFullscreen(false);
      setIsAnimatingOut(false);
    }, 190);
  };

  // Pan & Drag handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readonly) return;
    setIsPanning(true);
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
    setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingMarkerId && !readonly && innerRef.current) {
      e.preventDefault();
      const rect = innerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
      const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
      
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clickXFromCenter = clientX - centerX;
      const clickYFromCenter = clientY - centerY;
      
      const originalWidth = rect.width / zoom;
      const originalHeight = rect.height / zoom;
      const unzoomedX = clickXFromCenter / zoom;
      const unzoomedY = clickYFromCenter / zoom;
      
      const x = ((unzoomedX + originalWidth / 2) / originalWidth) * 100;
      const y = ((unzoomedY + originalHeight / 2) / originalHeight) * 100;
      
      setDragPos({ x, y });
      return;
    }
    // Image panning functionality is disabled based on user request.
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (draggingMarkerId) {
      if (dragPos && onUpdateTreatment) {
        const t = treatments.find(t => t.id === draggingMarkerId);
        if (t) {
          onUpdateTreatment({ ...t, zone: `${dragPos.x.toFixed(1)},${dragPos.y.toFixed(1)}` });
        }
      }
      setDraggingMarkerId(null);
      setDragPos(null);
      return;
    }

    setIsPanning(false);
    if (!dragStartRef.current) return;
    const clientX = 'changedTouches' in e ? (e as any).changedTouches[0].clientX : (e as any).clientX;
    const clientY = 'changedTouches' in e ? (e as any).changedTouches[0].clientY : (e as any).clientY;
    const dx = Math.abs(clientX - dragStartRef.current.x);
    const dy = Math.abs(clientY - dragStartRef.current.y);
    if (dx < 5 && dy < 5) {
      handleImageClick(e as any);
    }
    dragStartRef.current = null;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(z => Math.min(Math.max(z + delta, 0.7), 4));
  };

  // Parse marker position from zone string "x,y"
  const parsePos = (zone: string) => {
    const [x, y] = zone.split(",").map(Number);
    return { x: x || 50, y: y || 50 };
  };

  const getMarkerColor = (type: string) => {
    return type === "botoks"
      ? { bg: "rgba(59,130,246,0.85)", ring: "#3B82F6", light: "rgba(59,130,246,0.15)" }
      : { bg: "rgba(236,72,153,0.85)", ring: "#EC4899", light: "rgba(236,72,153,0.15)" };
  };

  return (
    <div className={`space-y-4 ${
      isFullscreen 
        ? `fixed inset-y-0 right-0 left-0 lg:left-[280px] z-[9999] bg-white flex flex-col overflow-hidden ${isAnimatingOut ? 'animate-out fade-out zoom-out-95 duration-200 fill-mode-forwards opacity-0' : 'animate-in fade-in zoom-in-95 duration-200'}` 
        : ""
    }`}>
      
      {/* Header & Controls */}
      {!isFullscreen ? (
        <div className="relative z-50 flex items-center justify-between shrink-0 border-b border-slate-100/10 pb-2 mb-1 w-full">
          <div />

          <div className="flex items-center gap-2">
            {/* Gender Toggle */}
            {!readonly && onGenderChange && (
              <div className="flex items-center gap-1.5 bg-slate-100/10 p-1 rounded-xl">
                <button onClick={() => onGenderChange("female")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isFemale ? "bg-pink-50 text-pink-700 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>
                  👩 Kadın
                </button>
                <button onClick={() => onGenderChange("male")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isFemale ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>
                  👨 Erkek
                </button>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Tam Ekran Modu (Hassas İşaretleme)
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleExitFullscreen}
          className="absolute top-6 right-6 z-[100] flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-extrabold border transition-all shadow-xl bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
        >
          <Minimize2 className="w-4 h-4" /> Tam Ekrandan Çık
        </button>
      )}

      <div className={`flex flex-col lg:flex-row gap-6 min-h-0 flex-1 ${isFullscreen ? "relative items-center justify-center w-full" : ""}`}>
        
        {/* Face Image Container */}
        <div className={`relative flex flex-col justify-center items-center ${isFullscreen ? "w-full flex-1" : "shrink-0 mx-auto lg:mx-0"}`}>

          <div
            ref={containerRef}
            className={`select-none transition-all flex items-center justify-center ${
              isFullscreen 
                ? "bg-white" 
                : "border-2 rounded-2xl overflow-hidden shadow-inner bg-gradient-to-br from-slate-50 to-white border-slate-200/60"
            }`}
            style={
              isFullscreen
                ? { width: "100%", height: "100%", maxHeight: "100%", maxWidth: "100%" }
                : { width: 320, height: 320 }
            }
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              ref={innerRef}
              className={`relative aspect-square bg-white shrink-0 ${isFullscreen ? "" : "rounded-2xl shadow-lg overflow-hidden"}`}
              style={{ 
                width: "100%",
                height: isFullscreen ? "auto" : "100%",
                maxHeight: "100%",
                maxWidth: isFullscreen ? "100vh" : "100%",
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, 
                transformOrigin: "center center", 
                transition: isPanning ? "none" : "transform 0.2s ease" 
              }}
            >
              {/* Face Image */}
              <img src={imgSrc} alt={isFemale ? "Kadın Yüz Şablonu" : "Erkek Yüz Şablonu"} className="w-full h-full object-contain pointer-events-none" draggable={false} />

              {/* Treatment Markers */}
              {activeTreatments.map(t => {
                const isDragging = draggingMarkerId === t.id;
                const pos = isDragging && dragPos ? dragPos : parsePos(t.zone);
                const colors = getMarkerColor(t.type);
                const isHovered = hoveredMarker === t.id;
                return (
                  <div key={t.id} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: isHovered || isDragging ? 30 : 10 }}>
                    {/* Pulse ring */}
                    <div className={`absolute inset-0 rounded-full ${isDragging ? "" : "animate-ping"}`} style={{ background: colors.light, width: 28, height: 28, margin: "-6px" }} />
                    {/* Marker dot */}
                    <div
                      className={`relative w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-150 ${isDragging ? "scale-150 cursor-grabbing" : "cursor-grab"}`}
                      style={{ background: colors.bg }}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredMarker(t.id); }}
                      onMouseLeave={() => setHoveredMarker(null)}
                      onMouseDown={(e) => {
                        if (readonly) return;
                        e.stopPropagation();
                        setDraggingMarkerId(t.id);
                        setHoveredMarker(null);
                        setDragPos(parsePos(t.zone));
                      }}
                      onTouchStart={(e) => {
                        if (readonly) return;
                        e.stopPropagation();
                        setDraggingMarkerId(t.id);
                        setHoveredMarker(null);
                        setDragPos(parsePos(t.zone));
                      }}
                    />
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-white border border-slate-200/80 rounded-xl px-3 py-2 shadow-xl pointer-events-none z-50 text-slate-900 flex flex-col items-center gap-0.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <span className="capitalize">{t.type === "botoks" ? "Botoks" : "Dolgu"}</span>
                          <span className="text-slate-900">-</span>
                          <span>{t.amount} {t.unit}</span>
                        </div>
                        <div className="text-[0.65rem] font-bold text-slate-500">
                          {t.date.split(" ")[0]}
                        </div>
                        {/* Arrow */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%-1px)] w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-200 -z-10" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pending click marker */}
              {clickPos && showForm && (
                <div style={{ position: "absolute", left: `${clickPos.x}%`, top: `${clickPos.y}%`, transform: "translate(-50%, -50%)", zIndex: 40 }}>
                  <div className="w-5 h-5 rounded-full border-3 border-emerald-400 bg-emerald-500/30 animate-pulse shadow-lg shadow-emerald-500/30" />
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className={`flex items-center justify-center gap-4 ${isFullscreen ? "absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-xl" : "mt-2"}`}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: "rgba(59,130,246,0.85)" }} />
              <span className={`text-[0.6rem] font-bold ${isFullscreen ? "text-slate-300" : "text-slate-500"}`}>Botoks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: "rgba(236,72,153,0.85)" }} />
              <span className={`text-[0.6rem] font-bold ${isFullscreen ? "text-slate-300" : "text-slate-500"}`}>Dolgu</span>
            </div>
          </div>
        </div>

        {/* Treatment Form Overlay (Fullscreen Mode) */}
        {isFullscreen && showForm && clickPos && !readonly && (
          <div className="absolute bottom-10 right-10 z-50 w-[340px] bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl text-white animate-in slide-in-from-bottom-5 duration-200">
            <button onClick={() => { setShowForm(false); setClickPos(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Syringe className="w-4 h-4" /></div>
              <div className="text-sm font-extrabold">Yeni Tedavi Noktası</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-400 uppercase">Tür</Label>
                <Select value={formType} onValueChange={(v) => { setFormType(v as any); setFormUnit(v === "botoks" ? "ünite" : "cc"); }}>
                  <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-800 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-white">
                    <SelectItem value="botoks">💉 Botoks</SelectItem>
                    <SelectItem value="dolgu">✨ Dolgu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-400 uppercase">Miktar</Label>
                <div className="flex gap-1">
                  <Input type="number" step="0.1" min="0" placeholder="0" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="h-8 text-xs flex-1 bg-slate-950 border-slate-800 text-white" />
                  <span className="h-8 px-1.5 flex items-center text-[0.6rem] font-bold rounded-md bg-slate-900 border border-slate-800 text-slate-400 shrink-0">{formUnit}</span>
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-400 uppercase">Ürün Adı</Label>
                <Input placeholder="Juvederm, Botox, Dysport..." value={formProduct} onChange={e => setFormProduct(e.target.value)} className="h-8 text-xs bg-slate-950 border-slate-800 text-white" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-400 uppercase">Not</Label>
                <Textarea placeholder="Ek bilgi..." value={formNote} onChange={e => setFormNote(e.target.value)} className="min-h-[40px] text-xs resize-none bg-slate-950 border-slate-800 text-white" />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!formAmount} className="w-full mt-4 h-8 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-md shadow-emerald-500/20 text-white">
              <Plus className="w-3.5 h-3.5 mr-1" /> Kaydet
            </Button>
          </div>
        )}

        {/* Normal Mode (Not Fullscreen) Right Panel */}
        {!isFullscreen && (
          <div className="flex-1 min-w-0 space-y-4 flex flex-col">
            <div className="space-y-4 overflow-y-auto pr-2 no-scrollbar" style={{ maxHeight: 440 }}>
              {/* Treatment Form */}
              {showForm && clickPos && !readonly && (
                <div className="bg-white border-2 border-emerald-100 rounded-2xl p-4 shadow-lg shadow-emerald-500/5 relative">
                  <button onClick={() => { setShowForm(false); setClickPos(null); }} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Syringe className="w-3.5 h-3.5" /></div>
                    <div className="text-sm font-extrabold text-slate-800">Yeni Tedavi Noktası</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Tür</Label>
                      <Select value={formType} onValueChange={(v) => { setFormType(v as any); setFormUnit(v === "botoks" ? "ünite" : "cc"); }}>
                        <SelectTrigger className="h-8 text-xs bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="botoks">💉 Botoks</SelectItem>
                          <SelectItem value="dolgu">✨ Dolgu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Miktar</Label>
                      <div className="flex gap-1">
                        <Input type="number" step="0.1" min="0" placeholder="0" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="h-8 text-xs bg-slate-50 flex-1" />
                        <span className="h-8 px-1.5 flex items-center text-[0.6rem] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200 shrink-0">{formUnit}</span>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Ürün Adı</Label>
                      <Input placeholder="Juvederm, Botox, Dysport..." value={formProduct} onChange={e => setFormProduct(e.target.value)} className="h-8 text-xs bg-slate-50" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Not</Label>
                      <Textarea placeholder="Ek bilgi..." value={formNote} onChange={e => setFormNote(e.target.value)} className="min-h-[40px] text-xs bg-slate-50 resize-none" />
                    </div>
                  </div>
                  <Button onClick={handleSubmit} disabled={!formAmount} className="w-full mt-2 h-8 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-md shadow-emerald-500/20">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Kaydet
                  </Button>
                </div>
              )}

              {/* Date filter */}
              {dateGroups.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 justify-between">
                    <h4 className="text-[0.6rem] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Tarihler</h4>
                    {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-[0.55rem] font-bold text-emerald-600 hover:text-emerald-800 underline underline-offset-2">Tümü</button>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dateGroups.map(([date, items]) => (
                      <button key={date} onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                        className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-bold transition-all border ${selectedDate === date ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"}`}>
                        {date} ({items.length})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatment list */}
              <div className="space-y-1.5">
                {activeTreatments.length === 0 ? (
                  <div className="text-center py-8 bg-white border border-slate-100 rounded-xl flex flex-col items-center gap-2">
                    <Syringe className="w-6 h-6 text-slate-300" />
                    <span className="italic text-xs text-slate-400 font-medium">
                      {readonly ? "Tedavi kaydı bulunmuyor." : "Yüze tıklayarak tedavi ekleyin."}
                    </span>
                  </div>
                ) : (
                  activeTreatments.slice().reverse().map(t => {
                    const colors = getMarkerColor(t.type);
                    return (
                      <div key={t.id}
                        className="flex items-start gap-2.5 bg-white p-2.5 border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredMarker(t.id)}
                        onMouseLeave={() => setHoveredMarker(null)}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: colors.light, borderColor: colors.ring + "30" }}>
                          <Syringe className="w-3.5 h-3.5" style={{ color: colors.ring }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full`} style={{ background: colors.light, color: colors.ring }}>
                              {t.type === "botoks" ? "Botoks" : "Dolgu"}
                            </span>
                            <span className="text-[0.7rem] font-bold text-slate-700">{t.amount} {t.unit}</span>
                          </div>
                          {t.product && <div className="text-[0.6rem] text-slate-500 truncate">{t.product}</div>}
                          {t.note && <div className="text-[0.55rem] text-slate-400 truncate">{t.note}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[0.5rem] font-bold text-slate-300">{t.date.split(" ")[0]}</span>
                          {!readonly && onDeleteTreatment && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteTreatment(t.id); }}
                              className="w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors border border-red-100"
                              title="Sil"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
