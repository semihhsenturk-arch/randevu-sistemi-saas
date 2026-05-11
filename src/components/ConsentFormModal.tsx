"use client";

import { useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignatureCanvas, SignatureCanvasHandle } from "@/components/SignatureCanvas";
import { useDatabase, ConsentRecord } from "@/hooks/use-database";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale/tr";
import {
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eraser,
  ChevronDown,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  patientName: string;
  patientTC?: string;
  patientPhone?: string;
  appointmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  clinicName?: string;
  onSuccess?: () => void;
};

const CONSENT_SECTIONS = [
  {
    title: "1. İşlem Bilgilendirmesi",
    content: `Dermatoloji kliniğimizde uygulanacak muayene, teşhis ve tedavi işlemleri hakkında bilgilendirildiğimi, yapılacak işlemin kapsamı, amacı ve sürecinin tarafıma sözlü ve yazılı olarak anlatıldığını beyan ederim.

Uygulanabilecek işlemler arasında dermatolojik muayene, biyopsi, kriyoterapi (dondurma tedavisi), elektrokoter, lazer tedavileri, kimyasal peeling, mezoterapi, PRP (trombositten zengin plazma), dolgu uygulamaları, botulinum toksin enjeksiyonları ve diğer dermatolojik girişimler yer alabilir.`,
  },
  {
    title: "2. Olası Riskler ve Komplikasyonlar",
    content: `Her tıbbi işlemde olduğu gibi, dermatolojik işlemlerde de aşağıda belirtilen riskler ve komplikasyonlar meydana gelebilir:

• Ağrı, şişlik, kızarıklık, morarma
• Geçici veya kalıcı renk değişikliği (hiperpigmentasyon / hipopigmentasyon)
• Yara izi (skar) oluşumu
• Alerjik reaksiyon
• Enfeksiyon riski
• Kanama veya hematom
• Beklenen sonucun tam olarak elde edilememesi
• Tedavinin tekrarlanma ihtiyacı
• Nadir durumlarda sinir hasarı veya doku nekrozu

Bu risklerin tarafıma açıklandığını ve bilgilendirildiğimi kabul ederim.`,
  },
  {
    title: "3. Alternatif Tedavi Seçenekleri",
    content: `Tedavi planında belirtilen işlem dışında, uygulanabilecek alternatif tedavi yöntemlerinin (ilaç tedavisi, farklı girişimsel yöntemler, tedavisiz takip vb.) avantaj ve dezavantajlarının tarafıma açıklandığını; tedaviyi reddetme veya durdurma hakkımın bulunduğunu biliyorum.

Tedavinin reddedilmesi halinde ortaya çıkabilecek sonuçlar hakkında bilgilendirildiğimi beyan ederim.`,
  },
  {
    title: "4. Hasta Hakları",
    content: `• İşlem öncesinde, sırasında ve sonrasında soru sorma hakkımın bulunduğunu biliyorum.
• Tedaviyi herhangi bir aşamada reddetme veya durdurma hakkım olduğunu biliyorum.
• Tedavi sonuçları hakkında bilgilendirilme hakkımın bulunduğunu biliyorum.
• İkinci bir uzman görüşü alma hakkımın olduğunu biliyorum.
• Tıbbi kayıtlarıma erişim ve kopyasını alma hakkımın bulunduğunu biliyorum.`,
  },
  {
    title: "5. Kişisel Verilerin İşlenmesi (KVKK)",
    content: `6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, sağlık verilerim dahil kişisel verilerimin; teşhis, tedavi, bakım hizmetlerinin yürütülmesi, sağlık hizmetleri ile finansmanının planlanması ve yönetimi amacıyla işlenebileceği konusunda bilgilendirildiğimi,

Verilerimin yasal yükümlülükler çerçevesinde ilgili kamu kurum ve kuruluşlarıyla paylaşılabileceğini,

KVKK kapsamındaki haklarım (erişim, düzeltme, silme, itiraz vb.) hakkında bilgilendirildiğimi kabul ve beyan ederim.`,
  },
];

