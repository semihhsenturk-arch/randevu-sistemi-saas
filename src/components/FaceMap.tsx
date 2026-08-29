"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { FaceTreatment, generateTransactionNo } from "@/hooks/use-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Syringe, Clock, ZoomIn, ZoomOut, RotateCcw, Trash2, Maximize2, Minimize2, Pencil, Receipt, MapPin } from "lucide-react";
import { TransactionReceiptModal } from "./TransactionReceiptModal";
import { format, parseISO, isValid } from "date-fns";

interface FaceMapProps {
  gender: "female" | "male";
  treatments?: FaceTreatment[];
  onAddTreatment?: (t: FaceTreatment) => void;
  onUpdateTreatment?: (t: FaceTreatment) => void;
  onDeleteTreatment?: (id: string) => void;
  onGenderChange?: (g: "female" | "male") => void;
  readonly?: boolean;
  patientName?: string;
  stockHistory?: any[];
  appointmentDate?: string;
  appointmentTime?: string;
  patientTransactions?: { txNo: string; date: string; time: string; service: string }[];
}

export function FaceMap({ gender, treatments = [], onAddTreatment, onUpdateTreatment, onDeleteTreatment, onGenderChange, readonly = false, patientName, stockHistory = [], appointmentDate, appointmentTime, patientTransactions = [] }: FaceMapProps) {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [receiptDateGroup, setReceiptDateGroup] = useState<{ date: string, txNo: string, treatments: FaceTreatment[] } | null>(null);

  type DrawingPoint = { percentX: number; percentY: number };
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);

  // Form state
  const [formType, setFormType] = useState<"botoks" | "dolgu" | "mezoterapi">("botoks");
  const [formAmount, setFormAmount] = useState("");
  const [formUnit, setFormUnit] = useState("ünite");
  const [formProduct, setFormProduct] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formIsControl, setFormIsControl] = useState(false);
  const [formParentTxNo, setFormParentTxNo] = useState("");
  const [formTransactionNo, setFormTransactionNo] = useState("");

  const isFemale = gender === "female";
  const imgSrc = isFemale ? "/images/face-female.png" : "/images/face-male.png";
  const fullscreenBgColor = isFemale ? "#e9e9e9" : "#f2f3f2";

  // Group treatments by date and txNo
  const dateGroups = useMemo(() => {
    const groups: Record<string, FaceTreatment[]> = {};
    treatments.forEach(t => {
      const dateKey = t.date.split(" ")[0];
      const txKey = t.transactionNo || 'none';
      const key = `${dateKey}_${txKey}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).sort((a, b) => {
       const dateA = a[1][0].date.split(" ")[0];
       const dateB = b[1][0].date.split(" ")[0];
       const dateCmp = dateB.localeCompare(dateA);
       if (dateCmp !== 0) return dateCmp;
       const txA = a[1][0].transactionNo || '';
       const txB = b[1][0].transactionNo || '';
       return txB.localeCompare(txA);
    });
  }, [treatments]);

  const activeTreatments = useMemo(() => {
    if (selectedDate) {
      return treatments.filter(t => {
        const dateKey = t.date.split(" ")[0];
        const txKey = t.transactionNo || 'none';
        return `${dateKey}_${txKey}` === selectedDate;
      });
    }
    return treatments;
  }, [treatments, selectedDate]);

  const pastTransactions = useMemo(() => {
    const map = new Map<string, { date: string, txNo: string, type: string }>();
    treatments.forEach(t => {
      if (t.transactionNo && !t.isControl) {
        const dateKey = t.date.split(" ")[0];
        if (!map.has(t.transactionNo)) {
          map.set(t.transactionNo, { date: dateKey, txNo: t.transactionNo, type: t.type });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.txNo.localeCompare(a.txNo));
  }, [treatments]);

  // Build a map from treatment id to its sequential number (1-based)
  const treatmentNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    activeTreatments.forEach((t, i) => {
      map.set(t.id, i + 1);
    });
    return map;
  }, [activeTreatments]);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = imgSrc;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0, img.width, img.height);
        canvasRef.current = canvas;
      }
    };
  }, [imgSrc]);

  // Click on face image to place a marker
  const isInsideHeadOrNeck = (xPercent: number, yPercent: number) => {
    if (!canvasRef.current) {
      return yPercent >= 5 && yPercent <= 95 && xPercent >= 10 && xPercent <= 90;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const pxX = Math.floor((xPercent / 100) * canvas.width);
    const pxY = Math.floor((yPercent / 100) * canvas.height);

    if (pxX < 0 || pxX >= canvas.width || pxY < 0 || pxY >= canvas.height) return false;

    try {
      const pixel = ctx.getImageData(pxX, pxY, 1, 1).data;
      const alpha = pixel[3];
      return alpha > 10;
    } catch (e) {
      return yPercent >= 5 && yPercent <= 95 && xPercent >= 10 && xPercent <= 90;
    }
  };

  const getPointerCoords = (clientX: number, clientY: number): DrawingPoint | null => {
    if (!innerRef.current) return null;
    const rect = innerRef.current.getBoundingClientRect();
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
    return { percentX: x, percentY: y };
  };

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (readonly) return;
    const clientX = 'changedTouches' in e ? (e as any).changedTouches[0].clientX : (e as any).clientX;
    const clientY = 'changedTouches' in e ? (e as any).changedTouches[0].clientY : (e as any).clientY;
    
    const coords = getPointerCoords(clientX, clientY);
    if (!coords || !isInsideHeadOrNeck(coords.percentX, coords.percentY)) return;

    setClickPos({ x: coords.percentX, y: coords.percentY });
    setEditingId(null);
    setShowForm(true);
    setFormType("botoks" as any);
    setFormAmount("");
    setFormUnit("ünite");
    setFormProduct("");
    setFormNote("");
    setFormIsControl(false);
    setFormParentTxNo("");
    if (patientTransactions.length > 0) {
      setFormTransactionNo(patientTransactions[0].txNo);
    } else {
      setFormTransactionNo("");
    }
  }, [readonly, zoom, patientTransactions]);

  const handleCloseForm = () => {
    setShowForm(false);
    setClickPos(null);
    setEditingId(null);
  };

  const handleEditClick = (t: FaceTreatment, e: React.MouseEvent) => {
    e.stopPropagation();
    const [x, y] = t.zone.split(",").map(Number);
    setClickPos({ x, y });
    setFormType(t.type as any);
    setFormAmount(t.amount.toString());
    setFormUnit(t.unit);
    setFormProduct(t.product || "");
    setFormNote(t.note || "");
    setFormIsControl(t.isControl || false);
    setFormParentTxNo(t.parentTransactionNo || "");
    setFormTransactionNo(t.transactionNo || "");
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formAmount) return;
    
    const formattedApptDate = appointmentDate 
      ? (isValid(parseISO(appointmentDate)) ? format(parseISO(appointmentDate), "dd.MM.yyyy") : appointmentDate) 
      : format(new Date(), "dd.MM.yyyy");
    const formattedApptTime = appointmentTime || format(new Date(), "HH:mm");
    const todayDate = formattedApptDate;

    let txNo = "";

    if (formIsControl && formParentTxNo) {
      const existing = editingId ? treatments.find(t => t.id === editingId) : null;
      if (existing && existing.isControl && existing.parentTransactionNo === formParentTxNo && existing.transactionNo) {
        txNo = existing.transactionNo;
      } else {
        const todayControl = treatments.find(t => t.id !== editingId && t.date.startsWith(todayDate) && t.isControl && t.parentTransactionNo === formParentTxNo && t.transactionNo);
        if (todayControl && todayControl.transactionNo) {
          txNo = todayControl.transactionNo;
        } else {
          const existingControls = treatments.filter(t => t.id !== editingId && t.isControl && t.parentTransactionNo === formParentTxNo);
          const uniqueTxNos = new Set(existingControls.map(t => t.transactionNo).filter(Boolean));
          txNo = `${formParentTxNo}-K${uniqueTxNos.size + 1}`;
        }
      }
    } else {
      txNo = formTransactionNo || generateTransactionNo(treatments);
    }

    if (editingId && onUpdateTreatment) {
      const existing = treatments.find(t => t.id === editingId);
      if (existing) {
        onUpdateTreatment({
          ...existing,
          type: formType,
          amount: parseFloat(formAmount),
          unit: formUnit,
          product: formProduct || undefined,
          note: formNote || undefined,
          isControl: formIsControl,
          parentTransactionNo: formIsControl ? formParentTxNo : undefined,
          transactionNo: txNo,
        });
      }
    } else if (clickPos && onAddTreatment) {
      const t: FaceTreatment = {
        id: `ft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: `${formattedApptDate} ${formattedApptTime}`,
        zone: `${clickPos.x.toFixed(1)},${clickPos.y.toFixed(1)}`,
        type: formType,
        amount: parseFloat(formAmount),
        unit: formUnit,
        product: formProduct || undefined,
        note: formNote || undefined,
        transactionNo: txNo,
        isControl: formIsControl,
        parentTransactionNo: formIsControl ? formParentTxNo : undefined,
      };
      onAddTreatment(t);
    }
    handleCloseForm();
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

  // Pan & Drag & Draw handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readonly) return;
    setIsPanning(true);
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;
    setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
    dragStartRef.current = { x: clientX, y: clientY };

    if (!draggingMarkerId) {
      const coords = getPointerCoords(clientX, clientY);
      if (coords && isInsideHeadOrNeck(coords.percentX, coords.percentY)) {
        setIsDrawing(true);
        setCurrentPath([coords]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (readonly || !innerRef.current) return;
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as any).clientY;

    if (draggingMarkerId) {
      if (e.cancelable) e.preventDefault();
      const coords = getPointerCoords(clientX, clientY);
      if (coords) setDragPos({ x: coords.percentX, y: coords.percentY });
      return;
    }

    if (isDrawing) {
      if (e.cancelable) e.preventDefault();
      const coords = getPointerCoords(clientX, clientY);
      if (coords) {
        setCurrentPath(prev => [...prev, coords]);
      }
    }
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
    
    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath.length > 2 && (dx >= 5 || dy >= 5)) {
        let sumX = 0, sumY = 0;
        currentPath.forEach(p => { sumX += p.percentX; sumY += p.percentY; });
        const avgX = sumX / currentPath.length;
        const avgY = sumY / currentPath.length;
        
        if (isInsideHeadOrNeck(avgX, avgY)) {
          setClickPos({ x: avgX, y: avgY });
          setEditingId(null);
          setShowForm(true);
          setFormType("botoks" as any);
          setFormAmount("");
          setFormUnit("ünite");
          setFormProduct("");
          setFormNote("");
        }
      } else if (dx < 5 && dy < 5) {
        handleImageClick(e as any);
      }
      setCurrentPath([]);
    } else {
      if (dx < 5 && dy < 5) {
        handleImageClick(e as any);
      }
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
    if (type === "botoks") return { bg: "rgba(59,130,246,0.85)", ring: "#3B82F6", light: "rgba(59,130,246,0.15)" };
    if (type === "mezoterapi") return { bg: "rgba(16,185,129,0.85)", ring: "#10B981", light: "rgba(16,185,129,0.15)" };
    return { bg: "rgba(236,72,153,0.85)", ring: "#EC4899", light: "rgba(236,72,153,0.15)" };
  };

  return (
    <div 
      className={`space-y-4 ${
        isFullscreen 
          ? `fixed inset-0 z-[9999] flex flex-col overflow-hidden ${isAnimatingOut ? 'animate-out fade-out zoom-out-95 duration-200 fill-mode-forwards opacity-0' : 'animate-in fade-in zoom-in-95 duration-200'}` 
          : ""
      }`}
      style={isFullscreen ? { backgroundColor: fullscreenBgColor } : undefined}
    >
      
      {/* Fullscreen Header Controls (Legend & Exit) */}
      {isFullscreen && (
        <div className="absolute top-3 left-2 right-2 z-[100] flex justify-between items-start pointer-events-none">
          {/* Left Side: Legend & Dates */}
          <div className="flex flex-col gap-2 pointer-events-none items-start max-w-[calc(100vw-100px)]">
            {/* Legend */}
            <div className="flex flex-col gap-1 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200/70 shadow-md pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(59,130,246,0.85)" }} />
                <span className="text-xs font-semibold text-slate-600">Botoks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(236,72,153,0.85)" }} />
                <span className="text-xs font-semibold text-slate-600">Dolgu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(16,185,129,0.85)" }} />
                <span className="text-xs font-semibold text-slate-600">Mezoterapi</span>
              </div>
            </div>

            {/* Date filter in fullscreen */}
            {dateGroups.length > 0 && (
              <div className="flex flex-col gap-1.5 pointer-events-auto mt-1">
                <div className="flex items-center gap-2 justify-between px-1">
                  <h4 className="text-[0.6rem] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Tarihler</h4>
                  {selectedDate && <button onClick={() => setSelectedDate(null)} className="text-[0.55rem] font-bold text-emerald-600 hover:text-emerald-800 underline underline-offset-2 bg-white/80 px-1.5 rounded backdrop-blur-sm shadow-sm border border-emerald-100">Tümü</button>}
                </div>
                <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto custom-scrollbar-inner pr-1">
                  {dateGroups.map(([key, items]) => {
                    const date = items[0].date;
                    const types = Array.from(new Set(items.map(t => t.type === "botoks" ? "Botoks" : t.type === "dolgu" ? "Dolgu" : "Mezoterapi"))).join(", ");
                    const totalUnits = items.reduce((sum, t) => sum + (t.amount || 0), 0);
                    return (
                      <div key={key} className="flex items-stretch gap-1">
                        <button
                          onClick={() => setSelectedDate(selectedDate === key ? null : key)}
                          className={`px-2.5 py-1.5 rounded-lg text-[0.6rem] font-bold transition-all border flex items-center justify-between gap-3 shadow-sm text-left ${selectedDate === key ? "bg-emerald-50/90 text-emerald-700 border-emerald-200" : "bg-white/80 backdrop-blur-sm text-slate-600 border-slate-200/70 hover:border-slate-300"}`}
                        >
                          <span className="truncate">{date} ({types}) · {items.length} işl.</span>
                          <span className="font-extrabold shrink-0">{totalUnits} ünite</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Exit Button */}
          <button
            onClick={handleExitFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all shadow-md bg-white/80 hover:bg-white border-slate-200/70 text-slate-700 pointer-events-auto backdrop-blur-sm self-start"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Kapat
          </button>
        </div>
      )}

      <div className={`flex flex-col lg:flex-row gap-6 min-h-0 flex-1 ${isFullscreen ? "relative items-center justify-center w-full" : ""}`}>
        
        {/* Face Image Container */}
        <div className={`relative flex flex-col items-center ${isFullscreen ? "w-full flex-1 justify-center" : "shrink-0 mx-auto lg:mx-0"}`}>
          
          {/* Top Controls (Fullscreen & Gender) */}
          {!isFullscreen && (
            <div className="flex flex-col items-center gap-3 mb-4 w-full">
              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Tam Ekran Modu (Hassas İşaretleme)
              </button>

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
            </div>
          )}

          <div
            ref={containerRef}
            className={`select-none transition-all flex items-center justify-center touch-none ${
              isFullscreen 
                ? "bg-transparent" 
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
            onPointerCancel={handleMouseUp}
          >
            <div
              ref={innerRef}
              className={`relative aspect-square shrink-0 touch-none ${isFullscreen ? "bg-transparent" : "bg-white rounded-2xl shadow-lg overflow-hidden"}`}
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

              {/* Drawing Path Layer */}
              {currentPath.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={currentPath.map(p => `${p.percentX},${p.percentY}`).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={1.5 / zoom}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className="animate-in fade-in"
                  />
                </svg>
              )}

              {/* Treatment Markers */}
              {activeTreatments.map(t => {
                const isDragging = draggingMarkerId === t.id;
                const pos = isDragging && dragPos ? dragPos : parsePos(t.zone);
                const colors = getMarkerColor(t.type);
                const isHovered = hoveredMarker === t.id;
                return (
                  <div key={t.id} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: isHovered || isDragging ? 30 : 10 }}>
                    {/* Pulse ring */}
                    <div className={`absolute inset-0 rounded-full ${isDragging ? "" : "animate-ping"}`} style={{ background: colors.light, width: 32, height: 32, margin: "-6px" }} />
                    {/* Marker dot with number */}
                    <div
                      className={`relative rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-125 ${isDragging ? "scale-125 cursor-grabbing" : "cursor-grab"}`}
                      style={{ background: colors.bg, width: 20, height: 20 }}
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
                    >
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>
                        {treatmentNumberMap.get(t.id) ?? ""}
                      </span>
                    </div>
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-white border border-slate-200/80 rounded-xl px-3 py-2 shadow-xl pointer-events-none z-50 text-slate-900 flex flex-col items-center gap-0.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <span className="capitalize">{t.type === "botoks" ? "Botoks" : t.type === "dolgu" ? "Dolgu" : "Mezoterapi"}</span>
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

          {/* Legend is now moved to the top header in fullscreen mode */}
          {!isFullscreen && (
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "rgba(59,130,246,0.85)" }} />
                <span className="text-[0.6rem] font-bold text-slate-500">Botoks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "rgba(236,72,153,0.85)" }} />
                <span className="text-[0.6rem] font-bold text-slate-500">Dolgu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: "rgba(16,185,129,0.85)" }} />
                <span className="text-[0.6rem] font-bold text-slate-500">Mezoterapi</span>
              </div>
            </div>
          )}
        </div>

        {/* Treatment Form Overlay (Fullscreen Mode) */}
        {isFullscreen && showForm && clickPos && !readonly && (
          <div className={`absolute bottom-10 ${clickPos.x > 50 ? "left-10" : "right-10"} z-50 w-[340px] bg-white border-2 border-emerald-100 rounded-2xl p-4 shadow-2xl shadow-emerald-500/10 animate-in slide-in-from-bottom-5 duration-200`}>
            <button onClick={handleCloseForm} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Syringe className="w-3.5 h-3.5" /></div>
              <div className="text-sm font-extrabold text-slate-800">{editingId ? "Tedaviyi Düzenle" : "Yeni Tedavi Noktası"}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="col-span-2 space-y-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                <Label className="text-[0.65rem] font-bold text-emerald-700 uppercase tracking-wider">İşlem Fişi Seçimi</Label>
                <Select value={formTransactionNo} onValueChange={setFormTransactionNo}>
                  <SelectTrigger className="h-9 text-xs bg-white text-slate-800 border-emerald-200">
                    <SelectValue placeholder="İşlem Fişi Seçin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 z-[99999]">
                    {patientTransactions.length === 0 && (
                      <SelectItem value="none" disabled>Randevu bulunamadı</SelectItem>
                    )}
                    {patientTransactions.map(tx => (
                      <SelectItem key={tx.txNo} value={tx.txNo} className="text-slate-800 cursor-pointer">
                        <span className="font-mono font-bold mr-2">{tx.txNo}</span>
                        {tx.date} {tx.time} - {tx.service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Tür</Label>
                <Select value={formType} onValueChange={(v) => { setFormType(v as any); setFormUnit("ünite"); }}>
                  <SelectTrigger className="h-8 text-xs bg-slate-50 text-slate-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 z-[99999]">
                    <SelectItem value="botoks" className="text-slate-800 cursor-pointer">💉 Botoks</SelectItem>
                    <SelectItem value="dolgu" className="text-slate-800 cursor-pointer">✨ Dolgu</SelectItem>
                    <SelectItem value="mezoterapi" className="text-slate-800 cursor-pointer">💧 Mezoterapi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Miktar</Label>
                <div className="flex gap-1">
                  <Input type="number" step="0.1" min="0" placeholder="0" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="h-8 text-xs bg-slate-50 flex-1 text-slate-800" />
                  <span className="h-8 px-1.5 flex items-center text-[0.6rem] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200 shrink-0">{formUnit}</span>
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Ürün Adı</Label>
                <Input placeholder="Juvederm, Botox, Dysport..." value={formProduct} onChange={e => setFormProduct(e.target.value)} className="h-8 text-xs bg-slate-50 text-slate-800" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Not</Label>
                <Textarea placeholder="Ek bilgi..." value={formNote} onChange={e => setFormNote(e.target.value)} className="min-h-[40px] text-xs bg-slate-50 resize-none text-slate-800" />
              </div>
              
              <div className="col-span-2 flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="fsIsControlCb" 
                  checked={formIsControl} 
                  onChange={e => {
                    setFormIsControl(e.target.checked);
                    if (!e.target.checked) setFormParentTxNo("");
                  }} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" 
                />
                <label htmlFor="fsIsControlCb" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Bu bir kontrol seansıdır
                </label>
              </div>
              
              {formIsControl && (
                <div className="col-span-2 space-y-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                  <Label className="text-[0.6rem] font-bold text-emerald-700 uppercase">Hangi İşlemin Kontrolü?</Label>
                  <Select value={formParentTxNo} onValueChange={setFormParentTxNo}>
                    <SelectTrigger className="h-8 text-xs bg-white text-slate-800 border-emerald-200">
                      <SelectValue placeholder="İşlem seçin..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 z-[99999]">
                      {pastTransactions.length === 0 && (
                        <SelectItem value="none" disabled>Önceki işlem bulunamadı</SelectItem>
                      )}
                      {pastTransactions.map(tx => (
                        <SelectItem key={tx.txNo} value={tx.txNo} className="text-slate-800 cursor-pointer">
                          {tx.date} - {tx.txNo} ({tx.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={!formAmount || (formIsControl && !formParentTxNo)} className="w-full mt-3 h-8 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-md shadow-emerald-500/20 text-white">
              <Plus className="w-3.5 h-3.5 mr-1" /> Kaydet
            </Button>
          </div>
        )}

        {/* Normal Mode (Not Fullscreen) Right Panel */}
        {!isFullscreen && (
          <div className="flex-1 min-w-0 space-y-4 flex flex-col">
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar-inner" style={{ maxHeight: 440 }}>
              {/* Treatment Form */}
              {showForm && clickPos && !readonly && (
                <div className="bg-white border-2 border-emerald-100 rounded-2xl p-4 shadow-lg shadow-emerald-500/5 relative">
                  <button onClick={handleCloseForm} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Syringe className="w-3.5 h-3.5" /></div>
                    <div className="text-sm font-extrabold text-slate-800">{editingId ? "Tedaviyi Düzenle" : "Yeni Tedavi Noktası"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="col-span-2 space-y-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      <Label className="text-[0.65rem] font-bold text-emerald-700 uppercase tracking-wider">İşlem Fişi Seçimi</Label>
                      <Select value={formTransactionNo} onValueChange={setFormTransactionNo}>
                        <SelectTrigger className="h-9 text-xs bg-white text-slate-800 border-emerald-200">
                          <SelectValue placeholder="İşlem Fişi Seçin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 z-[99999]">
                          {patientTransactions.length === 0 && (
                            <SelectItem value="none" disabled>Randevu bulunamadı</SelectItem>
                          )}
                          {patientTransactions.map(tx => (
                            <SelectItem key={tx.txNo} value={tx.txNo} className="text-slate-800 cursor-pointer">
                              <span className="font-mono font-bold mr-2">{tx.txNo}</span>
                              {tx.date} {tx.time} - {tx.service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[0.6rem] font-bold text-slate-500 uppercase">Tür</Label>
                      <Select value={formType} onValueChange={(v) => { setFormType(v as any); setFormUnit("ünite"); }}>
                        <SelectTrigger className="h-8 text-xs bg-slate-50 text-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 z-[99999]">
                          <SelectItem value="botoks" className="text-slate-800 cursor-pointer">💉 Botoks</SelectItem>
                          <SelectItem value="dolgu" className="text-slate-800 cursor-pointer">✨ Dolgu</SelectItem>
                          <SelectItem value="mezoterapi" className="text-slate-800 cursor-pointer">💧 Mezoterapi</SelectItem>
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

                    <div className="col-span-2 flex items-center gap-2 mt-1">
                      <input 
                        type="checkbox" 
                        id="nmIsControlCb" 
                        checked={formIsControl} 
                        onChange={e => {
                          setFormIsControl(e.target.checked);
                          if (!e.target.checked) setFormParentTxNo("");
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" 
                      />
                      <label htmlFor="nmIsControlCb" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        Bu bir kontrol seansıdır
                      </label>
                    </div>
                    
                    {formIsControl && (
                      <div className="col-span-2 space-y-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                        <Label className="text-[0.6rem] font-bold text-emerald-700 uppercase">Hangi İşlemin Kontrolü?</Label>
                        <Select value={formParentTxNo} onValueChange={setFormParentTxNo}>
                          <SelectTrigger className="h-8 text-xs bg-white text-slate-800 border-emerald-200">
                            <SelectValue placeholder="İşlem seçin..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 z-[99999]">
                            {pastTransactions.length === 0 && (
                              <SelectItem value="none" disabled>Önceki işlem bulunamadı</SelectItem>
                            )}
                            {pastTransactions.map(tx => (
                              <SelectItem key={tx.txNo} value={tx.txNo} className="text-slate-800 cursor-pointer">
                                {tx.date} - {tx.txNo} ({tx.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <Button onClick={handleSubmit} disabled={!formAmount || (formIsControl && !formParentTxNo)} className="w-full mt-3 h-8 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-md shadow-emerald-500/20 text-white">
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
                    {dateGroups.map(([key, items]) => {
                      const date = items[0].date;
                      const types = Array.from(new Set(items.map(t => t.type === "botoks" ? "Botoks" : t.type === "dolgu" ? "Dolgu" : "Mezoterapi"))).join(", ");
                      const totalUnits = items.reduce((sum, t) => sum + (t.amount || 0), 0);
                      
                      let primaryTxNo = "";
                      let displayTxNo = "";
                      let targetDate = date.split(" ")[0];
                      let isOnlyControl = false;

                      // Find the first non-control transaction, if any
                      const normalTx = items.find(t => !t.isControl && t.transactionNo);
                      if (normalTx) {
                        primaryTxNo = normalTx.transactionNo!;
                        displayTxNo = primaryTxNo;
                      } else {
                        // If all are control sessions, find the first parent txNo
                        const controlTx = items.find(t => t.isControl && t.parentTransactionNo);
                        if (controlTx) {
                          isOnlyControl = true;
                          displayTxNo = "Kontrol";
                        }
                      }

                      return (
                        <div key={key} className="w-full flex items-stretch justify-between gap-1">
                          <button
                            onClick={() => setSelectedDate(selectedDate === key ? null : key)}
                            className={`px-2.5 py-1.5 rounded-lg text-[0.6rem] font-bold transition-all border flex items-center gap-1 ${selectedDate === key ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"}`}
                          >
                            <span>{date} ({types}) · {items.length} işlem · <span className="font-extrabold">{totalUnits} ünite</span></span>
                          </button>
                          {displayTxNo && (
                            <button
                              onClick={() => {
                                if (!isOnlyControl) {
                                  setReceiptDateGroup({ date: targetDate, txNo: primaryTxNo, treatments: items });
                                }
                              }}
                              className={`px-2.5 rounded-lg font-mono font-bold text-[0.55rem] transition-colors flex items-center justify-center shrink-0 shadow-sm ${isOnlyControl ? 'bg-emerald-100 text-emerald-700 cursor-default' : 'bg-slate-800 text-white hover:bg-slate-900 cursor-pointer'}`}
                              title={isOnlyControl ? "Kontrol Seansı" : "İşlem Fişini Gör"}
                            >
                              {!isOnlyControl && <Receipt className="w-3 h-3 mr-1" />}
                              {displayTxNo}
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                  activeTreatments.map(t => {
                    const colors = getMarkerColor(t.type);
                    return (
                      <div key={t.id}
                        className="flex items-start gap-2.5 bg-white p-2.5 border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredMarker(t.id)}
                        onMouseLeave={() => setHoveredMarker(null)}
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow" style={{ background: colors.bg }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{treatmentNumberMap.get(t.id) ?? ""}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            
                            <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full`} style={{ background: colors.light, color: colors.ring }}>
                              {t.type === "botoks" ? "Botoks" : t.type === "dolgu" ? "Dolgu" : "Mezoterapi"}
                            </span>
                            {t.isControl && (
                              <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                                Kontrol ({t.parentTransactionNo})
                              </span>
                            )}
                            <span className="text-[0.7rem] font-bold text-slate-700">{t.amount} {t.unit}</span>
                          </div>
                          {t.product && <div className="text-[0.6rem] text-slate-500 truncate">{t.product}</div>}
                          {t.note && <div className="text-[0.55rem] text-slate-400 truncate">{t.note}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[0.5rem] font-bold text-slate-400 mr-1">{t.date.split(" ")[0]}</span>
                          
                          {!readonly && onUpdateTreatment && (
                            <button
                              onClick={(e) => handleEditClick(t, e)}
                              className="w-6 h-6 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 flex items-center justify-center transition-colors border border-blue-100"
                              title="Düzenle"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
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

      {/* ═══════ Receipt / İşlem Fişi Modal ═══════ */}
      <TransactionReceiptModal
        receiptDateGroup={receiptDateGroup}
        onClose={() => setReceiptDateGroup(null)}
        patientName={patientName}
        stockHistory={stockHistory}
        allTreatments={treatments}
      />
    </div>
  );
}