export function ConsentFormModal({
  open,
  onOpenChange,
  patientName,
  patientTC,
  patientPhone,
  appointmentId,
  appointmentDate,
  appointmentTime,
  clinicName = "Klinik",
  onSuccess,
}: Props) {
  const { saveConsentRecord } = useDatabase();
  const signatureRef = useRef<SignatureCanvasHandle>(null);

  const [checks, setChecks] = useState({
    read: false,
    questions: false,
    kvkk: false,
  });
  const [hasSigned, setHasSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const allChecked = checks.read && checks.questions && checks.kvkk;
  const canSubmit = allChecked && hasSigned && !isSubmitting;

  const formattedDate = useMemo(() => {
    if (!appointmentDate) return format(new Date(), "d MMMM yyyy, HH:mm", { locale: tr });
    try {
      const d = new Date(appointmentDate);
      return format(d, "d MMMM yyyy", { locale: tr }) + (appointmentTime ? ` — ${appointmentTime}` : "");
    } catch {
      return appointmentDate;
    }
  }, [appointmentDate, appointmentTime]);

  const consentFullText = useMemo(() => {
    return CONSENT_SECTIONS.map((s) => `${s.title}\n\n${s.content}`).join("\n\n---\n\n");
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (isBottom && !isScrolledToBottom) {
      setIsScrolledToBottom(true);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clear();
    setHasSigned(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const signatureData = signatureRef.current?.toDataURL() || "";

      const record: ConsentRecord = {
        patient_name: patientName,
        appointment_id: appointmentId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        consent_text: consentFullText,
        signature_data: signatureData,
        checkboxes: {
          bilgilendirme_okundu: checks.read,
          soru_sorma_hakki: checks.questions,
          kvkk_onay: checks.kvkk,
        },
        patient_tc: patientTC,
        patient_phone: patientPhone,
      };

      await saveConsentRecord(record);
      toast.success("Onam Formu Kaydedildi", {
        description: `${patientName} için dijital onam formu başarıyla oluşturuldu.`,
      });
      onSuccess?.();

      // Reset
      setChecks({ read: false, questions: false, kvkk: false });
      setHasSigned(false);
      setIsScrolledToBottom(false);
      signatureRef.current?.clear();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Consent save failed:", err);
      toast.error("Kayıt Hatası", {
        description: err?.message || "Onam formu kaydedilemedi. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-white border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2)] rounded-[20px] flex flex-col [&>button:last-child]:hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/20">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-white tracking-tight">
                  Aydınlatılmış Onam Formu
                </DialogTitle>
                <p className="text-sm text-slate-300 font-medium mt-1">
                  {clinicName} — Dermatoloji Kliniği
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {/* Patient Info Bar */}
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[0.78rem]">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.65rem]">Hasta</span>
              <p className="text-white font-extrabold mt-0.5">{patientName}</p>
            </div>
            {patientTC && (
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.65rem]">TC No</span>
                <p className="text-white font-extrabold mt-0.5">{patientTC}</p>
              </div>
            )}
            {patientPhone && (
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.65rem]">Telefon</span>
                <p className="text-white font-extrabold mt-0.5">{patientPhone}</p>
              </div>
            )}
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.65rem]">Tarih</span>
              <p className="text-white font-extrabold mt-0.5">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar"
          onScroll={handleScroll}
        >
          {/* Consent Sections */}
          <div className="space-y-6 mb-8">
            {CONSENT_SECTIONS.map((section, i) => (
              <div
                key={i}
                className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-6 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm"
              >
                <h3 className="text-[0.95rem] font-extrabold text-[#1e293b] mb-3 flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  {section.title}
                </h3>
                <p className="text-[0.83rem] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          {!isScrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none">
              <div className="bg-indigo-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 animate-bounce pointer-events-auto">
                <ChevronDown className="w-3.5 h-3.5" />
                Formu sonuna kadar okuyunuz
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="border-t border-slate-200 pt-6 mb-6">
            <h3 className="text-sm font-extrabold text-[#1e293b] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Onay Maddeleri
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: "read" as const,
                  label:
                    "Yukarıdaki tüm bilgilendirme maddelerini okudum ve anladım. Yapılacak işlem, olası riskler ve alternatif tedavi seçenekleri hakkında bilgilendirildim.",
                },
                {
                  key: "questions" as const,
                  label:
                    "İşlem öncesinde, sırasında ve sonrasında soru sorma hakkımın bulunduğunu; tedaviyi reddetme veya durdurma hakkım olduğunu biliyorum.",
                },
                {
                  key: "kvkk" as const,
                  label:
                    "6698 sayılı KVKK kapsamında kişisel sağlık verilerimin işlenmesine ve yasal yükümlülükler çerçevesinde paylaşılmasına onay veriyorum.",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    checks[item.key]
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        checks[item.key]
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {checks[item.key] && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checks[item.key]}
                    onChange={() =>
                      setChecks((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                  />
                  <span className="text-[0.82rem] font-medium text-slate-700 leading-relaxed">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Signature Area */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-[#1e293b] flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                Dijital İmza
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                onClick={handleClear}
              >
                <Eraser className="w-3.5 h-3.5 mr-1.5" />
                Temizle
              </Button>
            </div>

            <SignatureCanvas
              ref={signatureRef}
              width={800}
              height={180}
              onDrawStart={() => setHasSigned(true)}
            />

            {!hasSigned && (
              <p className="text-[0.72rem] text-amber-600 font-bold mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                İmza alanını lütfen doldurunuz
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-8 py-5 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="flex-1 text-[0.72rem] text-slate-400 font-medium">
            {format(new Date(), "'İmza Tarihi:' d MMMM yyyy, HH:mm:ss", { locale: tr })}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-initial h-12 px-6 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              className={`flex-1 sm:flex-initial h-12 px-8 rounded-xl font-bold text-white shadow-lg transition-all ${
                canSubmit
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 hover:-translate-y-0.5"
                  : "bg-slate-300 cursor-not-allowed shadow-none"
              }`}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Onayla ve İmzala
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
